import type { RuntimeCheckDetail } from "./runtime-report";
import { createCheckResult } from "./runtime-report";

export const STARTUP_TIMEOUT_MS = 120_000;

export type RuntimeDiagnostics = {
  workDir?: string;
  baseUrl?: string;
  port?: number;
  connectionString?: string;
  sqlProbeOutput?: string;
  databaseException?: string;
  migrationException?: string;
  phases: Array<{ phase: string; success: boolean; detail: string }>;
  endpoints: Array<{ path: string; status: number | null; ok: boolean; error?: string }>;
  startupOutput?: string;
  migrationOutput?: string;
  buildOutput?: string;
};

export function createEmptyDiagnostics(): RuntimeDiagnostics {
  return { phases: [], endpoints: [] };
}

export function appendPhase(
  diagnostics: RuntimeDiagnostics,
  phase: string,
  success: boolean,
  detail: string
): void {
  diagnostics.phases.push({ phase, success, detail });
}

export async function probeEndpoint(
  baseUrl: string,
  endpointPath: string,
  timeoutMs = 5000
): Promise<{ path: string; status: number | null; ok: boolean; error?: string }> {
  const url = `${baseUrl.replace(/\/$/, "")}${endpointPath}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return { path: endpointPath, status: res.status, ok: res.ok };
  } catch (error) {
    return {
      path: endpointPath,
      status: null,
      ok: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export async function verifyRuntimeEndpoints(
  baseUrl: string
): Promise<{ swagger: RuntimeCheckDetail; endpoints: RuntimeDiagnostics["endpoints"] }> {
  const paths = ["/swagger", "/swagger/index.html", "/swagger/v1/swagger.json", "/weatherforecast"];
  const results = await Promise.all(paths.map((p) => probeEndpoint(baseUrl, p)));

  const swaggerJson = results.find((r) => r.path === "/swagger/v1/swagger.json");
  const swaggerUi = results.find((r) => r.path === "/swagger/index.html" || r.path === "/swagger");
  const weather = results.find((r) => r.path === "/weatherforecast");

  const swaggerOk = Boolean(
    (swaggerJson?.ok && swaggerJson.status === 200) ||
      (swaggerUi?.ok && (swaggerUi.status === 200 || swaggerUi.status === 301))
  );

  const weatherOk = weather?.ok && weather.status === 200;

  let detail: string;
  if (swaggerOk && weatherOk) {
    detail = "Swagger and /weatherforecast responded successfully";
  } else if (swaggerOk) {
    detail = "Swagger reachable; /weatherforecast returned non-200";
  } else if (weatherOk) {
    detail = "/weatherforecast OK but Swagger endpoints unreachable";
  } else {
    detail = `Endpoint probe failed (${paths.join(", ")})`;
  }

  return {
    swagger: createCheckResult("Swagger Endpoint", swaggerOk, detail),
    endpoints: results,
  };
}

export function formatDiagnosticsOutput(diagnostics: RuntimeDiagnostics, tail = ""): string {
  const lines = [
    "=== Runtime Diagnostics ===",
    diagnostics.workDir ? `WorkDir: ${diagnostics.workDir}` : "",
    diagnostics.baseUrl ? `BaseUrl: ${diagnostics.baseUrl}` : "",
    diagnostics.port ? `Port: ${diagnostics.port}` : "",
    diagnostics.connectionString
      ? `ConnectionString: ${diagnostics.connectionString}`
      : "",
    "",
    "--- Phases ---",
    ...diagnostics.phases.map(
      (p) => `[${p.success ? "PASS" : "FAIL"}] ${p.phase}: ${p.detail}`
    ),
    "",
    "--- Endpoint Probes ---",
    ...diagnostics.endpoints.map((e) => {
      const status = e.status ?? "ERR";
      return `[${e.ok ? "OK" : "FAIL"}] ${e.path} -> ${status}${e.error ? ` (${e.error})` : ""}`;
    }),
    diagnostics.sqlProbeOutput
      ? `\n--- SQL Probe (SELECT 1) ---\n${diagnostics.sqlProbeOutput}`
      : "",
    diagnostics.databaseException
      ? `\n--- Database Exception ---\n${diagnostics.databaseException}`
      : "",
    diagnostics.migrationException
      ? `\n--- Migration Exception ---\n${diagnostics.migrationException}`
      : "",
    tail ? `\n--- Command Output (tail) ---\n${tail}` : "",
  ].filter(Boolean);

  return lines.join("\n");
}
