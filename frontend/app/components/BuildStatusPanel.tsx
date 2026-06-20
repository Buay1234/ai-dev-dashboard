"use client";

import { motion } from "framer-motion";
import type { BuildVerificationResult } from "@/lib/build-verification/types";
import { dedupeFixMessages } from "@/lib/build-verification/auto-fixer";
import { phaseLabel } from "@/lib/build-verification/types";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  result: BuildVerificationResult | null;
  running?: boolean;
  exportReady?: boolean;
};

function PhaseRow({ label, status }: { label: string; status: string }) {
  const color =
    status === "PASS"
      ? "text-emerald-400"
      : status === "FAIL"
        ? "text-red-400"
        : status === "RUNNING"
          ? "text-amber-400"
          : "text-zinc-500";

  return (
    <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-1 px-3 py-2">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className={`font-mono text-xs font-bold ${color}`}>{status}</span>
    </div>
  );
}

export default function BuildStatusPanel({ result, running, exportReady = false }: Props) {
  if (!result && !running) {
    return (
      <Card padding="md" className="border-yellow-500/25">
        <CardHeader
          title="Build Status"
          description="Usopp · Build Verification Agent"
        />
        <EmptyState
          icon="🔧"
          title="Awaiting build verification"
          description="Usopp runs dotnet restore, build, and test after project generation."
        />
      </Card>
    );
  }

  const restore = result ? phaseLabel(result.restore) : running ? "RUNNING" : "PENDING";
  const build = result ? phaseLabel(result.build) : "PENDING";
  const tests = result ? phaseLabel(result.tests) : "PENDING";
  const qaScore = result?.qaScore ?? 0;
  const complete = result?.complete ?? false;
  const displayFixes = result ? dedupeFixMessages(result.errorsFixed) : [];

  return (
    <Card padding="md" className="border-yellow-500/25">
      <CardHeader
        title="Build Status"
        description="Usopp · Build Verification Agent"
        action={
          exportReady ? (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-300">
              Export Ready ✅
            </span>
          ) : result ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-amber-300">
              Export Locked
            </span>
          ) : undefined
        }
      />

      <div className="space-y-2 mb-4">
        <PhaseRow label="Restore" status={restore} />
        <PhaseRow label="Build" status={build} />
        <PhaseRow label="Tests" status={tests} />
      </div>

      {displayFixes.length > 0 && (
        <div className="mb-4 rounded-lg border border-border-subtle bg-slate-950/60 p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
            Errors Fixed
          </p>
          <ul className="max-h-32 overflow-y-auto space-y-1">
            {displayFixes.map((fix, i) => (
              <motion.li
                key={`${fix}-${i}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] text-cyan-300/90 font-mono"
              >
                • {fix}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
        <span className="text-xs font-medium text-text-secondary">QA Score</span>
        <span
          className={`text-2xl font-bold ${
            qaScore >= 100 ? "text-emerald-400" : qaScore >= 70 ? "text-amber-400" : "text-red-400"
          }`}
        >
          {qaScore}%
        </span>
      </div>

      {result && !exportReady && !complete && (
        <p className="mt-3 text-[10px] text-amber-400/90 font-mono">
          Attempt {result.attempts}/{result.maxAttempts} — waiting for mission completion
        </p>
      )}

      {exportReady && (
        <p className="mt-3 text-[10px] text-emerald-400/90 font-mono">
          Mission complete · build & tests passed · export enabled
        </p>
      )}

      {running && !result?.complete && (
        <motion.p
          className="mt-3 text-center text-[10px] font-mono text-amber-300"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          Usopp is running dotnet restore · build · test…
        </motion.p>
      )}
    </Card>
  );
}
