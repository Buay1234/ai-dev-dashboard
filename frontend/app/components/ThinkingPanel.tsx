"use client";

import { motion, AnimatePresence } from "framer-motion";
import AgentCharacter from "./AgentCharacter";
import Card, { CardHeader } from "./ui/Card";
import { AGENT_CONFIG, AGENT_THEME_STYLES } from "@/lib/agents/config";
import type { AgentStatusProps } from "@/lib/types/agent-results";
import type { AgentThought } from "@/app/types/thinking";
import type { ArtifactProgressStep } from "@/app/types/artifacts";
import { sortThoughts } from "@/lib/thinking";

type Props = {
  thoughts: AgentThought[];
  currentAgent: string;
  progress: number;
  artifactSteps?: ArtifactProgressStep[];
  compact?: boolean;
} & AgentStatusProps;

const STATUS_COLORS: Record<string, string> = {
  Standby: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10",
  Thinking: "text-purple-300 border-purple-500/40 bg-purple-500/15",
  Handoff: "text-violet-300 border-violet-500/40 bg-violet-500/15",
  Developing: "text-emerald-300 border-emerald-500/40 bg-emerald-500/15",
  Designing: "text-red-300 border-red-500/40 bg-red-500/15",
  Binding: "text-teal-300 border-teal-500/40 bg-teal-500/15",
  "Building UI": "text-orange-300 border-orange-500/40 bg-orange-500/15",
  Reviewing: "text-blue-300 border-blue-500/40 bg-blue-500/15",
  Testing: "text-yellow-300 border-yellow-500/40 bg-yellow-500/15",
  Complete: "text-cyan-300 border-cyan-500/40 bg-cyan-500/15",
  Meeting: "text-amber-300 border-amber-500/40 bg-amber-500/15",
  Generating: "text-cyan-300 border-cyan-500/40 bg-cyan-500/15",
  Error: "text-red-300 border-red-500/40 bg-red-500/15",
};

function statusBadgeClass(status: string) {
  return STATUS_COLORS[status] ?? "text-cyan-300 border-cyan-500/30 bg-cyan-500/10";
}

function agentConfigFor(name: string) {
  return AGENT_CONFIG.find((a) => a.name === name);
}

export default function ThinkingPanel({
  thoughts,
  currentAgent,
  progress,
  robinStatus,
  zoroStatus,
  sanjiStatus,
  namiStatus,
  jinbeStatus,
  frankyStatus,
  usoppStatus,
  artifactSteps = [],
  compact = false,
}: Props) {
  const statusMap: Record<string, string> = {
    Robin: robinStatus,
    Zoro: zoroStatus,
    Sanji: sanjiStatus,
    Nami: namiStatus,
    Jinbe: jinbeStatus,
    Franky: frankyStatus,
    Usopp: usoppStatus,
  };

  const sorted = sortThoughts(thoughts);

  return (
    <Card padding="md" className={`flex flex-col border-cyan-500/20 bg-slate-950/80 ${compact ? "min-h-0" : "h-full min-h-[320px]"}`}>
      <CardHeader
        title="AI Thinking Panel"
        description="Gemini output stream · V25"
      />

      <div className={`flex-1 overflow-y-auto space-y-3 pr-1 ${compact ? "max-h-[340px]" : "max-h-[520px]"}`}>
        <AnimatePresence initial={false}>
          {sorted.map((thought) => {
            const agent = agentConfigFor(thought.agent);
            const theme = agent
              ? AGENT_THEME_STYLES[agent.theme]
              : { glow: "rgba(6,182,212,0.5)", text: "#67e8f9", border: "rgba(6,182,212,0.3)" };
            const pipelineStatus = statusMap[thought.agent];
            const isActive =
              thought.agent === currentAgent ||
              pipelineStatus === "Working" ||
              thought.agent === "System";
            const barProgress = thought.progress ?? 0;

            return (
              <motion.div
                key={thought.agent}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className={`rounded-xl border p-3 ${
                  isActive
                    ? "border-cyan-500/35 bg-slate-900/90 shadow-[0_0_20px_rgba(6,182,212,0.08)]"
                    : "border-slate-700/50 bg-slate-900/50"
                }`}
                style={
                  isActive
                    ? { boxShadow: `0 0 24px ${theme.glow}22` }
                    : undefined
                }
              >
                <div className="flex items-start gap-3">
                  {agent ? (
                    <AgentCharacter agent={agent} status={pipelineStatus ?? "Idle"} size="sm" />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-lg">
                      🏢
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: theme.text }}
                      >
                        {thought.agent}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${statusBadgeClass(thought.status)}`}
                      >
                        {thought.status}
                      </span>
                    </div>

                    {thought.task && (
                      <p className="mt-1 text-xs text-slate-400">{thought.task}</p>
                    )}

                    <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-cyan-500/70">
                      🧠 Thinking
                    </p>

                    <ul className="mt-1 space-y-0.5">
                      {thought.thoughts.map((line, i) => (
                        <motion.li
                          key={`${thought.agent}-${i}-${line}`}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="text-xs text-slate-200"
                        >
                          • {line}
                        </motion.li>
                      ))}
                    </ul>

                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[10px] font-mono text-slate-500">
                        <span>Progress</span>
                        <span>{barProgress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${theme.glow}, ${theme.text})`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${barProgress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {artifactSteps.length > 0 && (
        <div className="mt-3 border-t border-slate-700/50 pt-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-500/70 mb-2">
            Artifact Generation
          </p>
          <ul className="space-y-1">
            {artifactSteps.map((step) => (
              <li
                key={step.id}
                className={`text-xs ${step.done ? "text-emerald-400" : "text-slate-500"}`}
              >
                {step.done ? "✓" : "○"} {step.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 border-t border-slate-700/50 pt-3">
        <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500">
          <span>Mission pipeline</span>
          <span className="text-cyan-400">{progress}%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-600 to-purple-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </Card>
  );
}
