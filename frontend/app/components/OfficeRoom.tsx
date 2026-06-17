"use client";

import { motion } from "framer-motion";
import AgentCharacter from "./AgentCharacter";
import Badge, { statusToBadgeVariant } from "./ui/Badge";
import {
  AGENT_THEME_STYLES,
  type AgentConfig,
} from "@/lib/agents/config";
import type { AgentStatus } from "@/lib/types/agent-results";

const STATUS_GLOW = {
  Working: {
    border: "rgba(234, 179, 8, 0.5)",
    bg: "rgba(234, 179, 8, 0.1)",
    glow: "rgba(234, 179, 8, 0.45)",
    ring: "rgba(234, 179, 8, 0.35)",
  },
  Completed: {
    border: "rgba(34, 197, 94, 0.5)",
    bg: "rgba(34, 197, 94, 0.1)",
    glow: "rgba(34, 197, 94, 0.45)",
    ring: "rgba(34, 197, 94, 0.35)",
  },
  Error: {
    border: "rgba(239, 68, 68, 0.5)",
    bg: "rgba(239, 68, 68, 0.1)",
    glow: "rgba(239, 68, 68, 0.45)",
    ring: "rgba(239, 68, 68, 0.35)",
  },
} as const;

type Props = {
  agent: AgentConfig;
  status: AgentStatus | string;
  isActive: boolean;
  showConnector?: boolean;
  height: number;
};

export default function OfficeRoom({
  agent,
  status,
  isActive,
  showConnector = true,
  height,
}: Props) {
  const theme = AGENT_THEME_STYLES[agent.theme];
  const isWorking = status === "Working";
  const isCompleted = status === "Completed";
  const isError = status === "Error";
  const hasOccupant = isWorking || isCompleted || isError;

  const statusStyle =
    isWorking
      ? STATUS_GLOW.Working
      : isCompleted
        ? STATUS_GLOW.Completed
        : isError
          ? STATUS_GLOW.Error
          : null;

  const roomBorder = statusStyle?.border ?? "rgba(255, 255, 255, 0.06)";
  const roomBg = statusStyle?.bg ?? "rgba(255, 255, 255, 0.02)";
  const glowColor = statusStyle?.glow ?? theme.glow;

  return (
    <div className="relative">
      {(isActive || statusStyle) && (
        <motion.div
          className="absolute -inset-1 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)`,
          }}
          animate={{
            opacity: [0.35, 0.8, 0.35],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      )}

      <motion.div
        className="relative flex items-center gap-3 rounded-xl border px-3 sm:px-4 overflow-hidden"
        style={{ height, borderColor: roomBorder, backgroundColor: roomBg }}
        animate={
          isWorking
            ? {
                boxShadow: [
                  `0 0 12px 2px ${STATUS_GLOW.Working.glow}`,
                  `0 0 28px 8px ${STATUS_GLOW.Working.glow}`,
                  `0 0 12px 2px ${STATUS_GLOW.Working.glow}`,
                ],
              }
            : isCompleted
              ? { boxShadow: `0 0 16px 4px ${STATUS_GLOW.Completed.glow}` }
              : isError
                ? {
                    boxShadow: [
                      `0 0 12px 2px ${STATUS_GLOW.Error.glow}`,
                      `0 0 20px 6px ${STATUS_GLOW.Error.glow}`,
                      `0 0 12px 2px ${STATUS_GLOW.Error.glow}`,
                    ],
                  }
                : isActive
                  ? {
                      boxShadow: [
                        `0 0 12px 2px ${theme.glow}`,
                        `0 0 24px 6px ${theme.glow}`,
                        `0 0 12px 2px ${theme.glow}`,
                      ],
                    }
                  : { boxShadow: "0 0 0 0 transparent" }
        }
        transition={
          isWorking || isError
            ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.35 }
        }
      >
        {isWorking && (
          <motion.div
            className="absolute inset-0 opacity-25"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(234,179,8,0.6), transparent)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            aria-hidden
          />
        )}

        <div className="relative z-10 flex items-center gap-2 sm:gap-3 w-full min-w-0">
          {hasOccupant ? (
            <AgentCharacter agent={agent} status={status} size="sm" />
          ) : (
            <div
              className="flex size-9 items-center justify-center rounded-full border border-dashed border-border-default bg-surface-2/50 text-lg shrink-0"
              aria-hidden
            >
              {agent.icon}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3
              className="text-xs sm:text-sm font-semibold truncate"
              style={{ color: isActive ? theme.text : undefined }}
            >
              {agent.officeTitle}
            </h3>
            <p className="text-[10px] sm:text-xs text-text-muted truncate">
              {agent.role}
            </p>
          </div>

          <Badge variant={statusToBadgeVariant(status)} pulse={isWorking}>
            {isCompleted ? "✓ Done" : status}
          </Badge>
        </div>
      </motion.div>

      {showConnector && (
        <div className="flex justify-center py-1.5" aria-hidden>
          <motion.span
            className="text-accent/40 text-lg leading-none font-light"
            animate={
              isCompleted
                ? { opacity: [0.3, 0.9, 0.3], y: [0, 2, 0] }
                : { opacity: [0.15, 0.35, 0.15] }
            }
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            |
          </motion.span>
        </div>
      )}
    </div>
  );
}
