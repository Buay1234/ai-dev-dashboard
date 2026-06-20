import type { GeneratedSourceFile } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import type { ParsedCompilerError } from "./types";
import { inferMissingUsings } from "./error-parser";
import {
  filterUsingsForFile,
  inferSymbolUsings,
  isContentTriggerAllowedForFile,
  isUsingAllowedForFile,
  sanitizeLayerUsings,
  stripCrossLayerUsings,
} from "./layer-boundaries";

const STANDARD_USINGS = [
  "using System;",
  "using System.Collections.Generic;",
  "using System.Threading;",
  "using System.Threading.Tasks;",
];

const CONTENT_TRIGGERS: { pattern: RegExp; using: string }[] = [
  { pattern: /\bTask\b|async |await /, using: "using System.Threading.Tasks;" },
  { pattern: /\bCancellationToken\b/, using: "using System.Threading;" },
  {
    pattern: /\bList<|\bIReadOnlyList<|\bIEnumerable<|\bDictionary</,
    using: "using System.Collections.Generic;",
  },
  { pattern: /\bDateTime\b|\bGuid\b|\bException\b/, using: "using System;" },
  {
    pattern: /\.Select\(|\.Where\(|\.OrderBy\(|\.Any\(|\.FirstOrDefault\(/,
    using: "using System.Linq;",
  },
  {
    pattern: /\bWebApplication\b|\bWebApplication\.CreateBuilder\b/,
    using: "using Microsoft.AspNetCore.Builder;",
  },
  {
    pattern: /\bActionResult\b|\bControllerBase\b|\[Http(Get|Post|Put|Delete)/,
    using: "using Microsoft.AspNetCore.Mvc;",
  },
  {
    pattern: /\bDbContext\b|\bDbSet<|\bEntityFrameworkCore\b/,
    using: "using Microsoft.EntityFrameworkCore;",
  },
  {
    pattern: /\bMigrationBuilder\b|\bMigration\b.*\bUp\b/,
    using: "using Microsoft.EntityFrameworkCore.Migrations;",
  },
  {
    pattern: /\bIEntityTypeConfiguration\b|\bEntityTypeBuilder\b/,
    using: "using Microsoft.EntityFrameworkCore.Metadata.Builders;",
  },
  { pattern: /\bMock<|\bIt\./, using: "using Moq;" },
  { pattern: /\[Fact\]|\[Theory\]/, using: "using Xunit;" },
];

function ensureUsing(content: string, usingLine: string): {
  content: string;
  fixed: boolean;
} {
  if (!usingLine || content.includes(usingLine)) {
    return { content, fixed: false };
  }
  const trimmed = usingLine.trim();
  if (content.includes(trimmed.replace(";", ""))) {
    return { content, fixed: false };
  }

  const namespaceMatch = content.match(/^(\s*using [^;]+;\s*)*/);
  if (namespaceMatch) {
    const insertAt = namespaceMatch[0].length;
    return {
      content: content.slice(0, insertAt) + trimmed + "\n" + content.slice(insertAt),
      fixed: true,
    };
  }

  return {
    content: trimmed + "\n\n" + content,
    fixed: true,
  };
}

function fixFileUsings(
  file: GeneratedSourceFile,
  extraUsings: string[]
): { file: GeneratedSourceFile; fixes: string[] } {
  if (!file.fileName.endsWith(".cs")) {
    return { file, fixes: [] };
  }

  let content = file.content;
  const fixes: string[] = [];

  for (const trigger of CONTENT_TRIGGERS) {
    if (!isContentTriggerAllowedForFile(file, trigger.using)) continue;
    if (trigger.pattern.test(content)) {
      const result = ensureUsing(content, trigger.using);
      if (result.fixed) {
        fixes.push(formatFixMessage(trigger.using));
        content = result.content;
      }
    }
  }

  for (const usingLine of extraUsings) {
    if (!isUsingAllowedForFile(file, usingLine)) continue;
    const result = ensureUsing(content, usingLine);
    if (result.fixed) {
      fixes.push(formatFixMessage(usingLine));
      content = result.content;
    }
  }

  return {
    file: content === file.content ? file : { ...file, content },
    fixes,
  };
}

export function formatFixMessage(usingOrRef: string): string {
  const trimmed = usingOrRef.trim();
  if (trimmed.startsWith("using ")) {
    return `Added ${trimmed}`;
  }
  return trimmed;
}

export function dedupeFixMessages(fixes: string[]): string[] {
  return [...new Set(fixes)];
}

function inferNamespaceUsings(message: string): string[] {
  const typeMatch = message.match(
    /type or namespace name '([^']+)' could not be found/i
  );
  if (!typeMatch) return [];
  return inferSymbolUsings(typeMatch[1]);
}

export function applyProactiveFixes(files: GeneratedSourceFile[]): {
  files: GeneratedSourceFile[];
  fixes: string[];
} {
  const allFixes: string[] = [];
  const withUsings = files.map((file) => {
    const { file: updated, fixes } = fixFileUsings(file, STANDARD_USINGS);
    allFixes.push(...fixes);
    return updated;
  });
  const structural = applyStructuralFixes(withUsings);
  allFixes.push(...structural.fixes);
  const layered = sanitizeLayerUsings(structural.files);
  allFixes.push(...layered.fixes);
  return { files: layered.files, fixes: dedupeFixMessages(allFixes) };
}

const RESERVED_ENTITY_NAMES = new Set([
  "System",
  "Task",
  "Object",
  "String",
  "Guid",
  "Type",
  "Enum",
  "Void",
  "Int32",
  "Boolean",
  "DateTime",
  "Exception",
  "Action",
  "Func",
  "Thread",
  "Timer",
  "Math",
  "Console",
  "Convert",
  "Char",
  "Byte",
  "Int16",
  "Int64",
  "Single",
  "Double",
  "Decimal",
  "Array",
  "EventArgs",
]);

function fixDuplicateDbSets(content: string): { content: string; fixed: boolean } {
  const seenProps = new Set<string>();
  const seenTypes = new Set<string>();
  let fixed = false;

  const next = content.split("\n").filter((line) => {
    const match = line.match(/public DbSet<(\w+)>\s+(\w+)/);
    if (!match) return true;
    const [, typeName, propName] = match;
    if (seenProps.has(propName) || seenTypes.has(typeName)) {
      fixed = true;
      return false;
    }
    seenProps.add(propName);
    seenTypes.add(typeName);
    return true;
  });

  return { content: next.join("\n"), fixed };
}

function fixReservedEntityNames(files: GeneratedSourceFile[]): {
  files: GeneratedSourceFile[];
  fixes: string[];
} {
  const fixes: string[] = [];
  const renames = new Map<string, string>();

  for (const file of files) {
    if (!file.fileName.endsWith(".cs")) continue;
    const baseName = file.fileName.replace(".cs", "");
    const classMatch = file.content.match(/public class (\w+)/);
    const name = classMatch?.[1] ?? baseName;
    if (RESERVED_ENTITY_NAMES.has(name) && !name.endsWith("Entity")) {
      renames.set(name, `${name}Entity`);
    }
  }

  if (renames.size === 0) {
    return { files, fixes };
  }

  const next = files.map((file) => {
    let content = file.content;
    let fileName = file.fileName;

    for (const [oldName, newName] of renames) {
      if (fileName === `${oldName}.cs`) {
        fileName = `${newName}.cs`;
        fixes.push(`Renamed entity ${oldName} → ${newName} (reserved .NET namespace)`);
      }
      content = content.replace(new RegExp(`\\b${oldName}\\b`, "g"), newName);
    }

    if (content !== file.content || fileName !== file.fileName) {
      return { ...file, content, fileName };
    }
    return file;
  });

  return { files: next, fixes: dedupeFixMessages(fixes) };
}

export function applyStructuralFixes(files: GeneratedSourceFile[]): {
  files: GeneratedSourceFile[];
  fixes: string[];
} {
  const fixes: string[] = [];
  let next = files.map((file) => {
    if (file.fileName !== "AppDbContext.cs") return file;
    const result = fixDuplicateDbSets(file.content);
    if (!result.fixed) return file;
    fixes.push("Removed duplicate DbSet declarations");
    return { ...file, content: result.content };
  });

  const renamed = fixReservedEntityNames(next);
  next = renamed.files;
  fixes.push(...renamed.fixes);

  const layered = sanitizeLayerUsings(next);
  next = layered.files;
  fixes.push(...layered.fixes);

  return { files: next, fixes: dedupeFixMessages(fixes) };
}

export function applyFixesFromErrors(
  errors: ParsedCompilerError[],
  files: GeneratedSourceFile[]
): { files: GeneratedSourceFile[]; fixes: string[] } {
  const allFixes: string[] = [];
  let next = [...files];

  for (const error of errors) {
    const extraUsings = [
      ...inferMissingUsings(`${error.message} ${error.code}`),
      ...inferNamespaceUsings(error.message),
    ];
    if (extraUsings.length === 0 && !error.file) continue;

    const isCrossLayerNamespaceError =
      error.code === "CS0234" &&
      /namespace name '(Application|Infrastructure|API)' does not exist/i.test(
        error.message
      );

    next = next.map((file) => {
      if (isCrossLayerNamespaceError) {
        const stripped = stripCrossLayerUsings(file.content, file);
        if (stripped.fixed) {
          allFixes.push(`Removed invalid cross-layer usings → ${file.fileName}`);
          return { ...file, content: stripped.content };
        }
        return file;
      }

      if (
        error.file &&
        file.fileName !== error.file &&
        !file.fileName.endsWith(error.file)
      ) {
        return file;
      }

      const allowed = filterUsingsForFile(file, extraUsings);
      if (allowed.length === 0) return file;

      const { file: updated, fixes } = fixFileUsings(file, allowed);
      allFixes.push(...fixes);
      return updated;
    });
  }

  const layered = sanitizeLayerUsings(next);
  allFixes.push(...layered.fixes);

  return { files: layered.files, fixes: dedupeFixMessages(allFixes) };
}

function appendBeforeClosingProject(content: string, block: string): string {
  if (content.includes(block.trim())) return content;
  return content.replace("</Project>", `${block}\n\n</Project>`);
}

function appendToFirstItemGroup(content: string, lines: string): string {
  if (content.includes(lines.trim().split("\n")[0])) return content;
  if (content.includes("<ItemGroup>")) {
    return content.replace("<ItemGroup>", `<ItemGroup>\n${lines}`);
  }
  return appendBeforeClosingProject(content, `  <ItemGroup>\n${lines}\n  </ItemGroup>`);
}

export function ensureProjectReferences(files: GeneratedSourceFile[]): {
  files: GeneratedSourceFile[];
  fixes: string[];
} {
  const fixes: string[] = [];
  const ns = PROJECT_NAMESPACE;

  const next = files.map((file) => {
    if (!file.fileName.endsWith(".csproj")) return file;

    let content = file.content;
    const name = file.fileName;

    if (name.includes("Application") && !content.includes(`${ns}.Domain.csproj`)) {
      content = appendBeforeClosingProject(
        content,
        `  <ItemGroup>\n    <ProjectReference Include="..\\${ns}.Domain\\${ns}.Domain.csproj" />\n  </ItemGroup>`
      );
      fixes.push(`Added project reference → ${ns}.Domain`);
    }

    if (name.includes("Infrastructure")) {
      if (!content.includes("Microsoft.EntityFrameworkCore")) {
        content = appendToFirstItemGroup(
          content,
          `    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />\n    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.0" />`
        );
        fixes.push(`Added EF Core package references → ${ns}.Infrastructure`);
      }
      if (!content.includes(`${ns}.Domain.csproj`)) {
        content = appendBeforeClosingProject(
          content,
          `  <ItemGroup>\n    <ProjectReference Include="..\\${ns}.Domain\\${ns}.Domain.csproj" />\n  </ItemGroup>`
        );
        fixes.push(`Added project reference → ${ns}.Domain`);
      }
    }

    if (name.includes(".API") && !content.includes(`${ns}.Infrastructure.csproj`)) {
      if (!content.includes(`${ns}.Application.csproj`)) {
        content = appendBeforeClosingProject(
          content,
          `  <ItemGroup>\n    <ProjectReference Include="..\\${ns}.Application\\${ns}.Application.csproj" />\n  </ItemGroup>`
        );
        fixes.push(`Added project reference → ${ns}.Application`);
      }
    }

    if (name.includes(".Tests") && !content.includes("Microsoft.NET.Test.Sdk")) {
      content = appendToFirstItemGroup(
        content,
        `    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />\n    <PackageReference Include="xunit" Version="2.9.2" />\n    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />`
      );
      fixes.push(`Added test package references → ${ns}.Tests`);
    }

    return content === file.content ? file : { ...file, content };
  });

  return { files: next, fixes: dedupeFixMessages(fixes) };
}
