import type { GeneratedProjectBundle, GeneratedSourceFile } from "@/lib/project-generator/types";
import {
  applyFixesFromErrors,
  applyProactiveFixes,
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

/** Static analysis fallback when dotnet SDK or API unavailable */
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

  const testsOk =
    hasTests &&
    csFiles.some(
      (f) => f.content.includes("[Fact]") && f.content.includes("using Xunit")
    );

  return {
    restore: structureOk ? "pass" : "fail",
    build: structureOk ? "pass" : "fail",
    tests: testsOk ? "pass" : structureOk ? "fail" : "fail",
    output: `Static verification (${reason})`,
    errors: structureOk
      ? []
      : [{ code: "STATIC", message: "Project structure incomplete", raw: reason }],
    sdkAvailable: false,
  };
}

function allPass(r: BuildVerifyApiResponse): boolean {
  return r.restore === "pass" && r.build === "pass" && r.tests === "pass";
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

  let lastResult: BuildVerifyApiResponse = {
    restore: "pending",
    build: "pending",
    tests: "pending",
    output: "",
    errors: [],
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
      errorsFixed: dedupeFixMessages(errorsFixed),
      complete: false,
    });

    lastResult = await callBuildVerifyApi(files);

    onProgress?.({
      attempts: attempt,
      restore: lastResult.restore,
      build: lastResult.build,
      tests: lastResult.tests,
      errorsFixed: dedupeFixMessages(errorsFixed),
      lastOutput: lastResult.output.slice(0, 2000),
      complete: false,
    });

    if (allPass(lastResult)) {
      const deduped = dedupeFixMessages(errorsFixed);
      const result: BuildVerificationResult = {
        complete: true,
        restore: lastResult.restore,
        build: lastResult.build,
        tests: lastResult.tests,
        errorsFixed: deduped,
        qaScore: computeQaScore(
          lastResult.restore,
          lastResult.build,
          lastResult.tests,
          attempt,
          deduped.length
        ),
        attempts: attempt,
        maxAttempts: MAX_BUILD_RETRIES,
        lastOutput: lastResult.output,
      };
      onProgress?.({ ...result, errorsFixed: deduped });
      return { result, sourceFiles: files };
    }

    const fixes = applyFixesFromErrors(lastResult.errors, files);
    if (fixes.fixes.length === 0) {
      break;
    }

    files = fixes.files;
    errorsFixed.push(...fixes.fixes);
  }

  const deduped = dedupeFixMessages(errorsFixed);
  const result: BuildVerificationResult = {
    complete: allPass(lastResult),
    restore: lastResult.restore,
    build: lastResult.build,
    tests: lastResult.tests,
    errorsFixed: deduped,
    qaScore: computeQaScore(
      lastResult.restore,
      lastResult.build,
      lastResult.tests,
      lastAttempt,
      deduped.length
    ),
    attempts: lastAttempt,
    maxAttempts: MAX_BUILD_RETRIES,
    lastOutput: lastResult.output,
  };

  onProgress?.({ ...result, errorsFixed: deduped });
  return { result, sourceFiles: files };
}

export type { BuildVerificationResult };
