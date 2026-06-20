import "server-only";
import { buildMetaInstructions, runGeminiWorkflow } from "./gemini-runner";
import type { AgentWorkflowResult } from "./types";
import {
  runApiBindingGeneration,
  type ApiBindingGenerationResult,
} from "@/lib/api-binding-generator";
import type { EntityDefinition } from "@/lib/project-generator/types";

export type JinbeAgentResult = AgentWorkflowResult & {
  apiBindingGeneration: ApiBindingGenerationResult;
};

export async function runJinbeAgent(
  zoroOutput: string,
  namiOutput: string,
  options: {
    entities: EntityDefinition[];
    businessAnalysis?: string;
    baseUrl?: string;
    openapiJson?: string;
  }
): Promise<JinbeAgentResult> {
  const apiBindingGeneration = runApiBindingGeneration({
    entities: options.entities,
    baseUrl: options.baseUrl,
    openapiJson: options.openapiJson,
  });

  const structuredContext = options.businessAnalysis
    ? `

Structured Architecture Context:
${options.businessAnalysis}
`
    : "";

  const prompt = `
You are Jinbe.
Act as a senior API integration architect (V34 Frontend Backend Auto Binding).

${buildMetaInstructions()}

Using Zoro's backend plan, Nami's frontend plan, and the generated OpenAPI contract, write a concise API integration narrative.

Zoro Output:
${zoroOutput}

Nami Output:
${namiOutput}
${structuredContext}

OpenAPI: ${apiBindingGeneration.contract.title} · ${apiBindingGeneration.buildStatus.operationCount} CRUD operations
Build Status: ${apiBindingGeneration.buildStatus.passed ? "PASS" : "FAIL"}
Generated: types/ · services/ · hooks/

Document:
- Swagger/OpenAPI parsing strategy
- Type-safe service layer
- React Query data fetching patterns
- Form validation with Zod
- CRUD auto-binding map
- Health check integration

Return Markdown with:

# API Integration Overview
# Swagger Contract
# Generated Types & Services
# React Query Hooks
# Form & Validation Binding
# Health Check
# Handoff Notes
`;

  const workflow = await runGeminiWorkflow(prompt);

  return {
    ...workflow,
    apiBindingGeneration,
  };
}
