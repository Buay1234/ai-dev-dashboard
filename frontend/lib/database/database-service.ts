import type { EntityDefinition, GeneratedSourceFile } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import type { DatabaseWorkflowState } from "./database-status";
import { resolveStatusLabel } from "./database-status";
import {
  generateAppDbContextV24,
  generateEntityConfigurations,
  generateMigrationFiles,
  generateMigrationPreview,
  getMigrationProgressSteps,
  migrationFilesToArtifacts,
} from "./migration-service";
import type { ProjectArtifact } from "@/app/types/artifacts";

export type DatabaseWorkflowResult = {
  workflow: DatabaseWorkflowState;
  sourceFiles: GeneratedSourceFile[];
  migrationArtifacts: ProjectArtifact[];
};

export function runDatabaseMigrationWorkflow(
  entities: EntityDefinition[]
): DatabaseWorkflowResult {
  const dbContext = generateAppDbContextV24(entities);
  const configurations = generateEntityConfigurations(entities);
  const migrationFiles = generateMigrationFiles(entities);
  const preview = generateMigrationPreview(entities, migrationFiles);

  const progressSteps = getMigrationProgressSteps().map((step) => ({
    ...step,
    done: true,
  }));

  const sourceFiles: GeneratedSourceFile[] = [
    dbContext,
    ...configurations,
    ...migrationFiles,
    {
      id: "migration-preview-doc",
      path: "docs/migrations",
      fileName: "MigrationPreview.md",
      category: "migration",
      agent: "Franky",
      language: "markdown",
      content: preview,
    },
  ];

  const migrationArtifacts = migrationFilesToArtifacts(migrationFiles, preview);

  const efCommands = [
    `dotnet ef migrations add InitialCreate --project ${PROJECT_NAMESPACE}.Infrastructure --startup-project ${PROJECT_NAMESPACE}.API`,
    `dotnet ef database update --project ${PROJECT_NAMESPACE}.Infrastructure --startup-project ${PROJECT_NAMESPACE}.API`,
  ];

  const workflow: DatabaseWorkflowState = {
    connectionState: "connected",
    migrationState: "pending",
    statusLabel: resolveStatusLabel("connected", "pending"),
    preview,
    progressSteps,
    efCommands,
    migrationFileNames: migrationFiles.map((f) => f.fileName),
    updatedAt: new Date().toISOString(),
  };

  return { workflow, sourceFiles, migrationArtifacts };
}

export function simulateMigrationApplied(
  current: DatabaseWorkflowState
): DatabaseWorkflowState {
  return {
    ...current,
    migrationState: "applied",
    statusLabel: resolveStatusLabel("connected", "applied"),
    updatedAt: new Date().toISOString(),
  };
}

export function mergeDatabaseSourceFiles(
  projectFiles: GeneratedSourceFile[],
  databaseFiles: GeneratedSourceFile[]
): GeneratedSourceFile[] {
  const replaceIds = new Set([
    "infrastructure-dbcontext",
    "migration-ef",
    "migration-initial",
    "migration-designer",
    "migration-snapshot",
  ]);
  const replaceNames = new Set(["AppDbContext.cs"]);

  const filtered = projectFiles.filter(
    (f) =>
      !replaceIds.has(f.id) &&
      !(f.category === "migration" && f.agent === "Zoro" && f.id === "migration-ef") &&
      !(f.fileName === "AppDbContext.cs")
  );

  return [...filtered, ...databaseFiles];
}

export {
  generateMigrationPreview,
  getMigrationProgressSteps,
};
