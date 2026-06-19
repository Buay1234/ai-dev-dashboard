"use client";

import Image from "next/image";
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { AGENT_NAMES } from "@/lib/agents/config";
import type { AgentStatus } from "@/lib/types/agent-results";
import PixelAgent from "./PixelAgent";
import {
  OFFICE_MAP_IMAGE,
  OFFICE_MAP_SIZE,
  resolveAgentMapIntent,
} from "./office-map-config";
import type { OfficeRoomTheme } from "./theme";

const AGENT_THEMES: Record<string, OfficeRoomTheme> = {
  Robin: "purple",
  Zoro: "green",
  Nami: "orange",
  Franky: "blue",
  Usopp: "yellow",
};

type Props = {
  currentAgent: string;
  statuses: Record<(typeof AGENT_NAMES)[number], AgentStatus | string>;
  latestMessages?: Record<string, string>;
  zoom?: number;
  isFullscreen?: boolean;
};

function PixelWorld({
  currentAgent,
  statuses,
  latestMessages = {},
  zoom = 1,
  isFullscreen = false,
}: Props) {
  const intents = useMemo(
    () =>
      AGENT_NAMES.map((name, index) => ({
        name,
        intent: resolveAgentMapIntent(
          name,
          statuses[name],
          currentAgent,
          index
        ),
      })),
    [currentAgent, statuses]
  );

  const missionComplete = currentAgent === "Completed";

  const mapHeight = isFullscreen
    ? "min-h-[calc(100vh-12rem)]"
    : "min-h-[680px] max-h-[780px]";

  return (
    <div
      className={`relative w-full overflow-auto rounded-xl ${isFullscreen ? "flex-1" : ""}`}
    >
      <div
        className="mx-auto origin-top transition-transform duration-300 ease-out"
        style={{
          transform: `scale(${zoom})`,
          width: `${100 / zoom}%`,
        }}
      >
        <div
          className={`relative w-full overflow-hidden rounded-lg border-2 border-cyan-500/35 shadow-[0_0_40px_rgba(6,182,212,0.15),inset_0_0_48px_rgba(0,0,0,0.45)] ${mapHeight}`}
          style={{
            aspectRatio: `${OFFICE_MAP_SIZE.width} / ${OFFICE_MAP_SIZE.height}`,
          }}
          aria-label="Pixel office simulation"
        >
          <Image
            src={OFFICE_MAP_IMAGE}
            alt="AI software house office floor plan"
            fill
            priority
            className="object-contain object-center select-none"
            style={{ imageRendering: "auto" }}
            sizes="(max-width: 768px) 100vw, 75vw"
            draggable={false}
          />

          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.35)_100%)]"
            aria-hidden
          />

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 3px)",
            }}
            aria-hidden
          />

          {missionComplete && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-3 z-30 text-center text-xs font-mono uppercase tracking-[0.2em] text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ★ Mission complete — crew meeting ★
            </motion.div>
          )}

          <div className="absolute inset-0 z-10">
            {intents.map(({ name, intent }) => (
              <PixelAgent
                key={name}
                agentName={name}
                intent={intent}
                isCurrent={currentAgent === name}
                theme={AGENT_THEMES[name]}
                latestMessage={latestMessages[name]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PixelWorld);
