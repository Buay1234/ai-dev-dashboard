import type { AgentStatusProps } from "@/lib/types/agent-results";

export const AGENT_NAMES = [
  "Robin",
  "Zoro",
  "Nami",
  "Franky",
  "Usopp",
] as const;

export function getActiveAgentIndex(currentAgent: string): number {
  if (currentAgent === "Completed") {
    return AGENT_NAMES.length - 1;
  }

  const index = AGENT_NAMES.indexOf(
    currentAgent as (typeof AGENT_NAMES)[number]
  );

  return index >= 0 ? index : 0;
}

export function toAgentStatusMap(
  props: AgentStatusProps
): Record<string, string> {
  return {
    Robin: props.robinStatus,
    Zoro: props.zoroStatus,
    Nami: props.namiStatus,
    Franky: props.frankyStatus,
    Usopp: props.usoppStatus,
  };
}
