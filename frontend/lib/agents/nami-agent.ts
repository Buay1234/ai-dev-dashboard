import "server-only";
import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";

export async function runNamiAgent(
  zoroOutput: string,
  businessAnalysis?: string,
  uxDesign?: string
): Promise<AgentWorkflowResult> {
  const structuredContext = businessAnalysis
    ? `

Structured Architecture Context (V29 Domain Knowledge + V30 Business Architecture):
${businessAnalysis}
`
    : "";

  const uxContext = uxDesign
    ? `

Sanji UX Design Handoff (V33 — navigation, wireframes, design system):
${uxDesign}
`
    : "";

  const prompt = `
You are Nami.
Act as a senior frontend developer.

${buildMetaInstructions()}

Using Zoro's Backend Plan, Sanji's UX design handoff, and the V30 architecture plan, produce a Frontend Plan aligned to layers, modules, and project structure.

Zoro Output:
${zoroOutput}
${structuredContext}
${uxContext}

Identify and document:
- screens and navigation flow per parsed modules
- forms and validation aligned to business rules
- dashboards and data views for parsed entities

Return structured Markdown with:

# Frontend Overview
# Screens
# Forms
# Dashboards
# Component Structure
# API Integration
# Responsive Layout Notes
`;

  return runGeminiWorkflow(prompt);
}
