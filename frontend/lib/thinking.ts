import type { AgentThought } from "@/app/types/thinking";
import { AGENT_NAMES } from "@/lib/agents";

export type { AgentThought };

export const CREW_AGENTS = [...AGENT_NAMES] as const;

export const STANDBY_THOUGHTS: AgentThought[] = [
  {
    agent: "Robin",
    status: "Standby",
    task: "Awaiting mission brief",
    thoughts: ["Ready to analyze requirements"],
    progress: 0,
  },
  {
    agent: "Zoro",
    status: "Standby",
    task: "Awaiting analysis report",
    thoughts: ["Standing by for backend work"],
    progress: 0,
  },
  {
    agent: "Nami",
    status: "Standby",
    task: "Awaiting API contract",
    thoughts: ["Standing by for UI build"],
    progress: 0,
  },
  {
    agent: "Franky",
    status: "Standby",
    task: "Awaiting deliverables",
    thoughts: ["Standing by for architecture review"],
    progress: 0,
  },
  {
    agent: "Usopp",
    status: "Standby",
    task: "Awaiting build artifacts",
    thoughts: ["Standing by for QA cycle"],
    progress: 0,
  },
];

export function createAgentThought(
  agent: string,
  status: string,
  thoughts: string[],
  task?: string,
  progress?: number
): AgentThought {
  return {
    agent,
    status,
    thoughts,
    task: task ?? thoughts[0],
    progress,
  };
}

export function upsertThought(
  list: AgentThought[],
  entry: AgentThought
): AgentThought[] {
  const rest = list.filter((t) => t.agent !== entry.agent);
  return [...rest, entry];
}

/** Merge crew thoughts with optional System row for meeting */
export function sortThoughts(list: AgentThought[]): AgentThought[] {
  const order = [...CREW_AGENTS, "System"];
  return [...list].sort(
    (a, b) => order.indexOf(a.agent as (typeof order)[number]) - order.indexOf(b.agent as (typeof order)[number])
  );
}

export function resolveAgentStageProgress(
  agent: string,
  missionProgress: number
): number {
  const stages: Record<string, [number, number]> = {
    Robin: [0, 20],
    Zoro: [20, 40],
    Nami: [40, 60],
    Franky: [60, 80],
    Usopp: [80, 100],
    System: [100, 100],
  };
  const [min, max] = stages[agent] ?? [0, 0];
  if (missionProgress >= max) return max;
  if (missionProgress <= min) return min;
  return missionProgress;
}

export function thoughtSummariesByAgent(
  list: AgentThought[]
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of list) {
    if (entry.task) {
      out[entry.agent] = entry.task;
    }
  }
  return out;
}

/**
 * @deprecated Use agent API workflow — thoughts come from Gemini via useMission.
 */
export async function generateAgentThoughts(
  _agent: string,
  _context: Record<string, unknown>
): Promise<string[]> {
  // const aiThought = await gemini.generateContent(prompt);
  // return parseThoughtLines(aiThought.text);
  return [];
}
