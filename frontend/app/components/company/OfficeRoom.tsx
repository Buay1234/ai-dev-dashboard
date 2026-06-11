"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Badge, { statusToBadgeVariant } from "../ui/Badge";
import AgentCharacter from "./AgentCharacter";
import type { AgentStatus } from "@/lib/types/agent-results";
import {
  THEME_STYLES,
  STATUS_GLOW_RGB,
  type OfficeRoomTheme,
} from "./theme";

export type { OfficeRoomTheme };

export type OfficeRoomProps = {
  icon: string;
  title: string;
  agentName: string;
  agentRole: string;
  agentImage: string;
  status: AgentStatus | string;
  theme?: OfficeRoomTheme;
  isActive?: boolean;
};

function OfficeRoom({
  icon,
  title,
  agentName,
  agentRole,
  agentImage,
  status,
  theme = "purple",
  isActive = false,
}: OfficeRoomProps) {
  const styles = THEME_STYLES[theme];
  const isWorking = status === "Working";
  const isCompleted = status === "Completed";
  const isError = status === "Error";
  const statusRgb = STATUS_GLOW_RGB[status];

  return (
    <motion.article
      className="relative overflow-hidden rounded-xl border bg-[#0a0a0f]/90 backdrop-blur-sm"
      style={{ borderColor: styles.borderColor }}
      whileHover={{
        scale: 1.015,
        y: -2,
        borderColor: styles.hoverBorder,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      animate={
        statusRgb
          ? {
              boxShadow: [
                `0 0 12px ${statusRgb}40`,
                `0 0 28px ${statusRgb}55`,
                `0 0 12px ${statusRgb}40`,
              ],
            }
          : isActive
            ? {
                boxShadow: [
                  `0 0 12px ${styles.glowRgb}35`,
                  `0 0 24px ${styles.glowRgb}50`,
                  `0 0 12px ${styles.glowRgb}35`,
                ],
              }
            : { boxShadow: "0 0 0 transparent" }
      }
    >
      {statusRgb && (
        <motion.div
          className="pointer-events-none absolute -inset-1 rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at center, ${statusRgb}25, transparent 70%)`,
          }}
          animate={{ opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
        aria-hidden
      />

      {isWorking && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          aria-hidden
        />
      )}

      <div className="relative z-10 flex items-center gap-3 p-4 min-h-[76px]">
        <div className="relative">
          <AgentCharacter
            name={agentName}
            image={agentImage}
            role={agentRole}
            status={status}
            isActive={isActive}
            size="md"
          />
          <span
            className={`absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-white/10 text-[10px] ${styles.iconBg}`}
            aria-hidden
          >
            {icon}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className={`text-sm font-semibold tracking-wide truncate ${isActive ? styles.accent : "text-zinc-100"}`}
          >
            {title}
          </h3>
          <p className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            {agentName} · {agentRole}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge variant={statusToBadgeVariant(status)} pulse={isWorking}>
            {isCompleted ? "✓ Done" : isError ? "✕ Error" : status}
          </Badge>
          {isActive && (
            <motion.span
              className="text-[9px] font-mono uppercase tracking-wider text-yellow-400/90"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              ● Active
            </motion.span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default memo(OfficeRoom);
