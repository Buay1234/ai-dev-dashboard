"use client";

import { motion } from "framer-motion";
import type { BusinessArchitecturePlan } from "@/lib/architecture";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  plan: BusinessArchitecturePlan | null;
  loading?: boolean;
};

function confidenceTone(score: number) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

export default function BusinessArchitecturePanel({ plan, loading }: Props) {
  if (!plan && !loading) {
    return (
      <Card padding="md" className="border-teal-500/20">
        <CardHeader
          title="Business Architecture"
          description="V30 · Architecture Planning Engine"
        />
        <EmptyState
          icon="🏗️"
          title="No architecture plan yet"
          description="Start a mission to auto-select Clean, Layered, or CQRS architecture from domain complexity."
        />
      </Card>
    );
  }

  const archType = plan?.architectureType ?? "Planning…";

  return (
    <Card padding="md" className="border-teal-500/20">
      <CardHeader
        title="Business Architecture"
        description="V30 · Architecture Planning Engine"
        action={
          plan ? (
            <span className="rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-teal-300">
              {archType}
            </span>
          ) : undefined
        }
      />

      <div className="flex items-center justify-between rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 mb-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Architecture
          </p>
          <p className="text-sm font-semibold text-text-primary mt-0.5">{archType}</p>
          {plan?.selectionReason && (
            <p className="text-[10px] text-text-muted mt-1 max-w-md">{plan.selectionReason}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Confidence Score
          </p>
          <p className={`text-2xl font-bold ${confidenceTone(plan?.confidenceScore ?? 0)}`}>
            {loading && !plan ? "…" : `${plan?.confidenceScore ?? 0}%`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Section title="Layers">
          {plan?.layers.length ? (
            <ul className="space-y-1">
              {plan.layers.map((layer) => (
                <motion.li
                  key={layer}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[11px] font-mono text-teal-300/90"
                >
                  • {layer}
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] text-text-muted">Selecting layers…</p>
          )}
        </Section>

        <Section title="Patterns">
          {plan?.patterns.length ? (
            <ul className="space-y-1 max-h-36 overflow-y-auto">
              {plan.patterns.map((pattern) => (
                <motion.li
                  key={pattern}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[11px] font-mono text-cyan-300/90"
                >
                  • {pattern}
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] text-text-muted">Selecting patterns…</p>
          )}
        </Section>
      </div>

      <Section title="Project Structure">
        {plan?.projectStructure.length ? (
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {plan.projectStructure.map((node) => (
              <li
                key={node.path}
                className="text-[10px] font-mono text-text-secondary"
              >
                <span className="text-emerald-400/90">{node.path}</span>
                <span className="text-text-muted"> — {node.purpose}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] text-text-muted">Building project layout…</p>
        )}
      </Section>

      {plan && (
        <p className="mt-3 text-[10px] text-teal-300/80 font-mono">
          Architecture plan passed to Zoro · Nami · Usopp before code generation
        </p>
      )}

      {loading && !plan && (
        <motion.p
          className="mt-3 text-center text-[10px] font-mono text-teal-300"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          Generating architecture plan…
        </motion.p>
      )}
    </Card>
  );
}
