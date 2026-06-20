import { AGENT_NAMES } from "@/lib/agents/config";
import type { AgentStatus } from "@/lib/types/agent-results";

export type MissionStage =
  | "Reception"
  | "Robin"
  | "Zoro"
  | "Sanji"
  | "Nami"
  | "Jinbe"
  | "Franky"
  | "Usopp";

export type SpritePose = "idle" | "walk" | "working" | "wave";

export type AgentVisualStatus = "idle" | "walking" | "working" | "completed";

/** Percentage coordinates within the office map canvas */
export const STAGE_POSITIONS: Record<MissionStage, { x: number; y: number }> = {
  Reception: { x: 50, y: 12 },
  Robin: { x: 25, y: 41 },
  Zoro: { x: 75, y: 41 },
  Sanji: { x: 50, y: 52 },
  Nami: { x: 25, y: 63 },
  Jinbe: { x: 50, y: 70 },
  Franky: { x: 75, y: 63 },
  Usopp: { x: 50, y: 86 },
};

export const MISSION_STAGE_ORDER: MissionStage[] = [
  "Reception",
  "Robin",
  "Zoro",
  "Sanji",
  "Nami",
  "Jinbe",
  "Franky",
  "Usopp",
];

export function getHomeStage(agentName: string): MissionStage {
  return agentName as MissionStage;
}

export function getPreviousStage(agentName: string): MissionStage {
  const index = AGENT_NAMES.indexOf(
    agentName as (typeof AGENT_NAMES)[number]
  );
  if (index <= 0) return "Reception";
  return MISSION_STAGE_ORDER[index];
}

export function getAgentSpritePath(agentName: string, pose: SpritePose): string {
  const key = agentName.toLowerCase();
  return `/agents/${key}/${key}_${pose}.png`;
}

export function poseFromVisualStatus(
  visualStatus: AgentVisualStatus,
  isMoving: boolean
): SpritePose {
  if (isMoving || visualStatus === "walking") return "walk";
  if (visualStatus === "working") return "working";
  if (visualStatus === "completed") return "wave";
  return "idle";
}

export function getAgentVisualStatus(
  agentName: string,
  agentStatus: AgentStatus | string,
  currentAgent: string
): AgentVisualStatus {
  if (agentStatus === "Completed") return "completed";
  if (currentAgent === agentName && agentStatus === "Working") {
    return "walking";
  }
  if (agentStatus === "Working") return "working";
  return "idle";
}

export function getMissionStage(currentAgent: string): MissionStage {
  if (currentAgent === "Idle") return "Reception";
  if (currentAgent === "Completed") return "Usopp";
  if (MISSION_STAGE_ORDER.includes(currentAgent as MissionStage)) {
    return currentAgent as MissionStage;
  }
  return "Reception";
}
