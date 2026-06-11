"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import OfficeRoom, { type OfficeRoomTheme } from "./OfficeRoom";
import OfficeBackground from "./OfficeBackground";
import ReceptionDesk from "./ReceptionDesk";
import OfficeLights from "./OfficeLights";
import { isMissionActive } from "@/lib/agents";
import type { AgentStatusProps } from "@/lib/types/agent-results";

const FLOOR_ROOMS = [
  {
    key: "Robin",
    title: "Robin Office",
    icon: "🧠",
    role: "Business Analyst",
    image: "/agents/robin.png",
    theme: "purple" as OfficeRoomTheme,
    statusKey: "robinStatus" as const,
  },
  {
    key: "Zoro",
    title: "Zoro Backend Lab",
    icon: "⚔️",
    role: "Backend Developer",
    image: "/agents/zoro.png",
    theme: "green" as OfficeRoomTheme,
    statusKey: "zoroStatus" as const,
  },
  {
    key: "Nami",
    title: "Nami Frontend Studio",
    icon: "🧭",
    role: "Frontend Developer",
    image: "/agents/nami.png",
    theme: "orange" as OfficeRoomTheme,
    statusKey: "namiStatus" as const,
  },
  {
    key: "Franky",
    title: "Franky Architecture Room",
    icon: "🔨",
    role: "Full Stack Architect",
    image: "/agents/franky.png",
    theme: "blue" as OfficeRoomTheme,
    statusKey: "frankyStatus" as const,
  },
  {
    key: "Usopp",
    title: "Usopp QA Center",
    icon: "🔫",
    role: "QA Tester",
    image: "/agents/usopp.png",
    theme: "yellow" as OfficeRoomTheme,
    statusKey: "usoppStatus" as const,
  },
] as const;

const CONNECTOR = 36;
const RECEPTION_H = 68;
const ROOM_H = 76;

export type CompanyFloorProps = AgentStatusProps & {
  progress?: number;
  loading?: boolean;
};

function CompanyFloor({
  currentAgent,
  robinStatus,
  zoroStatus,
  namiStatus,
  frankyStatus,
  usoppStatus,
}: CompanyFloorProps) {
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

  const lights = useMemo(
    () => [
      {
        key: "reception",
        top: RECEPTION_H / 2,
        status: atReception ? "Idle" : "Completed",
        active: atReception,
      },
      ...FLOOR_ROOMS.map((room, i) => ({
        key: room.key,
        top:
          RECEPTION_H +
          CONNECTOR +
          i * (ROOM_H + CONNECTOR) +
          ROOM_H / 2,
        status: statusByKey[room.statusKey],
        active:
          currentAgent === room.key ||
          statusByKey[room.statusKey] === "Working",
      })),
    ],
    [statusByKey, currentAgent, atReception]
  );

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-cyan-500/20 shadow-[0_0_48px_rgba(6,182,212,0.06)]"
      aria-label="AI office floor"
    >
      <OfficeBackground />
      <OfficeLights lights={lights} />

      <div className="relative z-10 p-4 sm:p-6 pl-8 sm:pl-10">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400/80">
              Visual AI Office · V9
            </p>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
              Animated Characters
            </h2>
          </div>
          <motion.span
            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-300"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live Agents
          </motion.span>
        </header>

        <div className="flex flex-col">
          <ReceptionDesk
            isActive={atReception}
            missionActive={missionActive && atReception}
          />

          <motion.div
            className="flex justify-center py-2 text-cyan-500/25 font-mono text-sm"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            aria-hidden
          >
            │
          </motion.div>

          {FLOOR_ROOMS.map((room, index) => {
            const status = statusByKey[room.statusKey];
            const isActive =
              currentAgent === room.key || status === "Working";

            return (
              <div key={room.key}>
                <OfficeRoom
                  icon={room.icon}
                  title={room.title}
                  agentName={room.key}
                  agentRole={room.role}
                  agentImage={room.image}
                  status={status}
                  theme={room.theme}
                  isActive={isActive}
                />
                {index < FLOOR_ROOMS.length - 1 && (
                  <motion.div
                    className="flex justify-center py-2 text-violet-500/30 font-mono text-sm"
                    animate={
                      status === "Completed"
                        ? { opacity: [0.3, 0.8, 0.3], y: [0, 2, 0] }
                        : { opacity: 0.2 }
                    }
                    transition={{ duration: 1.5, repeat: Infinity }}
                    aria-hidden
                  >
                    │
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default memo(CompanyFloor);
