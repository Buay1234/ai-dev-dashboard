import {
  parseBuildSummary,
  parseCompilerOutput,
  parseCompilerWarnings,
  resolveCompilerCounts,
} from "../error-parser";
import type { ParsedCompilerError } from "../types";
import type {
  CompilerDiagnosticsJson,
  CompilerDiagnosticsReport,
  CompilerErrorGroup,
  RootCauseAnalysis,
} from "./types";

const MSBUILD_LINE =
  /(?:^|\n)\s*\d+>(?:.*?\\)?([^(\n]+\.(?:cs|csproj))\((\d+),(\d+)\):\s*(error|warning)\s+(CS\d+|NU\d+|MSB\d+):\s*(.+)/gi;

const VS_BRACKET_ERROR =
  /(?:^|\n)\s*(error|warning)\s+(CS\d+|NU\d+|MSB\d+):\s*(.+?)\s*\[([^(\]]+\.(?:cs|csproj))\((\d+)(?:,(\d+))?\)\]/gi;

function pushUnique(
  bucket: ParsedCompilerError[],
  seen: Set<string>,
  entry: ParsedCompilerError
) {
  const key = `${entry.severity}:${entry.file ?? ""}:${entry.line ?? ""}:${entry.code}:${entry.message}`;
  if (seen.has(key)) return;
  seen.add(key);
  bucket.push(entry);
}

/** Parse dotnet build + Visual Studio / MSBuild log formats */
export function parseDiagnosticsFromOutput(output: string): ParsedCompilerError[] {
  const errors = parseCompilerOutput(output);
  const seen = new Set(
    errors.map(
      (e) => `${e.severity}:${e.file ?? ""}:${e.line ?? ""}:${e.code}:${e.message}`
    )
  );

  let match: RegExpExecArray | null;

  MSBUILD_LINE.lastIndex = 0;
  while ((match = MSBUILD_LINE.exec(output)) !== null) {
    if (match[5].toLowerCase() !== "error") continue;
    pushUnique(errors, seen, {
      file: match[1].trim().replace(/^.*[\\/]/, ""),
      line: Number(match[2]),
      code: match[6],
      message: match[7].trim(),
      raw: match[0].trim(),
      severity: "error",
    });
  }

  VS_BRACKET_ERROR.lastIndex = 0;
  while ((match = VS_BRACKET_ERROR.exec(output)) !== null) {
    if (match[1].toLowerCase() !== "error") continue;
    pushUnique(errors, seen, {
      file: match[4].trim().replace(/^.*[\\/]/, ""),
      line: Number(match[5]),
      code: match[2],
      message: match[3].trim(),
      raw: match[0].trim(),
      severity: "error",
    });
  }

  return errors;
}

function groupErrorsByCode(errors: ParsedCompilerError[]): CompilerErrorGroup[] {
  const groups = new Map<string, CompilerErrorGroup>();

  for (const error of errors) {
    const code = error.code || "UNKNOWN";
    const existing = groups.get(code);
    if (!existing) {
      groups.set(code, {
        code,
        count: 1,
        message: error.message,
        messages: [error.message],
        files: error.file ? [error.file] : [],
        sampleLines: error.line ? [error.line] : [],
      });
      continue;
    }

    existing.count += 1;
    if (!existing.messages.includes(error.message)) {
      existing.messages.push(error.message);
    }
    if (error.file && !existing.files.includes(error.file)) {
      existing.files.push(error.file);
    }
    if (error.line && existing.sampleLines.length < 5) {
      existing.sampleLines.push(error.line);
    }
  }

  return [...groups.values()].sort((a, b) => b.count - a.count);
}

function extractEntityNameFromFile(file: string): string | null {
  if (!file.endsWith(".cs")) return null;
  return file.replace(".cs", "");
}

function inferRootCauses(
  errors: ParsedCompilerError[],
  groups: CompilerErrorGroup[]
): RootCauseAnalysis[] {
  const causes: RootCauseAnalysis[] = [];
  const lowerMessages = errors.map((e) => e.message.toLowerCase()).join(" ");

  const cs0118 = groups.find((g) => g.code === "CS0118");
  if (cs0118) {
    const namespaceConflict = errors.find((e) =>
      /is a namespace but is used like a type/i.test(e.message)
    );
    const conflictName =
      namespaceConflict?.message.match(/'([^']+)'/)?.[1] ??
      cs0118.files.map(extractEntityNameFromFile).find(Boolean) ??
      "System";
    const suggestedName =
      conflictName === "System"
        ? "SystemSetting"
        : `${conflictName}Entity`;

    causes.push({
      id: "namespace-entity-conflict",
      rootCause: `Entity ${conflictName}.cs conflicts with .NET namespace ${conflictName}.`,
      impact: `${cs0118.count} compiler error${cs0118.count === 1 ? "" : "s"}.`,
      impactCount: cs0118.count,
      suggestedFix: `Rename entity to ${suggestedName}.`,
      relatedCodes: ["CS0118"],
    });
  }

  const cs0102 = groups.find((g) => g.code === "CS0102");
  if (cs0102) {
    const dupMember = errors.find((e) => e.code === "CS0102");
    const member = dupMember?.message.match(/'([^']+)'/)?.[1] ?? "member";
    causes.push({
      id: "duplicate-member",
      rootCause: `Duplicate declaration of '${member}' (often duplicate DbSet in AppDbContext).`,
      impact: `${cs0102.count} compiler error${cs0102.count === 1 ? "" : "s"}.`,
      impactCount: cs0102.count,
      suggestedFix: "Remove duplicate DbSet or property declarations in AppDbContext.cs.",
      relatedCodes: ["CS0102"],
    });
  }

  const cs0246 = groups.find((g) => g.code === "CS0246");
  if (cs0246) {
    causes.push({
      id: "missing-type-or-using",
      rootCause: "Missing type, namespace, or using directive references.",
      impact: `${cs0246.count} compiler error${cs0246.count === 1 ? "" : "s"}.`,
      impactCount: cs0246.count,
      suggestedFix:
        "Add missing using System, System.Threading.Tasks, System.Collections.Generic, or project references.",
      relatedCodes: ["CS0246"],
    });
  }

  const cs0234 = groups.find((g) => g.code === "CS0234");
  if (cs0234) {
    causes.push({
      id: "missing-namespace",
      rootCause: "Referenced namespace does not exist or is not imported.",
      impact: `${cs0234.count} compiler error${cs0234.count === 1 ? "" : "s"}.`,
      impactCount: cs0234.count,
      suggestedFix: "Add correct namespace using directives or fix project references.",
      relatedCodes: ["CS0234"],
    });
  }

  const nuErrors = groups.filter((g) => g.code.startsWith("NU"));
  if (nuErrors.length > 0) {
    const total = nuErrors.reduce((sum, g) => sum + g.count, 0);
    causes.push({
      id: "nuget-restore",
      rootCause: "NuGet package restore or reference resolution failed.",
      impact: `${total} restore error${total === 1 ? "" : "s"}.`,
      impactCount: total,
      suggestedFix: "Verify PackageReference versions and run dotnet restore MyProject.sln.",
      relatedCodes: nuErrors.map((g) => g.code),
    });
  }

  if (causes.length === 0 && errors.length > 0) {
    const top = groups[0];
    causes.push({
      id: "general-compile",
      rootCause: top
        ? `Dominant compiler issue: ${top.code} — ${top.message}`
        : "Unresolved compiler errors detected.",
      impact: `${errors.length} compiler error${errors.length === 1 ? "" : "s"}.`,
      impactCount: errors.length,
      suggestedFix: "Review Error Breakdown and apply targeted fixes per error code.",
      relatedCodes: groups.slice(0, 3).map((g) => g.code),
    });
  }

  if (/duplicate dbset|already contains a definition for/i.test(lowerMessages)) {
    causes.push({
      id: "duplicate-dbset",
      rootCause: "Duplicate DbSet declarations in AppDbContext.",
      impact: `${cs0102?.count ?? errors.length} related compiler error(s).`,
      impactCount: cs0102?.count ?? errors.length,
      suggestedFix: "Keep one DbSet per entity type in AppDbContext.cs.",
      relatedCodes: ["CS0102", "CS0111"],
    });
  }

  return causes;
}

