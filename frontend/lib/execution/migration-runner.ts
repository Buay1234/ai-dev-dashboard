import type { GeneratedProjectBundle } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import type { ExecutionStep } from "./execution-types";

export function runMigrationExecutionCheck(
  project: GeneratedProjectBundle
): ExecutionStep {
  const migrationFiles = project.sourceFiles.filter(
    (f) =>
      f.category === "migration" &&
      f.path.includes("Migrations") &&
      f.language === "csharp"
  );

  const hasMigration = migrationFiles.some((f) =>
    f.fileName.includes("InitialCreate")
  );
  const hasDesigner = migrationFiles.some((f) => f.fileName.endsWith(".Designer.cs"));
  const hasSnapshot = migrationFiles.some(
    (f) => f.fileName === "AppDbContextModelSnapshot.cs"
  );
  const hasDbContext = project.sourceFiles.some(
    (f) => f.fileName === "AppDbContext.cs"
  );

  const command = `dotnet ef database update --project ${PROJECT_NAMESPACE}.Infrastructure --startup-project ${PROJECT_NAMESPACE}.API`;

  if (hasMigration && hasDesigner && hasSnapshot && hasDbContext) {
    return {
      id: "dotnet-ef-update",
      label: "Migration Execution (dotnet ef database update)",
      command,
      status: "success",
      agent: "Franky",
      message: `${migrationFiles.length} migration files · ${project.entities.length} tables ready to apply`,
    };
  }

  return {
    id: "dotnet-ef-update",
    label: "Migration Execution (dotnet ef database update)",
    command,
    status: "failed",
    agent: "Franky",
    message: "Missing InitialCreate migration, Designer, or ModelSnapshot",
  };
}

export function resolveMigrationStatusLabel(
  step: ExecutionStep
): "Pending" | "Applied" | "Failed" {
  if (step.status === "success") return "Applied";
  if (step.status === "failed") return "Failed";
  if (step.status === "running") return "Pending";
  return "Pending";
}
