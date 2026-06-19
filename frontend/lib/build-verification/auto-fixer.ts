import type { GeneratedSourceFile } from "@/lib/project-generator/types";
import type { ParsedCompilerError } from "./types";
import { inferMissingUsings } from "./error-parser";

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
  { pattern: /\bActionResult\b|\bControllerBase\b|\[Http(Get|Post|Put|Delete)/, using: "using Microsoft.AspNetCore.Mvc;" },
  { pattern: /\bDbContext\b|\bDbSet<|\bEntityFrameworkCore\b/, using: "using Microsoft.EntityFrameworkCore;" },
  { pattern: /\bMigrationBuilder\b|\bMigration\b.*\bUp\b/, using: "using Microsoft.EntityFrameworkCore.Migrations;" },
  { pattern: /\bIEntityTypeConfiguration\b|\bEntityTypeBuilder\b/, using: "using Microsoft.EntityFrameworkCore.Metadata.Builders;" },
  { pattern: /\bMock<|\bIt\./, using: "using Moq;" },
  { pattern: /\[Fact\]|\[Theory\]/, using: "using Xunit;" },
];

function ensureUsing(content: string, usingLine: string): {
  content: string;
  fixed: boolean;
} {
  if (content.includes(usingLine)) {
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
    if (trigger.pattern.test(content)) {
      const result = ensureUsing(content, trigger.using);
      if (result.fixed) {
        fixes.push(`Added ${trigger.using} → ${file.fileName}`);
        content = result.content;
      }
    }
  }

  for (const usingLine of extraUsings) {
    const result = ensureUsing(content, usingLine);
    if (result.fixed) {
      fixes.push(`Added ${usingLine} → ${file.fileName}`);
      content = result.content;
    }
  }

  return {
    file: content === file.content ? file : { ...file, content },
    fixes,
  };
}

export function applyProactiveFixes(files: GeneratedSourceFile[]): {
  files: GeneratedSourceFile[];
  fixes: string[];
} {
  const allFixes: string[] = [];
  const next = files.map((file) => {
    const { file: updated, fixes } = fixFileUsings(file, STANDARD_USINGS);
    allFixes.push(...fixes);
    return updated;
  });
  return { files: next, fixes: allFixes };
}

export function applyFixesFromErrors(
  errors: ParsedCompilerError[],
  files: GeneratedSourceFile[]
): { files: GeneratedSourceFile[]; fixes: string[] } {
  const allFixes: string[] = [];
  let next = [...files];

  for (const error of errors) {
    const extraUsings = inferMissingUsings(`${error.message} ${error.code}`);
    if (extraUsings.length === 0 && !error.file) continue;

    next = next.map((file) => {
      if (error.file && file.fileName !== error.file && !file.fileName.endsWith(error.file)) {
        return file;
      }
      const { file: updated, fixes } = fixFileUsings(file, extraUsings);
      allFixes.push(...fixes);
      return updated;
    });
  }

  return { files: next, fixes: allFixes };
}

export function ensureProjectReferences(files: GeneratedSourceFile[]): {
  files: GeneratedSourceFile[];
  fixes: string[];
} {
  const fixes: string[] = [];
  const next = files.map((file) => {
    if (!file.fileName.endsWith(".csproj")) return file;

    let content = file.content;
    if (
      file.fileName.includes("Application") &&
      !content.includes("MyProject.Domain.csproj")
    ) {
      content = content.replace(
        "</Project>",
        `  <ItemGroup>\n    <ProjectReference Include="..\\MyProject.Domain\\MyProject.Domain.csproj" />\n  </ItemGroup>\n\n</Project>`
      );
      fixes.push("Added project reference → MyProject.Domain");
    }
    if (
      file.fileName.includes("Infrastructure") &&
      !content.includes("Microsoft.EntityFrameworkCore")
    ) {
      if (content.includes("<ItemGroup>")) {
        content = content.replace(
          "<ItemGroup>",
          `<ItemGroup>\n    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />\n    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.0" />`
        );
      } else {
        content = content.replace(
          "</Project>",
          `  <ItemGroup>\n    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />\n    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.0" />\n  </ItemGroup>\n\n</Project>`
        );
      }
      fixes.push("Added EF Core package references → Infrastructure.csproj");
    }

    return content === file.content ? file : { ...file, content };
  });

  return { files: next, fixes };
}
