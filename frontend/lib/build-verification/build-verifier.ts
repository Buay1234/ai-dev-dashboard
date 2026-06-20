import type { GeneratedProjectBundle, GeneratedSourceFile } from "@/lib/project-generator/types";
import { runBuildRetryWorkflow } from "@/lib/build/build-retry-manager";
import type {
  BuildVerificationResult,
  BuildVerifyApiResponse,
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

export async function runBuildVerification(
  project: GeneratedProjectBundle,
  onProgress?: BuildVerificationProgress,
  onActivityLog?: (message: string) => void
): Promise<{
  result: BuildVerificationResult;
  sourceFiles: GeneratedSourceFile[];
}> {
  return runBuildRetryWorkflow(
    project.sourceFiles,
    callBuildVerifyApi,
    onProgress,
    onActivityLog
  );
}

export type { BuildVerificationResult };
