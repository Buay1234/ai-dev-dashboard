import type { ArchitectureContract } from "@/lib/domain-library/types";
import type { RequirementAnalysisContract } from "@/lib/requirement-parser/requirement-analyzer";
import {
  computeDomainComplexity,
  selectArchitectureType,
  type ArchitectureSelection,
  type ArchitectureType,
} from "./architecture-selector";
import {
  patternNames,
  selectDesignPatterns,
  type DesignPattern,
} from "./pattern-selector";
import {
  buildProjectLayout,
  type ProjectLayout,
  type ProjectStructureNode,
} from "./project-layout";

export type BusinessArchitecturePlan = {
  architectureType: ArchitectureType;
  layers: string[];
  patterns: string[];
  designPatterns: DesignPattern[];
  projectStructure: ProjectStructureNode[];
  projectLayout: ProjectLayout;
  confidenceScore: number;
  complexityScore: number;
  selectionReason: string;
  domain: string;
  generatedAt: string;
};

function computeArchitectureConfidence(
  selection: ArchitectureSelection,
  domainContract: ArchitectureContract,
  patternCount: number
): number {
  const domainBase = domainContract.confidenceScore;
  const complexityClarity = Math.min(selection.complexity.score / 50, 1) * 15;
  const templateBoost = domainContract.templateLoaded ? 8 : 0;
  const patternBoost = Math.min(patternCount * 2, 10);
  const entityBoost = Math.min(domainContract.entities.length * 2, 12);

  return Math.min(
    99,
    Math.round(domainBase * 0.45 + complexityClarity + templateBoost + patternBoost + entityBoost)
  );
}

export function generateBusinessArchitecture(
  analysis: RequirementAnalysisContract,
  domainContract: ArchitectureContract
): BusinessArchitecturePlan {
  const selection = selectArchitectureType(analysis, domainContract);
  const projectLayout = buildProjectLayout(selection.architectureType);
  const designPatterns = selectDesignPatterns(
    selection.architectureType,
    domainContract
  );
  const confidenceScore = computeArchitectureConfidence(
    selection,
    domainContract,
    designPatterns.length
  );

  return {
    architectureType: selection.architectureType,
    layers: projectLayout.layers,
    patterns: patternNames(designPatterns),
    designPatterns,
    projectStructure: projectLayout.structure,
    projectLayout,
    confidenceScore,
    complexityScore: selection.complexity.score,
    selectionReason: selection.reason,
    domain: domainContract.domain,
    generatedAt: new Date().toISOString(),
  };
}

export function formatBusinessArchitectureForAgent(
  plan: BusinessArchitecturePlan
): string {
  const patternLines = plan.designPatterns.map(
    (p) => `- **${p.name}** (${p.appliesTo}): ${p.purpose}`
  );

  const structureLines = plan.projectStructure.map(
    (s) => `- \`${s.path}\` — ${s.purpose}`
  );

  return `# Business Architecture Plan (V30)

Architecture Type: **${plan.architectureType}**
Domain: ${plan.domain}
Confidence Score: ${plan.confidenceScore}%
Complexity Score: ${plan.complexityScore}

Selection Reason: ${plan.selectionReason}

## Layers
${plan.layers.map((l) => `- ${l}`).join("\n")}

## Design Patterns
${patternLines.join("\n")}

## Project Structure
${structureLines.join("\n")}

Implement backend, frontend, and QA aligned to this architecture before writing code. Respect layer boundaries and pattern responsibilities.`;
}

export function buildAgentArchitectureContext(
  domainContract: ArchitectureContract,
  plan: BusinessArchitecturePlan,
  formatDomain: (contract: ArchitectureContract) => string
): string {
  return `${formatDomain(domainContract)}

---

${formatBusinessArchitectureForAgent(plan)}`;
}

export type { ArchitectureType, ArchitectureSelection, DomainComplexity } from "./architecture-selector";
export type { DesignPattern } from "./pattern-selector";
export type { ProjectLayout, ProjectStructureNode } from "./project-layout";
