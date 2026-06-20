"use client";

import { motion } from "framer-motion";
import type { RuntimeCheckDetail, RuntimeReport } from "@/lib/runtime/runtime-report";
import { statusLabel } from "@/lib/runtime/runtime-report";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  report: RuntimeReport | null;
  running?: boolean;
};

function toneForCheck(check: RuntimeCheckDetail) {
  if (check.status === "pass") return "good";
  if (check.status === "running") return "warn";
  if (check.status === "fail") return "bad";
  return "neutral";
}

function CheckRow({ check }: { check: RuntimeCheckDetail }) {
  const tone = toneForCheck(check);
  const label = statusLabel(check.status);
  const color =
    tone === "good"
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
      : tone === "bad"
        ? "text-red-400 border-red-500/30 bg-red-500/5"
        : tone === "warn"
          ? "text-amber-400 border-amber-500/30 bg-amber-500/5"
          : "text-zinc-400 border-zinc-500/30 bg-zinc-500/5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border px-3 py-2.5 ${color}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-medium">{check.label}</span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-[10px] font-mono opacity-90 leading-relaxed">{check.detail}</p>
    </motion.div>
  );
}

export default function RuntimeVerificationPanel({ report, running }: Props) {
  if (!report && !running) {
    return (
      <Card padding="md" className="border-cyan-500/20">
        <CardHeader
          title="Runtime Verification"
          description="Usopp · V27 Runtime Validation"
        />
        <EmptyState
          icon="🚀"
          title="Awaiting runtime verification"
          description="After a successful build, Usopp runs dotnet run, Swagger, database, and migration checks."
        />
      </Card>
    );
  }

  const status = running
    ? "RUNNING"
    : report?.runtimePassed
      ? "PASS"
      : report
        ? "FAIL"
        : "RUNNING";

  const statusClass =
    status === "PASS"
      ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
      : status === "FAIL"
        ? "text-red-400 border-red-500/40 bg-red-500/10"
        : "text-amber-400 border-amber-500/40 bg-amber-500/10";

  const checks = report?.checks;
  const checkList = checks
    ? [checks.apiStartup, checks.swagger, checks.database, checks.migration]
    : [];

  return (
    <Card padding="md" className="border-cyan-500/20">
      <CardHeader
        title="Runtime Verification"
        description="Usopp · V27 Runtime Validation"
        action={
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${statusClass}`}
          >
            {status}
          </span>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {(
          [
            ["API Startup", report?.apiStartup],
            ["Swagger", report?.swagger],
            ["Database", report?.database],
            ["Migration", report?.migration],
          ] as const
        ).map(([label, passed]) => (
          <div
            key={label}
            className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-center"
          >
            <p className="text-[10px] text-text-muted mb-1">{label}</p>
            <p
              className={`font-mono text-xs font-bold ${
                passed === undefined
                  ? "text-amber-400"
                  : passed
                    ? "text-emerald-400"
                    : "text-red-400"
              }`}
            >
              {passed === undefined ? "…" : passed ? "PASS" : "FAIL"}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {checkList.length > 0 ? (
          checkList.map((check) => <CheckRow key={check.label} check={check} />)
        ) : (
          <p className="text-center text-[10px] font-mono text-amber-300 animate-pulse">
            Running dotnet run · Swagger · database · migration…
          </p>
        )}
      </div>

      {report && !report.runtimePassed && (
        <p className="mt-3 text-[10px] text-red-400/90 font-mono">
          Export locked — runtime verification requires all checks to pass
        </p>
      )}

      {report?.runtimePassed && (
        <p className="mt-3 text-[10px] text-emerald-400/90 font-mono">
          Runtime passed — API, Swagger, database, and migration verified
        </p>
      )}

      {report?.output && (
        <details className="mt-4 rounded-lg border border-border-subtle bg-surface-1">
          <summary className="cursor-pointer px-3 py-2 text-[10px] font-mono text-cyan-300">
            Full runtime diagnostics
          </summary>
          <pre className="max-h-64 overflow-auto px-3 pb-3 text-[10px] font-mono text-text-muted whitespace-pre-wrap">
            {report.output}
          </pre>
        </details>
      )}
    </Card>
  );
}