function collectSuggestedFixes(causes: RootCauseAnalysis[]): string[] {
  return [...new Set(causes.map((c) => c.suggestedFix))];
}

export function analyzeCompilerDiagnostics(
  output: string,
  preParsedErrors?: ParsedCompilerError[]
): CompilerDiagnosticsReport {
  const diagnostics =
    preParsedErrors && preParsedErrors.length > 0
      ? preParsedErrors
      : parseDiagnosticsFromOutput(output);
  const warnings = parseCompilerWarnings(output);
  const { compilerErrorCount, compilerWarningCount } = resolveCompilerCounts(
    output,
    diagnostics,
    warnings
  );

  const errorGroups = groupErrorsByCode(diagnostics);
  const rootCauses = inferRootCauses(diagnostics, errorGroups);
  const suggestedFixes = collectSuggestedFixes(rootCauses);

  return {
    totalErrors: Math.max(compilerErrorCount, diagnostics.length),
    totalWarnings: compilerWarningCount,
    errorGroups,
    rootCauses,
    suggestedFixes,
    diagnostics,
    generatedAt: new Date().toISOString(),
  };
}

export function exportDiagnosticsJson(
  report: CompilerDiagnosticsReport
): CompilerDiagnosticsJson {
  return {
    totalErrors: report.totalErrors,
    totalWarnings: report.totalWarnings,
    errorGroups: report.errorGroups.map((g) => ({
      code: g.code,
      count: g.count,
      message: g.message,
    })),
    rootCauses: report.rootCauses.map((c) => ({
      rootCause: c.rootCause,
      impact: c.impact,
      suggestedFix: c.suggestedFix,
      relatedCodes: c.relatedCodes,
    })),
    suggestedFixes: report.suggestedFixes,
  };
}

export function downloadDiagnosticsJson(report: CompilerDiagnosticsReport): void {
  const json = exportDiagnosticsJson(report);
  const blob = new Blob([JSON.stringify(json, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "compiler-diagnostics.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
