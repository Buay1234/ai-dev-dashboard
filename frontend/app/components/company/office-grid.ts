import type { MapAnchor } from "./office-map-config";
import type { SpriteAnimState } from "./sprite-anim-state";
import { getSpriteFallbackPath } from "./sprite-anim-state";

export type WalkDirection = "up" | "down" | "left" | "right";

/** @deprecated use SpriteAnimState from sprite-anim-state.ts */
export type PixelPose = SpriteAnimState;

export const STEP_MS = 180;

const PATH_STEP = 2;

export function anchorsEqual(a: MapAnchor, b: MapAnchor) {
  return a.x === b.x && a.y === b.y;
}

/** Manhattan path in map-percent space — cell-by-cell steps */
export function buildAnchorPath(from: MapAnchor, to: MapAnchor): MapAnchor[] {
  if (anchorsEqual(from, to)) return [from];

  const path: MapAnchor[] = [{ ...from }];
  let cur = { ...from };

  while (!anchorsEqual(cur, to)) {
    if (cur.x < to.x) {
      cur = { x: Math.min(cur.x + PATH_STEP, to.x), y: cur.y };
    } else if (cur.x > to.x) {
      cur = { x: Math.max(cur.x - PATH_STEP, to.x), y: cur.y };
    } else if (cur.y < to.y) {
      cur = { x: cur.x, y: Math.min(cur.y + PATH_STEP, to.y) };
    } else if (cur.y > to.y) {
      cur = { x: cur.x, y: Math.max(cur.y - PATH_STEP, to.y) };
    }
    path.push({ ...cur });
  }

  return path;
}

export function directionBetween(
  from: MapAnchor,
  to: MapAnchor
): WalkDirection {
  if (to.x > from.x) return "right";
  if (to.x < from.x) return "left";
  if (to.y > from.y) return "down";
  return "up";
}

export function getPixelSpriteFallbacks(
  agentName: string,
  state: SpriteAnimState,
  direction?: WalkDirection
): string[] {
  const key = agentName.toLowerCase();
  const paths: string[] = [];

  if (state === "walking" && direction) {
    paths.push(`/agents/${key}/${key}_walk_${direction}.png`);
  }
  paths.push(getSpriteFallbackPath(agentName, state));
  paths.push(getSpriteFallbackPath(agentName, "idle"));

  return [...new Set(paths)];
}

export type GridIntent = import("./office-map-config").MapIntent;

export {
  resolveAgentMapIntent as resolveAgentGridIntent,
  AGENT_HOME,
  MEETING_SLOTS,
  ROOM_ANCHORS,
} from "./office-map-config";

export type { MapAnchor as GridCoord } from "./office-map-config";

export const buildGridPath = buildAnchorPath;
export const coordsEqual = anchorsEqual;

export function anchorToFloorAnchor(anchor: MapAnchor) {
  return anchor;
}

/** Legacy alias */
export const cellToFloorAnchor = anchorToFloorAnchor;
