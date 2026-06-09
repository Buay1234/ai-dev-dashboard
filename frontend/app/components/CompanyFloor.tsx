"use client";

import MovingRobot from "./MovingRobot";
import { getActiveAgentIndex, toAgentStatusMap } from "@/lib/agents";
import type { AgentStatusProps } from "@/lib/types/agent-results";

const ROOMS = [
  { agent: "Robin", title: "Robin Office", icon: "🧠" },
  { agent: "Zoro", title: "Zoro Backend Team", icon: "⚔️" },
  { agent: "Nami", title: "Nami Frontend Team", icon: "🧭" },
  { agent: "Franky", title: "Franky Architecture", icon: "🔨" },
  { agent: "Usopp", title: "Usopp QA Team", icon: "🔫" },
] as const;

const ROOM_HEIGHT = 80;
const ROOM_GAP = 16;
const STATION_STEP = ROOM_HEIGHT + ROOM_GAP;

export default function CompanyFloor(props: AgentStatusProps) {
  const { currentAgent } = props;
  const statuses = toAgentStatusMap(props);
  const activeIndex = getActiveAgentIndex(currentAgent);

  const getStatusClasses = (agent: string, status: string) => {
    if (status === "Completed") return "text-green-400";
    if (agent === currentAgent || status === "Working") {
      return "text-yellow-400 animate-pulse";
    }
    if (status === "Error") return "text-red-400";
    return "text-gray-400";
  };

  const getRoomClasses = (agent: string, status: string) => {
    const isCurrent = agent === currentAgent || status === "Working";

    if (isCurrent) {
      return "border-yellow-400 bg-slate-800 ring-2 ring-yellow-400/60 shadow-lg shadow-yellow-400/10";
    }

    if (status === "Completed") {
      return "border-green-500/50 bg-slate-800";
    }

    if (status === "Error") {
      return "border-red-500/50 bg-slate-800";
    }

    return "border-slate-600 bg-slate-800";
  };

  return (
    <div className="mt-6 bg-slate-900 border border-slate-700 rounded-xl p-4 md:p-6">
      <h2 className="font-bold text-lg md:text-xl mb-4 text-slate-100">
        AI Company Floor
      </h2>

      <div className="flex items-start gap-3 md:gap-4">
        <MovingRobot
          activeIndex={activeIndex}
          step={STATION_STEP}
          trackHeight={ROOMS.length * ROOM_HEIGHT + (ROOMS.length - 1) * ROOM_GAP}
          trackClassName="w-8 md:w-10 shrink-0"
          robotClassName="text-2xl md:text-3xl leading-none drop-shadow-lg"
        />

        <div className="grid grid-cols-1 gap-4 flex-1 min-w-0">
          {ROOMS.map((room) => {
            const status = statuses[room.agent];

            return (
              <div
                key={room.agent}
                className={`
                  border rounded-lg p-4 h-20 flex items-center
                  transition-all duration-300
                  ${getRoomClasses(room.agent, status)}
                `}
              >
                <div className="flex items-center gap-3 md:gap-4 w-full min-w-0">
                  <span className="text-2xl md:text-3xl shrink-0">
                    {room.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-100 truncate">
                      {room.title}
                    </h3>
                    <p
                      className={`text-sm mt-0.5 ${getStatusClasses(room.agent, status)}`}
                    >
                      Status: {status}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
