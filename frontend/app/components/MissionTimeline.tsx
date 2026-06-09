"use client";

import MovingRobot from "./MovingRobot";
import Card, { CardHeader } from "./ui/Card";
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
      return "text-success font-medium";
    }

    if (name === currentAgent || status === "Working") {
      return "text-warning font-medium";
    }

    return "text-text-muted";
  };

  const getDotClasses = (name: string) => {
    const status = statuses[name];

    if (status === "Completed") return "bg-success ring-success/30";
    if (name === currentAgent || status === "Working") {
      return "bg-warning ring-warning/30 animate-pulse";
    }
    return "bg-surface-elevated ring-border-default";
  };

  return (
    <Card padding="md">
      <CardHeader
        title="Workflow Timeline"
        description="Agent execution order and current position"
      />
      <div className="flex items-start gap-4">
        <MovingRobot
          activeIndex={activeIndex}
          step={STATION_STEP}
          trackHeight={AGENT_NAMES.length * STATION_STEP}
        />

        <div className="flex flex-col flex-1">
          {AGENT_NAMES.map((name, index) => (
            <div
              key={name}
              className="flex items-center gap-3"
              style={{ height: STATION_STEP }}
            >
              <span
                className={`size-2 rounded-full ring-2 shrink-0 ${getDotClasses(name)}`}
                aria-hidden
              />
              <span className={`text-sm ${getAgentClasses(name)}`}>{name}</span>
              {index < AGENT_NAMES.length - 1 && (
                <span className="ml-auto text-text-muted text-xs hidden sm:inline">
                  ↓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
