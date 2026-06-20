import type { GeneratedProjectBundle, GeneratedSourceFile } from "@/lib/project-generator/types";
import {
  applyFixesFromErrors,
  applyProactiveFixes,
  applyStructuralFixes,
  dedupeFixMessages,
  ensureProjectReferences,
} from "./auto-fixer";
import type {
  BuildVerificationResult,
  BuildVerifyApiResponse,
} from "./types";
import {
  MAX_BUILD_RETRIES,
  computeQaScore,
  isBuildIntegrityVerified,
} from "./types";

export type BuildVerificationProgress = (
  partial: Partial<BuildVerificationResult> & { errorsFixed?: string[] }
) => void;

function toApiPayload(files: GeneratedSourceFile[]) {
  return files.map((f) => ({
    path: f.path ? `${f.path}/${f.fileName}` : f.fileName,
    content: f.content,
  }));
}

async function callBuildVerifyApi(
  files: GeneratedSourceFile[]
): Promise<BuildVerifyApiResponse> {
  try {
    const res = await fetch("/api/build-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: toApiPayload(files) }),
    });

    if (!res.ok) {
      const text = await res.text();
      return staticFallbackVerify(files, text);
    }

    return (await res.json()) as BuildVerifyApiResponse;
  } catch (error) {
    return staticFallbackVerify(
      files,
      error instanceof Error ? error.message : "Build API unavailable"
    );
  }
}

function isValidSolution(content: string): boolean {
  return content.includes("Project(") && content.includes("EndProject");
}

function staticFallbackVerify(
  files: GeneratedSourceFile[],
  reason: string
): BuildVerifyApiResponse {
  const csFiles = files.filter((f) => f.fileName.endsWith(".cs"));
  const hasProgram = files.some((f) => f.fileName === "Program.cs");
  const hasDbContext = files.some((f) => f.fileName === "AppDbContext.cs");
  const hasTests = files.some((f) => f.fileName.endsWith(".Tests.csproj"));
  const sln = files.find((f) => f.fileName.endsWith(".sln"));
  const hasSln = Boolean(sln && isValidSolution(sln.content));

  const structureOk =
    csFiles.length >= 8 && hasProgram && hasDbContext && hasSln && hasTests;

  const errors = structureOk
    ? []
    : [{ code: "STATIC", message: "Project structure incomplete", raw: reason, severity: "error" as const }];

  return {
    restore: structureOk ? "pass" : "fail",
    build: structureOk ? "pass" : "fail",
    tests: "fail",
    output: `Static verification (${reason})`,
    errors,
    warnings: [],
    compilerErrorCount: structureOk ? 0 : 1,
    compilerWarningCount: 0,
    sdkAvailable: false,
  };
}

function toVerificationResult(
  lastResult: BuildVerifyApiResponse,
  errorsFixed: string[],
  attempt: number
): BuildVerificationResult {
  const verified = isBuildIntegrityVerified(
    lastResult.restore,
    lastResult.build,
    lastResult.compilerErrorCount
  );

  return {
    complete: verified,
    restore: lastResult.restore,
    build: lastResult.build,
    tests: lastResult.tests,
    buildStatus: verified ? "PASS" : "FAIL",
    compilerErrorCount: lastResult.compilerErrorCount,
    compilerWarningCount: lastResult.compilerWarningCount,
    errorsFixed,
    qaScore: computeQaScore(
      lastResult.compilerErrorCount,
      lastResult.compilerWarningCount,
      verified,
      attempt
    ),
    attempts: attempt,
    maxAttempts: MAX_BUILD_RETRIES,
    lastOutput: lastResult.output,
  };
}

export async function runBuildVerification(
  project: GeneratedProjectBundle,
  onProgress?: BuildVerificationProgress
): Promise<{
  result: BuildVerificationResult;
  sourceFiles: GeneratedSourceFile[];
}> {
  let files = [...project.sourceFiles];
  const errorsFixed: string[] = [];

  const proactive = applyProactiveFixes(files);
  files = proactive.files;
  errorsFixed.push(...proactive.fixes);

  const refs = ensureProjectReferences(files);
  files = refs.files;
  errorsFixed.push(...refs.fixes);

  const structural = applyStructuralFixes(files);
  files = structural.files;
  errorsFixed.push(...structural.fixes);

  let lastResult: BuildVerifyApiResponse = {
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

  let lastAttempt = 0;

  for (let attempt = 1; attempt <= MAX_BUILD_RETRIES; attempt++) {
    lastAttempt = attempt;

    onProgress?.({
      attempts: attempt,
      maxAttempts: MAX_BUILD_RETRIES,
      restore: "running",
      build: "pending",
      tests: "pending",
      buildStatus: "FAIL",
      compilerErrorCount: 0,
      compilerWarningCount: 0,
      errorsFixed: dedupeFixMessages(errorsFixed),
      complete: false,
    });

    lastResult = await callBuildVerifyApi(files);

    const partial = toVerificationResult(
      lastResult,
      dedupeFixMessages(errorsFixed),
      attempt
    );
    onProgress?.({ ...partial, complete: false });

    if (partial.complete) {
      onProgress?.({ ...partial, complete: true });
      return { result: partial, sourceFiles: files };
    }

    const fixes = applyFixesFromErrors(lastResult.errors, files);
    files = fixes.files;
    errorsFixed.push(...fixes.fixes);

    const retryStructural = applyStructuralFixes(files);
    files = retryStructural.files;
    errorsFixed.push(...retryStructural.fixes);

    if (fixes.fixes.length === 0 && retryStructural.fixes.length === 0) {
      break;
    }
  }

  const result = toVerificationResult(
    lastResult,
    dedupeFixMessages(errorsFixed),
    lastAttempt
  );
  onProgress?.({ ...result });
  return { result, sourceFiles: files };
}

export type { BuildVerificationResult };
