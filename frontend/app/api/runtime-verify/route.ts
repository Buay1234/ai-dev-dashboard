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
import {
  buildSqlCmdSelectOneCommand,
  extractConnectionStringFromPayload,
  extractExceptionExcerpt,
  verifyDatabaseSelectOneOutput,
} from "@/lib/runtime/database-checker";
import {
  migrationAddCommand,
  migrationCommand,
  verifyMigrationFromCommandOutput,
} from "@/lib/runtime/migration-checker";
import {
  appendPhase,
  createEmptyDiagnostics,
  formatDiagnosticsOutput,
  STARTUP_TIMEOUT_MS,
  verifyRuntimeEndpoints,
} from "@/lib/runtime/runtime-diagnostics";
import { findFreePort } from "@/lib/runtime/runtime-diagnostics-server";
import {
  createCheckResult,
  finalizeRuntimeReport,
  type RuntimeReport,
} from "@/lib/runtime/runtime-report";

export const maxDuration = 300;

const execAsync = promisify(exec);

type FilePayload = { path: string; content: string };

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
): Promise<{ started: boolean; output: string; exception?: string }> {
  let output = "";
  let exception: string | undefined;

  const startedPromise = new Promise<boolean>((resolve) => {
    const onData = (chunk: Buffer | string) => {
      output += chunk.toString();
      if (
        output.includes("Unhandled exception") ||
        output.includes("Hosting failed to start") ||
        output.includes("fail: Microsoft.Extensions.Hosting")
      ) {
        exception = output.slice(-4000);
      }
      if (
        output.includes("Now listening on") ||
        output.includes("Application started")
      ) {
        resolve(true);
      }
    };
    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", onData);
    setTimeout(() => resolve(false), timeoutMs);
  });

  const started = await startedPromise;
  return { started, output, exception };
}

function killProcess(proc: ChildProcess | null) {
  if (!proc || proc.killed) return;
  try {
    if (proc.pid) {
      spawn("taskkill", ["/PID", String(proc.pid), "/T", "/F"], {
        shell: true,
        windowsHide: true,
        stdio: "ignore",
      });
    }
    proc.kill("SIGTERM");
  } catch {
    // ignore
  }
}

async function regenerateMigrations(
  workDir: string,
  connectionString: string
): Promise<{ code: number; output: string }> {
  const migrationsDir = path.join(
    workDir,
    `${PROJECT_NAMESPACE}.Infrastructure`,
    "Migrations"
  );
  await fs.rm(migrationsDir, { recursive: true, force: true }).catch(() => {});
  return runCommand(workDir, migrationAddCommand(connectionString), 120_000);
}

