"use client";

import { motion } from "framer-motion";
import type { MigrationProgressStep } from "@/lib/database/database-status";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  steps: MigrationProgressStep[];
  preview?: string | null;
};

export default function MigrationProgressPanel({ steps, preview }: Props) {
  const doneCount = steps.filter((s) => s.done).length;
  const progress = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <Card padding="md" className="border-blue-500/20">
      <CardHeader
        title="Migration Progress"
        description="Franky · DbContext & EF Migrations · V24"
        action={
          steps.length > 0 ? (
            <span className="text-[10px] font-mono text-cyan-400">{progress}%</span>
          ) : undefined
        }
      />

      {steps.length === 0 ? (
        <EmptyState
          icon="⚙️"
          title="Awaiting migration pipeline"
          description="Migration steps appear after Franky generates DbContext and InitialCreate."
        />
      ) : (
        <>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <ul className="space-y-2">
            {steps.map((step, i) => (
              <motion.li
                key={step.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-2 text-xs ${
                  step.done ? "text-emerald-400" : "text-slate-500"
                }`}
              >
                <span className="font-mono">{step.done ? "✓" : "○"}</span>
                <span className="flex-1">{step.label}</span>
                {step.agent && (
                  <span className="text-[10px] text-text-muted">{step.agent}</span>
                )}
              </motion.li>
            ))}
          </ul>

          {preview && (
            <details className="mt-4 rounded-lg border border-border-subtle bg-slate-950/80">
              <summary className="cursor-pointer px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-cyan-500/80">
                EF Core Migration Preview
              </summary>
              <pre className="max-h-64 overflow-auto px-3 pb-3 text-[10px] leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">
                {preview.slice(0, 3500)}
                {preview.length > 3500 ? "\n\n…" : ""}
              </pre>
            </details>
          )}
        </>
      )}
    </Card>
  );
}
