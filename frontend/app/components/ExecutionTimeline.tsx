"use client";

import { motion } from "framer-motion";
import type { ExecutionTimelineEvent } from "@/lib/execution/execution-types";
import { EXECUTION_STATUS_COLORS } from "@/lib/execution/execution-types";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  events: ExecutionTimelineEvent[];
};

export default function ExecutionTimeline({ events }: Props) {
  return (
    <Card padding="md" className="border-cyan-500/20">
      <CardHeader
        title="Execution Timeline"
        description="Pipeline events · V25"
        action={
          events.length > 0 ? (
            <span className="text-[10px] font-mono text-text-muted">
              {events.length} events
            </span>
          ) : undefined
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No execution events"
          description="Timeline fills as restore, build, migrate, CRUD, and tests run."
        />
      ) : (
        <ol className="relative space-y-0 pl-4 border-l border-cyan-500/20 max-h-80 overflow-y-auto">
          {events.map((event, i) => {
            const colors = EXECUTION_STATUS_COLORS[event.status];
            return (
              <motion.li
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative pb-4 last:pb-0"
              >
                <span
                  className={`absolute -left-[1.35rem] top-1 size-2.5 rounded-full border-2 border-surface-2 ${colors.bg}`}
                  aria-hidden
                />
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-[10px] text-text-muted">
                    {event.timestamp}
                  </span>
                  <span className="text-[10px] font-semibold text-cyan-400/90">
                    {event.agent}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase ${colors.text}`}
                  >
                    {event.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-text-secondary">{event.label}</p>
              </motion.li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
