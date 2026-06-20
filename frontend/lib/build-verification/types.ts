export type PhaseStatus = "pending" | "running" | "pass" | "fail";

export type ParsedCompilerError = {
  code: string;
  message: string;
  file?: string;
  line?: number;
  raw: string;
  severity?: "error" | "warning";
};

export type { CompilerDiagnosticsReport } from "./compiler-diagnostics/types";
export type { AutoFixReport } from "@/lib/build/fix-report";
export type { BuildRetryState, BuildRetryStatus } from "@/lib/build/build-attempt";

import type { CompilerDiagnosticsReport } from "./compiler-diagnostics/types";
import type { AutoFixReport } from "@/lib/build/fix-report";
import type { BuildRetryState, BuildRetryStatus } from "@/lib/build/build-attempt";

export type BuildVerifyApiResponse = {
  restore: PhaseStatus;
  build: PhaseStatus;
  tests: PhaseStatus;
  output: string;
  errors: ParsedCompilerError[];
  warnings: ParsedCompilerError[];
  compilerErrorCount: number;
  compilerWarningCount: number;
  sdkAvailable: boolean;
};

export type BuildVerificationResult = {
  complete: boolean;
  restore: PhaseStatus;
  build: PhaseStatus;
  tests: PhaseStatus;
  buildStatus: "PASS" | "FAIL";
  compilerErrorCount: number;
  compilerWarningCount: number;
  errorsFixed: string[];
  qaScore: number;
  attempts: number;
  maxAttempts: number;
  lastOutput?: string;
  compilerAnalysis: CompilerDiagnosticsReport | null;
  autoFixReport: AutoFixReport | null;
  buildRetry: BuildRetryState | null;
  retryStatus: BuildRetryStatus;
};

export const MAX_BUILD_RETRIES = 5;

export function computeQaScore(
  compilerErrorCount: number,
  compilerWarningCount: number,
  buildPassed: boolean,
  attempts: number
): number {
  if (buildPassed && compilerErrorCount === 0) {
    return Math.max(70, 100 - compilerWarningCount - (attempts - 1) * 3);
  }
  return Math.max(
    0,
    100 - compilerErrorCount * 2 - compilerWarningCount - (attempts - 1) * 5
  );
}

export function phaseLabel(status: PhaseStatus): string {
  if (status === "pass") return "PASS";
  if (status === "fail") return "FAIL";
  if (status === "running") return "RUNNING";
  return "PENDING";
}

export function isBuildIntegrityVerified(
  restore: PhaseStatus,
  build: PhaseStatus,
  compilerErrorCount: number
): boolean {
  return restore === "pass" && build === "pass" && compilerErrorCount === 0;
}
