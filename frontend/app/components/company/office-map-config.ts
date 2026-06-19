import { AGENT_NAMES } from "@/lib/agents/config";
import type { AgentStatus } from "@/lib/types/agent-results";

/** Percentage-based floor anchor (0–100) on office-map.png */
export type MapAnchor = { x: number; y: number };

export type MapZone =
  | "Reception"
  | "Robin"
  | "Zoro"
  | "Nami"
  | "Franky"
  | "Usopp"
  | "Meeting";

export const OFFICE_MAP_IMAGE = "/office/office-map.png";

/** Native pixel dimensions of office-map.png — used for aspect ratio (file is JPEG despite .png extension) */
export const OFFICE_MAP_SIZE = { width: 1536, height: 857 } as const;

export const MISSION_PIPELINE: MapZone[] = [
  "Reception",
  "Robin",
  "Zoro",
  "Nami",
  "Franky",
  "Usopp",
];

/** Character feet anchor per room — tuned to office-map.png floor tiles */
export const ROOM_ANCHORS: Record<MapZone, MapAnchor> = {
  Meeting: { x: 16, y: 24 },
  Reception: { x: 52, y: 19 },
  Robin: { x: 84, y: 23 },
  Franky: { x: 16, y: 49 },
  Zoro: { x: 84, y: 49 },
  Usopp: { x: 16, y: 77 },
  Nami: { x: 84, y: 77 },
};

/** Group meeting slots inside Meeting Room */
export const MEETING_SLOTS: MapAnchor[] = [
  { x: 10, y: 26 },
  { x: 14, y: 30 },
  { x: 18, y: 26 },
  { x: 12, y: 22 },
  { x: 20, y: 28 },
];

export const AGENT_HOME: Record<(typeof AGENT_NAMES)[number], MapAnchor> = {
  Robin: ROOM_ANCHORS.Robin,
  Zoro: ROOM_ANCHORS.Zoro,
  Nami: ROOM_ANCHORS.Nami,
  Franky: ROOM_ANCHORS.Franky,
  Usopp: ROOM_ANCHORS.Usopp,
};

export const ROOM_LABELS: { zone: MapZone; title: string }[] = [
  { zone: "Meeting", title: "Meeting Room" },
  { zone: "Reception", title: "Reception Desk" },
  { zone: "Robin", title: "Robin Office" },
  { zone: "Zoro", title: "Zoro Backend Lab" },
  { zone: "Nami", title: "Nami Frontend Studio" },
  { zone: "Franky", title: "Franky Architecture Room" },
  { zone: "Usopp", title: "Usopp Build Verification Center" },
];

export function anchorToFloorStyle(anchor: MapAnchor) {
  return {
    left: `${anchor.x}%`,
    top: `${anchor.y}%`,
  };
}

export function anchorsEqual(a: MapAnchor, b: MapAnchor) {
  return a.x === b.x && a.y === b.y;
}

export function getPipelinePreviousZone(agentName: string): MapZone {
  const index = AGENT_NAMES.indexOf(
    agentName as (typeof AGENT_NAMES)[number]
  );
  if (index <= 0) return "Reception";
  return MISSION_PIPELINE[index];
}

import type { ArrivedSpriteState } from "./sprite-anim-state";

export type MapIntent = {
  targetAnchor: MapAnchor;
  pathOrigin: MapAnchor | null;
  arrivedPose: ArrivedSpriteState;
};

export function resolveAgentMapIntent(
  agentName: (typeof AGENT_NAMES)[number],
  agentStatus: AgentStatus | string,
  currentAgent: string,
  meetingSlotIndex: number
): MapIntent {
  const home = AGENT_HOME[agentName];
  const missionDone = currentAgent === "Completed";

  if (missionDone && agentStatus === "Completed") {
    return {
      targetAnchor: MEETING_SLOTS[meetingSlotIndex] ?? ROOM_ANCHORS.Meeting,
      pathOrigin: null,
      arrivedPose: "celebrate",
    };
  }

  if (agentStatus === "Completed") {
    return { targetAnchor: home, pathOrigin: null, arrivedPose: "celebrate" };
  }

  if (currentAgent === agentName && agentStatus === "Working") {
    return {
      targetAnchor: home,
      pathOrigin: ROOM_ANCHORS[getPipelinePreviousZone(agentName)],
      arrivedPose: "working",
    };
  }

  return { targetAnchor: home, pathOrigin: null, arrivedPose: "idle" };
}

export function getMissionStage(currentAgent: string): MapZone | "Idle" {
  if (currentAgent === "Idle") return "Idle";
  if (currentAgent === "Completed") return "Meeting";
  if (currentAgent in ROOM_ANCHORS || MISSION_PIPELINE.includes(currentAgent as MapZone)) {
    return currentAgent as MapZone;
  }
  return "Idle";
}
