import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";

export async function runZoroAgent(
  robinOutput: string
): Promise<AgentWorkflowResult> {
  const prompt = `
You are Zoro.
Act as a senior backend developer specializing in ASP.NET Core.

${buildMetaInstructions()}

Using Robin's Business Analysis, produce a Backend Plan.

Robin Output:
${robinOutput}

Identify and document:
- REST APIs (method, path, purpose)
- database tables and key fields
- backend services and responsibilities

Return structured Markdown with:

# Backend Overview
# API Endpoints
# Database Schema
# Services
# Technology Stack
# Implementation Notes

Include concrete endpoint and table definitions.
`;

  return runGeminiWorkflow(prompt);
}
