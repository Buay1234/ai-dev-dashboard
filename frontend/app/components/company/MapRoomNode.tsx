"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Badge, { statusToBadgeVariant } from "../ui/Badge";
import AgentCharacter from "./AgentCharacter";
import type { AgentStatus } from "@/lib/types/agent-results";
import { STATUS_NODE_STYLES, type OfficeRoomTheme } from "./theme";
import { THEME_STYLES } from "./theme";

export type MapRoomNodeProps = {
  title: string;
  image?: string;
  agentName?: string;
  agentRole?: string;
  status: AgentStatus | string;
  theme?: OfficeRoomTheme;
  isActive?: boolean;
  subtitle?: string;
  hideCharacter?: boolean;
};

function MapRoomNode({
  title,
  image,
  agentName,
  agentRole,
  status,
  theme = "purple",
  isActive = false,
  subtitle,
  hideCharacter = false,
}: MapRoomNodeProps) {
  const nodeStyle = STATUS_NODE_STYLES[status] ?? STATUS_NODE_STYLES.Idle;
  const themeStyle = THEME_STYLES[theme];
  const isWorking = status === "Working";
  const hasCharacter = Boolean(image && agentName && agentRole);

  return (
    <motion.article
      data-map-node
      className={`relative overflow-hidden rounded-xl border backdrop-blur-sm ${nodeStyle.card}`}
      style={{
        boxShadow: isActive
          ? `0 0 24px ${nodeStyle.glowRgb}55, inset 0 1px 0 rgba(255,255,255,0.06)`
          : `0 0 12px ${nodeStyle.glowRgb}22`,
      }}
      whileHover={{
        scale: 1.02,
        y: -2,
        transition: { type: "tween", duration: 0.2 },
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at top, ${nodeStyle.glowRgb}18, transparent 65%)`,
        }}
        animate={
          isWorking
            ? { opacity: [0.4, 0.85, 0.4] }
            : { opacity: [0.25, 0.45, 0.25] }
        }
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
        aria-hidden
      />

      {isWorking && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent"
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          aria-hidden
        />
      )}

      <div className="relative z-10 flex items-center gap-3 p-3 sm:p-4 min-h-[112px]">
        <div className="relative flex shrink-0 items-center justify-center">
          {hasCharacter && !hideCharacter ? (
            <AgentCharacter
              name={agentName!}
              image={image!}
              role={agentRole!}
              status={status}
              isActive={isActive}
              theme={theme}
              size="md"
            />
          ) : hasCharacter && hideCharacter ? (
            <div
              className="flex flex-col items-center opacity-25"
              style={{ width: 56, height: 92 }}
              aria-hidden
            >
              <div className="size-full rounded-md border border-dashed border-zinc-600/40" />
            </div>
          ) : (
            <div
              className="flex size-14 items-center justify-center rounded-md border border-violet-500/30 bg-violet-500/10"
              aria-hidden
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-violet-300">
                HQ
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pb-1">
          <h3
            className={`text-sm font-semibold tracking-wide truncate ${isActive ? themeStyle.accent : "text-zinc-100"}`}
          >
            {title}
          </h3>
          <p className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500 truncate">
            {subtitle ?? (agentName && agentRole ? `${agentName} · ${agentRole}` : "")}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0 pb-1">
          <Badge variant={statusToBadgeVariant(status)} pulse={isWorking}>
            {status === "Completed"
              ? "✓ Done"
              : status === "Error"
                ? "✕ Error"
                : status}
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

export default memo(MapRoomNode);
