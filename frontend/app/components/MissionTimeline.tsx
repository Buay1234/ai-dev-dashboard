"use client";

import { motion } from "framer-motion";
import Card, { CardHeader } from "./ui/Card";
import AgentCharacter from "./AgentCharacter";
import {
  AGENT_CONFIG,
  AGENT_THEME_STYLES,
  isMissionActive,
  toAgentStatusMap,
} from "@/lib/agents/config";
import type { AgentStatusProps } from "@/lib/types/agent-results";
import type { AgentMessage } from "@/app/types/conversation";
import { getLatestAgentMessage } from "@/lib/conversation";

const STEP = 64;

type Props = AgentStatusProps & {
  messages?: AgentMessage[];
};

export default function MissionTimeline({ messages = [], ...props }: Props) {
  const { currentAgent } = props;
  const statuses = toAgentStatusMap(props);
  const missionActive = isMissionActive(statuses, currentAgent);

  return (
    <Card padding="md">
      <CardHeader
        title="Workflow Timeline"
        description="Agent dialogue and live mission progress · V22"
      />

      <div className="relative flex flex-col">
        {AGENT_CONFIG.map((agent, index) => {
          const status = statuses[agent.name];
          const theme = AGENT_THEME_STYLES[agent.theme];
          const isActive =
            agent.name === currentAgent || status === "Working";
          const isCompleted = status === "Completed";
          const isError = status === "Error";
          const isFuture = status === "Idle" && missionActive;
          const dialogue = getLatestAgentMessage(messages, agent.name);

          return (
            <div key={agent.name} className="relative">
              <motion.div
                className="flex items-center gap-3 rounded-lg px-2 py-2"
                style={{ minHeight: STEP }}
                animate={
                  isActive
                    ? { backgroundColor: theme.bg }
                    : { backgroundColor: "transparent" }
                }
                transition={{ duration: 0.35 }}
              >
                <div className="relative shrink-0">
                  <AgentCharacter
                    agent={agent}
                    status={status}
                    size="sm"
                    latestMessage={dialogue}
                  />
                  {isActive && (
                    <motion.span
                      className="absolute -inset-1 rounded-full border-2"
                      style={{ borderColor: theme.ring }}
                      animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      aria-hidden
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: isCompleted
                        ? "#86efac"
                        : isError
                          ? "#fca5a5"
                          : isActive
                            ? theme.text
                            : isFuture
                              ? "#71717a"
                              : "#a1a1aa",
                    }}
                  >
                    {agent.name}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {agent.role}
                  </p>
                  {dialogue && (
                    <p className="mt-1 text-[10px] text-cyan-400/90 line-clamp-2 italic">
                      &ldquo;{dialogue}&rdquo;
                    </p>
                  )}
                </div>

                <motion.span
                  className="text-xs font-medium shrink-0"
                  animate={
                    isActive ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }
                  }
                  transition={
                    isActive
                      ? { duration: 1.2, repeat: Infinity }
                      : { duration: 0.3 }
                  }
                  style={{
                    color: isCompleted
                      ? "#86efac"
                      : isError
                        ? "#fca5a5"
                        : isActive
                          ? theme.text
                          : "#71717a",
                  }}
                >
                  {isCompleted
                    ? "✓ Done"
                    : isError
                      ? "✕ Failed"
                      : isActive
                        ? "● Active"
                        : "○ Waiting"}
                </motion.span>
              </motion.div>

              {index < AGENT_CONFIG.length - 1 && (
                <div className="flex justify-start pl-5 py-0.5" aria-hidden>
                  <motion.div
                    className="w-0.5 h-4 rounded-full"
                    style={{
                      background: isCompleted
                        ? "linear-gradient(to bottom, #22c55e, rgba(255,255,255,0.1))"
                        : "rgba(255,255,255,0.08)",
                    }}
                    animate={
                      isCompleted
                        ? { opacity: [0.4, 1, 0.4] }
                        : { opacity: 0.3 }
                    }
                    transition={
                      isCompleted
                        ? { duration: 1.5, repeat: Infinity }
                        : { duration: 0.3 }
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
