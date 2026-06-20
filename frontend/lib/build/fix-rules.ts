import type { GeneratedSourceFile } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import type { CompilerDiagnosticsReport } from "@/lib/build-verification/compiler-diagnostics/types";
import type { ParsedCompilerError } from "@/lib/build-verification/types";
import { inferMissingUsings } from "@/lib/build-verification/error-parser";

export type FixRuleResult = {
  files: GeneratedSourceFile[];
  fixes: string[];
};

const RESERVED_ENTITY_NAMES = new Set([
  "System", "Task", "Object", "String", "Guid", "Type", "Enum", "Void",
  "Int32", "Boolean", "DateTime", "Exception", "Action", "Func", "Thread",
  "Timer", "Math", "Console", "Convert", "Char", "Byte", "Int16", "Int64",
  "Single", "Double", "Decimal", "Array", "EventArgs",
]);

function ensureUsing(content: string, usingLine: string): {
  content: string;
  fixed: boolean;
} {
  if (!usingLine || content.includes(usingLine)) {
    return { content, fixed: false };
  }
  const trimmed = usingLine.trim();
  const namespaceMatch = content.match(/^(\s*using [^;]+;\s*)*/);
  if (namespaceMatch) {
    const insertAt = namespaceMatch[0].length;
    return {
      content: content.slice(0, insertAt) + trimmed + "\n" + content.slice(insertAt),
      fixed: true,
    };
  }
  return { content: trimmed + "\n\n" + content, fixed: true };
}

function targetFile(
  files: GeneratedSourceFile[],
  error: ParsedCompilerError
): GeneratedSourceFile | undefined {
  const fileName = error.file;
  if (!fileName) return undefined;
  return files.find(
    (f) => f.fileName === fileName || f.fileName.endsWith(fileName)
  );
}

/** CS0246 — add missing using directives */
export function applyCs0246Fixes(
  files: GeneratedSourceFile[],
  errors: ParsedCompilerError[]
): FixRuleResult {
  const fixes: string[] = [];
  let next = [...files];

  for (const error of errors.filter((e) => e.code === "CS0246")) {
    const usings = inferMissingUsings(error.message);
    const nsMatch = error.message.match(/type or namespace name '([^']+)'/i);
    if (nsMatch?.[1]?.includes(".")) {
      usings.push(`using ${nsMatch[1]};`);
    } else if (nsMatch?.[1]) {
      usings.push(`using ${PROJECT_NAMESPACE}.Domain.Entities;`);
      usings.push(`using ${PROJECT_NAMESPACE}.Application.DTOs;`);
      usings.push(`using ${PROJECT_NAMESPACE}.Infrastructure.Repositories;`);
    }

    next = next.map((file) => {
      if (error.file && file.fileName !== error.file && !file.fileName.endsWith(error.file ?? "")) {
        return file;
      }
      if (!file.fileName.endsWith(".cs")) return file;

      let content = file.content;
      for (const usingLine of usings) {
        const result = ensureUsing(content, usingLine);
        if (result.fixed) {
          fixes.push(`CS0246: Added ${usingLine.trim()}`);
          content = result.content;
        }
      }
      return content === file.content ? file : { ...file, content };
    });
  }

  return { files: next, fixes: [...new Set(fixes)] };
}

