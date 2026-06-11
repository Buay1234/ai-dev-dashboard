"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import OfficeBackground from "./OfficeBackground";
import MapRoomNode from "./MapRoomNode";
import MapConnections from "./MapConnections";
import WalkingAgent from "./WalkingAgent";
import { isMissionActive } from "@/lib/agents";
import type { AgentStatusProps } from "@/lib/types/agent-results";
import type { OfficeRoomTheme } from "./theme";
import {
  getMissionStage,
  getWalkingAgentConfig,
} from "./map-stages";

const MAP_ROOMS = [
  {
    key: "Robin",
    title: "Robin Office",
    image: "/agents/robin.png",
    role: "Business Analyst",
    theme: "purple" as OfficeRoomTheme,
    statusKey: "robinStatus" as const,
    gridClass: "col-start-1 row-start-2",
  },
  {
    key: "Zoro",
    title: "Zoro Backend Lab",
    image: "/agents/zoro.png",
    role: "Backend Developer",
    theme: "green" as OfficeRoomTheme,
    statusKey: "zoroStatus" as const,
    gridClass: "col-start-2 row-start-2",
  },
  {
    key: "Nami",
    title: "Nami Frontend Studio",
    image: "/agents/nami.png",
    role: "Frontend Developer",
    theme: "orange" as OfficeRoomTheme,
    statusKey: "namiStatus" as const,
    gridClass: "col-start-1 row-start-3",
  },
  {
    key: "Franky",
    title: "Franky Architecture Room",
    image: "/agents/franky.png",
    role: "Full Stack Architect",
    theme: "blue" as OfficeRoomTheme,
    statusKey: "frankyStatus" as const,
    gridClass: "col-start-2 row-start-3",
  },
  {
    key: "Usopp",
    title: "Usopp QA Center",
    image: "/agents/usopp.png",
    role: "QA Tester",
    theme: "yellow" as OfficeRoomTheme,
    statusKey: "usoppStatus" as const,
    gridClass: "col-span-2 row-start-4 max-w-md mx-auto w-full",
  },
] as const;

const PIPELINE_PATHS = [
  { id: "reception-robin", d: "M 50 13 L 25 24" },
  { id: "robin-zoro", d: "M 25 38 L 75 38" },
  { id: "zoro-nami", d: "M 75 46 L 25 54" },
  { id: "nami-franky", d: "M 25 66 L 75 66" },
  { id: "franky-usopp", d: "M 75 74 L 50 86" },
] as const;

export type OfficeMapProps = AgentStatusProps & {
  progress?: number;
  loading?: boolean;
};

function isPastIdle(status: string) {
  return status !== "Idle";
}

function OfficeMap({
  currentAgent,
  robinStatus,
  zoroStatus,
  namiStatus,
  frankyStatus,
  usoppStatus,
}: OfficeMapProps) {
  const statusByKey = {
    robinStatus,
    zoroStatus,
    namiStatus,
    frankyStatus,
    usoppStatus,
  };

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
  const atReception = currentAgent === "Idle" || !missionActive;
  const currentStage = getMissionStage(currentAgent);
  const walkingAgent = getWalkingAgentConfig(currentAgent);

  const walkingAgentStatus = useMemo(() => {
    if (currentAgent === "Completed") return usoppStatus;
    const room = MAP_ROOMS.find((r) => r.key === currentAgent);
    if (!room) return "Idle";
    return statusByKey[room.statusKey];
  }, [currentAgent, statusByKey, usoppStatus]);

  const receptionStatus = missionActive
    ? atReception
      ? "Working"
      : "Completed"
    : "Idle";

  const segments = useMemo(
    () => [
      {
        ...PIPELINE_PATHS[0],
        active: robinStatus === "Working",
        completed: isPastIdle(robinStatus),
      },
      {
        ...PIPELINE_PATHS[1],
        active: zoroStatus === "Working",
        completed: isPastIdle(zoroStatus),
      },
      {
        ...PIPELINE_PATHS[2],
        active: namiStatus === "Working",
        completed: isPastIdle(namiStatus),
      },
      {
        ...PIPELINE_PATHS[3],
        active: frankyStatus === "Working",
        completed: isPastIdle(frankyStatus),
      },
      {
        ...PIPELINE_PATHS[4],
        active: usoppStatus === "Working",
        completed: usoppStatus === "Completed",
      },
    ],
    [robinStatus, zoroStatus, namiStatus, frankyStatus, usoppStatus]
  );

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-cyan-500/20 shadow-[0_0_48px_rgba(6,182,212,0.06)]"
      aria-label="AI office floor map"
    >
      <OfficeBackground />

      <div className="relative z-10 p-4 sm:p-6">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400/80">
              Visual AI Office · V11
            </p>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
              Walking Agent Map
            </h2>
          </div>
          <motion.span
            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-300"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {walkingAgent ? `${walkingAgent.name} en route` : "Floor Plan"}
          </motion.span>
        </header>

        <div className="relative min-h-[460px] sm:min-h-[520px]">
          <MapConnections segments={segments} />

          <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 auto-rows-fr">
            <div className="col-span-2 row-start-1 max-w-lg mx-auto w-full">
              <MapRoomNode
                title="Reception Desk"
                status={receptionStatus}
                theme="purple"
                isActive={atReception && missionActive}
                subtitle="Mission briefing · Crew dispatch"
              />
            </div>

            {MAP_ROOMS.map((room) => {
              const status = statusByKey[room.statusKey];
              const isActive =
                currentAgent === room.key || status === "Working";
              const hideCharacter =
                walkingAgent !== null && currentStage === room.key;

              return (
                <div key={room.key} className={room.gridClass}>
                  <MapRoomNode
                    title={room.title}
                    image={room.image}
                    agentName={room.key}
                    agentRole={room.role}
                    status={status}
                    theme={room.theme}
                    isActive={isActive}
                    hideCharacter={hideCharacter}
                  />
                </div>
              );
            })}
          </div>

          {walkingAgent && (
            <WalkingAgent
              currentStage={currentStage}
              currentAgent={currentAgent}
              agent={walkingAgent}
              status={walkingAgentStatus}
              isActive
            />
          )}
        </div>

        <p className="mt-4 text-center text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          Mission pipeline · Reception → Robin → Zoro → Nami → Franky → Usopp
        </p>
      </div>
    </section>
  );
}

export default memo(OfficeMap);
