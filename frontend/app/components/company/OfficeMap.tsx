"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import OfficeBackground from "./OfficeBackground";
import PixelWorld from "./PixelWorld";
import OfficeViewportControls from "./OfficeViewportControls";
import { isMissionActive } from "@/lib/agents/config";
import type { AgentStatusProps } from "@/lib/types/agent-results";
import { getMissionStage } from "./office-map-config";

export type OfficeMapProps = AgentStatusProps & {
  progress?: number;
  loading?: boolean;
  latestMessages?: Record<string, string>;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

function OfficeMap({
  currentAgent,
  robinStatus,
  zoroStatus,
  namiStatus,
  frankyStatus,
  usoppStatus,
  latestMessages = {},
  zoom = 1,
  onZoomChange,
  isFullscreen = false,
  onToggleFullscreen,
}: OfficeMapProps) {
  const statuses = useMemo(
    () => ({
      Robin: robinStatus,
      Zoro: zoroStatus,
      Nami: namiStatus,
      Franky: frankyStatus,
      Usopp: usoppStatus,
    }),
    [robinStatus, zoroStatus, namiStatus, frankyStatus, usoppStatus]
  );

  const missionActive = isMissionActive(statuses, currentAgent);
  const currentStage = getMissionStage(currentAgent);
  const missionComplete = currentAgent === "Completed";

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-cyan-500/20 shadow-[0_0_48px_rgba(6,182,212,0.06)] ${
        isFullscreen ? "h-full flex flex-col" : ""
      }`}
      aria-label="AI office floor map"
    >
      <OfficeBackground />

      <div className={`relative z-10 p-4 sm:p-5 ${isFullscreen ? "flex flex-1 flex-col min-h-0" : ""}`}>
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400/80">
              Visual AI Office · V24
            </p>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
              Focus Layout · Live Simulation
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {onZoomChange && onToggleFullscreen && (
              <OfficeViewportControls
                zoom={zoom}
                onZoomChange={onZoomChange}
                isFullscreen={isFullscreen}
                onToggleFullscreen={onToggleFullscreen}
              />
            )}
            <motion.span
            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-300"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {missionComplete
              ? "Meeting Room"
              : missionActive
                ? `Pipeline · ${currentStage}`
                : "Crew on standby"}
            </motion.span>
          </div>
        </header>

        <PixelWorld
          currentAgent={currentAgent}
          statuses={statuses}
          latestMessages={latestMessages}
          zoom={zoom}
          isFullscreen={isFullscreen}
        />

        <p className="mt-4 text-center text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          Reception → Robin → Zoro → Nami → Franky → Usopp → Meeting Room
        </p>
      </div>
    </section>
  );
}

export default memo(OfficeMap);
