export type AgentWorkflowResult = {
  /** Main deliverable (report / plan) */
  result: string;
  /** Bullet points for Thinking Panel */
  thoughts: string[];
  /** One-line summary for speech bubble */
  summary: string;
  /** Reasoning paragraph for Activity Log */
  reasoning: string;
};

export const GEMINI_MODEL = "gemini-2.5-flash";
