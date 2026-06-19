export type PhaseStatus = "pending" | "running" | "pass" | "fail";

export type ParsedCompilerError = {
  code: string;
  message: string;
  file?: string;
  line?: number;
  raw: string;
};

export type BuildVerifyApiResponse = {
  restore: PhaseStatus;
  build: PhaseStatus;
  tests: PhaseStatus;
  output: string;
  errors: ParsedCompilerError[];
  sdkAvailable: boolean;
};

export type BuildVerificationResult = {
  complete: boolean;
  restore: PhaseStatus;
  build: PhaseStatus;
  tests: PhaseStatus;
  errorsFixed: string[];
  qaScore: number;
  attempts: number;
  maxAttempts: number;
  lastOutput?: string;
};

export const MAX_BUILD_RETRIES = 5;

export function computeQaScore(
  restore: PhaseStatus,
  build: PhaseStatus,
  tests: PhaseStatus,
  attempts: number,
  errorsFixedCount: number
): number {
  if (restore !== "pass" || build !== "pass" || tests !== "pass") {
    const partial =
      (restore === "pass" ? 25 : 0) +
      (build === "pass" ? 35 : 0) +
      (tests === "pass" ? 40 : 0);
    return Math.max(0, partial - (attempts - 1) * 5);
  }
  return 100;
}

export function phaseLabel(status: PhaseStatus): string {
  if (status === "pass") return "PASS";
  if (status === "fail") return "FAIL";
  if (status === "running") return "RUNNING";
  return "PENDING";
}
