import type { BuildVerificationResult } from "@/lib/build-verification/types";
import type { ExecutionReport } from "@/lib/execution/execution-types";
import type { GeneratedProjectBundle } from "@/lib/project-generator/types";

export type ExportState = {
  missionStatus: string;
  missionComplete: boolean;
  buildPassed: boolean;
  testsPassed: boolean;
  generatedFilesCount: number;
  canExport: boolean;
  exportEnabled: boolean;
  exportReady: boolean;
  exportLocked: boolean;
  validationPassed: boolean;
  buildVerificationComplete: boolean;
};

export function computeExportState(
  currentAgent: string,
  buildVerification: BuildVerificationResult | null,
  executionReport: ExecutionReport | null,
  projectBundle: GeneratedProjectBundle | null
): ExportState {
  const missionStatus =
    currentAgent === "Completed" ? "complete" : currentAgent.toLowerCase();
  const missionComplete = currentAgent === "Completed";

  const buildFromVerification = buildVerification?.build === "pass";
  const buildFromExecution =
    executionReport?.steps.find((s) => s.id === "dotnet-build")?.status ===
    "success";
  const buildPassed =
    buildFromVerification ||
    buildFromExecution ||
    buildVerification?.complete === true;

  const testsFromVerification = buildVerification?.tests === "pass";
  const testsFromExecution =
    (executionReport?.testSummary.failed ?? 1) === 0 &&
    (executionReport?.testSummary.total ?? 0) > 0;
  const testsPassed =
    testsFromVerification ||
    testsFromExecution ||
    buildVerification?.complete === true;

  const generatedFilesCount = projectBundle?.sourceFiles.length ?? 0;

  const canExport =
    missionComplete &&
    buildPassed &&
    testsPassed &&
    generatedFilesCount > 0;

  return {
    missionStatus,
    missionComplete,
    buildPassed,
    testsPassed,
    generatedFilesCount,
    canExport,
    exportEnabled: canExport,
    exportReady: canExport,
    exportLocked: !canExport,
    validationPassed: buildPassed && testsPassed,
    buildVerificationComplete: buildVerification?.complete === true,
  };
}

export function logExportState(state: ExportState): void {
  console.log("[Export State]", {
    missionStatus: state.missionStatus,
    missionComplete: state.missionComplete,
    buildPassed: state.buildPassed,
    testsPassed: state.testsPassed,
    generatedFilesCount: state.generatedFilesCount,
    canExport: state.canExport,
    exportEnabled: state.exportEnabled,
    exportReady: state.exportReady,
    exportLocked: state.exportLocked,
    validationPassed: state.validationPassed,
    buildVerificationComplete: state.buildVerificationComplete,
  });
}
