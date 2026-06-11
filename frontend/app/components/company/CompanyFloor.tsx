"use client";

import OfficeRoom, { type OfficeRoomTheme } from "./OfficeRoom";
import type { AgentStatusProps } from "@/lib/types/agent-results";

const FLOOR_ROOMS = [
  {
    key: "Robin",
    title: "Robin Office",
    icon: "🧠",
    theme: "purple" as OfficeRoomTheme,
    statusKey: "robinStatus" as const,
  },
  {
    key: "Zoro",
    title: "Zoro Backend Room",
    icon: "⚔️",
    theme: "green" as OfficeRoomTheme,
    statusKey: "zoroStatus" as const,
  },
  {
    key: "Nami",
    title: "Nami Frontend Room",
    icon: "🧭",
    theme: "orange" as OfficeRoomTheme,
    statusKey: "namiStatus" as const,
  },
  {
    key: "Franky",
    title: "Franky Architecture Lab",
    icon: "🔨",
    theme: "blue" as OfficeRoomTheme,
    statusKey: "frankyStatus" as const,
  },
  {
    key: "Usopp",
    title: "Usopp QA Center",
    icon: "🔫",
    theme: "yellow" as OfficeRoomTheme,
    statusKey: "usoppStatus" as const,
  },
] as const;

export default function CompanyFloor({
  currentAgent,
  robinStatus,
  zoroStatus,
  namiStatus,
  frankyStatus,
  usoppStatus,
}: AgentStatusProps) {
  const statusByKey = {
    robinStatus,
    zoroStatus,
    namiStatus,
    frankyStatus,
    usoppStatus,
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#050508] p-4 sm:p-6"
      aria-label="Company floor"
    >
      <div
        className="pointer-events-none absolute inset-0 office-floor-grid opacity-30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.08)_0%,_transparent_60%)]"
        aria-hidden
      />

      <header className="relative z-10 mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400/70">
            Floor Plan
          </p>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
            AI Software House
          </h2>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-300">
          <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Online
        </span>
      </header>

      <div className="relative z-10 flex flex-col gap-3">
        {FLOOR_ROOMS.map((room, index) => {
          const status = statusByKey[room.statusKey];
          const isActive =
            currentAgent === room.key || status === "Working";

          return (
            <div key={room.key} className="relative">
              <OfficeRoom
                icon={room.icon}
                title={room.title}
                status={status}
                theme={room.theme}
                isActive={isActive}
              />
              {index < FLOOR_ROOMS.length - 1 && (
                <div
                  className="flex justify-center py-1 text-cyan-500/30 font-mono text-xs"
                  aria-hidden
                >
                  │
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
