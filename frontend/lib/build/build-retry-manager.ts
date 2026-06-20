import type { GeneratedSourceFile } from "@/lib/project-generator/types";
import { analyzeCompilerDiagnostics } from "@/lib/build-verification/compiler-diagnostics";
import type { BuildVerifyApiResponse } from "@/lib/build-verification/types";
import {
  MAX_BUILD_RETRIES,
  computeQaScore,
  isBuildIntegrityVerified,
} from "@/lib/build-verification/types";
import type { BuildVerificationResult } from "@/lib/build-verification/types";
import { dedupeFixMessages } from "@/lib/build-verification/auto-fixer";
import {
  applyAutoFixEngine,
  buildAutoFixReport,
  runInitialAutoFixes,
} from "./auto-fix-engine";
import {
  createBuildAttemptRecord,
  createInitialRetryState,
  type BuildAttemptRecord,
  type BuildRetryState,
} from "./build-attempt";

export type BuildApiCaller = (
  files: GeneratedSourceFile[]
) => Promise<BuildVerifyApiResponse>;

export type BuildRetryProgress = (
  partial: Partial<BuildVerificationResult> & {
    buildRetry?: BuildRetryState;
    errorsFixed?: string[];
  }
) => void;

export type BuildRetryActivityLog = (message: string) => void;

export type BuildRetryResult = {
  files: GeneratedSourceFile[];
  lastResult: BuildVerifyApiResponse;
  errorsFixed: string[];
  buildRetry: BuildRetryState;
  initialErrorCount: number;
};

function buildVerificationFromRetry(
  lastResult: BuildVerifyApiResponse,
  errorsFixed: string[],
  buildRetry: BuildRetryState,
  initialErrorCount: number
): BuildVerificationResult {
  const attempt = buildRetry.currentAttempt;
  const verified = isBuildIntegrityVerified(
    lastResult.restore,
    lastResult.build,
    lastResult.compilerErrorCount
  );

  const retryFailed =
    buildRetry.status === "FAILED" &&
    lastResult.compilerErrorCount > 0 &&
    attempt >= buildRetry.maxAttempts;

  const compilerAnalysis =
    lastResult.compilerErrorCount > 0 || retryFailed
      ? analyzeCompilerDiagnostics(lastResult.output, lastResult.errors)
      : null;

  const autoFixReport = buildAutoFixReport({
    initialErrorCount,
    remainingErrors: lastResult.compilerErrorCount,
    attempts: attempt,
    buildStatus: verified ? "PASS" : "FAIL",
    fixesApplied: dedupeFixMessages(errorsFixed),
  });

  return {
    complete: verified,
    restore: lastResult.restore,
    build: lastResult.build,
    tests: lastResult.tests,
    buildStatus: verified ? "PASS" : retryFailed ? "FAIL" : "FAIL",
    compilerErrorCount: lastResult.compilerErrorCount,
    compilerWarningCount: lastResult.compilerWarningCount,
    errorsFixed: dedupeFixMessages(errorsFixed),
    qaScore: computeQaScore(
      lastResult.compilerErrorCount,
      lastResult.compilerWarningCount,
      verified,
      attempt
    ),
    attempts: attempt,
    maxAttempts: MAX_BUILD_RETRIES,
    lastOutput: lastResult.output,
    compilerAnalysis,
    autoFixReport,
    buildRetry,
    retryStatus: buildRetry.status,
  };
}

export class BuildRetryManager {
  private files: GeneratedSourceFile[];
  private errorsFixed: string[] = [];
  private buildRetry: BuildRetryState;
  private initialErrorCount = 0;
  private lastResult: BuildVerifyApiResponse;
  private previousErrorCount = 0;

  constructor(
    sourceFiles: GeneratedSourceFile[],
    private readonly callBuild: BuildApiCaller,
    private readonly onProgress?: BuildRetryProgress,
    private readonly onActivityLog?: BuildRetryActivityLog
  ) {
    const initial = runInitialAutoFixes(sourceFiles);
    this.files = initial.files;
    this.errorsFixed = [...initial.fixesApplied];
    this.buildRetry = createInitialRetryState(MAX_BUILD_RETRIES);
    this.lastResult = {
      restore: "pending",
      build: "pending",
      tests: "pending",
      output: "",
      errors: [],
      warnings: [],
      compilerErrorCount: 0,
      compilerWarningCount: 0,
      sdkAvailable: true,
    };
  }

  private log(message: string) {
    this.onActivityLog?.(message);
  }

  private emit(partial: Partial<BuildVerificationResult>) {
    this.onProgress?.({
      ...partial,
      buildRetry: this.buildRetry,
      errorsFixed: dedupeFixMessages(this.errorsFixed),
    });
  }

  private pushHistory(record: BuildAttemptRecord) {
    this.buildRetry = {
      ...this.buildRetry,
      history: [...this.buildRetry.history, record],
    };
  }

