"use client";

import { motion } from "framer-motion";

type Props = {
  currentAgent: string;
  robinStatus: string;
  zoroStatus: string;
  namiStatus: string;
  frankyStatus: string;
  usoppStatus: string;
};

const AGENTS = ["Robin", "Zoro", "Nami", "Franky", "Usopp"];
const STATION_STEP = 56;

function getActiveIndex(currentAgent: string): number {
  if (currentAgent === "Completed") {
    return AGENTS.length - 1;
  }

  const index = AGENTS.indexOf(currentAgent);
  return index >= 0 ? index : 0;
}

export default function MissionTimeline({
  currentAgent,
  robinStatus,
  zoroStatus,
  namiStatus,
  frankyStatus,
  usoppStatus,
}: Props) {
  const statuses: Record<string, string> = {
    Robin: robinStatus,
    Zoro: zoroStatus,
    Nami: namiStatus,
    Franky: frankyStatus,
    Usopp: usoppStatus,
  };

  const activeIndex = getActiveIndex(currentAgent);

  const getAgentClasses = (name: string) => {
    const status = statuses[name];

    if (status === "Completed") {
      return "text-green-400 font-semibold";
    }

    if (name === currentAgent || status === "Working") {
      return "text-yellow-400 font-semibold animate-pulse";
    }

    return "text-gray-500";
  };

  return (
    <div className="mt-4 bg-slate-800 p-4 rounded-lg">
      <h2 className="font-bold mb-3 text-slate-200">Mission Timeline</h2>
      <div className="flex items-start gap-3">
        <div
          className="relative w-8 shrink-0"
          style={{ height: AGENTS.length * STATION_STEP }}
        >
          <motion.span
            className="absolute left-0 top-0 text-2xl leading-none"
            animate={{ y: activeIndex * STATION_STEP }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            aria-hidden
          >
            🤖
          </motion.span>
        </div>

        <div className="flex flex-col flex-1">
          {AGENTS.map((name, index) => (
            <div
              key={name}
              className="flex flex-col items-center justify-start"
              style={{ height: STATION_STEP }}
            >
              <span className={getAgentClasses(name)}>{name}</span>
              {index < AGENTS.length - 1 && (
                <span className="text-slate-500 mt-1">↓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
