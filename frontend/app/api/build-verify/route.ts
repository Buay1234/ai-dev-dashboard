import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { parseCompilerOutput } from "@/lib/build-verification/error-parser";
import type { BuildVerifyApiResponse, PhaseStatus } from "@/lib/build-verification/types";

const execAsync = promisify(exec);

type FilePayload = { path: string; content: string };

async function runCommand(cwd: string, command: string) {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
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

function statusFromCode(code: number): PhaseStatus {
  return code === 0 ? "pass" : "fail";
}

async function checkDotnetSdk(): Promise<boolean> {
  const result = await runCommand(process.cwd(), "dotnet --version");
  return result.code === 0;
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
      return Response.json({
        restore: "fail",
        build: "fail",
        tests: "fail",
        output: "dotnet SDK not found on server",
        errors: [{ code: "SDK", message: "dotnet SDK not available", raw: "" }],
        sdkAvailable: false,
      } satisfies BuildVerifyApiResponse);
    }

    workDir = path.join(os.tmpdir(), `ai-build-${Date.now()}`);
    await fs.mkdir(workDir, { recursive: true });

    for (const file of files) {
      const fullPath = path.join(workDir, file.path.replace(/\//g, path.sep));
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content, "utf8");
    }

    const sln = files.find((f) => f.path.endsWith(".sln"));
    const buildTarget = sln
      ? path.basename(sln.path)
      : files.find((f) => f.path.includes(".API") && f.path.endsWith(".csproj"))
          ?.path ?? "";

    let restore: PhaseStatus = "fail";
    let build: PhaseStatus = "fail";
    let tests: PhaseStatus = "fail";
    let combinedOutput = "";

    const restoreResult = await runCommand(
      workDir,
      buildTarget ? `dotnet restore "${buildTarget}"` : "dotnet restore"
    );
    combinedOutput += restoreResult.output;
    restore = statusFromCode(restoreResult.code);

    if (restore === "pass") {
      const buildResult = await runCommand(
        workDir,
        buildTarget ? `dotnet build "${buildTarget}" --no-restore` : "dotnet build --no-restore"
      );
      combinedOutput += "\n" + buildResult.output;
      build = statusFromCode(buildResult.code);

      if (build === "pass") {
        const testResult = await runCommand(
          workDir,
          buildTarget
            ? `dotnet test "${buildTarget}" --no-build --verbosity quiet`
            : "dotnet test --no-build --verbosity quiet"
        );
        combinedOutput += "\n" + testResult.output;
        tests = statusFromCode(testResult.code);
      }
    }

    const errors = parseCompilerOutput(combinedOutput);

    const response: BuildVerifyApiResponse = {
      restore,
      build,
      tests,
      output: combinedOutput.slice(-8000),
      errors,
      sdkAvailable: true,
    };

    return Response.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Build verify failed";
    return Response.json(
      {
        restore: "fail",
        build: "fail",
        tests: "fail",
        output: message,
        errors: [{ code: "ERR", message, raw: message }],
        sdkAvailable: false,
      } satisfies BuildVerifyApiResponse,
      { status: 500 }
    );
  } finally {
    if (workDir) {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