/** CS0118 — rename entities conflicting with .NET namespaces */
export function applyCs0118Fixes(
  files: GeneratedSourceFile[],
  errors: ParsedCompilerError[]
): FixRuleResult {
  const fixes: string[] = [];
  const renames = new Map<string, string>();

  for (const error of errors.filter((e) => e.code === "CS0118")) {
    const nsMatch = error.message.match(/'([^']+)'\s+is a namespace/i);
    const name = nsMatch?.[1] ?? error.file?.replace(".cs", "");
    if (!name || renames.has(name)) continue;

    const newName =
      name === "System"
        ? "SystemSetting"
        : RESERVED_ENTITY_NAMES.has(name)
          ? `${name}Entity`
          : `${name}Model`;
    renames.set(name, newName);
    fixes.push(`CS0118: Renamed entity ${name} → ${newName}`);
  }

  for (const file of files) {
    if (!file.fileName.endsWith(".cs")) continue;
    const base = file.fileName.replace(".cs", "");
    if (RESERVED_ENTITY_NAMES.has(base) && !renames.has(base)) {
      renames.set(base, base === "System" ? "SystemSetting" : `${base}Entity`);
      fixes.push(`CS0118: Renamed entity ${base} → ${renames.get(base)}`);
    }
  }

  if (renames.size === 0) return { files, fixes };

  const next = files.map((file) => {
    let content = file.content;
    let fileName = file.fileName;

    for (const [oldName, newName] of renames) {
      if (fileName === `${oldName}.cs`) {
        fileName = `${newName}.cs`;
      }
      content = content.replace(new RegExp(`\\b${oldName}\\b`, "g"), newName);
    }

    return content !== file.content || fileName !== file.fileName
      ? { ...file, content, fileName }
      : file;
  });

  return { files: next, fixes: [...new Set(fixes)] };
}

