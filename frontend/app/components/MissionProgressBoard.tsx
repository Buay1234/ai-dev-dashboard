"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { AGENT_CONFIG } from "@/lib/agents";

type Props = {
  progress: number;
  currentAgent: string;
  loading: boolean;
  statuses: Record<string, string>;
};

function MissionProgressBoard({
  progress,
  currentAgent,
  loading,
  statuses,
}: Props) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1/90 backdrop-blur-sm p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            Mission Progress Board
          </p>
          <p className="text-sm font-bold text-text-primary mt-0.5">
            {loading
              ? `Active · ${currentAgent}`
              : currentAgent === "Completed"
                ? "Mission Complete"
                : "Awaiting Dispatch"}
          </p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums text-accent">
            {progress}
          </span>
          <span className="text-sm text-text-muted">%</span>
        </div>
      </div>

      <div className="relative h-2 rounded-full bg-surface-3 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent via-purple-400 to-accent"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        />
        {loading && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1">
        {AGENT_CONFIG.map((agent) => {
          const status = statuses[agent.name];
          const isDone = status === "Completed";
          const isActive = status === "Working";
          const isError = status === "Error";

          return (
            <div key={agent.name} className="text-center">
              <motion.div
                className="mx-auto size-2 rounded-full mb-1"
                animate={{
                  backgroundColor: isDone
                    ? "#22c55e"
                    : isError
                      ? "#ef4444"
                      : isActive
                        ? "#eab308"
                        : "rgba(255,255,255,0.15)",
                  scale: isActive ? [1, 1.3, 1] : 1,
                }}
                transition={
                  isActive
                    ? { duration: 1, repeat: Infinity }
                    : { duration: 0.3 }
                }
              />
              <span className="text-[9px] text-text-muted truncate block">
                {agent.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(MissionProgressBoard);