export async function POST(req: Request) {
  let workDir = "";
  let apiProcess: ChildProcess | null = null;
  let combinedOutput = "";
  const diagnostics = createEmptyDiagnostics();

  try {
    const body = await req.json();
    const files = (body.files ?? []) as FilePayload[];

    if (!files.length) {
      return Response.json({ error: "No files provided" }, { status: 400 });
    }

    const sdkAvailable = await checkDotnetSdk();
    if (!sdkAvailable) {
      appendPhase(diagnostics, "SDK Check", false, "dotnet SDK not available");
      return Response.json(
        finalizeRuntimeReport(
          {
            apiStartup: createCheckResult("API Startup", false, "dotnet SDK not available"),
            swagger: createCheckResult("Swagger Endpoint", false, "dotnet SDK not available"),
            database: createCheckResult("Database Connection", false, "dotnet SDK not available"),
            migration: createCheckResult("Migration Execution", false, "dotnet SDK not available"),
          },
          {
            output: formatDiagnosticsOutput(diagnostics),
            sdkAvailable: false,
            diagnostics,
          }
        )
      );
    }

    workDir = path.join(os.tmpdir(), `ai-runtime-v27-${Date.now()}`);
    diagnostics.workDir = workDir;
    await fs.mkdir(workDir, { recursive: true });

    for (const file of files) {
      const fullPath = path.join(workDir, file.path.replace(/\//g, path.sep));
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content, "utf8");
    }

    const slnTarget = resolveSolutionTarget(files);
    const slnArg = `"${slnTarget.replace(/\//g, path.sep)}"`;
    const apiProject = `${PROJECT_NAMESPACE}.API`;
    const port = await findFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    diagnostics.port = port;
    diagnostics.baseUrl = baseUrl;

    const restoreResult = await runCommand(workDir, `dotnet restore ${slnArg}`);
    combinedOutput += restoreResult.output;
    appendPhase(
      diagnostics,
      "Restore",
      restoreResult.code === 0,
      restoreResult.code === 0 ? "dotnet restore succeeded" : "dotnet restore failed"
    );

    const buildResult = await runCommand(workDir, `dotnet build ${slnArg} --no-restore`);
    combinedOutput += "\n" + buildResult.output;
    diagnostics.buildOutput = buildResult.output.slice(-4000);
    appendPhase(
      diagnostics,
      "Build",
      buildResult.code === 0,
      buildResult.code === 0 ? "dotnet build succeeded" : "dotnet build failed"
    );

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
          {
            output: formatDiagnosticsOutput(diagnostics, combinedOutput.slice(-12000)),
            sdkAvailable: true,
            diagnostics,
          }
        )
      );
    }

    const connectionString = extractConnectionStringFromPayload(files);
    if (!connectionString) {
      appendPhase(
        diagnostics,
        "Connection String",
        false,
        "DefaultConnection not found in appsettings.json"
      );
      return Response.json(
        finalizeRuntimeReport(
          {
            apiStartup: createCheckResult("API Startup", false, "Skipped — no connection string"),
            swagger: createCheckResult("Swagger Endpoint", false, "Skipped — no connection string"),
            database: createCheckResult(
              "Database Connection",
              false,
              "DefaultConnection missing in appsettings.json"
            ),
            migration: createCheckResult(
              "Migration Execution",
              false,
              "Skipped — DefaultConnection missing in appsettings.json"
            ),
          },
          {
            output: formatDiagnosticsOutput(diagnostics, combinedOutput.slice(-12000)),
            sdkAvailable: true,
            diagnostics,
          }
        )
      );
    }

    diagnostics.connectionString = connectionString;

    const sqlProbeResult = await runCommand(
      workDir,
      buildSqlCmdSelectOneCommand(connectionString),
      60_000
    );
    combinedOutput += "\n" + sqlProbeResult.output;
    diagnostics.sqlProbeOutput = sqlProbeResult.output.slice(-4000);
    if (sqlProbeResult.code !== 0) {
      diagnostics.databaseException = extractExceptionExcerpt(sqlProbeResult.output);
    }

    let databaseCheck = verifyDatabaseSelectOneOutput(
      sqlProbeResult.output,
      sqlProbeResult.code,
      connectionString
    );
    appendPhase(diagnostics, "SQL Probe (SELECT 1)", databaseCheck.passed, databaseCheck.detail);

    const migrationRegen = await regenerateMigrations(workDir, connectionString);
    combinedOutput += "\n" + migrationRegen.output;
    appendPhase(
      diagnostics,
      "Migration Regeneration",
      migrationRegen.code === 0,
      migrationRegen.code === 0
        ? "dotnet ef migrations add InitialCreate succeeded"
        : "dotnet ef migrations add failed"
    );

    const migrationResult =
      migrationRegen.code === 0
        ? await runCommand(workDir, migrationCommand(connectionString), 120_000)
        : { code: 1, output: migrationRegen.output };
    combinedOutput += "\n" + migrationResult.output;
    diagnostics.migrationOutput = migrationResult.output.slice(-4000);
    if (migrationResult.code !== 0) {
      diagnostics.migrationException = extractExceptionExcerpt(migrationResult.output);
    }

    const migrationCheck =
      migrationRegen.code !== 0
        ? createCheckResult(
            "Migration Execution",
            false,
            `dotnet ef migrations add InitialCreate failed: ${extractExceptionExcerpt(migrationRegen.output, 1200)}`
          )
        : verifyMigrationFromCommandOutput(
            migrationRegen.output + migrationResult.output,
            migrationResult.code
          );

    appendPhase(
      diagnostics,
      "Migration Update",
      migrationCheck.passed,
      migrationCheck.detail
    );
    appendPhase(
      diagnostics,
      "Database Connection",
      databaseCheck.passed,
      databaseCheck.detail
    );

    apiProcess = spawn(
      "dotnet",
      ["run", "--project", apiProject, "--no-build", "--urls", baseUrl],
      {
        cwd: workDir,
        shell: true,
        windowsHide: true,
        env: {
          ...process.env,
          ASPNETCORE_ENVIRONMENT: "Development",
          DOTNET_ENVIRONMENT: "Development",
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    const { started, output: startupOutput, exception } = await waitForStartupLog(
      apiProcess,
      STARTUP_TIMEOUT_MS
    );
    combinedOutput += "\n" + startupOutput;
    diagnostics.startupOutput = startupOutput.slice(-4000);

    const apiStartupCheck =
      started && !exception
        ? createCheckResult(
            "API Startup",
            true,
            `API started and listening on ${baseUrl}`
          )
        : createCheckResult(
            "API Startup",
            false,
            exception
              ? `Startup exception: ${exception.slice(0, 500)}`
              : `API process did not report listening within ${STARTUP_TIMEOUT_MS / 1000}s`
          );

    appendPhase(diagnostics, "API Startup", apiStartupCheck.passed, apiStartupCheck.detail);

    let swaggerCheck = createCheckResult(
      "Swagger Endpoint",
      false,
      "Skipped — API did not start"
    );

    if (started && !exception) {
      await sleep(2000);
      const endpointResult = await verifyRuntimeEndpoints(baseUrl);
      swaggerCheck = endpointResult.swagger;
      diagnostics.endpoints = endpointResult.endpoints;
      appendPhase(diagnostics, "Swagger Endpoint", swaggerCheck.passed, swaggerCheck.detail);
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
      {
        output: formatDiagnosticsOutput(diagnostics, combinedOutput.slice(-12000)),
        sdkAvailable: true,
        diagnostics,
      }
    );

    return Response.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Runtime verify failed";
    appendPhase(diagnostics, "Runtime Verify", false, message);
    return Response.json(
      finalizeRuntimeReport(
        {
          apiStartup: createCheckResult("API Startup", false, message),
          swagger: createCheckResult("Swagger Endpoint", false, message),
          database: createCheckResult("Database Connection", false, message),
          migration: createCheckResult("Migration Execution", false, message),
        },
        {
          output: formatDiagnosticsOutput(diagnostics, message),
          sdkAvailable: true,
          diagnostics,
        }
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
