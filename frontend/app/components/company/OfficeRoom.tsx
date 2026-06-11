"use client";

import Badge, { statusToBadgeVariant } from "../ui/Badge";
import type { AgentStatus } from "@/lib/types/agent-results";

export type OfficeRoomTheme = "purple" | "green" | "orange" | "blue" | "yellow";

const THEME_STYLES: Record<
  OfficeRoomTheme,
  { border: string; glow: string; iconBg: string; accent: string }
> = {
  purple: {
    border: "border-violet-500/40",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.25)]",
    iconBg: "bg-violet-500/15 text-violet-300",
    accent: "text-violet-300",
  },
  green: {
    border: "border-emerald-500/40",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    iconBg: "bg-emerald-500/15 text-emerald-300",
    accent: "text-emerald-300",
  },
  orange: {
    border: "border-orange-500/40",
    glow: "shadow-[0_0_20px_rgba(249,115,22,0.2)]",
    iconBg: "bg-orange-500/15 text-orange-300",
    accent: "text-orange-300",
  },
  blue: {
    border: "border-cyan-500/40",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.2)]",
    iconBg: "bg-cyan-500/15 text-cyan-300",
    accent: "text-cyan-300",
  },
  yellow: {
    border: "border-amber-500/40",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    iconBg: "bg-amber-500/15 text-amber-300",
    accent: "text-amber-300",
  },
};

const STATUS_GLOW: Record<string, string> = {
  Working: "shadow-[0_0_24px_rgba(234,179,8,0.35)] border-yellow-500/50",
  Completed: "shadow-[0_0_24px_rgba(34,197,94,0.35)] border-emerald-500/50",
  Error: "shadow-[0_0_24px_rgba(239,68,68,0.35)] border-red-500/50",
};

export type OfficeRoomProps = {
  icon: string;
  title: string;
  status: AgentStatus | string;
  theme?: OfficeRoomTheme;
  isActive?: boolean;
};

export default function OfficeRoom({
  icon,
  title,
  status,
  theme = "purple",
  isActive = false,
}: OfficeRoomProps) {
  const styles = THEME_STYLES[theme];
  const isWorking = status === "Working";
  const statusGlow = STATUS_GLOW[status] ?? "";

  return (
    <article
      className={`
        relative overflow-hidden rounded-xl border bg-[#0a0a0f]/90
        backdrop-blur-sm transition-all duration-300
        ${styles.border}
        ${isActive || status !== "Idle" ? styles.glow : ""}
        ${statusGlow}
      `}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
        aria-hidden
      />

      {isWorking && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent"
          aria-hidden
        />
      )}

      <div className="relative z-10 flex items-center gap-3 p-4 min-h-[72px]">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/5 text-xl ${styles.iconBg}`}
          aria-hidden
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className={`text-sm font-semibold tracking-wide truncate ${isActive ? styles.accent : "text-zinc-100"}`}
          >
            {title}
          </h3>
          <p className="mt-0.5 text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
            Dept. Node
          </p>
        </div>

        <Badge variant={statusToBadgeVariant(status)} pulse={isWorking}>
          {status}
        </Badge>
      </div>
    </article>
  );
}
