import "server-only";
import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";

export async function runRobinAgent(
  requirement: string
): Promise<AgentWorkflowResult> {
  const prompt = `
You are Robin.
Act as a senior business analyst with 15+ years of experience.

${buildMetaInstructions()}

Analyze this user requirement and produce a Business Analysis Report.

Requirement:
${requirement}

Identify and document:
- modules
- features
- user stories
- business rules

Return structured Markdown with these sections:

# Business Goal
# Target Users
# Modules
# Features
# User Stories
# Business Rules
# Acceptance Criteria
# Functional Requirements
# Non-Functional Requirements
# API Requirements
# Database Entities
# Assumptions
# Risks
`;

  return runGeminiWorkflow(prompt);
}
