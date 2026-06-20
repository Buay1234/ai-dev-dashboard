import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import {
  parseCompilerOutput,
  parseCompilerWarnings,
  resolveCompilerCounts,
} from "@/lib/build-verification/error-parser";
import type { BuildVerifyApiResponse, PhaseStatus } from "@/lib/build-verification/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";

const execAsync = promisify(exec);

type FilePayload = { path: string; content: string };

async function runCommand(cwd: string, command: string) {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: 180_000,
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
    });
    return { code: 0, output: stdout + stderr };
  } catch (error: unknown) {
    const err = error as { code?: number; stdout?: string; stderr?: string; message?: string };
    return {
      code: err.code ?? 1,
      output: (err.stdout ?? "") + (err.stderr ?? "") + (err.message ?? ""),
    };
  }
}

function statusFromBuild(exitCode: number, compilerErrorCount: number): PhaseStatus {
  return exitCode === 0 && compilerErrorCount === 0 ? "pass" : "fail";
}

async function checkDotnetSdk(): Promise<boolean> {
  const result = await runCommand(process.cwd(), "dotnet --version");
  return result.code === 0;
}

function isValidSolution(content: string): boolean {
  return content.includes("Project(") && content.includes("EndProject");
}

function resolveSolutionTarget(files: FilePayload[]): string {
  const sln =
    files.find((f) => f.path.endsWith(`${PROJECT_NAMESPACE}.sln`)) ??
    files.find((f) => f.path.endsWith(".sln"));
  if (sln && isValidSolution(sln.content)) {
    return path.basename(sln.path);
  }
  return `${PROJECT_NAMESPACE}.sln`;
}

function emptyResponse(partial: Partial<BuildVerifyApiResponse>): BuildVerifyApiResponse {
  return {
    restore: "fail",
    build: "fail",
    tests: "pending",
    output: "",
    errors: [],
    warnings: [],
    compilerErrorCount: 0,
    compilerWarningCount: 0,
    sdkAvailable: false,
    ...partial,
  };
}

export async function POST(req: Request) {
  let workDir = "";

  try {
    const body = await req.json();
    const files = (body.files ?? []) as FilePayload[];

    if (!files.length) {
      return Response.json({ error: "No files provided" }, { status: 400 });
    }

    const sdkAvailable = await checkDotnetSdk();
    if (!sdkAvailable) {
      return Response.json(
        emptyResponse({
          output: "dotnet SDK not found on server",
          errors: [{ code: "SDK", message: "dotnet SDK not available", raw: "", severity: "error" }],
          compilerErrorCount: 1,
        })
      );
    }

    workDir = path.join(os.tmpdir(), `ai-build-v26-${Date.now()}`);
    await fs.mkdir(workDir, { recursive: true });

    for (const file of files) {
      const fullPath = path.join(workDir, file.path.replace(/\//g, path.sep));
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content, "utf8");
    }

    const slnTarget = resolveSolutionTarget(files);
    const slnArg = `"${slnTarget.replace(/\//g, path.sep)}"`;

    let restore: PhaseStatus = "fail";
    let build: PhaseStatus = "fail";
    let tests: PhaseStatus = "pending";
    let combinedOutput = "";

    const restoreResult = await runCommand(workDir, `dotnet restore ${slnArg}`);
    combinedOutput += restoreResult.output;

    const restoreErrors = parseCompilerOutput(restoreResult.output);
    const restoreWarnings = parseCompilerWarnings(restoreResult.output);
    const restoreCounts = resolveCompilerCounts(
      restoreResult.output,
      restoreErrors,
      restoreWarnings
    );

    restore =
      restoreResult.code === 0 && restoreCounts.compilerErrorCount === 0
        ? "pass"
        : "fail";

    if (restore === "pass") {
      const buildResult = await runCommand(
        workDir,
        `dotnet build ${slnArg} --no-restore`
      );
      combinedOutput += "\n" + buildResult.output;

      const buildErrors = parseCompilerOutput(buildResult.output);
      const buildWarnings = parseCompilerWarnings(buildResult.output);
      const buildCounts = resolveCompilerCounts(
        combinedOutput,
        [...restoreErrors, ...buildErrors],
        [...restoreWarnings, ...buildWarnings]
      );

      build = statusFromBuild(buildResult.code, buildCounts.compilerErrorCount);

      if (build === "pass") {
        const testResult = await runCommand(
          workDir,
          `dotnet test ${slnArg} --no-build --verbosity quiet`
        );
        combinedOutput += "\n" + testResult.output;
        tests = testResult.code === 0 ? "pass" : "fail";
      } else {
        tests = "fail";
      }
    } else {
      tests = "fail";
    }

    const errors = parseCompilerOutput(combinedOutput);
    const warnings = parseCompilerWarnings(combinedOutput);
    const { compilerErrorCount, compilerWarningCount } = resolveCompilerCounts(
      combinedOutput,
      errors,
      warnings
    );

    build =
      restore === "pass" && compilerErrorCount === 0 ? "pass" : "fail";

    const response: BuildVerifyApiResponse = {
      restore,
      build,
      tests,
      output: combinedOutput.slice(-12000),
      errors,
      warnings,
      compilerErrorCount,
      compilerWarningCount,
      sdkAvailable: true,
    };

    return Response.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Build verify failed";
    return Response.json(
      emptyResponse({
        output: message,
        errors: [{ code: "ERR", message, raw: message, severity: "error" }],
        compilerErrorCount: 1,
      }),
      { status: 500 }
    );
  } finally {
    if (workDir) {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
