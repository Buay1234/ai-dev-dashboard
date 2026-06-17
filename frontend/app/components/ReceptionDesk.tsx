"use client";

import { motion } from "framer-motion";
import Badge from "./ui/Badge";
import { RECEPTION_LABEL } from "@/lib/agents/config";

type Props = {
  isActive: boolean;
  missionActive: boolean;
  height: number;
};

export default function ReceptionDesk({
  isActive,
  missionActive,
  height,
}: Props) {
  return (
    <div className="relative">
      {isActive && (
        <motion.div
          className="absolute -inset-1 rounded-2xl pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(139,92,246,0.45), transparent 70%)",
          }}
          animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      )}

      <motion.div
        className="relative flex items-center gap-3 rounded-xl border px-4 overflow-hidden"
        style={{
          height,
          borderColor: isActive
            ? "rgba(139, 92, 246, 0.45)"
            : "rgba(255, 255, 255, 0.08)",
          backgroundColor: isActive
            ? "rgba(139, 92, 246, 0.1)"
            : "rgba(255, 255, 255, 0.03)",
        }}
        animate={
          isActive
            ? {
                boxShadow: [
                  "0 0 12px 2px rgba(139, 92, 246, 0.35)",
                  "0 0 28px 8px rgba(139, 92, 246, 0.25)",
                  "0 0 12px 2px rgba(139, 92, 246, 0.35)",
                ],
              }
            : { boxShadow: "0 0 0 0 transparent" }
        }
        transition={
          isActive
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.3 }
        }
      >
        <div className="relative z-10 flex items-center gap-3 w-full min-w-0">
          <motion.div
            className="flex size-10 items-center justify-center rounded-lg text-xl shrink-0 border border-accent/30 bg-accent-muted"
            animate={!missionActive ? { y: [0, -2, 0] } : { y: 0 }}
            transition={
              !missionActive
                ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
            }
            aria-hidden
          >
            🏢
          </motion.div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {RECEPTION_LABEL}
            </h3>
            <p className="text-xs text-text-muted truncate">
              Mission briefing & crew dispatch
            </p>
          </div>

          <Badge variant={missionActive ? "default" : "idle"}>
            {missionActive ? "Active" : "Standby"}
          </Badge>
        </div>
      </motion.div>

      <div className="flex justify-center py-1.5" aria-hidden>
        <motion.span
          className="text-text-muted/50 text-lg leading-none"
          animate={{ opacity: [0.2, 0.6, 0.2], y: [0, 2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </motion.span>
      </div>
    </div>
  );
}
