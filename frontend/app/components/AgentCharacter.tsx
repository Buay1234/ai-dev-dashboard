"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  AGENT_THEME_STYLES,
  type AgentConfig,
} from "@/lib/agents";
import type { AgentStatus } from "@/lib/types/agent-results";

export type CharacterMode = "idle" | "walking" | "working";

type Props = {
  agent: AgentConfig;
  status: AgentStatus | string;
  mode?: CharacterMode;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  priority?: boolean;
};

const SIZE_MAP = {
  sm: {
    body: "size-9",
    px: 36,
    icon: "text-xs",
    label: "text-[10px]",
    badge: "size-4 text-[8px]",
  },
  md: {
    body: "size-12",
    px: 48,
    icon: "text-sm",
    label: "text-xs",
    badge: "size-5 text-[10px]",
  },
  lg: {
    body: "size-16",
    px: 64,
    icon: "text-base",
    label: "text-sm",
    badge: "size-5 text-[10px]",
  },
  xl: {
    body: "size-20",
    px: 80,
    icon: "text-base",
    label: "text-sm",
    badge: "size-6 text-xs",
  },
};

const WALK_TRANSITION = { duration: 0.85, ease: [0.4, 0, 0.2, 1] as const };

export default function AgentCharacter({
  agent,
  status,
  mode,
  size = "md",
  showLabel = false,
  priority = false,
}: Props) {
  const theme = AGENT_THEME_STYLES[agent.theme];
  const sizes = SIZE_MAP[size];
  const isWalking = mode === "walking";
  const isWorking =
    mode === "working" || (mode === undefined && status === "Working");
  const isIdle = mode === "idle" || (mode === undefined && status === "Idle");
  const isCompleted = status === "Completed";
  const isError = status === "Error";

  const glowColor = isCompleted
    ? "rgba(34, 197, 94, 0.6)"
    : isError
      ? "rgba(239, 68, 68, 0.6)"
      : theme.glow;

  const borderColor = isCompleted
    ? "rgba(34, 197, 94, 0.5)"
    : isError
      ? "rgba(239, 68, 68, 0.5)"
      : theme.border;

  const bgColor = isCompleted
    ? "rgba(34, 197, 94, 0.15)"
    : isError
      ? "rgba(239, 68, 68, 0.15)"
      : theme.bg;

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={`relative ${sizes.body} shrink-0 overflow-hidden rounded-full border-2`}
        style={{
          borderColor,
          backgroundColor: bgColor,
          boxShadow: isWorking
            ? `0 0 24px ${glowColor}, 0 0 48px ${glowColor}`
            : isCompleted
              ? `0 0 16px ${glowColor}`
              : isError
                ? `0 0 16px ${glowColor}`
                : `0 0 8px ${theme.glow}`,
        }}
        animate={
          isWalking
            ? {
                y: [0, -4, 0, -4, 0],
                rotate: [-3, 3, -3],
                scaleX: [1, 1.05, 1, 1.05, 1],
              }
            : isWorking
              ? { y: [0, -5, 0], scale: [1, 1.04, 1], rotate: 0, scaleX: 1 }
              : isIdle
                ? { y: [0, -4, 0], scale: 1, rotate: 0, scaleX: 1 }
                : isError
                  ? { x: [0, -4, 4, -4, 4, 0], y: 0, rotate: 0, scaleX: 1 }
                  : { y: 0, scale: 1, x: 0, rotate: 0, scaleX: 1 }
        }
        transition={
          isWalking
            ? { duration: 0.45, repeat: Infinity, ease: "easeInOut" }
            : isWorking
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : isIdle
                ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                : isError
                  ? { duration: 0.5, ease: "easeInOut" }
                  : WALK_TRANSITION
        }
      >
        <Image
          src={agent.image}
          alt={`${agent.name} — ${agent.role}`}
          width={sizes.px}
          height={sizes.px}
          priority={priority}
          className="size-full object-cover object-top"
          draggable={false}
        />

        <span
          className={`absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-surface-2 border border-border-default ${sizes.badge} ${sizes.icon}`}
          aria-hidden
        >
          {agent.icon}
        </span>

        {isWalking && (
          <motion.span
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] opacity-70"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 0.45, repeat: Infinity }}
            aria-hidden
          >
            👣
          </motion.span>
        )}

        {isWorking && (
          <motion.span
            className="absolute -bottom-0.5 -left-0.5 text-xs"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            aria-hidden
          >
            ⚙️
          </motion.span>
        )}

        {isCompleted && (
          <motion.span
            className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-success font-bold text-white ${sizes.badge}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            aria-label="Completed"
          >
            ✓
          </motion.span>
        )}

        {isError && (
          <motion.span
            className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-error font-bold text-white ${sizes.badge}`}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            aria-label="Failed"
          >
            ✕
          </motion.span>
        )}
      </motion.div>

      {showLabel && (
        <span
          className={`font-medium ${sizes.label}`}
          style={{
            color: isCompleted ? "#86efac" : isError ? "#fca5a5" : theme.text,
          }}
        >
          {agent.name}
        </span>
      )}
    </div>
  );
}
