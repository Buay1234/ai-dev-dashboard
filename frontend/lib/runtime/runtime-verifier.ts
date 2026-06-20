import type { GeneratedProjectBundle, GeneratedSourceFile } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import {
  verifyDatabaseConfiguration,
  verifyDatabaseFromCommandOutput,
} from "./database-checker";
import {
  verifyMigrationFiles,
  verifyMigrationFromCommandOutput,
} from "./migration-checker";
import {
  createCheckResult,
  createInitialRuntimeReport,
  finalizeRuntimeReport,
  type RuntimeReport,
  type RuntimeVerifyApiResponse,
} from "./runtime-report";
import { verifySwaggerInSource } from "./swagger-checker";

export type RuntimeVerificationProgress = (partial: RuntimeReport) => void;
export type RuntimeActivityLog = (message: string) => void;

function toApiPayload(files: GeneratedSourceFile[]) {
  return files.map((f) => ({
    path: f.path ? `${f.path}/${f.fileName}` : f.fileName,
    content: f.content,
  }));
}

function verifyApiStartupInSource(files: GeneratedSourceFile[]) {
  const program =
    files.find(
      (f) =>
        f.fileName === "Program.cs" &&
        f.path.includes(`${PROJECT_NAMESPACE}.API`)
    ) ?? files.find((f) => f.fileName === "Program.cs");

  if (!program) {
    return createCheckResult(
      "API Startup",
      false,
      "Program.cs not found — API cannot start"
    );
  }

  const hasWebApp =
    program.content.includes("WebApplication.CreateBuilder") &&
    program.content.includes("app.Run");

  if (hasWebApp) {
    return createCheckResult(
      "API Startup",
      true,
      "ASP.NET Core minimal hosting pipeline configured (static verification)"
    );
  }

  return createCheckResult(
    "API Startup",
    false,
    "Program.cs missing WebApplication host or app.Run()"
  );
}

function staticFallbackRuntimeVerify(
  files: GeneratedSourceFile[],
  reason: string
): RuntimeVerifyApiResponse {
  const checks = {
    apiStartup: verifyApiStartupInSource(files),
    swagger: verifySwaggerInSource(files),
    database: verifyDatabaseConfiguration(files),
    migration: verifyMigrationFiles(files),
  };

  return finalizeRuntimeReport(checks, {
    output: `Static runtime verification (${reason})`,
    sdkAvailable: false,
  });
}

async function callRuntimeVerifyApi(
  files: GeneratedSourceFile[]
): Promise<RuntimeVerifyApiResponse> {
  try {
    const res = await fetch("/api/runtime-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: toApiPayload(files) }),
    });

    if (!res.ok) {
      const text = await res.text();
      return staticFallbackRuntimeVerify(files, text);
    }

    return (await res.json()) as RuntimeVerifyApiResponse;
  } catch (error) {
    return staticFallbackRuntimeVerify(
      files,
      error instanceof Error ? error.message : "Runtime API unavailable"
    );
  }
}

export async function runRuntimeVerification(
  project: GeneratedProjectBundle,
  onProgress?: RuntimeVerificationProgress,
  onActivityLog?: RuntimeActivityLog
): Promise<RuntimeReport> {
  const log = (message: string) => onActivityLog?.(message);

  log("Runtime Verification — starting (dotnet run · swagger · database · migration)");

  const initial = createInitialRuntimeReport();
  onProgress?.({
    ...initial,
    checks: {
      apiStartup: { ...initial.checks.apiStartup, status: "running", detail: "Starting API…" },
      swagger: initial.checks.swagger,
      database: initial.checks.database,
      migration: initial.checks.migration,
    },
  });

  const report = await callRuntimeVerifyApi(project.sourceFiles);

  for (const key of ["apiStartup", "swagger", "database", "migration"] as const) {
    const check = report.checks[key];
    log(
      `Runtime ${check.label} — ${check.status === "pass" ? "PASS" : "FAIL"}: ${check.detail}`
    );
  }

  log(
    report.runtimePassed
      ? "Runtime Verification PASSED — all checks green"
      : `Runtime Verification FAILED — ${[
          !report.apiStartup && "API Startup",
          !report.swagger && "Swagger",
          !report.database && "Database",
          !report.migration && "Migration",
        ]
          .filter(Boolean)
          .join(", ")}`
  );

  onProgress?.(report);
  return report;
}

export type { RuntimeReport };
