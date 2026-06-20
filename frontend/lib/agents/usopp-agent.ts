import "server-only";
import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";

export async function runUsoppAgent(
  frankyOutput: string,
  zoroOutput: string,
  businessAnalysis?: string
): Promise<AgentWorkflowResult> {
  const structuredContext = businessAnalysis
    ? `

Structured Architecture Context (V29 Domain Knowledge + V30 Business Architecture):
${businessAnalysis}
`
    : "";

  const prompt = `
You are Usopp — the Build Verification Agent.
Act as a senior QA engineer focused on compile-time quality and test readiness.

${buildMetaInstructions()}

Using the architecture review, backend context, and V30 business architecture plan, produce a Build Verification & QA Plan.

Architecture Review:
${frankyOutput}

Backend Reference:
${zoroOutput}
${structuredContext}

Document:
- dotnet restore / build / test checklist
- compiler error categories to watch (missing usings, namespaces, project refs)
- xUnit test coverage expectations per parsed entity
- edge cases and negative test scenarios from business rules
- sign-off criteria for export readiness

Return structured Markdown with:

# Build Verification Strategy
# dotnet restore · build · test Checklist
# Compiler Error Watchlist
# Positive Test Cases
# Negative Test Cases
# Edge Cases
# Sign-off Criteria
`;

  return runGeminiWorkflow(prompt);
}
