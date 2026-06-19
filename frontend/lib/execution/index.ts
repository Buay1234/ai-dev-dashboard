import type { GeneratedProjectBundle } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import type {
  DatabasePanelInfo,
  ExecutionReport,
  ExecutionStatus,
  ExecutionStep,
  ExecutionTimelineEvent,
} from "./execution-types";
import {
  extractConnectionString,
  extractDatabaseName,
  runBuildCheck,
  runDatabaseCreationCheck,
} from "./database-runner";
import {
  resolveMigrationStatusLabel,
  runMigrationExecutionCheck,
} from "./migration-runner";
import {
  summarizeCrudValidation,
  validateCrudForProject,
} from "./crud-validator";
import { buildTestExecutionStep, runUnitTestValidation } from "./test-runner";

export type ExecutionProgressCallback = (
  step: ExecutionStep,
  timelineEvent: ExecutionTimelineEvent
) => void;

const STEP_DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timelineEvent(
  agent: string,
  label: string,
  status: ExecutionStatus
): ExecutionTimelineEvent {
  return {
    id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleTimeString(),
    agent,
    label,
    status,
  };
}

function overallStatus(steps: ExecutionStep[]): ExecutionStatus {
  if (steps.some((s) => s.status === "failed")) return "failed";
  if (steps.every((s) => s.status === "success")) return "success";
  return "pending";
}

export function upsertExecutionStep(
  steps: ExecutionStep[],
  step: ExecutionStep
): ExecutionStep[] {
  const index = steps.findIndex((s) => s.id === step.id);
  if (index >= 0) {
    const next = [...steps];
    next[index] = step;
    return next;
  }
  return [...steps, step];
}

export function buildDatabasePanelInfo(
  project: GeneratedProjectBundle,
  migrationStep: ExecutionStep
): DatabasePanelInfo {
  return {
    connection: extractConnectionString(project),
    databaseName: extractDatabaseName(project),
    migrationStatus: resolveMigrationStatusLabel(migrationStep),
    tableCount: project.entities.length,
  };
}

export async function runFullExecutionPipeline(
  project: GeneratedProjectBundle,
  onProgress?: ExecutionProgressCallback
): Promise<ExecutionReport> {
  const startedAt = new Date().toISOString();
  const timeline: ExecutionTimelineEvent[] = [];
  const steps: ExecutionStep[] = [];

  const dotnetCommands = [
    "dotnet restore",
    "dotnet build",
    `dotnet ef database update --project ${PROJECT_NAMESPACE}.Infrastructure --startup-project ${PROJECT_NAMESPACE}.API`,
    "dotnet test",
  ];

  async function runStep(
    runner: () => ExecutionStep,
    runningLabel: string
  ): Promise<ExecutionStep> {
    const running: ExecutionStep = {
      ...runner(),
      status: "running",
      message: runningLabel,
    };
    const runEvt = timelineEvent(
      running.agent ?? "System",
      running.label,
      "running"
    );
    timeline.push(runEvt);
    onProgress?.(running, runEvt);
    await sleep(STEP_DELAY_MS);

    const final = runner();
    const doneEvt = timelineEvent(
      final.agent ?? "System",
      final.label,
      final.status
    );
    timeline.push(doneEvt);
    onProgress?.(final, doneEvt);
    steps.push(final);
    return final;
  }

  await runStep(
    () => runDatabaseCreationCheck(project),
    "Restoring NuGet packages…"
  );
  await runStep(() => runBuildCheck(project), "Compiling solution…");

  const migrationStep = await runStep(
    () => runMigrationExecutionCheck(project),
    "Applying EF Core migration…"
  );

  const crudResults = validateCrudForProject(project);
  const crudStatus = summarizeCrudValidation(crudResults);

  const crudStep: ExecutionStep = {
    id: "crud-validation",
    label: "CRUD Validation (Usopp)",
    status: crudStatus,
    agent: "Usopp",
    message: `${crudResults.filter((r) => r.overall === "success").length}/${crudResults.length} entities pass Create·Read·Update·Delete`,
  };
  const crudRunEvt = timelineEvent("Usopp", "CRUD validation started", "running");
  timeline.push(crudRunEvt);
  onProgress?.({ ...crudStep, status: "running" }, crudRunEvt);
  await sleep(STEP_DELAY_MS);
  const crudDoneEvt = timelineEvent(
    "Usopp",
    crudStep.message ?? "CRUD done",
    crudStatus
  );
  timeline.push(crudDoneEvt);
  onProgress?.(crudStep, crudDoneEvt);
  steps.push(crudStep);

  const testSummary = runUnitTestValidation(project);
  const testStep = buildTestExecutionStep(testSummary);
  const testRunEvt = timelineEvent("Usopp", "Running unit tests…", "running");
  timeline.push(testRunEvt);
  onProgress?.({ ...testStep, status: "running" }, testRunEvt);
  await sleep(STEP_DELAY_MS);
  const testDoneEvt = timelineEvent(
    "Usopp",
    testStep.message ?? "Tests complete",
    testSummary.status
  );
  timeline.push(testDoneEvt);
  onProgress?.(testStep, testDoneEvt);
  steps.push(testStep);

  const databasePanel = buildDatabasePanelInfo(project, migrationStep);

  return {
    id: `exec-${Date.now()}`,
    startedAt,
    completedAt: new Date().toISOString(),
    overallStatus: overallStatus(steps),
    steps,
    crudResults,
    testSummary,
    databasePanel,
    timeline,
    dotnetCommands,
  };
}

export {
  validateCrudForProject,
  runUnitTestValidation,
  runDatabaseCreationCheck,
  runMigrationExecutionCheck,
};

export type {
  ExecutionReport,
  ExecutionStep,
  ExecutionTimelineEvent,
  DatabasePanelInfo,
} from "./execution-types";
