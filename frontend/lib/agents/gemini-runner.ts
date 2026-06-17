import { gemini } from "@/lib/gemini";
import { getErrorMessage } from "@/lib/get-error-message";
import { buildMetaInstructions, parseAgentResponse } from "./parse-response";
import type { AgentWorkflowResult } from "./types";
import { GEMINI_MODEL } from "./types";

export async function runGeminiWorkflow(
  prompt: string
): Promise<AgentWorkflowResult> {
  try {
    const response = await gemini.models.generateContent({
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
