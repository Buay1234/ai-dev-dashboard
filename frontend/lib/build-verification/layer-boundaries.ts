import type { GeneratedSourceFile } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";

const NS = PROJECT_NAMESPACE;

export function isDomainLayerFile(file: GeneratedSourceFile): boolean {
  return file.path.includes(`${NS}.Domain`);
}

export function isApplicationLayerFile(file: GeneratedSourceFile): boolean {
  return file.path.includes(`${NS}.Application`);
}

export function isInfrastructureLayerFile(file: GeneratedSourceFile): boolean {
  return file.path.includes(`${NS}.Infrastructure`);
}

export function isApiLayerFile(file: GeneratedSourceFile): boolean {
  return file.path.includes(`${NS}.API`);
}

/** Clean Architecture: which project namespaces a file may import. */
export function isUsingAllowedForFile(
  file: GeneratedSourceFile,
  usingLine: string
): boolean {
  if (isDomainLayerFile(file)) {
    return !(
      usingLine.includes(`${NS}.Application`) ||
      usingLine.includes(`${NS}.API`) ||
      usingLine.includes(`${NS}.Infrastructure`)
    );
  }

  if (isApplicationLayerFile(file)) {
    return !(
      usingLine.includes(`${NS}.Infrastructure`) || usingLine.includes(`${NS}.API`)
    );
  }

  if (isInfrastructureLayerFile(file)) {
    return !(usingLine.includes(`${NS}.Application`) || usingLine.includes(`${NS}.API`));
  }

  return true;
}

function disallowedPrefixesForFile(file: GeneratedSourceFile): string[] {
  if (isDomainLayerFile(file)) {
    return [`${NS}.Application`, `${NS}.API`, `${NS}.Infrastructure`];
  }
  if (isApplicationLayerFile(file)) {
    return [`${NS}.Infrastructure`, `${NS}.API`];
  }
  if (isInfrastructureLayerFile(file)) {
    return [`${NS}.Application`, `${NS}.API`];
  }
  return [];
}

export function stripCrossLayerUsings(content: string, file: GeneratedSourceFile): {
  content: string;
  fixed: boolean;
} {
  const prefixes = disallowedPrefixesForFile(file);
  if (prefixes.length === 0) {
    return { content, fixed: false };
  }

  let next = content;
  for (const prefix of prefixes) {
    const escaped = prefix.replace(/\./g, "\\.");
    next = next.replace(
      new RegExp(`^using ${escaped}[^;]*;\\s*\\n?`, "gm"),
      ""
    );
  }

  return { content: next, fixed: next !== content };
}

export function sanitizeLayerUsings(files: GeneratedSourceFile[]): {
  files: GeneratedSourceFile[];
  fixes: string[];
} {
  const fixes: string[] = [];
  const next = files.map((file) => {
    if (!file.fileName.endsWith(".cs")) return file;
    const prefixes = disallowedPrefixesForFile(file);
    if (prefixes.length === 0) return file;

    const result = stripCrossLayerUsings(file.content, file);
    if (!result.fixed) return file;

    const layer = isDomainLayerFile(file)
      ? "Domain"
      : isApplicationLayerFile(file)
        ? "Application"
        : "Infrastructure";
    fixes.push(`Removed cross-layer usings from ${layer} → ${file.fileName}`);
    return { ...file, content: result.content };
  });

  return { files: next, fixes };
}

export function inferSymbolUsings(symbol: string): string[] {
  const usings: string[] = [];

  if (symbol === "AppDbContext") {
    usings.push(`using ${NS}.Infrastructure.Data;`);
  }
  if (symbol.endsWith("Controller")) {
    usings.push(`using ${NS}.API.Controllers;`);
  }
  if (
    symbol.endsWith("Repository") ||
    (symbol.startsWith("I") && symbol.endsWith("Repository"))
  ) {
    usings.push(`using ${NS}.Infrastructure.Repositories;`);
  }
  if (
    symbol.endsWith("Response") ||
    symbol.endsWith("CreateRequest") ||
    symbol.endsWith("UpdateRequest")
  ) {
    usings.push(`using ${NS}.Application.DTOs;`);
  }
  if (/^[A-Z][a-zA-Z0-9]+$/.test(symbol) && !symbol.includes(".")) {
    usings.push(`using ${NS}.Domain.Entities;`);
  }

  return usings;
}

export function filterUsingsForFile(
  file: GeneratedSourceFile,
  usings: string[]
): string[] {
  return [...new Set(usings)].filter((u) => isUsingAllowedForFile(file, u));
}

export function isContentTriggerAllowedForFile(
  file: GeneratedSourceFile,
  usingLine: string
): boolean {
  if (!isDomainLayerFile(file) && !isApplicationLayerFile(file)) {
    return true;
  }

  return !(
    usingLine.includes("Microsoft.AspNetCore") ||
    usingLine.includes("Microsoft.EntityFrameworkCore") ||
    usingLine.includes("Moq") ||
    usingLine.includes("Xunit")
  );
}
