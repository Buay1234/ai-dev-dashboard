"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { AGENT_THEME_STYLES, type AgentConfig } from "@/lib/agents/config";
import type { AgentStatus } from "@/lib/types/agent-results";

const STATUS_LABEL: Record<string, string> = {
  Idle: "Standby",
  Working: "Working",
  Completed: "Done",
  Error: "Failed",
};

const STATUS_COLOR: Record<string, string> = {
  Idle: "rgba(255,255,255,0.5)",
  Working: "#fde047",
  Completed: "#86efac",
  Error: "#fca5a5",
};

type Props = {
  agent: AgentConfig;
  status: AgentStatus | string;
  isActive: boolean;
};

function RoomStatusIndicator({ agent, status, isActive }: Props) {
  const theme = AGENT_THEME_STYLES[agent.theme];
  const label = STATUS_LABEL[status] ?? status;
  const color = STATUS_COLOR[status] ?? theme.text;

  return (
    <motion.div
      className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap shadow-lg"
      style={{
        borderColor: isActive ? theme.border : "rgba(255,255,255,0.1)",
        backgroundColor: "rgba(9,9,11,0.92)",
        color,
      }}
      initial={{ opacity: 0, y: 4 }}
      animate={{
        opacity: 1,
        y: isActive && status === "Working" ? [0, -2, 0] : 0,
        boxShadow: isActive
          ? [`0 0 8px ${theme.glow}`, `0 0 16px ${theme.glow}`, `0 0 8px ${theme.glow}`]
          : "0 0 0 transparent",
      }}
      transition={
        isActive && status === "Working"
          ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.35 }
      }
    >
      <span aria-hidden>{agent.icon}</span>
      <span>{label}</span>
    </motion.div>
  );
}

export default memo(RoomStatusIndicator);
