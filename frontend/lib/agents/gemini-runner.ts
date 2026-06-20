import "server-only";
import { getGeminiClient } from "@/lib/gemini";
import { getGeminiApiKey } from "@/lib/gemini-env";
import { getErrorMessage } from "@/lib/get-error-message";
import { buildMetaInstructions, parseAgentResponse } from "./parse-response";
import type { AgentWorkflowResult } from "./types";
import { GEMINI_MODEL } from "./types";

export async function runGeminiWorkflow(
  prompt: string
): Promise<AgentWorkflowResult> {
  try {
    getGeminiApiKey();
    const response = await getGeminiClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const text = response.text ?? "";
    const parsed = parseAgentResponse(text);

    return parsed;
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

export { buildMetaInstructions, parseAgentResponse, GEMINI_MODEL };
