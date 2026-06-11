"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Badge from "../ui/Badge";

type Props = {
  isActive: boolean;
  missionActive: boolean;
};

function ReceptionDesk({ isActive, missionActive }: Props) {
  return (
    <motion.article
      className="relative overflow-hidden rounded-xl border border-violet-500/30 bg-[#0a0a12]/90 backdrop-blur-sm"
      animate={
        isActive
          ? {
              boxShadow: [
                "0 0 16px rgba(139,92,246,0.25)",
                "0 0 32px rgba(139,92,246,0.4)",
                "0 0 16px rgba(139,92,246,0.25)",
              ],
            }
          : { boxShadow: "0 0 0 transparent" }
      }
      transition={
        isActive
          ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.3 }
      }
      whileHover={{ scale: 1.01, borderColor: "rgba(139,92,246,0.5)" }}
    >
      <div className="relative z-10 flex items-center gap-3 p-4 min-h-[68px]">
        <motion.div
          className="flex size-11 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-xl"
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
          <h3 className="text-sm font-semibold text-violet-200 tracking-wide">
            Reception Desk
          </h3>
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-0.5">
            Mission briefing · Crew dispatch
          </p>
        </div>

        <Badge variant={missionActive ? "working" : "idle"}>
          {missionActive ? "Live" : "Standby"}
        </Badge>
      </div>
    </motion.article>
  );
}

export default memo(ReceptionDesk);
