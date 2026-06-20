import type { GeneratedSourceFile } from "@/lib/project-generator/types";
import type { CompilerDiagnosticsReport } from "@/lib/build-verification/compiler-diagnostics/types";
import { analyzeCompilerDiagnostics } from "@/lib/build-verification/compiler-diagnostics";
import type { ParsedCompilerError } from "@/lib/build-verification/types";
import {
  applyProactiveFixes,
  applyStructuralFixes,
  dedupeFixMessages,
  ensureProjectReferences,
} from "@/lib/build-verification/auto-fixer";
import { applyAllFixRules } from "./fix-rules";
import {
  createAutoFixReport,
  type AutoFixReport,
} from "./fix-report";

export type AutoFixEngineResult = {
  files: GeneratedSourceFile[];
  fixesApplied: string[];
  analysis: CompilerDiagnosticsReport | null;
};

export function runInitialAutoFixes(
  files: GeneratedSourceFile[]
): AutoFixEngineResult {
  const fixesApplied: string[] = [];
  let next = [...files];

  const proactive = applyProactiveFixes(next);
  next = proactive.files;
  fixesApplied.push(...proactive.fixes);

  const refs = ensureProjectReferences(next);
  next = refs.files;
  fixesApplied.push(...refs.fixes);

  const structural = applyStructuralFixes(next);
  next = structural.files;
  fixesApplied.push(...structural.fixes);

  return {
    files: next,
    fixesApplied: dedupeFixMessages(fixesApplied),
    analysis: null,
  };
}

/** Apply rule-based fixes from compiler diagnostics analyzer output */
export function applyAutoFixEngine(
  files: GeneratedSourceFile[],
  buildOutput: string,
  errors: ParsedCompilerError[],
  existingAnalysis?: CompilerDiagnosticsReport | null
): AutoFixEngineResult {
  const analysis =
    existingAnalysis ??
    (errors.length > 0 || buildOutput
      ? analyzeCompilerDiagnostics(buildOutput, errors)
      : null);

  const ruleResult = applyAllFixRules(files, analysis, errors);
  const structural = applyStructuralFixes(ruleResult.files);

  const fixesApplied = dedupeFixMessages([
    ...ruleResult.fixes,
    ...structural.fixes,
  ]);

  return {
    files: structural.files,
    fixesApplied,
    analysis,
  };
}

export function buildAutoFixReport(params: {
  initialErrorCount: number;
  remainingErrors: number;
  attempts: number;
  buildStatus: "PASS" | "FAIL";
  fixesApplied: string[];
}): AutoFixReport {
  return createAutoFixReport({
    fixedErrors: Math.max(0, params.initialErrorCount - params.remainingErrors),
    remainingErrors: params.remainingErrors,
    attempts: params.attempts,
    buildStatus: params.buildStatus,
    fixesApplied: params.fixesApplied,
  });
}

export type { AutoFixReport } from "./fix-report";
export { exportAutoFixReportJson, downloadAutoFixReportJson } from "./fix-report";
