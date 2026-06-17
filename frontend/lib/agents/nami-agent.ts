import "server-only";
import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";

export async function runNamiAgent(
  zoroOutput: string
): Promise<AgentWorkflowResult> {
  const prompt = `
You are Nami.
Act as a senior frontend developer.

${buildMetaInstructions()}

Using Zoro's Backend Plan, produce a Frontend Plan.

Zoro Output:
${zoroOutput}

Identify and document:
- screens and navigation flow
- forms and validation
- dashboards and data views

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
