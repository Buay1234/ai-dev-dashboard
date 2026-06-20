import type { GeneratedSourceFile } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import { createCheckResult, type RuntimeCheckDetail } from "./runtime-report";

function parseDefaultConnection(content: string): string | null {
  const match = content.match(/"DefaultConnection"\s*:\s*"([^"]+)"/);
  return match?.[1] ?? null;
}

function normalizePayloadPath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

export function extractConnectionStringFromPayload(
  files: Array<{ path: string; content: string }>
): string | null {
  const apiDev = files.find(
    (f) =>
      normalizePayloadPath(f.path).includes(`${PROJECT_NAMESPACE}.API`) &&
      f.path.endsWith("appsettings.Development.json")
  );
  const apiBase = files.find(
    (f) =>
      normalizePayloadPath(f.path).includes(`${PROJECT_NAMESPACE}.API`) &&
      f.path.endsWith("appsettings.json")
  );
  const anySettings = files.find((f) => f.path.endsWith("appsettings.json"));

  return (
    (apiDev ? parseDefaultConnection(apiDev.content) : null) ??
    (apiBase ? parseDefaultConnection(apiBase.content) : null) ??
    (anySettings ? parseDefaultConnection(anySettings.content) : null)
  );
}

export function extractConnectionString(files: GeneratedSourceFile[]): string | null {
  return extractConnectionStringFromPayload(
    files.map((f) => ({
      path: f.path ? `${f.path}/${f.fileName}` : f.fileName,
      content: f.content,
    }))
  );
}

export function parseConnectionStringParts(connectionString: string): {
  server: string;
  database: string;
  trustedConnection: boolean;
} {
  return {
    server: connectionString.match(/Server=([^;]+)/i)?.[1]?.trim() ?? ".",
    database: connectionString.match(/Database=([^;]+)/i)?.[1]?.trim() ?? "master",
    trustedConnection: /Trusted_Connection=True/i.test(connectionString),
  };
}

export function buildSqlCmdSelectOneCommand(connectionString: string): string {
  const { server, database, trustedConnection } = parseConnectionStringParts(connectionString);
  const auth = trustedConnection ? "-E" : "";
  return `sqlcmd -S "${server}" -d "${database}" ${auth} -C -Q "SELECT 1" -h -1 -W`.trim();
}

export function extractExceptionExcerpt(output: string, maxLen = 8000): string {
  const trimmed = output.trim();
  if (!trimmed) return "No command output captured";

  const exceptionIdx = trimmed.search(
    /(?:System\.[A-Za-z.]+Exception|Unhandled exception|Hosting failed to start|An error was generated)/i
  );
  if (exceptionIdx >= 0) {
    return trimmed.slice(exceptionIdx, exceptionIdx + maxLen);
  }

  return trimmed.slice(-maxLen);
}

export function verifyDatabaseSelectOneOutput(
  output: string,
  exitCode: number,
  connectionString: string
): RuntimeCheckDetail {
  const { server, database } = parseConnectionStringParts(connectionString);

  if (exitCode === 0 && /\b1\b/.test(output)) {
    return createCheckResult(
      "Database Connection",
      true,
      `SELECT 1 succeeded on ${server} · database ${database}`
    );
  }

  const lower = output.toLowerCase();
  if (lower.includes("login failed") || lower.includes("cannot open database")) {
    return createCheckResult(
      "Database Connection",
      false,
      `SQL login/database error on ${server}/${database}: ${extractExceptionExcerpt(output, 1200)}`
    );
  }

  if (lower.includes("network-related") || lower.includes("server was not found")) {
    return createCheckResult(
      "Database Connection",
      false,
      `SQL Server not reachable at ${server}: ${extractExceptionExcerpt(output, 1200)}`
    );
  }

  return createCheckResult(
    "Database Connection",
    false,
    `SELECT 1 failed on ${server}/${database}: ${extractExceptionExcerpt(output, 1200)}`
  );
}

export function verifyDatabaseConfiguration(
  files: GeneratedSourceFile[]
): RuntimeCheckDetail {
  const connectionString = extractConnectionString(files);
  const hasDbContext = files.some((f) => f.fileName === "AppDbContext.cs");
  const program = files.find((f) => f.fileName === "Program.cs");

  const registersDbContext =
    program?.content.includes("AddDbContext") &&
    program.content.includes("DefaultConnection");

  if (connectionString && hasDbContext && registersDbContext) {
    const dbName =
      connectionString.match(/Database=([^;"']+)/i)?.[1]?.trim() ?? "configured";
    return createCheckResult(
      "Database Connection",
      true,
      `Connection string configured for ${dbName} · AppDbContext registered`
    );
  }

  const missing: string[] = [];
  if (!connectionString) missing.push("DefaultConnection in appsettings.json");
  if (!hasDbContext) missing.push("AppDbContext.cs");
  if (!registersDbContext) missing.push("AddDbContext in Program.cs");

  return createCheckResult(
    "Database Connection",
    false,
    `Database setup incomplete: ${missing.join(", ")}`
  );
}

export function verifyDatabaseFromCommandOutput(
  output: string,
  exitCode: number
): RuntimeCheckDetail {
  const lower = output.toLowerCase();
  const connected =
    lower.includes("successfully") ||
    lower.includes("done.") ||
    lower.includes("applying migration") ||
    lower.includes("database update completed");

  if (exitCode === 0 && connected) {
    return createCheckResult(
      "Database Connection",
      true,
      "Database connection verified via dotnet ef database update"
    );
  }

  if (lower.includes("login failed") || lower.includes("cannot open database")) {
    return createCheckResult(
      "Database Connection",
      false,
      `SQL Server connection failed: ${extractExceptionExcerpt(output, 1200)}`
    );
  }

  if (lower.includes("network-related") || lower.includes("server was not found")) {
    return createCheckResult(
      "Database Connection",
      false,
      `SQL Server instance not reachable: ${extractExceptionExcerpt(output, 1200)}`
    );
  }

  if (lower.includes("pendingmodelchangeswarning") || lower.includes("pending changes")) {
    return createCheckResult(
      "Database Connection",
      false,
      "Database update blocked by pending EF model changes"
    );
  }

  return createCheckResult(
    "Database Connection",
    false,
    exitCode === 0
      ? "Database update completed but connection could not be confirmed"
      : `Database connection verification failed: ${extractExceptionExcerpt(output, 1200)}`
  );
}
