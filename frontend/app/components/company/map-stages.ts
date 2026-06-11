import { AGENT_CONFIG } from "@/lib/agents";
import type { AgentConfig } from "@/lib/agents";

export type MissionStage =
  | "Reception"
  | "Robin"
  | "Zoro"
  | "Nami"
  | "Franky"
  | "Usopp";

/** Percentage coordinates within the office map canvas (matches 2D floor layout) */
export const STAGE_POSITIONS: Record<MissionStage, { x: number; y: number }> = {
  Reception: { x: 50, y: 14 },
  Robin: { x: 25, y: 36 },
  Zoro: { x: 75, y: 36 },
  Nami: { x: 25, y: 58 },
  Franky: { x: 75, y: 58 },
  Usopp: { x: 50, y: 82 },
};

const STAGE_SET = new Set<string>(Object.keys(STAGE_POSITIONS));

export function getMissionStage(currentAgent: string): MissionStage {
  if (currentAgent === "Idle") return "Reception";
  if (currentAgent === "Completed") return "Usopp";
  if (STAGE_SET.has(currentAgent)) {
    return currentAgent as MissionStage;
  }
  return "Reception";
}

export function getWalkingAgentConfig(currentAgent: string): AgentConfig | null {
  if (currentAgent === "Idle") return null;
  if (currentAgent === "Completed") {
    return AGENT_CONFIG.find((a) => a.name === "Usopp") ?? null;
  }
  return AGENT_CONFIG.find((a) => a.name === currentAgent) ?? null;
}
