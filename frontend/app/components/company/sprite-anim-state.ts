import type { AgentStatus } from "@/lib/types/agent-results";

/** Sprite sheet animation states — aligned with mission pipeline */
export type SpriteAnimState = "idle" | "walking" | "working" | "celebrate";

export type ArrivedSpriteState = Exclude<SpriteAnimState, "walking">;

/** Legacy PNG filename suffix per animation state */
export const SPRITE_FALLBACK_POSE: Record<SpriteAnimState, string> = {
  idle: "idle",
  walking: "walk",
  working: "working",
  celebrate: "wave",
};

export function mapAgentStatusToSprite(
  status: AgentStatus | string,
  isWalking = false
): SpriteAnimState {
  if (isWalking) return "walking";
  switch (status) {
    case "Working":
      return "working";
    case "Completed":
      return "celebrate";
    case "Idle":
    case "Error":
    default:
      return "idle";
  }
}

export function resolveMapSpriteState(
  isWalking: boolean,
  arrivedState: ArrivedSpriteState
): SpriteAnimState {
  return isWalking ? "walking" : arrivedState;
}

export function getSpriteFallbackPath(
  agentName: string,
  state: SpriteAnimState
): string {
  const key = agentName.toLowerCase();
  const pose = SPRITE_FALLBACK_POSE[state];
  return `/agents/${key}/${key}_${pose}.png`;
}
