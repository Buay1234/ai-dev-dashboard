import "server-only";
import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";

export async function runFrankyAgent(
  zoroOutput: string,
  namiOutput: string
): Promise<AgentWorkflowResult> {
  const prompt = `
You are Franky.
Act as a senior full-stack architect.

${buildMetaInstructions()}

Review the backend and frontend plans and produce an Architecture Review.

Backend Plan:
${zoroOutput}

Frontend Plan:
${namiOutput}

Identify and document:
- architecture patterns
- scalability concerns
- recommended improvements

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
