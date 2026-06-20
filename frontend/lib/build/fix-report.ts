export type AutoFixReport = {
  fixedErrors: number;
  remainingErrors: number;
  attempts: number;
  buildStatus: "PASS" | "FAIL";
  fixesApplied: string[];
  generatedAt: string;
};

export type AutoFixReportJson = {
  fixedErrors: number;
  remainingErrors: number;
  attempts: number;
  buildStatus: "PASS" | "FAIL";
};

export function createAutoFixReport(params: {
  fixedErrors: number;
  remainingErrors: number;
  attempts: number;
  buildStatus: "PASS" | "FAIL";
  fixesApplied: string[];
}): AutoFixReport {
  return {
    ...params,
    generatedAt: new Date().toISOString(),
  };
}

export function exportAutoFixReportJson(report: AutoFixReport): AutoFixReportJson {
  return {
    fixedErrors: report.fixedErrors,
    remainingErrors: report.remainingErrors,
    attempts: report.attempts,
    buildStatus: report.buildStatus,
  };
}

export function downloadAutoFixReportJson(report: AutoFixReport): void {
  const blob = new Blob([JSON.stringify(exportAutoFixReportJson(report), null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "auto-fix-report.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
