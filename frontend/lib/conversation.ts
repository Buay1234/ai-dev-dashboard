import type { AgentMessage } from "@/app/types/conversation";

export type { AgentMessage };

export function createAgentMessage(
  agent: string,
  message: string
): AgentMessage {
  return {
    agent,
    message,
    timestamp: new Date().toLocaleTimeString(),
  };
}

/** Latest message per agent — for speech bubbles */
export function indexLatestMessages(
  messages: AgentMessage[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const msg of messages) {
    map[msg.agent] = msg.message;
  }
  return map;
}

export function getLatestAgentMessage(
  messages: AgentMessage[],
  agent: string
): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].agent === agent) return messages[i].message;
  }
  return undefined;
}

/**
 * Future Gemini integration — swap body for live AI dialogue without refactoring UI.
 * @example
 * const text = await generateAgentDialogue("Robin", { phase: "analysis", requirement });
 * addMessage("Robin", text);
 */
export async function generateAgentDialogue(
  _agent: string,
  _context: Record<string, unknown>
): Promise<string> {
  // const aiResponse = await gemini.generateContent(prompt);
  // return aiResponse.text ?? "";
  return "";
}
