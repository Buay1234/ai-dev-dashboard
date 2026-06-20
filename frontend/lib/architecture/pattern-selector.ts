import type { ArchitectureContract } from "@/lib/domain-library/types";
import type { ArchitectureType } from "./architecture-selector";

export type DesignPattern = {
  name: string;
  purpose: string;
  appliesTo: string;
};

export function selectDesignPatterns(
  architectureType: ArchitectureType,
  domainContract: ArchitectureContract
): DesignPattern[] {
  const entityCount = domainContract.entities.length;
  const hasRelationships = domainContract.relationships.length > 0;

  const shared: DesignPattern[] = [
    {
      name: "Dependency Injection",
      purpose: "Loose coupling and testable service registration",
      appliesTo: "API · Infrastructure",
    },
    {
      name: "Repository",
      purpose: "Abstract data access per aggregate root",
      appliesTo: "Infrastructure · Domain",
    },
    {
      name: "DTO Mapping",
      purpose: "Separate API contracts from domain models",
      appliesTo: "Application · API",
    },
  ];

  if (architectureType === "Layered Architecture") {
    return [
      ...shared,
      {
        name: "Service Layer",
        purpose: "Orchestrate business operations across repositories",
        appliesTo: "Application",
      },
      {
        name: "Unit of Work",
        purpose: "Coordinate transactions across repositories",
        appliesTo: "Infrastructure",
      },
      {
        name: "API Controller",
        purpose: "HTTP endpoints delegating to application services",
        appliesTo: "API",
      },
    ];
  }

  if (architectureType === "Clean Architecture") {
    const patterns: DesignPattern[] = [
      ...shared,
      {
        name: "Use Case / Interactor",
        purpose: "Application-specific business rules isolated from infrastructure",
        appliesTo: "Application",
      },
      {
        name: "Domain Entity",
        purpose: "Encapsulate enterprise business rules",
        appliesTo: "Domain",
      },
      {
        name: "Interface Adapter",
        purpose: "Convert data between use cases and external agents",
        appliesTo: "Infrastructure · API",
      },
    ];

    if (hasRelationships) {
      patterns.push({
        name: "Aggregate Root",
        purpose: "Consistency boundary for related entities",
        appliesTo: "Domain",
      });
    }

    if (entityCount >= 5) {
      patterns.push({
        name: "Specification",
        purpose: "Composable query and validation rules",
        appliesTo: "Domain · Application",
      });
    }

    return patterns;
  }

  // CQRS Architecture
  const patterns: DesignPattern[] = [
    ...shared,
    {
      name: "Mediator (CQRS)",
      purpose: "Dispatch commands and queries to focused handlers",
      appliesTo: "Application",
    },
    {
      name: "Command Handler",
      purpose: "Process state-changing operations with validation",
      appliesTo: "Application · Commands",
    },
    {
      name: "Query Handler",
      purpose: "Optimized read models without side effects",
      appliesTo: "Application · Queries",
    },
  ];

  if (domainContract.statusValues.length > 0) {
    patterns.push({
      name: "Domain Event",
      purpose: "Notify downstream workflows on status transitions",
      appliesTo: "Domain · Application",
    });
  }

  if (entityCount >= 4) {
    patterns.push({
      name: "Read Model Projection",
      purpose: "Denormalized views for dashboards and reporting",
      appliesTo: "Infrastructure · Queries",
    });
  }

  return patterns;
}

export function patternNames(patterns: DesignPattern[]): string[] {
  return patterns.map((p) => p.name);
}
