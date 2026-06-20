import "server-only";
import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";

export async function runZoroAgent(
  robinOutput: string,
  businessAnalysis?: string
): Promise<AgentWorkflowResult> {
  const structuredContext = businessAnalysis
    ? `

Structured Architecture Context (V29 Domain Knowledge + V30 Business Architecture — follow before writing code):
${businessAnalysis}
`
    : "";

  const prompt = `
You are Zoro.
Act as a senior backend developer specializing in ASP.NET Core.

${buildMetaInstructions()}

Using Robin's Business Analysis and the V30 architecture plan, produce a Backend Plan aligned to the selected architecture type, layers, and project structure.

Robin Output:
${robinOutput}
${structuredContext}

Identify and document:
- REST APIs (method, path, purpose) aligned to parsed modules and entities
- database tables and key fields for each parsed entity (no generic Handle/Core/Manage/System tables)
- backend services and responsibilities

Return structured Markdown with:

# Backend Overview
# API Endpoints
# Database Schema
# Services
# Technology Stack
# Implementation Notes

Include concrete endpoint and table definitions tied to the detected domain entities.
`;

  return runGeminiWorkflow(prompt);
}