  async run(): Promise<{
    result: BuildVerificationResult;
    sourceFiles: GeneratedSourceFile[];
  }> {
    this.log("Usopp Build Retry — starting workflow (build → analyze → auto-fix)");

    for (let attempt = 1; attempt <= MAX_BUILD_RETRIES; attempt++) {
      this.buildRetry = {
        ...this.buildRetry,
        status: "RUNNING",
        currentAttempt: attempt,
      };

      this.emit({
        attempts: attempt,
        maxAttempts: MAX_BUILD_RETRIES,
        restore: "running",
        build: "pending",
        buildStatus: "FAIL",
        compilerAnalysis: null,
        autoFixReport: null,
        complete: false,
      });

      this.log(`Build Retry — attempt ${attempt}/${MAX_BUILD_RETRIES}: dotnet build`);

      this.lastResult = await this.callBuild(this.files);

      if (this.initialErrorCount === 0 && this.lastResult.compilerErrorCount > 0) {
        this.initialErrorCount = this.lastResult.compilerErrorCount;
      }

      this.buildRetry = {
        ...this.buildRetry,
        currentErrorCount: this.lastResult.compilerErrorCount,
        currentWarningCount: this.lastResult.compilerWarningCount,
      };

      const buildRecord = createBuildAttemptRecord({
        attemptNumber: attempt,
        compilerErrors: this.lastResult.compilerErrorCount,
        compilerWarnings: this.lastResult.compilerWarningCount,
        fixedErrors: 0,
        buildStatus:
          this.lastResult.compilerErrorCount === 0 ? "PASS" : "FAIL",
        phase: "build",
      });
      this.pushHistory(buildRecord);

      this.log(
        `Attempt ${attempt}: ${this.lastResult.compilerErrorCount} errors, ${this.lastResult.compilerWarningCount} warnings`
      );

      const partialAfterBuild = buildVerificationFromRetry(
        this.lastResult,
        this.errorsFixed,
        this.buildRetry,
        this.initialErrorCount
      );
      this.emit({ ...partialAfterBuild, complete: false });

      if (this.lastResult.compilerErrorCount === 0) {
        this.buildRetry = { ...this.buildRetry, status: "PASS" };
        this.log(`Build Retry — PASS on attempt ${attempt} (0 compiler errors)`);
        const result = buildVerificationFromRetry(
          this.lastResult,
          this.errorsFixed,
          this.buildRetry,
          this.initialErrorCount
        );
        this.emit({ ...result, complete: true });
        return { result: { ...result, complete: true }, sourceFiles: this.files };
      }

      if (attempt >= MAX_BUILD_RETRIES) {
        break;
      }

      this.log(`Attempt ${attempt}: analyzing compiler errors`);
      const analysis = analyzeCompilerDiagnostics(
        this.lastResult.output,
        this.lastResult.errors
      );

      this.pushHistory(
        createBuildAttemptRecord({
          attemptNumber: attempt,
          compilerErrors: this.lastResult.compilerErrorCount,
          compilerWarnings: this.lastResult.compilerWarningCount,
          fixedErrors: 0,
          buildStatus: "RUNNING",
          phase: "analyze",
        })
      );

      this.log(`Attempt ${attempt}: applying auto-fixes`);
      const engine = applyAutoFixEngine(
        this.files,
        this.lastResult.output,
        this.lastResult.errors,
        analysis
      );
      this.files = engine.files;
      this.errorsFixed.push(...engine.fixesApplied);

      const fixedThisRound = Math.max(
        0,
        this.previousErrorCount > 0
          ? this.previousErrorCount - this.lastResult.compilerErrorCount
          : engine.fixesApplied.length
      );
      this.buildRetry = {
        ...this.buildRetry,
        totalFixedErrors: this.buildRetry.totalFixedErrors + fixedThisRound,
      };

      this.pushHistory(
        createBuildAttemptRecord({
          attemptNumber: attempt,
          compilerErrors: this.lastResult.compilerErrorCount,
          compilerWarnings: this.lastResult.compilerWarningCount,
          fixedErrors: engine.fixesApplied.length,
          buildStatus: "RUNNING",
          phase: "auto-fix",
        })
      );

      this.log(
        `Attempt ${attempt}: applied ${engine.fixesApplied.length} fix(es), rebuilding…`
      );

      this.previousErrorCount = this.lastResult.compilerErrorCount;
    }

    this.buildRetry = { ...this.buildRetry, status: "FAILED" };
    this.log(
      `Build Retry — FAILED after ${MAX_BUILD_RETRIES} attempts (${this.lastResult.compilerErrorCount} errors remain)`
    );

    const result = buildVerificationFromRetry(
      this.lastResult,
      this.errorsFixed,
      this.buildRetry,
      this.initialErrorCount
    );
    this.emit({ ...result, complete: false });
    return { result, sourceFiles: this.files };
  }
}

export async function runBuildRetryWorkflow(
  sourceFiles: GeneratedSourceFile[],
  callBuild: BuildApiCaller,
  onProgress?: BuildRetryProgress,
  onActivityLog?: BuildRetryActivityLog
): Promise<{
  result: BuildVerificationResult;
  sourceFiles: GeneratedSourceFile[];
}> {
  const manager = new BuildRetryManager(
    sourceFiles,
    callBuild,
    onProgress,
    onActivityLog
  );
  return manager.run();
}
