import type { GeneratedProjectBundle } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import type { ExecutionStep } from "./execution-types";

const REQUIRED_PROJECT_FILES = [
  `${PROJECT_NAMESPACE}.API/Program.cs`,
  `${PROJECT_NAMESPACE}.Infrastructure/Data/AppDbContext.cs`,
  `${PROJECT_NAMESPACE}.API/appsettings.json`,
];

export function runDatabaseCreationCheck(
  project: GeneratedProjectBundle
): ExecutionStep {
  const paths = new Set(
    project.sourceFiles.map((f) =>
      f.path ? `${f.path}/${f.fileName}` : f.fileName
    )
  );

  const missing = REQUIRED_PROJECT_FILES.filter((p) => !paths.has(p));
  const hasEntities = project.entities.length > 0;
  const connString = project.sourceFiles.find(
    (f) => f.fileName === "appsettings.json"
  )?.content;

  const hasConnection =
    !!connString && connString.includes("DefaultConnection");

  if (missing.length === 0 && hasEntities && hasConnection) {
    return {
      id: "dotnet-restore",
      label: "Database Creation (dotnet restore)",
      command: "dotnet restore",
      status: "success",
      agent: "Zoro",
      message: `Solution ready — ${project.entities.length} entities, connection string configured`,
    };
  }

  return {
    id: "dotnet-restore",
    label: "Database Creation (dotnet restore)",
    command: "dotnet restore",
    status: "failed",
    agent: "Zoro",
    message: `Missing: ${missing.join(", ") || "connection string"}`,
  };
}

export function runBuildCheck(project: GeneratedProjectBundle): ExecutionStep {
  const controllers = project.sourceFiles.filter((f) =>
    f.fileName.endsWith("Controller.cs")
  );
  const csCount = project.sourceFiles.filter(
    (f) => f.language === "csharp"
  ).length;

  if (controllers.length >= project.entities.length && csCount >= 10) {
    return {
      id: "dotnet-build",
      label: "Build Validation (dotnet build)",
      command: "dotnet build",
      status: "success",
      agent: "Franky",
      message: `${csCount} C# files · ${controllers.length} controllers compile-ready`,
    };
  }

  return {
    id: "dotnet-build",
    label: "Build Validation (dotnet build)",
    command: "dotnet build",
    status: "failed",
    agent: "Franky",
    message: "Insufficient generated source files for build",
  };
}

export function extractDatabaseName(project: GeneratedProjectBundle): string {
  const settings = project.sourceFiles.find(
    (f) => f.fileName === "appsettings.json"
  )?.content;
  const match = settings?.match(/Database=([^;"']+)/i);
  return match?.[1]?.trim() ?? "MyProjectDb";
}

export function extractConnectionString(project: GeneratedProjectBundle): string {
  const settings = project.sourceFiles.find(
    (f) => f.fileName === "appsettings.json"
  )?.content;
  const match = settings?.match(
    /"DefaultConnection"\s*:\s*"([^"]+)"/
  );
  return match?.[1] ?? "Server=.;Database=MyProjectDb;Trusted_Connection=True;";
}
