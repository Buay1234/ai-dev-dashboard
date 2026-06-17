"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { AGENT_CONFIG } from "@/lib/agents/config";
import { getRoomTopY, RECEPTION_Y, ROOM_HEIGHT } from "@/lib/office-layout";

type Props = {
  statuses: Record<string, string>;
  receptionActive: boolean;
  corridorWidth: number;
  roomsLeft: number;
};

function getLightColor(status: string, active: boolean): string {
  if (status === "Working") return "rgba(234, 179, 8, 0.9)";
  if (status === "Completed") return "rgba(34, 197, 94, 0.85)";
  if (status === "Error") return "rgba(239, 68, 68, 0.9)";
  if (active) return "rgba(139, 92, 246, 0.7)";
  return "rgba(255, 255, 255, 0.12)";
}

function OfficeLights({
  statuses,
  receptionActive,
  corridorWidth,
  roomsLeft,
}: Props) {
  const lightX = roomsLeft + corridorWidth + 8;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
      <motion.div
        className="absolute size-2 rounded-full"
        style={{ left: lightX, top: RECEPTION_Y + 8 }}
        animate={{
          backgroundColor: getLightColor("Idle", receptionActive),
          boxShadow: receptionActive
            ? "0 0 12px rgba(139,92,246,0.6)"
            : "0 0 4px rgba(255,255,255,0.1)",
        }}
        transition={{ duration: 0.4 }}
      />

      {AGENT_CONFIG.map((agent, index) => {
        const status = statuses[agent.name];
        const top = getRoomTopY(index) + 10;
        const lit =
          status === "Working" ||
          status === "Completed" ||
          status === "Error";

        return (
          <motion.div
            key={agent.name}
            className="absolute size-2 rounded-full"
            style={{ left: lightX, top }}
            animate={{
              backgroundColor: getLightColor(status, lit),
              boxShadow: lit
                ? [
                    `0 0 8px ${getLightColor(status, true)}`,
                    `0 0 18px ${getLightColor(status, true)}`,
                    `0 0 8px ${getLightColor(status, true)}`,
                  ]
                : "0 0 3px rgba(255,255,255,0.08)",
              opacity: lit ? [0.7, 1, 0.7] : 0.4,
            }}
            transition={
              lit
                ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.35 }
            }
          />
        );
      })}

      {AGENT_CONFIG.map((agent, index) => {
        const status = statuses[agent.name];
        if (status !== "Working") return null;
        const top = getRoomTopY(index);

        return (
          <motion.div
            key={`beam-${agent.name}`}
            className="absolute h-px opacity-30"
            style={{
              left: lightX + 4,
              top: top + 14,
              width: 48,
              background: "linear-gradient(90deg, rgba(234,179,8,0.5), transparent)",
            }}
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        );
      })}
    </div>
  );
}

export default memo(OfficeLights);
