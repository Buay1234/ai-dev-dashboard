"use client";

import { motion } from "framer-motion";
import {
  AGENT_THEME_STYLES,
  type AgentConfig,
} from "@/lib/agents/config";
import type { AgentStatus } from "@/lib/types/agent-results";
import SpriteAnimator from "./company/SpriteAnimator";
import {
  mapAgentStatusToSprite,
  type SpriteAnimState,
} from "./company/sprite-anim-state";

export type CharacterMode = "idle" | "walking" | "working";

type Props = {
  agent: AgentConfig;
  status: AgentStatus | string;
  mode?: CharacterMode;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  priority?: boolean;
  latestMessage?: string;
};

const SIZE_MAP = {
  sm: { px: 36, icon: "text-xs", label: "text-[10px]", badge: "size-4 text-[8px]" },
  md: { px: 48, icon: "text-sm", label: "text-xs", badge: "size-5 text-[10px]" },
  lg: { px: 64, icon: "text-base", label: "text-sm", badge: "size-5 text-[10px]" },
  xl: { px: 80, icon: "text-base", label: "text-sm", badge: "size-6 text-xs" },
};

function resolveSpriteState(
  status: AgentStatus | string,
  mode?: CharacterMode
): SpriteAnimState {
  if (mode === "walking") return "walking";
  if (mode === "working") return "working";
  return mapAgentStatusToSprite(status);
}

export default function AgentCharacter({
  agent,
  status,
  mode,
  size = "md",
  showLabel = false,
  latestMessage,
}: Props) {
  const theme = AGENT_THEME_STYLES[agent.theme];
  const sizes = SIZE_MAP[size];
  const spriteState = resolveSpriteState(status, mode);
  const isWalking = spriteState === "walking";
  const isWorking = spriteState === "working";
  const isIdle = spriteState === "idle";
  const isCompleted = spriteState === "celebrate";
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
    <div className="relative flex flex-col items-center gap-1">
      {latestMessage && (
        <div className="absolute -top-10 left-1/2 z-20 max-w-[140px] -translate-x-1/2 whitespace-normal rounded-lg border border-cyan-500/40 bg-black/80 px-2 py-1 text-center text-[10px] leading-tight text-white">
          {latestMessage}
        </div>
      )}
      <motion.div
        className="relative shrink-0 overflow-hidden rounded-lg border-2"
        style={{
          width: sizes.px,
          height: sizes.px,
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
        animate={{ y: 0, scale: 1 }}
      >
        <div className="flex size-full items-end justify-center">
          <SpriteAnimator
            agentName={agent.name}
            state={spriteState}
            width={sizes.px}
            maxHeight={sizes.px}
            alt={`${agent.name} — ${agent.role}`}
          />
        </div>

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