/** CS0102 — remove duplicate members (DbSet, properties) */
export function applyCs0102Fixes(
  files: GeneratedSourceFile[],
  errors: ParsedCompilerError[]
): FixRuleResult {
  const fixes: string[] = [];
  const targetFiles = new Set(
    errors.filter((e) => e.code === "CS0102").map((e) => e.file).filter(Boolean) as string[]
  );
  if (targetFiles.size === 0) targetFiles.add("AppDbContext.cs");

  const next = files.map((file) => {
    if (!targetFiles.has(file.fileName) && !file.fileName.endsWith("AppDbContext.cs")) {
      return file;
    }

    const seenMembers = new Set<string>();
    const seenDbSets = new Set<string>();
    let removed = 0;

    const lines = file.content.split("\n");
    const filtered = lines.filter((line) => {
      const dbSet = line.match(/public DbSet<(\w+)>\s+(\w+)/);
      if (dbSet) {
        const key = `${dbSet[1]}:${dbSet[2]}`;
        if (seenDbSets.has(key)) {
          removed += 1;
          return false;
        }
        seenDbSets.add(key);
        return true;
      }

      const member = line.match(/^\s*(?:public|private|protected|internal)\s+[\w<>,?\[\]\s]+\s+(\w+)\s*[{;=]/);
      if (member) {
        const name = member[1];
        if (seenMembers.has(name)) {
          removed += 1;
          return false;
        }
        seenMembers.add(name);
      }
      return true;
    });

    if (removed === 0) return file;
    fixes.push(`CS0102: Removed ${removed} duplicate member(s) in ${file.fileName}`);
    return { ...file, content: filtered.join("\n") };
  });

  return { files: next, fixes };
}

/** CS8618 — initialize non-nullable properties */
export function applyCs8618Fixes(
  files: GeneratedSourceFile[],
  errors: ParsedCompilerError[]
): FixRuleResult {
  const fixes: string[] = [];
  let next = [...files];

  for (const error of errors.filter((e) => e.code === "CS8618")) {
    const file = targetFile(next, error);
    if (!file || !error.line) continue;

    const lines = file.content.split("\n");
    const idx = error.line - 1;
    if (idx < 0 || idx >= lines.length) continue;

    const line = lines[idx];
    if (/=\s*[^;]+;/.test(line) || line.includes("= null!") || line.includes("= string.Empty")) {
      continue;
    }

    let updated = line;
    if (/public string\s+(\w+)\s*\{\s*get;\s*set;\s*\}/.test(line)) {
      updated = line.replace(/\{\s*get;\s*set;\s*\}/, "{ get; set; } = string.Empty;");
    } else if (/public string\?\s+\w+\s*\{\s*get;\s*set;\s*\}/.test(line)) {
      continue;
    } else if (/\{\s*get;\s*set;\s*\}/.test(line)) {
      updated = line.replace(/\{\s*get;\s*set;\s*\}/, "{ get; set; } = null!;");
    } else if (/\{\s*get;\s*init;\s*\}/.test(line)) {
      updated = line.replace(/\{\s*get;\s*init;\s*\}/, "{ get; init; } = null!;");
    }

    if (updated === line) continue;

    lines[idx] = updated;
    fixes.push(`CS8618: Initialized property at ${file.fileName}:${error.line}`);
    next = next.map((f) =>
      f.id === file.id ? { ...f, content: lines.join("\n") } : f
    );
  }

  return { files: next, fixes: [...new Set(fixes)] };
}

/** CS8602 — add null checks / null-forgiving on dereference lines */
export function applyCs8602Fixes(
  files: GeneratedSourceFile[],
  errors: ParsedCompilerError[]
): FixRuleResult {
  const fixes: string[] = [];
  let next = [...files];

  for (const error of errors.filter((e) => e.code === "CS8602")) {
    const file = targetFile(next, error);
    if (!file || !error.line) continue;

    const lines = file.content.split("\n");
    const idx = error.line - 1;
    if (idx < 0 || idx >= lines.length) continue;

    const line = lines[idx];
    if (line.includes(" is null") || line.includes("?.") || line.includes("!.")) {
      continue;
    }

    let updated = line;

    if (/(\w+)\.Result/.test(line) && !line.includes(".Result!")) {
      updated = line.replace(/(\w+)\.Result/g, "$1.Result!");
      fixes.push(`CS8602: Added null-forgiving on Result at ${file.fileName}:${error.line}`);
    } else if (/await (\w+)\./.test(line)) {
      updated = line.replace(/(\w+)(\.\w+)/, "$1!$2");
      fixes.push(`CS8602: Added null-forgiving dereference at ${file.fileName}:${error.line}`);
    } else if (/\w+\.\w+/.test(line) && !line.trim().startsWith("//")) {
      const indent = line.match(/^\s*/)?.[0] ?? "";
      const varMatch = line.match(/(\w+)\s*=\s*(\w+)\./);
      if (varMatch) {
        lines.splice(idx, 0, `${indent}if (${varMatch[2]} is null) return NotFound();`);
        fixes.push(`CS8602: Added null guard at ${file.fileName}:${error.line}`);
        next = next.map((f) =>
          f.id === file.id ? { ...f, content: lines.join("\n") } : f
        );
        continue;
      }
    }

    if (updated !== line) {
      lines[idx] = updated;
      next = next.map((f) =>
        f.id === file.id ? { ...f, content: lines.join("\n") } : f
      );
    }
  }

  return { files: next, fixes: [...new Set(fixes)] };
}

export function applyAllFixRules(
  files: GeneratedSourceFile[],
  analysis: CompilerDiagnosticsReport | null,
  errors: ParsedCompilerError[]
): FixRuleResult {
  const errorList = errors.length > 0 ? errors : (analysis?.diagnostics ?? []);
  const codes = new Set(errorList.map((e) => e.code));

  let next = files;
  const allFixes: string[] = [];

  const rules: Array<(f: GeneratedSourceFile[], e: ParsedCompilerError[]) => FixRuleResult> = [];

  if (codes.has("CS0246") || analysis?.errorGroups.some((g) => g.code === "CS0246")) {
    rules.push(applyCs0246Fixes);
  }
  if (codes.has("CS0118") || analysis?.errorGroups.some((g) => g.code === "CS0118")) {
    rules.push(applyCs0118Fixes);
  }
  if (codes.has("CS0102") || analysis?.errorGroups.some((g) => g.code === "CS0102")) {
    rules.push(applyCs0102Fixes);
  }
  if (codes.has("CS8618") || analysis?.errorGroups.some((g) => g.code === "CS8618")) {
    rules.push(applyCs8618Fixes);
  }
  if (codes.has("CS8602") || analysis?.errorGroups.some((g) => g.code === "CS8602")) {
    rules.push(applyCs8602Fixes);
  }

  if (rules.length === 0) {
    rules.push(applyCs0246Fixes, applyCs0118Fixes, applyCs0102Fixes);
  }

  for (const rule of rules) {
    const result = rule(next, errorList);
    next = result.files;
    allFixes.push(...result.fixes);
  }

  return { files: next, fixes: [...new Set(allFixes)] };
}
