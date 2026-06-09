"use client";

import MovingRobot from "./MovingRobot";
import {
  AGENT_NAMES,
  getActiveAgentIndex,
  toAgentStatusMap,
} from "@/lib/agents";
import type { AgentStatusProps } from "@/lib/types/agent-results";

const STATION_STEP = 56;

export default function MissionTimeline(props: AgentStatusProps) {
  const { currentAgent } = props;
  const statuses = toAgentStatusMap(props);
  const activeIndex = getActiveAgentIndex(currentAgent);

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
        <MovingRobot
          activeIndex={activeIndex}
          step={STATION_STEP}
          trackHeight={AGENT_NAMES.length * STATION_STEP}
        />

        <div className="flex flex-col flex-1">
          {AGENT_NAMES.map((name, index) => (
            <div
              key={name}
              className="flex flex-col items-center justify-start"
              style={{ height: STATION_STEP }}
            >
              <span className={getAgentClasses(name)}>{name}</span>
              {index < AGENT_NAMES.length - 1 && (
                <span className="text-slate-500 mt-1">↓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
