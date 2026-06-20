import type { ArchitectureContract } from "@/lib/domain-library/types";
import type { RequirementAnalysisContract } from "@/lib/requirement-parser/requirement-analyzer";

export type ArchitectureType =
  | "Clean Architecture"
  | "Layered Architecture"
  | "CQRS Architecture";

export type DomainComplexity = {
  score: number;
  entityCount: number;
  relationshipCount: number;
  moduleCount: number;
  ruleCount: number;
  statusEnumCount: number;
  templateLoaded: boolean;
};

export type ArchitectureSelection = {
  architectureType: ArchitectureType;
  complexity: DomainComplexity;
  reason: string;
};

const CQRS_FAVORED_DOMAINS = new Set([
  "Inventory",
  "Warehouse",
  "ERP",
  "POS",
]);

const CLEAN_FAVORED_DOMAINS = new Set([
  "HR",
  "CRM",
  "Customer Service",
]);

export function computeDomainComplexity(
  analysis: RequirementAnalysisContract,
  domainContract: ArchitectureContract
): DomainComplexity {
  const entityCount = domainContract.entities.length;
  const relationshipCount = domainContract.relationships.length;
  const moduleCount = domainContract.modules.length;
  const ruleCount = domainContract.businessRules.length;
  const statusEnumCount = domainContract.statusValues.reduce(
    (sum, s) => sum + s.values.length,
    0
  );

  const score = Math.round(
    entityCount * 3 +
      relationshipCount * 4 +
      moduleCount * 2 +
      ruleCount * 1.5 +
      statusEnumCount * 0.5 +
      (domainContract.templateLoaded ? 6 : 0)
  );

  return {
    score,
    entityCount,
    relationshipCount,
    moduleCount,
    ruleCount,
    statusEnumCount,
    templateLoaded: domainContract.templateLoaded,
  };
}

export function selectArchitectureType(
  analysis: RequirementAnalysisContract,
  domainContract: ArchitectureContract
): ArchitectureSelection {
  const complexity = computeDomainComplexity(analysis, domainContract);
  const domain = domainContract.domain;

  if (
    complexity.score >= 42 ||
    (complexity.entityCount >= 6 && complexity.relationshipCount >= 4)
  ) {
    return {
      architectureType: "Clean Architecture",
      complexity,
      reason: `High domain complexity (${complexity.score}) with ${complexity.entityCount} entities and ${complexity.relationshipCount} relationships`,
    };
  }

  if (
    CQRS_FAVORED_DOMAINS.has(domain) ||
    complexity.relationshipCount >= 3 ||
    complexity.ruleCount >= 5 ||
    complexity.statusEnumCount >= 10
  ) {
    return {
      architectureType: "CQRS Architecture",
      complexity,
      reason: `${domain} domain favors read/write separation with ${complexity.ruleCount} business rules and operational workflows`,
    };
  }

  if (
    CLEAN_FAVORED_DOMAINS.has(domain) &&
    complexity.score >= 24
  ) {
    return {
      architectureType: "Clean Architecture",
      complexity,
      reason: `${domain} requires strict domain rules and bounded contexts at complexity ${complexity.score}`,
    };
  }

  if (complexity.score >= 30) {
    return {
      architectureType: "Clean Architecture",
      complexity,
      reason: `Moderate-high complexity (${complexity.score}) benefits from dependency inversion and domain isolation`,
    };
  }

  if (complexity.score >= 18) {
    return {
      architectureType: "CQRS Architecture",
      complexity,
      reason: `Mid complexity (${complexity.score}) with ${complexity.moduleCount} modules suits command/query separation`,
    };
  }

  return {
    architectureType: "Layered Architecture",
    complexity,
    reason: `Standard CRUD scope (${complexity.entityCount} entities, complexity ${complexity.score}) fits classic layers`,
  };
}
