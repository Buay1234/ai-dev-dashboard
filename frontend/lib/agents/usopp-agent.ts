import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";

export async function runUsoppAgent(
  frankyOutput: string,
  zoroOutput: string
): Promise<AgentWorkflowResult> {
  const prompt = `
You are Usopp.
Act as a senior QA engineer.

${buildMetaInstructions()}

Using the architecture review and backend context, produce a QA Plan.

Architecture Review:
${frankyOutput}

Backend Reference:
${zoroOutput}

Identify and document:
- test cases (positive and negative)
- edge cases
- validation checklist

Return structured Markdown with:

# QA Strategy
# Positive Test Cases
# Negative Test Cases
# Edge Cases
# Security Tests
# Validation Checklist
# Sign-off Criteria
`;

  return runGeminiWorkflow(prompt);
}
