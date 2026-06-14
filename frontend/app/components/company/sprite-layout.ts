/** Native PNG dimensions (e.g. franky_walk.png = 301 × 496) */
export const SPRITE_NATIVE = { width: 301, height: 496 } as const;

export const SPRITE_ASPECT =
  SPRITE_NATIVE.width / SPRITE_NATIVE.height;

export function spriteBox(displayWidth: number) {
  return {
    width: displayWidth,
    height: Math.round(displayWidth / SPRITE_ASPECT),
  };
}

/** Map overlay walkers — tall enough for head-to-toe, fits room grid cell */
export const MAP_SPRITE = spriteBox(62);

/** Room card / roster sprites */
export const CARD_SPRITE = {
  sm: spriteBox(44),
  md: spriteBox(56),
} as const;

export const SPRITE_IMAGE_CLASS =
  "max-h-full max-w-full object-contain object-center pointer-events-none select-none";
