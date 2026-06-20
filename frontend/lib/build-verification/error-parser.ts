import type { ParsedCompilerError } from "./types";

const DIAGNOSTIC_LINE =
  /(?:^|\n)(?:.*?\\)?([^(\n]+\.(?:cs|csproj))\((\d+),(\d+)\):\s*(error|warning)\s+(CS\d+|NU\d+|MSB\d+):\s*(.+)/gi;

const SIMPLE_DIAGNOSTIC =
  /(?:^|\n).+?:\s*(error|warning)\s+(CS\d+|NU\d+|MSB\d+):\s*(.+)/gi;

const RESTORE_ERROR = /(?:^|\n).*?(?:error|ERROR)\s+(NU\d+|MSB\d+):\s*(.+)/gi;

const SUMMARY_ERRORS = /(\d+)\s+Error\(s\)/i;
const SUMMARY_WARNINGS = /(\d+)\s+Warning\(s\)/i;

function pushDiagnostic(
  bucket: ParsedCompilerError[],
  seen: Set<string>,
  entry: ParsedCompilerError
) {
  const key = `${entry.severity}:${entry.file ?? ""}:${entry.line ?? ""}:${entry.code}:${entry.message}`;
  if (seen.has(key)) return;
  seen.add(key);
  bucket.push(entry);
}

export function parseCompilerOutput(output: string): ParsedCompilerError[] {
  const errors: ParsedCompilerError[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  DIAGNOSTIC_LINE.lastIndex = 0;
  while ((match = DIAGNOSTIC_LINE.exec(output)) !== null) {
    if (match[5].toLowerCase() !== "error") continue;
    pushDiagnostic(errors, seen, {
      file: match[1].trim().replace(/^.*[\\/]/, ""),
      line: Number(match[2]),
      code: match[6],
      message: match[7].trim(),
      raw: match[0].trim(),
      severity: "error",
    });
  }

  SIMPLE_DIAGNOSTIC.lastIndex = 0;
  while ((match = SIMPLE_DIAGNOSTIC.exec(output)) !== null) {
    if (match[1].toLowerCase() !== "error") continue;
    pushDiagnostic(errors, seen, {
      code: match[2],
      message: match[3].trim(),
      raw: match[0].trim(),
      severity: "error",
    });
  }

  RESTORE_ERROR.lastIndex = 0;
  while ((match = RESTORE_ERROR.exec(output)) !== null) {
    pushDiagnostic(errors, seen, {
      code: match[1],
      message: match[2].trim(),
      raw: match[0].trim(),
      severity: "error",
    });
  }

  return errors;
}

export function parseCompilerWarnings(output: string): ParsedCompilerError[] {
  const warnings: ParsedCompilerError[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  DIAGNOSTIC_LINE.lastIndex = 0;
  while ((match = DIAGNOSTIC_LINE.exec(output)) !== null) {
    if (match[5].toLowerCase() !== "warning") continue;
    pushDiagnostic(warnings, seen, {
      file: match[1].trim().replace(/^.*[\\/]/, ""),
      line: Number(match[2]),
      code: match[6],
      message: match[7].trim(),
      raw: match[0].trim(),
      severity: "warning",
    });
  }

  SIMPLE_DIAGNOSTIC.lastIndex = 0;
  while ((match = SIMPLE_DIAGNOSTIC.exec(output)) !== null) {
    if (match[1].toLowerCase() !== "warning") continue;
    pushDiagnostic(warnings, seen, {
      code: match[2],
      message: match[3].trim(),
      raw: match[0].trim(),
      severity: "warning",
    });
  }

  return warnings;
}

export function parseBuildSummary(output: string): {
  errorCount: number;
  warningCount: number;
} {
  const errorMatch = output.match(SUMMARY_ERRORS);
  const warningMatch = output.match(SUMMARY_WARNINGS);
  return {
    errorCount: errorMatch ? Number(errorMatch[1]) : 0,
    warningCount: warningMatch ? Number(warningMatch[1]) : 0,
  };
}

export function resolveCompilerCounts(
  output: string,
  parsedErrors: ParsedCompilerError[],
  parsedWarnings: ParsedCompilerError[]
): { compilerErrorCount: number; compilerWarningCount: number } {
  const summary = parseBuildSummary(output);
  return {
    compilerErrorCount: Math.max(summary.errorCount, parsedErrors.length),
    compilerWarningCount: Math.max(summary.warningCount, parsedWarnings.length),
  };
}

export function inferMissingUsings(message: string): string[] {
  const lower = message.toLowerCase();
  const usings: string[] = [];

  if (/task|async|await/.test(lower)) {
    usings.push("using System.Threading.Tasks;");
  }
  if (/cancellationtoken|threading/.test(lower)) {
    usings.push("using System.Threading;");
  }
  if (/list<|ienumerable|icollection|dictionary|hashset|ireadonlylist/.test(lower)) {
    usings.push("using System.Collections.Generic;");
  }
  if (/datetime|guid|exception|console|math/.test(lower) && !/namespace/.test(lower)) {
    usings.push("using System;");
  }
  if (
    /definition for 'select'|system\.linq|\.select\(|\.where\(|\.orderby\(/.test(lower)
  ) {
    usings.push("using System.Linq;");
  }
  if (/webapplication|createbuilder|swaggergen|endpointsapiexplorer/.test(lower)) {
    usings.push("using Microsoft.AspNetCore.Builder;");
    usings.push("using Microsoft.Extensions.DependencyInjection;");
    usings.push("using Microsoft.Extensions.Hosting;");
  }
  if (
    /actionresult|controllerbase|frombody|httppost|httpget|httpput|httpdelete|iapicontroller|okobjectresult|notfoundresult|createdatactionresult/.test(
      lower
    )
  ) {
    usings.push("using Microsoft.AspNetCore.Mvc;");
  }
  if (/mock<|it\.|mock\.setup/.test(lower)) {
    usings.push("using Moq;");
  }
  if (/fact|theory|xunit|assert\./.test(lower)) {
    usings.push("using Xunit;");
  }
  if (/dbcontext|entityframeworkcore|dbset|migrationbuilder/.test(lower)) {
    usings.push("using Microsoft.EntityFrameworkCore;");
  }
  if (/migration\]|migration\(/.test(lower)) {
    usings.push("using Microsoft.EntityFrameworkCore.Migrations;");
  }
  if (/entitytypeconfiguration|entitytypebuilder|modelbuilder/.test(lower)) {
    usings.push("using Microsoft.EntityFrameworkCore.Metadata.Builders;");
  }

  return usings;
}
