/** Native PNG dimensions (e.g. franky_walk.png = 301 × 496) */
export const SPRITE_NATIVE = { width: 301, height: 496 } as const;

export const SPRITE_ASPECT =
  SPRITE_NATIVE.width / SPRITE_NATIVE.height;

/** Size box from a target height — preserves aspect ratio */
export function spriteBoxFromHeight(height: number) {
  return {
    height,
    width: Math.round(height * SPRITE_ASPECT),
  };
}

/** Pixel map agents — V12.1 placement (48×72 max, aspect preserved) */
export const PIXEL_AGENT = {
  width: 48,
  maxHeight: 72,
} as const;

/** @deprecated use PIXEL_AGENT for pixel simulation */
export const MAP_SPRITE = {
  width: PIXEL_AGENT.width,
  height: PIXEL_AGENT.maxHeight,
};

/** Room card icons — small strategy-game unit portraits */
export const CARD_SPRITE = {
  sm: spriteBoxFromHeight(56),
  md: spriteBoxFromHeight(72),
} as const;

export const SPRITE_IMAGE_CLASS =
  "max-h-full max-w-full object-contain object-bottom pointer-events-none select-none";
