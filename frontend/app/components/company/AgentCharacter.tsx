"use client";

import Image from "next/image";
import { memo } from "react";
import {
  motion,
  type TargetAndTransition,
  type Transition,
} from "framer-motion";
import type { AgentStatus } from "@/lib/types/agent-results";
import { CHARACTER_STATUS_GLOW, type CharacterStatus } from "./theme";
import type { OfficeRoomTheme } from "./theme";
import { THEME_STYLES } from "./theme";
import {
  CARD_SPRITE,
  SPRITE_IMAGE_CLASS,
  SPRITE_NATIVE,
} from "./sprite-layout";

type Props = {
  name: string;
  image: string;
  role: string;
  status?: AgentStatus | string;
  isActive?: boolean;
  theme?: OfficeRoomTheme;
  size?: "sm" | "md";
};

const SPRITE = {
  sm: CARD_SPRITE.sm,
  md: CARD_SPRITE.md,
} as const;

const TWEEN_LOOP = (duration: number): Transition => ({
  type: "tween",
  duration,
  repeat: Infinity,
  ease: "easeInOut",
});

type SpriteAnim = {
  body: TargetAndTransition;
  bodyTransition: Transition | Record<string, Transition>;
  shadow: TargetAndTransition;
  shadowTransition: Transition;
  glowDuration: number;
};

const SPRITE_ANIM: Record<CharacterStatus, SpriteAnim> = {
  Idle: {
    body: {
      y: [0, -8, 0],
      scale: [1, 1.05, 1],
      rotate: [-3, 3, -3],
    },
    bodyTransition: {
      y: TWEEN_LOOP(2.8),
      scale: TWEEN_LOOP(2.2),
      rotate: TWEEN_LOOP(3.4),
    },
    shadow: {
      scaleX: [1, 0.68, 1],
      scaleY: [1, 0.85, 1],
      opacity: [0.45, 0.22, 0.45],
    },
    shadowTransition: TWEEN_LOOP(2.8),
    glowDuration: 2.4,
  },
  Working: {
    body: {
      y: [0, -10, 2, -10, 0],
      x: [0, 5, 0, -5, 0],
      rotate: [-8, 8, -8],
      scaleY: [1, 0.92, 1.06, 0.92, 1],
      scaleX: [1, 1.04, 1, 1.04, 1],
    },
    bodyTransition: {
      y: TWEEN_LOOP(0.36),
      x: TWEEN_LOOP(0.36),
      rotate: TWEEN_LOOP(0.4),
      scaleY: TWEEN_LOOP(0.36),
      scaleX: TWEEN_LOOP(0.36),
    },
    shadow: {
      scaleX: [1, 0.55, 0.9, 0.55, 1],
      opacity: [0.5, 0.3, 0.45, 0.3, 0.5],
    },
    shadowTransition: TWEEN_LOOP(0.36),
    glowDuration: 0.5,
  },
  Completed: {
    body: {
      y: [0, -10, 0, -4, 0],
      scale: [1, 1.05, 1, 1.03, 1],
      rotate: [0, 4, 0, -4, 0],
    },
    bodyTransition: {
      y: { type: "tween", duration: 1.4, repeat: Infinity, ease: "easeOut" },
      scale: TWEEN_LOOP(2.6),
      rotate: TWEEN_LOOP(3),
    },
    shadow: {
      scaleX: [1, 0.7, 1, 0.8, 1],
      opacity: [0.4, 0.25, 0.4, 0.3, 0.4],
    },
    shadowTransition: TWEEN_LOOP(1.4),
    glowDuration: 1.5,
  },
  Error: {
    body: {
      x: [0, -7, 7, -7, 7, 0],
      rotate: [0, -3, 3, -3, 3, 0],
      y: [0, -2, 0],
    },
    bodyTransition: {
      x: TWEEN_LOOP(0.32),
      rotate: TWEEN_LOOP(0.32),
      y: TWEEN_LOOP(0.32),
    },
    shadow: {
      scaleX: [1, 1.15, 1, 1.15, 1],
      opacity: [0.4, 0.55, 0.4],
    },
    shadowTransition: TWEEN_LOOP(0.32),
    glowDuration: 0.45,
  },
};

