"use client";

import { motion } from "framer-motion";
import type { CompilerDiagnosticsReport } from "@/lib/build-verification/compiler-diagnostics/types";
import { downloadDiagnosticsJson } from "@/lib/build-verification/compiler-diagnostics";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  analysis: CompilerDiagnosticsReport | null;
  running?: boolean;
};

export default function CompilerErrorAnalysisPanel({ analysis, running }: Props) {
  if (!analysis && !running) {
    return (
      <Card padding="md" className="border-red-500/20">
        <CardHeader
          title="Compiler Error Analysis"
          description="Usopp · V26.1 Compiler Diagnostics"
        />
        <EmptyState
          icon="🔍"
          title="No compiler analysis yet"
          description="Analysis runs automatically when dotnet build reports errors."
        />
      </Card>
    );
  }

  if (running && !analysis) {
    return (
      <Card padding="md" className="border-red-500/20">
        <CardHeader
          title="Compiler Error Analysis"
          description="Usopp · V26.1 Compiler Diagnostics"
        />
        <motion.p
          className="text-center text-[10px] font-mono text-amber-300 py-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          Analyzing compiler output…
        </motion.p>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <Card padding="md" className="border-red-500/20">
      <CardHeader
        title="Compiler Error Analysis"
        description="Usopp · V26.1 Compiler Diagnostics"
        action={
          <button
            type="button"
            onClick={() => downloadDiagnosticsJson(analysis)}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20"
          >
            Export JSON
          </button>
        }
      />

      <section className="mb-5">
        <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
          Total Errors
        </p>
        <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-text-secondary">Compiler Errors</span>
          <span className="text-3xl font-bold text-red-400">{analysis.totalErrors}</span>
        </div>
        <p className="mt-2 text-[10px] text-text-muted font-mono">
          Warnings: {analysis.totalWarnings}
        </p>
      </section>

      <section className="mb-5">
        <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
          Error Breakdown
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {analysis.errorGroups.map((group) => (
            <div
              key={group.code}
              className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-amber-300">
                  {group.code}
                </span>
                <span className="font-mono text-[10px] text-text-muted">
                  Count: {group.count}
                </span>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                {group.message}
              </p>
              {group.files.length > 0 && (
                <p className="mt-1 text-[10px] font-mono text-zinc-500 truncate">
                  {group.files.slice(0, 3).join(", ")}
                  {group.files.length > 3 ? ` +${group.files.length - 3} more` : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-5">
        <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
          Root Causes
        </p>
        <div className="space-y-3">
          {analysis.rootCauses.map((cause) => (
            <motion.div
              key={cause.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
            >
              <p className="text-[10px] font-mono uppercase text-amber-400/90 mb-1">
                Root Cause
              </p>
              <p className="text-xs text-text-primary mb-2">{cause.rootCause}</p>
              <p className="text-[10px] font-mono uppercase text-red-400/90 mb-1">
                Impact
              </p>
              <p className="text-xs text-text-secondary mb-2">{cause.impact}</p>
              <p className="text-[10px] font-mono uppercase text-emerald-400/90 mb-1">
                Suggested Fix
              </p>
              <p className="text-xs text-emerald-300/90">{cause.suggestedFix}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {analysis.suggestedFixes.length > 0 && (
        <section>
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
            Suggested Fixes
          </p>
          <ul className="space-y-1">
            {analysis.suggestedFixes.map((fix) => (
              <li
                key={fix}
                className="text-[10px] font-mono text-cyan-300/90 before:content-['•'] before:mr-2"
              >
                {fix}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  );
}
