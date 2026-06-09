"use client";

import { motion } from "framer-motion";
import AgentCharacter from "./AgentCharacter";
import Card from "./ui/Card";
import Badge, { statusToBadgeVariant } from "./ui/Badge";
import { AGENT_CONFIG, AGENT_THEME_STYLES } from "@/lib/agents";
import type { AgentStatus } from "@/lib/types/agent-results";

type Props = {
  name: string;
  status: AgentStatus | string;
};

export default function AgentCard({ name, status }: Props) {
  const agent = AGENT_CONFIG.find((a) => a.name === name);
  if (!agent) return null;

  const theme = AGENT_THEME_STYLES[agent.theme];
  const isWorking = status === "Working";
  const isCompleted = status === "Completed";
  const isError = status === "Error";

  const borderStyle = isWorking
    ? theme.border
    : isCompleted
      ? "rgba(34, 197, 94, 0.35)"
      : isError
        ? "rgba(239, 68, 68, 0.35)"
        : undefined;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="h-full"
      style={
        borderStyle
          ? {
              borderRadius: "0.75rem",
              border: `1px solid ${borderStyle}`,
              boxShadow: isWorking ? `0 0 20px ${theme.glow}` : undefined,
            }
          : undefined
      }
    >
      <Card hover padding="md" className="h-full border-0 shadow-none">
        <div className="flex flex-col items-center text-center gap-3">
          <AgentCharacter agent={agent} status={status} size="md" />

          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {agent.name}
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">{agent.role}</p>
          </div>

          <Badge variant={statusToBadgeVariant(status)} pulse={isWorking}>
            {isWorking ? (
              <span className="flex items-center gap-1">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  aria-hidden
                >
                  ⚙️
                </motion.span>
                Working
              </span>
            ) : isCompleted ? (
              "✓ Completed"
            ) : isError ? (
              "✕ Failed"
            ) : (
              status
            )}
          </Badge>
        </div>
      </Card>
    </motion.div>
  );
}
