import type { GeneratedSourceFile } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import { createCheckResult, type RuntimeCheckDetail } from "./runtime-report";

export function extractConnectionString(files: GeneratedSourceFile[]): string | null {
  const settings = files.find(
    (f) =>
      f.fileName === "appsettings.json" &&
      f.path.includes(`${PROJECT_NAMESPACE}.API`)
  ) ?? files.find((f) => f.fileName === "appsettings.json");

  if (!settings) return null;

  const match = settings.content.match(/"DefaultConnection"\s*:\s*"([^"]+)"/);
  return match?.[1] ?? null;
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
      "SQL Server connection failed — check server availability and connection string"
    );
  }

  if (lower.includes("network-related") || lower.includes("server was not found")) {
    return createCheckResult(
      "Database Connection",
      false,
      "SQL Server instance not reachable"
    );
  }

  return createCheckResult(
    "Database Connection",
    false,
    exitCode === 0
      ? "Database update completed but connection could not be confirmed"
      : "Database connection verification failed"
  );
}
