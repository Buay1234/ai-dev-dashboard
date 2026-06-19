import type { AgentOutputs } from "@/lib/artifacts/artifact-generator";
import type { GeneratedProjectBundle, GeneratedSourceFile, EntityDefinition } from "./types";
import { PROJECT_NAMESPACE } from "./types";
import { extractEntities } from "./entity-parser";
import {
  generateEntityClasses,
  generateRepositories,
} from "./entity-generator";
import { runDatabaseMigrationWorkflow, mergeDatabaseSourceFiles } from "@/lib/database/database-service";
import {
  generateDatabaseDesignDoc,
  generateSqlScript,
} from "./migration-generator";
import {
  generateCrudControllers,
  generateDtoFiles,
} from "./controller-generator";
import {
  generateTestPlanDoc,
  generateUnitTests,
} from "./unit-test-generator";
import {
  APPSETTINGS_JSON,
  DOMAIN_CSPROJ,
  PROJECT_SOLUTION_FILE,
} from "@/lib/project-templates";

function generateProgramCs(entities: ReturnType<typeof extractEntities>): GeneratedSourceFile {
  const repoRegistrations = entities
    .map(
      (e) =>
        `builder.Services.AddScoped<I${e.name}Repository, ${e.name}Repository>();`
    )
    .join("\n");

  const content = `using Microsoft.EntityFrameworkCore;
using ${PROJECT_NAMESPACE}.Infrastructure.Data;
using ${PROJECT_NAMESPACE}.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

${repoRegistrations}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();
app.Run();
`;

  return {
    id: "api-program",
    path: `${PROJECT_NAMESPACE}.API`,
    fileName: "Program.cs",
    category: "infrastructure",
    agent: "Franky",
    language: "csharp",
    content,
  };
}

function generateRobinEntityDoc(
  entities: ReturnType<typeof extractEntities>,
  robin: string
): GeneratedSourceFile {
  const list = entities.map((e) => `- **${e.name}** → table \`${e.tableName}\``).join("\n");
  return {
    id: "robin-entities",
    path: "docs",
    fileName: "Entities.md",
    category: "docs",
    agent: "Robin",
    language: "markdown",
    content: `# Domain Entities

> Extracted by Robin · V23

${list}

## Analysis

${robin.slice(0, 6000)}
`,
  };
}

function generateInfrastructureCsproj(): GeneratedSourceFile {
  return {
    id: "infra-csproj",
    path: `${PROJECT_NAMESPACE}.Infrastructure`,
    fileName: `${PROJECT_NAMESPACE}.Infrastructure.csproj`,
    category: "infrastructure",
    agent: "Franky",
    language: "csharp",
    content: `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="9.0.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\\${PROJECT_NAMESPACE}.Domain\\${PROJECT_NAMESPACE}.Domain.csproj" />
  </ItemGroup>

</Project>
`,
  };
}

function generateApiCsproj(): GeneratedSourceFile {
  return {
    id: "api-csproj",
    path: `${PROJECT_NAMESPACE}.API`,
    fileName: `${PROJECT_NAMESPACE}.API.csproj`,
    category: "infrastructure",
    agent: "Nami",
    language: "csharp",
    content: `<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="9.0.0" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="7.2.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\\${PROJECT_NAMESPACE}.Application\\${PROJECT_NAMESPACE}.Application.csproj" />
    <ProjectReference Include="..\\${PROJECT_NAMESPACE}.Infrastructure\\${PROJECT_NAMESPACE}.Infrastructure.csproj" />
  </ItemGroup>

</Project>
`,
  };
}

