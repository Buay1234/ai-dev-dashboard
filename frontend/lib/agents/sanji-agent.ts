import "server-only";
import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";
import {
  runDesignGeneration,
  type DesignGenerationResult,
} from "@/lib/design-generator";

export type SanjiAgentResult = AgentWorkflowResult & {
  designGeneration: DesignGenerationResult;
};

export async function runSanjiAgent(
  zoroOutput: string,
  options: {
    requirement: string;
    domain: string;
    entityNames: string[];
    businessAnalysis?: string;
  }
): Promise<SanjiAgentResult> {
  const designGeneration = runDesignGeneration({
    requirement: options.requirement,
    domain: options.domain,
    entityNames: options.entityNames,
  });

  const structuredContext = options.businessAnalysis
    ? `

Structured Architecture Context:
${options.businessAnalysis}
`
    : "";

  const prompt = `
You are Sanji.
Act as a senior UI/UX designer (V33).

${buildMetaInstructions()}

Using Zoro's backend plan and business context, write a concise UX design narrative that complements the generated design artifacts.

Zoro Output:
${zoroOutput}
${structuredContext}

Domain: ${options.domain}
Entities: ${options.entityNames.join(", ")}
UX Quality Score: ${designGeneration.uxQuality.percentage}% (${designGeneration.uxQuality.grade})

Document:
- information architecture
- dashboard UX rationale
- CRUD screen patterns
- responsive & accessibility priorities

Return Markdown with:

# UX Overview
# Navigation & IA
# Dashboard Experience
# CRUD Screen Patterns
# Design System Notes
# Accessibility & Responsive
# Handoff to Nami
`;

  const workflow = await runGeminiWorkflow(prompt);

  return {
    ...workflow,
    designGeneration,
  };
}
