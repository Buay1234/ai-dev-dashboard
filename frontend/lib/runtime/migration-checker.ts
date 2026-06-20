import type { GeneratedSourceFile } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import { extractExceptionExcerpt } from "./database-checker";
import { createCheckResult, type RuntimeCheckDetail } from "./runtime-report";

export function verifyMigrationFiles(files: GeneratedSourceFile[]): RuntimeCheckDetail {
  const migrationFiles = files.filter(
    (f) =>
      f.path.includes("Migrations") &&
      f.language === "csharp" &&
      f.fileName.endsWith(".cs")
  );

  const hasInitial = migrationFiles.some((f) =>
    f.fileName.includes("InitialCreate")
  );
  const hasDesigner = migrationFiles.some((f) => f.fileName.endsWith(".Designer.cs"));
  const hasSnapshot = migrationFiles.some(
    (f) => f.fileName === "AppDbContextModelSnapshot.cs"
  );
  const hasDbContext = files.some((f) => f.fileName === "AppDbContext.cs");

  if (hasInitial && hasDesigner && hasSnapshot && hasDbContext) {
    return createCheckResult(
      "Migration Execution",
      true,
      `${migrationFiles.length} migration files present · InitialCreate ready (static verification)`
    );
  }

  const missing: string[] = [];
  if (!hasInitial) missing.push("InitialCreate migration");
  if (!hasDesigner) missing.push("Designer.cs");
  if (!hasSnapshot) missing.push("AppDbContextModelSnapshot.cs");
  if (!hasDbContext) missing.push("AppDbContext.cs");

  return createCheckResult(
    "Migration Execution",
    false,
    `Missing migration artifacts: ${missing.join(", ")}`
  );
}

export function verifyMigrationFromCommandOutput(
  output: string,
  exitCode: number
): RuntimeCheckDetail {
  const lower = output.toLowerCase();

  if (exitCode === 0) {
    if (
      lower.includes("done.") ||
      lower.includes("applying migration") ||
      lower.includes("no migrations were applied") ||
      lower.includes("already up to date")
    ) {
      return createCheckResult(
        "Migration Execution",
        true,
        "dotnet ef database update completed successfully"
      );
    }
    return createCheckResult(
      "Migration Execution",
      true,
      "Migration command exited successfully"
    );
  }

  if (lower.includes("no migrations") || lower.includes("build failed")) {
    return createCheckResult(
      "Migration Execution",
      false,
      `Migration execution failed: ${extractExceptionExcerpt(output, 1200)}`
    );
  }

  if (lower.includes("pendingmodelchangeswarning") || lower.includes("pending changes")) {
    return createCheckResult(
      "Migration Execution",
      false,
      "Migration model out of sync — regenerate with dotnet ef migrations add"
    );
  }

  return createCheckResult(
    "Migration Execution",
    false,
    `dotnet ef database update failed: ${extractExceptionExcerpt(output, 1200)}`
  );
}

function quoteConnectionString(connectionString: string): string {
  return connectionString.replace(/"/g, '\\"');
}

export function migrationCommand(connectionString?: string): string {
  const base = `dotnet ef database update --project ${PROJECT_NAMESPACE}.Infrastructure --startup-project ${PROJECT_NAMESPACE}.API`;
  if (!connectionString) return base;
  return `${base} --connection "${quoteConnectionString(connectionString)}"`;
}

export function migrationAddCommand(connectionString?: string): string {
  const base = `dotnet ef migrations add InitialCreate --project ${PROJECT_NAMESPACE}.Infrastructure --startup-project ${PROJECT_NAMESPACE}.API --output-dir Migrations`;
  if (!connectionString) return base;
  return `${base} --connection "${quoteConnectionString(connectionString)}"`;
}
