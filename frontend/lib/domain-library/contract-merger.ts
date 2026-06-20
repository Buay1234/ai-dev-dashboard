import type { RequirementAnalysisContract } from "@/lib/requirement-parser/requirement-analyzer";
import { isGenericEntity } from "@/lib/requirement-parser/entity-extractor";
import type { BusinessDomain } from "@/lib/requirement-parser/domain-detector";
import { loadDomainTemplate } from "./template-loader";
import type { ArchitectureContract, DomainRelationship, DomainStatusValues } from "./types";

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.trim();
    if (!key) continue;
    const normalized = key.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(key);
  }
  return result;
}

function mergeEntities(
  parsed: string[],
  recommended: string[],
  requirement: string
): { entities: string[]; parsedEntities: string[]; recommendedEntities: string[] } {
  const filteredParsed = parsed.filter(
    (name) => !isGenericEntity(name, requirement) && name !== "BusinessRecord"
  );
  const filteredRecommended = recommended.filter(
    (name) => !isGenericEntity(name, requirement)
  );

  const parsedEntities =
    filteredParsed.length > 0 ? filteredParsed : parsed.filter((n) => n !== "BusinessRecord");
  const recommendedEntities = filteredRecommended;

  const entities = dedupeStrings([...parsedEntities, ...recommendedEntities]);

  if (entities.length === 0 && recommendedEntities.length > 0) {
    return {
      entities: recommendedEntities.slice(0, 5),
      parsedEntities,
      recommendedEntities,
    };
  }

  return { entities, parsedEntities, recommendedEntities };
}

function mergeModules(parsed: string[], recommended: string[]): {
  modules: string[];
  parsedModules: string[];
  recommendedModules: string[];
} {
  return {
    parsedModules: parsed,
    recommendedModules: recommended,
    modules: dedupeStrings([...parsed, ...recommended]),
  };
}

function mergeRules(parsed: string[], templateRules: string[]): {
  businessRules: string[];
  parsedBusinessRules: string[];
  templateBusinessRules: string[];
} {
  return {
    parsedBusinessRules: parsed,
    templateBusinessRules: templateRules,
    businessRules: dedupeStrings([...templateRules, ...parsed]),
  };
}

export function buildArchitectureContract(
  analysis: RequirementAnalysisContract
): ArchitectureContract {
  const template = loadDomainTemplate(analysis.domain as BusinessDomain);
  const requirement = analysis.rawRequirement;

  if (!template) {
    return {
      domain: analysis.domain,
      templateId: null,
      templateName: null,
      templateLoaded: false,
      requirementAnalysis: analysis,
      entities: analysis.entities,
      parsedEntities: analysis.entities,
      recommendedEntities: [],
      relationships: [],
      statusValues: [],
      modules: analysis.modules,
      parsedModules: analysis.modules,
      recommendedModules: [],
      businessRules: analysis.businessRules,
      parsedBusinessRules: analysis.businessRules,
      templateBusinessRules: [],
      confidenceScore: analysis.confidenceScore,
      rawRequirement: analysis.rawRequirement,
      analyzedAt: analysis.analyzedAt,
    };
  }

  const recommendedEntityNames = template.entities.map((e) => e.name);
  const { entities, parsedEntities, recommendedEntities } = mergeEntities(
    analysis.entities,
    recommendedEntityNames,
    requirement
  );

  const { modules, parsedModules, recommendedModules } = mergeModules(
    analysis.modules,
    template.recommendedModules
  );

  const { businessRules, parsedBusinessRules, templateBusinessRules } = mergeRules(
    analysis.businessRules,
    template.businessRules
  );

  const templateBoost = template ? 8 : 0;
  const relationshipBoost = Math.min(template.relationships.length, 5);
  const confidenceScore = Math.min(
    99,
    analysis.confidenceScore + templateBoost + relationshipBoost
  );

  return {
    domain: analysis.domain,
    templateId: template.id,
    templateName: template.domain,
    templateLoaded: true,
    requirementAnalysis: analysis,
    entities,
    parsedEntities,
    recommendedEntities,
    relationships: template.relationships as DomainRelationship[],
    statusValues: template.statusValues as DomainStatusValues[],
    modules,
    parsedModules,
    recommendedModules,
    businessRules,
    parsedBusinessRules,
    templateBusinessRules,
    confidenceScore,
    rawRequirement: analysis.rawRequirement,
    analyzedAt: new Date().toISOString(),
  };
}

export function formatArchitectureContractForAgent(
  contract: ArchitectureContract
): string {
  const relationshipLines = contract.relationships.map(
    (r) => `- ${r.from} → ${r.to} (${r.type}): ${r.label}`
  );

  const statusLines = contract.statusValues.map(
    (s) => `- ${s.entity}.${s.field}: ${s.values.join(", ")}`
  );

  return `# Architecture Contract (V29 Domain Knowledge Library)

Domain: ${contract.domain}
Template: ${contract.templateLoaded ? contract.templateName : "None (general business)"}
Confidence Score: ${contract.confidenceScore}%

## Merged Entities (use for database schema and APIs)
${contract.entities.map((e) => `- ${e}`).join("\n")}

## Entity Relationships
${relationshipLines.length > 0 ? relationshipLines.join("\n") : "- Define FK relationships per merged entities"}

## Status Values
${statusLines.length > 0 ? statusLines.join("\n") : "- Apply status enums per entity lifecycle"}

## Modules
${contract.modules.map((m) => `- ${m}`).join("\n")}

## Business Rules
${contract.businessRules.map((r) => `- ${r}`).join("\n")}

## Parsed from Requirement
Entities: ${contract.parsedEntities.join(", ") || "none"}
Modules: ${contract.parsedModules.join(", ") || "none"}

## Domain Template Recommendations
Entities: ${contract.recommendedEntities.join(", ") || "none"}
Modules: ${contract.recommendedModules.join(", ") || "none"}

Design backend, frontend, architecture, and QA around this enriched contract — not generic placeholders. Honor relationships, status enums, and business rules from the domain template.`;
}

export function exportArchitectureContractJson(contract: ArchitectureContract): string {
  return JSON.stringify(
    {
      domain: contract.domain,
      templateId: contract.templateId,
      entities: contract.entities,
      relationships: contract.relationships,
      statusValues: contract.statusValues,
      modules: contract.modules,
      businessRules: contract.businessRules,
    },
    null,
    2
  );
}
