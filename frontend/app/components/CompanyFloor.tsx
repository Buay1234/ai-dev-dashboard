"use client";

import MovingRobot from "./MovingRobot";
import Card, { CardHeader } from "./ui/Card";
import Badge, { statusToBadgeVariant } from "./ui/Badge";
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

  const getRoomClasses = (agent: string, status: string) => {
    const isCurrent = agent === currentAgent || status === "Working";

    if (isCurrent) {
      return "border-warning/40 bg-warning-muted/30 ring-1 ring-warning/20";
    }
    if (status === "Completed") {
      return "border-success/30 bg-success-muted/20";
    }
    if (status === "Error") {
      return "border-error/30 bg-error-muted/20";
    }
    return "border-border-subtle bg-surface-1";
  };

  return (
    <Card padding="lg">
      <CardHeader
        title="Company Floor"
        description="Visual map of AI teams and live agent positions"
      />

      <div className="flex items-start gap-4">
        <MovingRobot
          activeIndex={activeIndex}
          step={STATION_STEP}
          trackHeight={
            ROOMS.length * ROOM_HEIGHT + (ROOMS.length - 1) * ROOM_GAP
          }
          trackClassName="w-8 md:w-10 shrink-0"
          robotClassName="text-2xl md:text-3xl leading-none drop-shadow-[0_0_12px_rgba(139,92,246,0.4)]"
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
                  <span
                    className="flex size-10 items-center justify-center rounded-lg bg-surface-3 text-xl shrink-0"
                    aria-hidden
                  >
                    {room.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {room.title}
                    </h3>
                    <div className="mt-1">
                      <Badge
                        variant={statusToBadgeVariant(status)}
                        pulse={status === "Working"}
                      >
                        {status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
