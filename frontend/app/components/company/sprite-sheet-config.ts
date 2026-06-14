import type { SpriteAnimState } from "./sprite-anim-state";

export type SheetFrame = { col: number; row: number };

export type SheetAnimation = {
  frames: SheetFrame[];
  /** Frames per second when animating */
  fps: number;
  loop: boolean;
};

export type GridSheetDef = {
  kind: "grid";
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  animations: Partial<Record<SpriteAnimState, SheetAnimation>>;
};

/** 4×3 RPG grid @ 64×64 px (256×192 sheet) — shared by all agents */
export const RPG_GRID_SHEET: GridSheetDef = {
  kind: "grid",
  frameWidth: 64,
  frameHeight: 64,
  columns: 4,
  rows: 3,
  animations: {
    idle: { frames: [{ col: 0, row: 0 }], fps: 1, loop: false },
    walking: {
      frames: [
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
        { col: 0, row: 1 },
      ],
      fps: 8,
      loop: true,
    },
    working: {
      frames: [
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
        { col: 0, row: 2 },
      ],
      fps: 6,
      loop: true,
    },
    celebrate: {
      frames: [
        { col: 1, row: 2 },
        { col: 2, row: 2 },
      ],
      fps: 4,
      loop: true,
    },
  },
};

export type AgentSheetDef = GridSheetDef;

export function getAgentSheetDef(_agentName: string): AgentSheetDef {
  return RPG_GRID_SHEET;
}

export function getSpriteSheetPath(agentName: string) {
  const key = agentName.toLowerCase();
  return `/agents/${key}/${key}_sheet.png`;
}

export function getSheetAnimation(
  agentName: string,
  state: SpriteAnimState
): SheetAnimation {
  const def = getAgentSheetDef(agentName);
  return (
    def.animations[state] ??
    def.animations.idle ?? {
      frames: [{ col: 0, row: 0 }],
      fps: 1,
      loop: false,
    }
  );
}

export function getSpriteSheetStyles(
  agentName: string,
  state: SpriteAnimState,
  display: { width: number; maxHeight: number },
  frame: SheetFrame = { col: 0, row: 0 }
) {
  const def = getAgentSheetDef(agentName);
  const frameW = def.frameWidth;
  const frameH = def.frameHeight;

  const scale = Math.min(display.width / frameW, display.maxHeight / frameH);
  const scaledFrameW = frameW * scale;
  const scaledFrameH = frameH * scale;
  const sheetW = def.columns * scaledFrameW;
  const sheetH = def.rows * scaledFrameH;

  return {
    width: scaledFrameW,
    height: scaledFrameH,
    backgroundImage: `url(${getSpriteSheetPath(agentName)})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${sheetW}px ${sheetH}px`,
    backgroundPosition: `${-frame.col * scaledFrameW}px ${-frame.row * scaledFrameH}px`,
    imageRendering: "pixelated" as const,
  };
}
