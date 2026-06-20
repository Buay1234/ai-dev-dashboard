export type RuntimeCheckStatus = "pending" | "running" | "pass" | "fail";

export type RuntimeCheckDetail = {
  passed: boolean;
  status: RuntimeCheckStatus;
  label: string;
  detail: string;
};

export type RuntimeReport = {
  apiStartup: boolean;
  swagger: boolean;
  database: boolean;
  migration: boolean;
  runtimePassed: boolean;
  checks: {
    apiStartup: RuntimeCheckDetail;
    swagger: RuntimeCheckDetail;
    database: RuntimeCheckDetail;
    migration: RuntimeCheckDetail;
  };
  timestamp: string;
  output?: string;
  sdkAvailable?: boolean;
  diagnostics?: import("./runtime-diagnostics").RuntimeDiagnostics;
};

export type RuntimeVerifyApiResponse = RuntimeReport;

export function createPendingCheck(label: string, detail = "Pending"): RuntimeCheckDetail {
  return {
    passed: false,
    status: "pending",
    label,
    detail,
  };
}

export function createRunningCheck(label: string, detail: string): RuntimeCheckDetail {
  return {
    passed: false,
    status: "running",
    label,
    detail,
  };
}

export function createCheckResult(
  label: string,
  passed: boolean,
  detail: string
): RuntimeCheckDetail {
  return {
    passed,
    status: passed ? "pass" : "fail",
    label,
    detail,
  };
}

export function createInitialRuntimeReport(): RuntimeReport {
  return {
    apiStartup: false,
    swagger: false,
    database: false,
    migration: false,
    runtimePassed: false,
    checks: {
      apiStartup: createPendingCheck("API Startup"),
      swagger: createPendingCheck("Swagger Endpoint"),
      database: createPendingCheck("Database Connection"),
      migration: createPendingCheck("Migration Execution"),
    },
    timestamp: new Date().toISOString(),
  };
}

export function computeRuntimePassed(report: Pick<RuntimeReport, "checks">): boolean {
  return (
    report.checks.apiStartup.passed &&
    report.checks.swagger.passed &&
    report.checks.database.passed &&
    report.checks.migration.passed
  );
}

export function finalizeRuntimeReport(
  checks: RuntimeReport["checks"],
  partial?: Partial<Pick<RuntimeReport, "output" | "sdkAvailable" | "diagnostics">>
): RuntimeReport {
  const runtimePassed = computeRuntimePassed({ checks });
  return {
    apiStartup: checks.apiStartup.passed,
    swagger: checks.swagger.passed,
    database: checks.database.passed,
    migration: checks.migration.passed,
    runtimePassed,
    checks,
    timestamp: new Date().toISOString(),
    ...partial,
  };
}

export function statusLabel(status: RuntimeCheckStatus): "PASS" | "FAIL" | "RUNNING" | "PENDING" {
  if (status === "pass") return "PASS";
  if (status === "fail") return "FAIL";
  if (status === "running") return "RUNNING";
  return "PENDING";
}

export function exportRuntimeReportJson(report: RuntimeReport): string {
  return JSON.stringify(report, null, 2);
}
