export interface AgentThought {
  agent: string;
  status: string;
  thoughts: string[];
  /** Current focus task — shown as headline under agent name */
  task?: string;
  /** 0–100 progress for this agent's pipeline stage */
  progress?: number;
}
