"use client";

import { motion } from "framer-motion";
import type { RequirementAnalysisContract } from "@/lib/requirement-parser";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  analysis: RequirementAnalysisContract | null;
  loading?: boolean;
};

function confidenceTone(score: number) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function ListBlock({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
        {title}
      </p>
      {items.length > 0 ? (
        <ul className="space-y-1 max-h-36 overflow-y-auto">
          {items.map((item) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[11px] font-mono text-cyan-300/90"
            >
              • {item}
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] text-text-muted">{emptyLabel}</p>
      )}
    </div>
  );
}

export default function BusinessAnalysisPanel({ analysis, loading }: Props) {
  if (!analysis && !loading) {
    return (
      <Card padding="md" className="border-violet-500/20">
        <CardHeader
          title="Business Analysis"
          description="V28 · Business Requirement Parser"
        />
        <EmptyState
          icon="📊"
          title="No analysis yet"
          description="Enter a requirement and start a mission to detect domain, entities, modules, and rules."
        />
      </Card>
    );
  }

  const domain = analysis?.domain ?? "Analyzing…";
  const score = analysis?.confidenceScore ?? 0;

  return (
    <Card padding="md" className="border-violet-500/20">
      <CardHeader
        title="Business Analysis"
        description="V28 · Business Requirement Parser"
        action={
          analysis ? (
            <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-violet-300">
              {domain}
            </span>
          ) : undefined
        }
      />

      <div className="flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 mb-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Detected Domain
          </p>
          <p className="text-sm font-semibold text-text-primary mt-0.5">{domain}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Confidence Score
          </p>
          <p className={`text-2xl font-bold ${confidenceTone(score)}`}>
            {loading && !analysis ? "…" : `${score}%`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ListBlock
          title="Entities"
          items={analysis?.entities ?? []}
          emptyLabel="Parsing entities…"
        />
        <ListBlock
          title="Modules"
          items={analysis?.modules ?? []}
          emptyLabel="Parsing modules…"
        />
        <ListBlock
          title="Business Rules"
          items={analysis?.businessRules ?? []}
          emptyLabel="Parsing rules…"
        />
      </div>

      {analysis && (
        <p className="mt-3 text-[10px] text-violet-300/80 font-mono">
          Structured contract passed to Zoro · Nami · Franky · Usopp — generic entities filtered
        </p>
      )}

      {loading && !analysis && (
        <motion.p
          className="mt-3 text-center text-[10px] font-mono text-violet-300"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          Analyzing requirement text…
        </motion.p>
      )}
    </Card>
  );
}
