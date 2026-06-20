"use client";

import type { AutoFixReport } from "@/lib/build/fix-report";
import { downloadAutoFixReportJson } from "@/lib/build/fix-report";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  report: AutoFixReport | null;
  running?: boolean;
};

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "bad" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-red-400"
        : tone === "warn"
          ? "text-amber-400"
          : "text-text-primary";

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-3 text-center">
      <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}

export default function AutoFixReportPanel({ report, running }: Props) {
  if (!report && !running) {
    return (
      <Card padding="md" className="border-emerald-500/20">
        <CardHeader
          title="Auto Fix Report"
          description="Usopp · V26.2 Auto Fix Engine"
        />
        <EmptyState
          icon="🛠️"
          title="No auto-fix report yet"
          description="Auto-fix runs after build failure, then retries dotnet build up to 5 times."
        />
      </Card>
    );
  }

  if (running && !report) {
    return (
      <Card padding="md" className="border-emerald-500/20">
        <CardHeader
          title="Auto Fix Report"
          description="Usopp · V26.2 Auto Fix Engine"
        />
        <p className="text-center text-[10px] font-mono text-amber-300 py-6">
          Applying auto-fixes and rebuilding…
        </p>
      </Card>
    );
  }

  if (!report) return null;

  const buildTone = report.buildStatus === "PASS" ? "good" : "bad";

  return (
    <Card padding="md" className="border-emerald-500/20">
      <CardHeader
        title="Auto Fix Report"
        description="Usopp · V26.2 Auto Fix Engine"
        action={
          <button
            type="button"
            onClick={() => downloadAutoFixReportJson(report)}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/20"
          >
            Export JSON
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Metric label="Fixed Errors" value={report.fixedErrors} tone="good" />
        <Metric label="Remaining Errors" value={report.remainingErrors} tone={report.remainingErrors === 0 ? "good" : "bad"} />
        <Metric label="Retry Count" value={report.attempts} tone="warn" />
        <Metric label="Build Status" value={report.buildStatus} tone={buildTone} />
      </div>

      {report.fixesApplied.length > 0 && (
        <div className="rounded-lg border border-border-subtle bg-slate-950/60 p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
            Fixes Applied
          </p>
          <ul className="max-h-36 overflow-y-auto space-y-1">
            {report.fixesApplied.map((fix, i) => (
              <li key={`${fix}-${i}`} className="text-[10px] font-mono text-cyan-300/90">
                • {fix}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.remainingErrors > 0 && (
        <p className="mt-3 text-[10px] text-amber-400/90 font-mono">
          Export locked — {report.remainingErrors} compiler error(s) remain
        </p>
      )}
    </Card>
  );
}
