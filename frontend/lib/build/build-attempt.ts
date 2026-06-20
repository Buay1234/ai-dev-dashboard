export type BuildAttemptPhase = "build" | "analyze" | "auto-fix";

export type BuildAttemptStatus = "RUNNING" | "PASS" | "FAIL";

export type BuildAttemptRecord = {
  attemptNumber: number;
  compilerErrors: number;
  compilerWarnings: number;
  fixedErrors: number;
  timestamp: string;
  buildStatus: BuildAttemptStatus;
  phase: BuildAttemptPhase;
};

export type BuildRetryStatus = "RUNNING" | "PASS" | "FAILED";

export type BuildRetryState = {
  status: BuildRetryStatus;
  currentAttempt: number;
  maxAttempts: number;
  currentErrorCount: number;
  currentWarningCount: number;
  totalFixedErrors: number;
  history: BuildAttemptRecord[];
};

export function createBuildAttemptRecord(params: {
  attemptNumber: number;
  compilerErrors: number;
  compilerWarnings: number;
  fixedErrors: number;
  buildStatus: BuildAttemptStatus;
  phase: BuildAttemptPhase;
}): BuildAttemptRecord {
  return {
    ...params,
    timestamp: new Date().toISOString(),
  };
}

export function createInitialRetryState(maxAttempts: number): BuildRetryState {
  return {
    status: "RUNNING",
    currentAttempt: 0,
    maxAttempts,
    currentErrorCount: 0,
    currentWarningCount: 0,
    totalFixedErrors: 0,
    history: [],
  };
}

export function formatAttemptTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString();
}
