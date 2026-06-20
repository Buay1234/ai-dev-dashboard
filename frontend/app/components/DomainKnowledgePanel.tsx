"use client";

import { motion } from "framer-motion";
import type { ArchitectureContract } from "@/lib/domain-library";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  contract: ArchitectureContract | null;
  loading?: boolean;
};

function ListBlock({
  title,
  items,
  tone = "cyan",
}: {
  title: string;
  items: string[];
  tone?: "cyan" | "violet" | "amber";
}) {
  const color =
    tone === "violet"
      ? "text-violet-300/90"
      : tone === "amber"
        ? "text-amber-300/90"
        : "text-cyan-300/90";

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
        {title}
      </p>
      {items.length > 0 ? (
        <ul className="space-y-1 max-h-32 overflow-y-auto">
          {items.map((item) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-[11px] font-mono ${color}`}
            >
              • {item}
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] text-text-muted">None</p>
      )}
    </div>
  );
}

export default function DomainKnowledgePanel({ contract, loading }: Props) {
  if (!contract && !loading) {
    return (
      <Card padding="md" className="border-indigo-500/20">
        <CardHeader
          title="Domain Knowledge"
          description="V29 · Domain Knowledge Library"
        />
        <EmptyState
          icon="📚"
          title="No domain template loaded"
          description="Start a mission to detect domain and merge requirement analysis with domain best practices."
        />
      </Card>
    );
  }

  const templateLabel = contract?.templateLoaded
    ? `${contract.templateName} (${contract.templateId}.json)`
    : "No matching template";

  return (
    <Card padding="md" className="border-indigo-500/20">
      <CardHeader
        title="Domain Knowledge"
        description="V29 · Domain Knowledge Library"
        action={
          contract ? (
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${
                contract.templateLoaded
                  ? "text-indigo-300 border-indigo-500/40 bg-indigo-500/10"
                  : "text-zinc-400 border-zinc-500/40 bg-zinc-500/10"
              }`}
            >
              {contract.templateLoaded ? "Template Loaded" : "General"}
            </span>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2.5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Detected Domain
          </p>
          <p className="text-sm font-semibold text-text-primary mt-0.5">
            {contract?.domain ?? "Analyzing…"}
          </p>
        </div>
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2.5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Loaded Template
          </p>
          <p className="text-sm font-semibold text-indigo-300 mt-0.5">{templateLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <ListBlock
          title="Recommended Entities"
          items={contract?.recommendedEntities ?? []}
          tone="cyan"
        />
        <ListBlock
          title="Recommended Modules"
          items={contract?.recommendedModules ?? []}
          tone="violet"
        />
        <ListBlock
          title="Business Rules"
          items={contract?.businessRules ?? []}
          tone="amber"
        />
      </div>

      {contract && contract.entities.length > 0 && (
        <div className="rounded-lg border border-border-subtle bg-slate-950/50 p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
            Merged Architecture Entities
          </p>
          <p className="text-[11px] font-mono text-emerald-300/90">
            {contract.entities.join(" · ")}
          </p>
          {contract.relationships.length > 0 && (
            <p className="mt-2 text-[10px] font-mono text-text-muted">
              {contract.relationships.length} relationships ·{" "}
              {contract.statusValues.length} status enums
            </p>
          )}
        </div>
      )}

      {contract && (
        <p className="mt-3 text-[10px] text-indigo-300/80 font-mono">
          Architecture Contract passed to Zoro · Nami · Franky · Usopp
        </p>
      )}

      {loading && !contract && (
        <motion.p
          className="mt-3 text-center text-[10px] font-mono text-indigo-300"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          Loading domain template…
        </motion.p>
      )}
    </Card>
  );
}
