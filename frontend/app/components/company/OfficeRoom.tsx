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
      style={{
        borderColor: styles.borderColor,
        boxShadow: statusRgb
          ? `0 0 20px ${statusRgb}44`
          : isActive
            ? `0 0 18px ${styles.glowRgb}40`
            : undefined,
      }}
      whileHover={{
        scale: 1.015,
        y: -2,
        borderColor: styles.hoverBorder,
        transition: { type: "tween", duration: 0.25 },
      }}
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

      <div className="relative z-10 flex items-end gap-3 p-4 min-h-[88px]">
        <div className="relative shrink-0 pb-0.5">
          <AgentCharacter
            name={agentName}
            role={agentRole}
            status={status}
            isActive={isActive}
            theme={theme}
            size="md"
          />
          <span
            className={`absolute top-0 -right-1 flex size-5 items-center justify-center rounded-sm border border-white/10 text-[10px] shadow-md ${styles.iconBg}`}
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
