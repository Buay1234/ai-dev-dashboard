"use client";

import Image from "next/image";
import { memo } from "react";
import { motion } from "framer-motion";
import type { AgentStatus } from "@/lib/types/agent-results";
import { CHARACTER_STATUS_GLOW, type CharacterStatus } from "./theme";

type Props = {
  name: string;
  image: string;
  role: string;
  status?: AgentStatus | string;
  isActive?: boolean;
  size?: "sm" | "md";
};

const SIZE_PX = { sm: 36, md: 48 } as const;
const SIZE_CLASS = { sm: "size-9", md: "size-12" } as const;

const IDLE_FLOAT = { y: [0, -8, 0] };
const IDLE_BREATH = { scale: [1, 1.03, 1] };
const IDLE_DURATION = 2;

const STATUS_MOTION: Record<
  CharacterStatus,
  {
    float: { y: number[] };
    breath: { scale: number[] };
    floatDuration: number;
    breathDuration: number;
    glowDuration: number;
  }
> = {
  Idle: {
    float: IDLE_FLOAT,
    breath: IDLE_BREATH,
    floatDuration: IDLE_DURATION,
    breathDuration: IDLE_DURATION,
    glowDuration: IDLE_DURATION,
  },
  Working: {
    float: { y: [0, -10, 0] },
    breath: { scale: [1, 1.05, 1] },
    floatDuration: 1,
    breathDuration: 1.2,
    glowDuration: 1,
  },
  Completed: {
    float: IDLE_FLOAT,
    breath: IDLE_BREATH,
    floatDuration: IDLE_DURATION,
    breathDuration: IDLE_DURATION,
    glowDuration: 1.6,
  },
  Error: {
    float: { y: [0, -6, 0] },
    breath: { scale: [1, 1.02, 1] },
    floatDuration: 0.8,
    breathDuration: 0.8,
    glowDuration: 0.7,
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
  size = "md",
}: Props) {
  const resolved = resolveStatus(status);
  const glow = CHARACTER_STATUS_GLOW[resolved];
  const anim = STATUS_MOTION[resolved];
  const px = SIZE_PX[size];

  return (
    <motion.div
      className="relative shrink-0 will-change-transform"
      animate={anim.float}
      transition={{
        duration: anim.floatDuration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      whileHover={{ scale: 1.06 }}
    >
      <motion.div
        className={`relative ${SIZE_CLASS[size]} rounded-full`}
        animate={anim.breath}
        transition={{
          duration: anim.breathDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="absolute -inset-1 rounded-full pointer-events-none"
          style={{ border: `2px solid ${glow.ring}` }}
          animate={{
            opacity: [0.4, 1, 0.4],
            boxShadow: glow.pulse,
          }}
          transition={{
            duration: anim.glowDuration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden
        />

        {isActive && (
          <motion.div
            className="absolute -inset-2 rounded-full pointer-events-none border border-white/10"
            animate={{ opacity: [0, 0.45, 0], scale: [0.92, 1.12, 0.92] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        )}

        <div
          className={`relative ${SIZE_CLASS[size]} overflow-hidden rounded-full border-2 border-white/15 bg-[#0a0a0f]`}
        >
          <Image
            src={image}
            alt={`${name} — ${role}`}
            width={px}
            height={px}
            className="size-full object-cover object-top"
            draggable={false}
          />
        </div>

        {resolved === "Working" && (
          <motion.span
            className="absolute -bottom-0.5 -right-0.5 text-[10px]"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            aria-hidden
          >
            ⚙️
          </motion.span>
        )}

        {resolved === "Completed" && (
          <motion.span
            className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            aria-label="Completed"
          >
            ✓
          </motion.span>
        )}

        {resolved === "Error" && (
          <motion.span
            className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
            aria-label="Error"
          >
            ✕
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
}

export default memo(AgentCharacter);
