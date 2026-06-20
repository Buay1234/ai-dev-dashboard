import type { GeneratedSourceFile } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
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
      "Migration execution failed — build or migration assembly error"
    );
  }

  return createCheckResult(
    "Migration Execution",
    false,
    "dotnet ef database update failed — see runtime output for details"
  );
}

export function migrationCommand(): string {
  return `dotnet ef database update --project ${PROJECT_NAMESPACE}.Infrastructure --startup-project ${PROJECT_NAMESPACE}.API`;
}
