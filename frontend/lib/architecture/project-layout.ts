import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import type { ArchitectureType } from "./architecture-selector";

export type ProjectStructureNode = {
  path: string;
  purpose: string;
};

export type ProjectLayout = {
  root: string;
  layers: string[];
  structure: ProjectStructureNode[];
};

const NS = PROJECT_NAMESPACE;

function baseStructure(): ProjectStructureNode[] {
  return [
    { path: `${NS}.sln`, purpose: "Solution entry point" },
    { path: `${NS}.Domain/`, purpose: "Core business entities and domain rules" },
    { path: `${NS}.Application/`, purpose: "Application logic and use cases" },
    { path: `${NS}.Infrastructure/`, purpose: "EF Core, repositories, external services" },
    { path: `${NS}.Infrastructure/Data/`, purpose: "DbContext and configurations" },
    { path: `${NS}.Infrastructure/Migrations/`, purpose: "EF Core migrations" },
    { path: `${NS}.API/`, purpose: "ASP.NET Core host and HTTP surface" },
    { path: `${NS}.API/Controllers/`, purpose: "REST API endpoints" },
    { path: `${NS}.Tests/`, purpose: "xUnit integration and unit tests" },
  ];
}

export function buildLayeredLayout(): ProjectLayout {
  return {
    root: NS,
    layers: ["Presentation (API)", "Application Services", "Domain", "Infrastructure (Data)"],
    structure: [
      ...baseStructure(),
      { path: `${NS}.Application/Services/`, purpose: "Business service orchestration" },
      { path: `${NS}.Application/DTOs/`, purpose: "Request/response contracts" },
      { path: `${NS}.Infrastructure/Repositories/`, purpose: "Repository implementations" },
    ],
  };
}

export function buildCleanLayout(): ProjectLayout {
  return {
    root: NS,
    layers: [
      "Presentation (API)",
      "Application (Use Cases)",
      "Domain (Entities · Rules)",
      "Infrastructure (Adapters)",
    ],
    structure: [
      ...baseStructure(),
      { path: `${NS}.Domain/Entities/`, purpose: "Aggregate roots and value objects" },
      { path: `${NS}.Application/Interfaces/`, purpose: "Ports — repository and service abstractions" },
      { path: `${NS}.Application/UseCases/`, purpose: "Application-specific business rules" },
      { path: `${NS}.Infrastructure/Repositories/`, purpose: "Adapter implementations" },
    ],
  };
}

export function buildCqrsLayout(): ProjectLayout {
  return {
    root: NS,
    layers: [
      "Presentation (API)",
      "Application (Commands · Queries)",
      "Domain (Write Model)",
      "Infrastructure (Persistence · Read Models)",
    ],
    structure: [
      ...baseStructure(),
      { path: `${NS}.Application/Commands/`, purpose: "Write-side command handlers" },
      { path: `${NS}.Application/Queries/`, purpose: "Read-side query handlers" },
      { path: `${NS}.Application/DTOs/`, purpose: "Command/query contracts and read DTOs" },
      { path: `${NS}.Infrastructure/Repositories/`, purpose: "Write repositories and read projections" },
    ],
  };
}

export function buildProjectLayout(architectureType: ArchitectureType): ProjectLayout {
  if (architectureType === "Clean Architecture") return buildCleanLayout();
  if (architectureType === "CQRS Architecture") return buildCqrsLayout();
  return buildLayeredLayout();
}

export function structurePaths(layout: ProjectLayout): string[] {
  return layout.structure.map((node) => node.path);
}