function resolveStatus(status: string): CharacterStatus {
  if (status in CHARACTER_STATUS_GLOW) {
    return status as CharacterStatus;
  }
  return "Idle";
}

function AgentCharacter({
  name,
  image,
  role,
  status = "Idle",
  isActive = false,
  theme = "purple",
  size = "md",
}: Props) {
  const resolved = resolveStatus(status);
  const glow = CHARACTER_STATUS_GLOW[resolved];
  const themeStyle = THEME_STYLES[theme];
  const anim = SPRITE_ANIM[resolved];
  const dims = SPRITE[size];
  const isWorking = resolved === "Working";

  return (
    <div
      className="relative flex flex-col items-center shrink-0"
      style={{ width: dims.width }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: dims.width, height: dims.height }}
      >
        <motion.div
          className="pointer-events-none absolute -inset-1 rounded-md opacity-60"
          style={{
            background: `radial-gradient(ellipse at bottom, ${glow.ring}, transparent 70%)`,
          }}
          animate={{ opacity: isWorking ? [0.35, 0.7, 0.35] : [0.2, 0.45, 0.2] }}
          transition={TWEEN_LOOP(anim.glowDuration)}
          aria-hidden
        />

        <motion.div
          className="absolute inset-0 flex items-center justify-center will-change-transform"
          style={{ transformOrigin: "center center" }}
          animate={anim.body}
          transition={anim.bodyTransition}
        >
          <div
            className="relative flex size-full items-center justify-center rounded-md border-2 bg-transparent"
            style={{
              borderColor: isActive ? themeStyle.borderColor : "rgba(255,255,255,0.12)",
              boxShadow: isActive
                ? `0 0 12px ${themeStyle.glowRgb}33`
                : undefined,
            }}
          >
            <Image
              src={image}
              alt={`${name} — ${role}`}
              width={SPRITE_NATIVE.width}
              height={SPRITE_NATIVE.height}
              className={SPRITE_IMAGE_CLASS}
              style={{ width: "100%", height: "100%" }}
              draggable={false}
            />
            {isWorking && (
              <motion.div
                className="absolute bottom-0 left-1/2 flex gap-0.5 -translate-x-1/2"
                animate={{ opacity: [0, 0.8, 0], y: [0, 2, 0] }}
                transition={TWEEN_LOOP(0.36)}
                aria-hidden
              >
                <span className="text-[8px]">💨</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {resolved === "Completed" && (
          <motion.span
            className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-sm bg-emerald-500 text-[9px] font-bold text-white z-10 border border-emerald-300/50"
            animate={{ y: [0, -3, 0], scale: [1, 1.1, 1] }}
            transition={TWEEN_LOOP(1.2)}
            aria-label="Completed"
          >
            ✓
          </motion.span>
        )}

        {resolved === "Error" && (
          <motion.span
            className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-sm bg-red-500 text-[9px] font-bold text-white z-10"
            animate={{ x: [0, -2, 2, 0] }}
            transition={TWEEN_LOOP(0.32)}
            aria-label="Error"
          >
            !
          </motion.span>
        )}
      </div>

      {/* Platform ledge — character stands on this */}
      <div
        className="relative mt-0.5 w-full rounded-sm border border-t"
        style={{
          height: 4,
          borderColor: `${themeStyle.glowRgb}44`,
          background: `linear-gradient(to bottom, ${themeStyle.glowRgb}30, ${themeStyle.glowRgb}08)`,
        }}
        aria-hidden
      />

      {/* Ground shadow — shrinks when sprite floats up */}
      <motion.div
        className="rounded-full bg-black/60 blur-[3px] -mt-0.5"
        style={{ width: dims.width * 0.72, height: 6 }}
        animate={anim.shadow}
        transition={anim.shadowTransition}
        aria-hidden
      />
    </div>
  );
}

export default memo(AgentCharacter);
