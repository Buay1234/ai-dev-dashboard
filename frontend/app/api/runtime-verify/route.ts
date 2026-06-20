import { exec, spawn, type ChildProcess } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import {
  parseCompilerOutput,
  resolveCompilerCounts,
} from "@/lib/build-verification/error-parser";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import { verifyDatabaseFromCommandOutput } from "@/lib/runtime/database-checker";
import {
  migrationCommand,
  verifyMigrationFromCommandOutput,
} from "@/lib/runtime/migration-checker";
import {
  createCheckResult,
  finalizeRuntimeReport,
  type RuntimeReport,
} from "@/lib/runtime/runtime-report";
import { verifySwaggerEndpoint } from "@/lib/runtime/swagger-checker";

const execAsync = promisify(exec);

type FilePayload = { path: string; content: string };

const RUNTIME_PORT = 5199;

async function runCommand(cwd: string, command: string, timeoutMs = 180_000) {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: timeoutMs,
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

async function checkDotnetSdk(): Promise<boolean> {
  const result = await runCommand(process.cwd(), "dotnet --version", 30_000);
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForStartupLog(
  proc: ChildProcess,
  timeoutMs: number
): Promise<{ started: boolean; output: string }> {
  let output = "";
  const startedPromise = new Promise<boolean>((resolve) => {
    const onData = (chunk: Buffer | string) => {
      output += chunk.toString();
      if (
        output.includes("Now listening on") ||
        output.includes("Application started") ||
        output.includes("Hosting environment")
      ) {
        resolve(true);
      }
    };
    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", onData);
    setTimeout(() => resolve(false), timeoutMs);
  });

  const started = await startedPromise;
  return { started, output };
}

function killProcess(proc: ChildProcess | null) {
  if (!proc || proc.killed) return;
  try {
    proc.kill("SIGTERM");
  } catch {
    // ignore
  }
}

export async function POST(req: Request) {
  let workDir = "";
  let apiProcess: ChildProcess | null = null;
  let combinedOutput = "";

  try {
    const body = await req.json();
    const files = (body.files ?? []) as FilePayload[];

    if (!files.length) {
      return Response.json({ error: "No files provided" }, { status: 400 });
    }

    const sdkAvailable = await checkDotnetSdk();
    if (!sdkAvailable) {
      return Response.json(
        finalizeRuntimeReport(
          {
            apiStartup: createCheckResult("API Startup", false, "dotnet SDK not available"),
            swagger: createCheckResult("Swagger Endpoint", false, "dotnet SDK not available"),
            database: createCheckResult("Database Connection", false, "dotnet SDK not available"),
            migration: createCheckResult("Migration Execution", false, "dotnet SDK not available"),
          },
          { output: "dotnet SDK not found on server", sdkAvailable: false }
        )
      );
    }

    workDir = path.join(os.tmpdir(), `ai-runtime-v27-${Date.now()}`);
    await fs.mkdir(workDir, { recursive: true });

    for (const file of files) {
      const fullPath = path.join(workDir, file.path.replace(/\//g, path.sep));
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content, "utf8");
    }

    const slnTarget = resolveSolutionTarget(files);
    const slnArg = `"${slnTarget.replace(/\//g, path.sep)}"`;
    const apiProject = `${PROJECT_NAMESPACE}.API`;
    const baseUrl = `http://127.0.0.1:${RUNTIME_PORT}`;

    const restoreResult = await runCommand(workDir, `dotnet restore ${slnArg}`);
    combinedOutput += restoreResult.output;

    const buildResult = await runCommand(
      workDir,
      `dotnet build ${slnArg} --no-restore`
    );
    combinedOutput += "\n" + buildResult.output;

    const buildErrors = parseCompilerOutput(buildResult.output);
    const buildCounts = resolveCompilerCounts(buildResult.output, buildErrors, []);
    if (buildResult.code !== 0 || buildCounts.compilerErrorCount > 0) {
      return Response.json(
        finalizeRuntimeReport(
          {
            apiStartup: createCheckResult(
              "API Startup",
              false,
              `Build failed with ${buildCounts.compilerErrorCount} compiler errors`
            ),
            swagger: createCheckResult("Swagger Endpoint", false, "Skipped — build failed"),
            database: createCheckResult("Database Connection", false, "Skipped — build failed"),
            migration: createCheckResult("Migration Execution", false, "Skipped — build failed"),
          },
          { output: combinedOutput.slice(-12000), sdkAvailable: true }
        )
      );
    }

    const migrationResult = await runCommand(workDir, migrationCommand(), 120_000);
    combinedOutput += "\n" + migrationResult.output;

    const migrationCheck = verifyMigrationFromCommandOutput(
      migrationResult.output,
      migrationResult.code
    );
    const databaseCheck = verifyDatabaseFromCommandOutput(
      migrationResult.output,
      migrationResult.code
    );

    apiProcess = spawn(
      "dotnet",
      ["run", "--project", apiProject, "--no-build", "--urls", baseUrl],
      {
        cwd: workDir,
        shell: true,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    const { started, output: startupOutput } = await waitForStartupLog(
      apiProcess,
      45_000
    );
    combinedOutput += "\n" + startupOutput;

    const apiStartupCheck = started
      ? createCheckResult(
          "API Startup",
          true,
          `API started and listening on ${baseUrl}`
        )
      : createCheckResult(
          "API Startup",
          false,
          "API process did not report listening within timeout"
        );

    let swaggerCheck = createCheckResult(
      "Swagger Endpoint",
      false,
      "Skipped — API did not start"
    );

    if (started) {
      await sleep(1500);
      swaggerCheck = await verifySwaggerEndpoint(baseUrl);
    }

    killProcess(apiProcess);
    apiProcess = null;

    const report: RuntimeReport = finalizeRuntimeReport(
      {
        apiStartup: apiStartupCheck,
        swagger: swaggerCheck,
        database: databaseCheck,
        migration: migrationCheck,
      },
      { output: combinedOutput.slice(-12000), sdkAvailable: true }
    );

    return Response.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Runtime verify failed";
    return Response.json(
      finalizeRuntimeReport(
        {
          apiStartup: createCheckResult("API Startup", false, message),
          swagger: createCheckResult("Swagger Endpoint", false, message),
          database: createCheckResult("Database Connection", false, message),
          migration: createCheckResult("Migration Execution", false, message),
        },
        { output: message, sdkAvailable: true }
      ),
      { status: 500 }
    );
  } finally {
    killProcess(apiProcess);
    if (workDir) {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
