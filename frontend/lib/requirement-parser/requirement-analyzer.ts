import { extractBusinessRules } from "./business-rules";
import { detectDomain, domainConfidenceScore } from "./domain-detector";
import { extractEntities } from "./entity-extractor";
import { extractModules } from "./module-extractor";

export type RequirementAnalysisContract = {
  domain: string;
  entities: string[];
  modules: string[];
  businessRules: string[];
  confidenceScore: number;
  rawRequirement: string;
  analyzedAt: string;
};

export function analyzeRequirement(requirement: string): RequirementAnalysisContract {
  const trimmed = requirement.trim();
  const detection = detectDomain(trimmed);
  const entities = extractEntities(trimmed, detection.domain);
  const modules = extractModules(trimmed, detection.domain, entities);
  const businessRules = extractBusinessRules(trimmed, detection.domain);

  const entityBoost = Math.min(entities.filter((e) => e !== "BusinessRecord").length * 5, 25);
  const moduleBoost = Math.min(modules.length * 2, 12);
  const ruleBoost = Math.min(businessRules.length * 2, 10);
  const confidenceScore = Math.min(
    99,
    Math.round(domainConfidenceScore(detection) * 0.55 + entityBoost + moduleBoost + ruleBoost)
  );

  return {
    domain: detection.domain,
    entities,
    modules,
    businessRules,
    confidenceScore,
    rawRequirement: trimmed,
    analyzedAt: new Date().toISOString(),
  };
}

export function formatAnalysisForAgent(contract: RequirementAnalysisContract): string {
  return `# Business Requirement Analysis (V28 Parser)

Domain: ${contract.domain}
Confidence Score: ${contract.confidenceScore}%

## Entities
${contract.entities.map((e) => `- ${e}`).join("\n")}

## Modules
${contract.modules.map((m) => `- ${m}`).join("\n")}

## Business Rules
${contract.businessRules.map((r) => `- ${r}`).join("\n")}

Use these domain-specific entities and modules — avoid generic placeholders like Handle, Core, Manage, Generate, Provide, or System unless explicitly listed above.`;
}

export function exportRequirementContractJson(
  contract: RequirementAnalysisContract
): string {
  return JSON.stringify(
    {
      domain: contract.domain,
      entities: contract.entities,
      modules: contract.modules,
      businessRules: contract.businessRules,
    },
    null,
    2
  );
}

export type { BusinessDomain, DomainDetectionResult } from "./domain-detector";
