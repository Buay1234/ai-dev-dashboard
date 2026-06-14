"use client";

import { memo } from "react";
import { AGENT_NAMES } from "@/lib/agents";
import type { AgentStatus } from "@/lib/types/agent-results";
import WalkingAgent from "./WalkingAgent";
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
};

function OfficeAgents({ currentAgent, statuses }: Props) {
  return (
    <>
      {AGENT_NAMES.map((name) => (
        <WalkingAgent
          key={name}
          agentName={name}
          agentStatus={statuses[name]}
          currentAgent={currentAgent}
          theme={AGENT_THEMES[name]}
          isCurrent={currentAgent === name}
        />
      ))}
    </>
  );
}

export default memo(OfficeAgents);
