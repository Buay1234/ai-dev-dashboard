import "server-only";
import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";

export async function runFrankyAgent(
  zoroOutput: string,
  namiOutput: string,
  businessAnalysis?: string,
  apiIntegration?: string
): Promise<AgentWorkflowResult> {
  const structuredContext = businessAnalysis
    ? `

Structured Architecture Contract (V29 Domain Knowledge):
${businessAnalysis}
`
    : "";

  const apiContext = apiIntegration
    ? `

Jinbe API Integration (V34 Swagger Auto Binding):
${apiIntegration}
`
    : "";

  const prompt = `
You are Franky.
Act as a senior full-stack architect.

${buildMetaInstructions()}

Review the backend, frontend, and API integration plans against the structured business analysis and produce an Architecture Review.

Backend Plan:
${zoroOutput}

Frontend Plan:
${namiOutput}
${structuredContext}
${apiContext}

Identify and document:
- architecture patterns for the detected domain
- scalability concerns per module
- recommended improvements honoring business rules

Return structured Markdown with:

# Architecture Overview
# Patterns
# Scalability Review
# Security Considerations
# Improvements
# Deployment Architecture
# Final Recommendations
`;

  return runGeminiWorkflow(prompt);
}
