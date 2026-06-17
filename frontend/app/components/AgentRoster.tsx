"use client";

import { motion } from "framer-motion";
import AgentCharacter from "./AgentCharacter";
import Card, { CardHeader } from "./ui/Card";
import Badge, { statusToBadgeVariant } from "./ui/Badge";
import { AGENT_CONFIG, AGENT_THEME_STYLES } from "@/lib/agents";
import type { AgentStatusProps } from "@/lib/types/agent-results";

type Props = AgentStatusProps & {
  latestMessages?: Record<string, string>;
};

export default function AgentRoster({
  latestMessages = {},
  ...props
}: Props) {
  const statusMap = {
    Robin: props.robinStatus,
    Zoro: props.zoroStatus,
    Nami: props.namiStatus,
    Franky: props.frankyStatus,
    Usopp: props.usoppStatus,
  };

  return (
    <Card padding="lg" className="relative overflow-hidden">
      <CardHeader
        title="Agent Roster"
        description="Full crew status board"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {AGENT_CONFIG.map((agent, index) => {
          const status = statusMap[agent.name];
          const theme = AGENT_THEME_STYLES[agent.theme];
          const isActive =
            props.currentAgent === agent.name || status === "Working";

          return (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              className="relative rounded-xl border border-border-subtle bg-surface-1/80 p-3 text-center"
              style={
                isActive
                  ? {
                      borderColor: theme.border,
                      boxShadow: `0 0 16px ${theme.glow}`,
                    }
                  : undefined
              }
            >
              <div className="flex flex-col items-center gap-2">
                <AgentCharacter
                  agent={agent}
                  status={status}
                  size="sm"
                  latestMessage={latestMessages[agent.name]}
                />
                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: theme.text }}
                  >
                    {agent.name}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5 line-clamp-2">
                    {agent.role}
                  </p>
                </div>
                <Badge
                  variant={statusToBadgeVariant(status)}
                  pulse={status === "Working"}
                >
                  {status}
                </Badge>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
