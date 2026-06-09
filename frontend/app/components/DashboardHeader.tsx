"use client";

import { motion } from "framer-motion";
import Badge from "./ui/Badge";
import {
  getMissionStatusLabel,
  getSuccessRate,
} from "@/lib/agents";

type Props = {
  loading: boolean;
  currentAgent: string;
  projectCount: number;
  successCount: number;
};

export default function DashboardHeader({
  loading,
  currentAgent,
  projectCount,
  successCount,
}: Props) {
  const missionStatus = getMissionStatusLabel(loading, currentAgent);
  const successRate = getSuccessRate(projectCount, successCount);

  const stats = [
    {
      label: "Mission Status",
      value: missionStatus,
      variant: loading
        ? ("working" as const)
        : currentAgent === "Completed"
          ? ("completed" as const)
          : ("idle" as const),
    },
    {
      label: "Current Agent",
      value: currentAgent === "Idle" ? "—" : currentAgent,
      variant: "default" as const,
    },
    {
      label: "Projects",
      value: String(projectCount),
      variant: "default" as const,
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      variant: successRate >= 80 ? ("completed" as const) : ("default" as const),
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface-0/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-accent-muted border border-accent/40 text-base sm:text-lg shadow-[0_0_20px_rgba(139,92,246,0.25)]"
            animate={{ boxShadow: ["0 0 12px rgba(139,92,246,0.2)", "0 0 24px rgba(139,92,246,0.4)", "0 0 12px rgba(139,92,246,0.2)"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          >
            ⚡
          </motion.div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-text-primary">
              AI Development Crew
            </h1>
            <p className="text-[10px] sm:text-xs text-text-muted">
              AI Software House Simulator
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 rounded-lg border border-border-subtle bg-surface-2/60 px-2.5 py-1.5 sm:px-3 sm:py-2"
            >
              <span className="text-[10px] text-text-muted uppercase tracking-wider whitespace-nowrap">
                {stat.label}
              </span>
              <Badge variant={stat.variant} pulse={stat.label === "Mission Status" && loading}>
                {stat.value}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    </header>
  );
}
