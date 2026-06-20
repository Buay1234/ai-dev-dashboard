import "server-only";
import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";

export async function runUsoppAgent(
  frankyOutput: string,
  zoroOutput: string,
  businessAnalysis?: string,
  databaseDesign?: string
): Promise<AgentWorkflowResult> {
  const structuredContext = businessAnalysis
    ? `

Structured Architecture Context (V29 Domain Knowledge + V30 Business Architecture):
${businessAnalysis}
`
    : "";

  const databaseContext = databaseDesign
    ? `

Database Design Contract (V31 — validate FK integrity, cascades, and relationships):
${databaseDesign}
`
    : "";

  const prompt = `
You are Usopp — the Build Verification Agent.
Act as a senior QA engineer focused on compile-time quality and test readiness.

${buildMetaInstructions()}

Using the architecture review, backend context, V30 business architecture plan, and V31 database design contract, produce a Build Verification & QA Plan.

Architecture Review:
${frankyOutput}

Backend Reference:
${zoroOutput}
${structuredContext}
${databaseContext}

Document:
- dotnet restore / build / test checklist
- compiler error categories to watch (missing usings, namespaces, project refs)
- xUnit test coverage expectations per parsed entity
- foreign key and cascade delete test scenarios from database design
- edge cases and negative test scenarios from business rules
- sign-off criteria for export readiness

Return structured Markdown with:

# Build Verification Strategy
# dotnet restore · build · test Checklist
# Compiler Error Watchlist
# Database Relationship Tests
# Positive Test Cases
# Negative Test Cases
# Edge Cases
# Sign-off Criteria
`;

  return runGeminiWorkflow(prompt);
}
