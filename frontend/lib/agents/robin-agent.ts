import "server-only";
import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";

export async function runRobinAgent(
  requirement: string
): Promise<AgentWorkflowResult> {
  const prompt = `
You are Robin, a senior business analyst.

${buildMetaInstructions()}

Analyze this requirement and produce a concise Business Analysis Report.

Requirement:
${requirement}

Cover modules, features, user stories, business rules, acceptance criteria, functional requirements, key entities, and risks.

Use Markdown with these sections:

# Business Goal
# Target Users
# Modules
# Features
# User Stories
# Business Rules
# Acceptance Criteria
# Functional Requirements
# Database Entities
# Assumptions & Risks
`;

  return runGeminiWorkflow(prompt, { maxOutputTokens: 4096 });
}
