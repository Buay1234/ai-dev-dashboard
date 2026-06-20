"use client";

import { motion } from "framer-motion";
import type { BuildRetryState } from "@/lib/build/build-attempt";
import { formatAttemptTimestamp } from "@/lib/build/build-attempt";
import type { CompilerDiagnosticsReport } from "@/lib/build-verification/compiler-diagnostics/types";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  buildRetry: BuildRetryState | null;
  running?: boolean;
  compilerAnalysis?: CompilerDiagnosticsReport | null;
};

function statusColor(status: string) {
  if (status === "PASS") return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
  if (status === "FAILED") return "text-red-400 border-red-500/40 bg-red-500/10";
  if (status === "RUNNING") return "text-amber-400 border-amber-500/40 bg-amber-500/10";
  return "text-zinc-400 border-zinc-500/40 bg-zinc-500/10";
}

export default function BuildRetryProgressPanel({
  buildRetry,
  running,
  compilerAnalysis,
}: Props) {
  if (!buildRetry && !running) {
    return (
      <Card padding="md" className="border-blue-500/20">
        <CardHeader
          title="Build Retry Progress"
          description="Usopp · V26.3 Build Retry System"
        />
        <EmptyState
          icon="🔄"
          title="No retry history yet"
          description="Build → Analyze → Auto Fix → Build Again (max 5 attempts)"
        />
      </Card>
    );
  }

  const retry = buildRetry;
  const status = retry?.status ?? (running ? "RUNNING" : "RUNNING");
  const buildHistory = retry?.history.filter((h) => h.phase === "build") ?? [];

  return (
    <Card padding="md" className="border-blue-500/20">
      <CardHeader
        title="Build Retry Progress"
        description="Usopp · V26.3 Build Retry System"
        action={
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${statusColor(status)}`}
          >
            {status}
          </span>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-3 text-center">
          <p className="text-[10px] font-mono uppercase text-text-muted mb-1">Current Attempt</p>
          <p className="text-2xl font-bold font-mono text-blue-300">
            {retry?.currentAttempt ?? 0}/{retry?.maxAttempts ?? 5}
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-3 text-center">
          <p className="text-[10px] font-mono uppercase text-text-muted mb-1">Error Count</p>
          <p className={`text-2xl font-bold font-mono ${(retry?.currentErrorCount ?? 0) === 0 ? "text-emerald-400" : "text-red-400"}`}>
            {retry?.currentErrorCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-3 text-center">
          <p className="text-[10px] font-mono uppercase text-text-muted mb-1">Warnings</p>
          <p className="text-2xl font-bold font-mono text-amber-300">
            {retry?.currentWarningCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-3 text-center">
          <p className="text-[10px] font-mono uppercase text-text-muted mb-1">Build Status</p>
          <p className={`text-lg font-bold font-mono ${status === "PASS" ? "text-emerald-400" : status === "FAILED" ? "text-red-400" : "text-amber-400"}`}>
            {status}
          </p>
        </div>
      </div>

      <section className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
          Retry History
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {buildHistory.length === 0 && running && (
            <motion.p
              className="text-center text-[10px] font-mono text-amber-300 py-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              Running build attempt…
            </motion.p>
          )}
          {buildHistory.map((entry) => (
            <div
              key={`${entry.attemptNumber}-${entry.timestamp}`}
              className="rounded-lg border border-border-subtle bg-slate-950/60 px-3 py-2"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-blue-300">
                  Attempt {entry.attemptNumber}
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  {formatAttemptTimestamp(entry.timestamp)}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-[10px] font-mono text-text-secondary">
                <span>Errors: {entry.compilerErrors}</span>
                <span>Warnings: {entry.compilerWarnings}</span>
                <span>Fixed: {entry.fixedErrors}</span>
                <span className={entry.buildStatus === "PASS" ? "text-emerald-400" : "text-red-400"}>
                  {entry.buildStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {status === "FAILED" && compilerAnalysis && (
        <section className="rounded-lg border border-red-500/25 bg-red-500/5 p-3">
          <p className="text-[10px] font-mono uppercase text-red-400/90 mb-2">
            Retry Limit Reached — Remaining Errors
          </p>
          <p className="text-xs text-text-secondary mb-2">
            {compilerAnalysis.totalErrors} compiler errors remain after {retry?.maxAttempts} attempts.
          </p>
          {compilerAnalysis.rootCauses.slice(0, 2).map((cause) => (
            <div key={cause.id} className="mb-2 last:mb-0">
              <p className="text-[10px] font-mono text-amber-300">{cause.rootCause}</p>
              <p className="text-[10px] text-emerald-300/80">{cause.suggestedFix}</p>
            </div>
          ))}
        </section>
      )}

      {status === "PASS" && (
        <p className="text-[10px] text-emerald-400/90 font-mono">
          Build passed with 0 compiler errors — export enabled
        </p>
      )}
    </Card>
  );
}