export function generateProjectBundle(
  outputs: AgentOutputs,
  requirement: string
): GeneratedProjectBundle {
  const entities = extractEntities(outputs.robin, outputs.zoro, requirement);
  const databaseResult = runDatabaseMigrationWorkflow(entities);

  const baseFiles: GeneratedSourceFile[] = [
    generateRobinEntityDoc(entities, outputs.robin),
    generateSqlScript(entities),
    generateDatabaseDesignDoc(entities, outputs.zoro),
    ...generateEntityClasses(entities),
    ...generateRepositories(entities),
    ...generateDtoFiles(entities),
    ...generateCrudControllers(entities),
    ...generateUnitTests(entities),
    generateTestPlanDoc(outputs.usopp),
    generateProgramCs(entities),
    generateApiCsproj(),
    generateInfrastructureCsproj(),
    {
      id: "domain-csproj",
      path: `${PROJECT_NAMESPACE}.Domain`,
      fileName: `${PROJECT_NAMESPACE}.Domain.csproj`,
      category: "infrastructure",
      agent: "Franky",
      language: "csharp",
      content: DOMAIN_CSPROJ.trim(),
    },
    {
      id: "app-csproj",
      path: `${PROJECT_NAMESPACE}.Application`,
      fileName: `${PROJECT_NAMESPACE}.Application.csproj`,
      category: "infrastructure",
      agent: "Nami",
      language: "csharp",
      content: `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\\${PROJECT_NAMESPACE}.Domain\\${PROJECT_NAMESPACE}.Domain.csproj" />
  </ItemGroup>

</Project>
`,
    },
    {
      id: "appsettings",
      path: `${PROJECT_NAMESPACE}.API`,
      fileName: "appsettings.json",
      category: "infrastructure",
      agent: "Zoro",
      language: "csharp",
      content: APPSETTINGS_JSON.trim(),
    },
    {
      id: "readme",
      path: "",
      fileName: "README.md",
      category: "docs",
      agent: "System",
      language: "markdown",
      content: `# ${PROJECT_NAMESPACE}

Generated by AI Dev Dashboard V24 · EF Core Migration Runner

## Structure

- **Domain** — Entity classes (${entities.map((e) => e.name).join(", ")})
- **Infrastructure** — DbContext, Entity Configurations, EF Migrations
- **Application** — DTOs
- **API** — CRUD Controllers
- **Tests** — xUnit + Moq

## EF Core Migration (Visual Studio 2022)

\`\`\`powershell
dotnet restore
dotnet ef migrations add InitialCreate --project ${PROJECT_NAMESPACE}.Infrastructure --startup-project ${PROJECT_NAMESPACE}.API
dotnet ef database update --project ${PROJECT_NAMESPACE}.Infrastructure --startup-project ${PROJECT_NAMESPACE}.API
\`\`\`

> Migration files are pre-generated under \`${PROJECT_NAMESPACE}.Infrastructure/Migrations/\`

## Run API

\`\`\`bash
dotnet run --project ${PROJECT_NAMESPACE}.API
dotnet test ${PROJECT_NAMESPACE}.Tests
\`\`\`
`,
    },
    {
      id: "sln",
      path: "",
      fileName: `${PROJECT_NAMESPACE}.sln`,
      category: "infrastructure",
      agent: "System",
      language: "csharp",
      content: PROJECT_SOLUTION_FILE.trim(),
    },
  ];

  const sourceFiles = mergeDatabaseSourceFiles(baseFiles, databaseResult.sourceFiles);

  return {
    id: `project-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    requirement,
    entities,
    sourceFiles,
    databaseWorkflow: databaseResult.workflow,
    migrationArtifacts: databaseResult.migrationArtifacts,
  };
}

export function getProjectGenerationSteps(entities: ReturnType<typeof extractEntities>) {
  return [
    { id: "entities", label: `Entities Extracted (${entities.length})`, done: true },
    { id: "config", label: "Entity Configurations Complete", done: true },
    { id: "dbcontext", label: "AppDbContext Complete", done: true },
    { id: "migration", label: "InitialCreate Migration Complete", done: true },
    { id: "snapshot", label: "Model Snapshot Complete", done: true },
    { id: "repos", label: "Repositories Generated", done: true },
    { id: "api", label: "CRUD Controllers Generated", done: true },
    { id: "tests", label: "xUnit Tests Generated", done: true },
  ];
}

export type { GeneratedSourceFile, GeneratedProjectBundle, EntityDefinition };
