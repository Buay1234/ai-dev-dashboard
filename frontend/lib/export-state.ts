import type { BuildVerificationResult } from "@/lib/build-verification/types";
import type { GeneratedProjectBundle } from "@/lib/project-generator/types";
import type { RuntimeReport } from "@/lib/runtime/runtime-report";

export type ExportState = {
  missionStatus: string;
  missionComplete: boolean;
  buildPassed: boolean;
  testsPassed: boolean;
  runtimePassed: boolean;
  generatedFilesCount: number;
  compilerErrorCount: number;
  compilerWarningCount: number;
  canExport: boolean;
  exportEnabled: boolean;
  exportReady: boolean;
  exportLocked: boolean;
  validationPassed: boolean;
  buildVerificationComplete: boolean;
  runtimeVerificationComplete: boolean;
};

export function computeExportState(
  currentAgent: string,
  buildVerification: BuildVerificationResult | null,
  projectBundle: GeneratedProjectBundle | null,
  runtimeReport: RuntimeReport | null = null
): ExportState {
  const missionStatus =
    currentAgent === "Completed" ? "complete" : currentAgent.toLowerCase();
  const missionComplete = currentAgent === "Completed";

  const compilerErrorCount = buildVerification?.compilerErrorCount ?? -1;
  const compilerWarningCount = buildVerification?.compilerWarningCount ?? 0;
  const buildPassed =
    buildVerification?.build === "pass" && compilerErrorCount === 0;
  const testsPassed = buildVerification?.tests === "pass";
  const runtimePassed = runtimeReport?.runtimePassed === true;
  const generatedFilesCount = projectBundle?.sourceFiles.length ?? 0;

  const canExport =
    missionComplete &&
    buildPassed &&
    compilerErrorCount === 0 &&
    runtimePassed &&
    generatedFilesCount > 0;

  return {
    missionStatus,
    missionComplete,
    buildPassed,
    testsPassed,
    runtimePassed,
    generatedFilesCount,
    compilerErrorCount,
    compilerWarningCount,
    canExport,
    exportEnabled: canExport,
    exportReady: canExport,
    exportLocked: !canExport,
    validationPassed:
      buildPassed && compilerErrorCount === 0 && runtimePassed,
    buildVerificationComplete: buildVerification?.complete === true,
    runtimeVerificationComplete: runtimeReport?.runtimePassed === true,
  };
}

export function logExportState(state: ExportState): void {
  console.log("[Export State V27]", {
    missionStatus: state.missionStatus,
    missionComplete: state.missionComplete,
    buildPassed: state.buildPassed,
    testsPassed: state.testsPassed,
    runtimePassed: state.runtimePassed,
    compilerErrorCount: state.compilerErrorCount,
    compilerWarningCount: state.compilerWarningCount,
    generatedFilesCount: state.generatedFilesCount,
    canExport: state.canExport,
    exportReady: state.exportReady,
    exportLocked: state.exportLocked,
  });
}
