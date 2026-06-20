"use client";

import { motion } from "framer-motion";
import type { ExecutionReport, ExecutionStatus } from "@/lib/execution/execution-types";
import { EXECUTION_STATUS_COLORS } from "@/lib/execution/execution-types";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  report: ExecutionReport | null;
  liveSteps?: ExecutionReport["steps"];
};

const CRUD_LABELS = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
} as const;

export default function ExecutionCenterPanel({ report, liveSteps }: Props) {
  const steps = liveSteps ?? report?.steps ?? [];
  const crudResults = report?.crudResults ?? [];
  const tests = report?.testSummary;

  if (!report && steps.length === 0) {
    return (
      <Card padding="md" className="border-violet-500/25">
        <CardHeader
          title="Execution Center"
          description="Real Database CRUD Execution · V25"
        />
        <EmptyState
          icon="⚡"
          title="No execution yet"
          description="Complete a mission — Usopp will validate CRUD and run unit tests."
        />
      </Card>
    );
  }

  const overall = report?.overallStatus ?? "running";
  const colors = EXECUTION_STATUS_COLORS[overall];

  return (
    <Card padding="md" className="border-violet-500/25">
      <CardHeader
        title="Execution Center"
        description="Real Database CRUD Execution · V25"
        action={
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${colors.text} ${colors.border} ${colors.bg}`}
          >
            {overall}
          </span>
        }
      />

      <div className="mb-5 space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
          Pipeline Steps
        </p>
        <ul className="space-y-2">
          {steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </ul>
      </div>

      {crudResults.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-text-muted">
            CRUD Validation · Usopp
          </p>
          <div className="space-y-2">
            {crudResults.map((row) => (
              <div
                key={row.entity}
                className="rounded-lg border border-border-subtle bg-surface-1 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">
                    {row.entity}
                  </span>
                  <StatusBadge status={row.overall} />
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(Object.keys(CRUD_LABELS) as (keyof typeof CRUD_LABELS)[]).map(
                    (op) => (
                      <div
                        key={op}
                        className={`rounded px-1.5 py-1 text-center text-[9px] font-mono ${
                          row.operations[op].status === "success"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : row.operations[op].status === "failed"
                              ? "bg-red-500/15 text-red-400"
                              : "bg-zinc-800 text-zinc-500"
                        }`}
                        title={row.operations[op].detail}
                      >
                        {CRUD_LABELS[op]}
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tests && (
        <div className="rounded-lg border border-border-subtle bg-slate-950/80 p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">
            Unit Test Summary · Usopp
          </p>
          <p className="text-[10px] text-amber-400/80 font-mono mb-3">
            Structural simulation only — see Build Status for real dotnet compiler results
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Total" value={tests.total} />
            <Stat label="Passed" value={tests.passed} accent="text-emerald-400" />
            <Stat label="Failed" value={tests.failed} accent="text-red-400" />
          </div>
          <div className="mt-3 flex justify-center">
            <StatusBadge status={tests.status} />
          </div>
        </div>
      )}

      {report?.dotnetCommands && (
        <div className="mt-4 rounded-lg border border-border-subtle bg-surface-1 p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-500/70 mb-2">
            Ready for Visual Studio / CLI
          </p>
          <ul className="space-y-1">
            {report.dotnetCommands.map((cmd) => (
              <li
                key={cmd}
                className="font-mono text-[10px] text-slate-400 break-all"
              >
                {cmd}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function StepRow({ step }: { step: ExecutionReport["steps"][0] }) {
  const colors = EXECUTION_STATUS_COLORS[step.status];
  return (
    <motion.li
      layout
      className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2"
    >
      <span
        className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase ${colors.text} ${colors.bg}`}
      >
        {step.status}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-text-primary">{step.label}</p>
        {step.message && (
          <p className="text-[10px] text-text-muted mt-0.5">{step.message}</p>
        )}
        {step.command && (
          <p className="font-mono text-[9px] text-cyan-500/60 mt-1">{step.command}</p>
        )}
      </div>
      {step.agent && (
        <span className="text-[10px] text-text-muted shrink-0">{step.agent}</span>
      )}
    </motion.li>
  );
}

function StatusBadge({ status }: { status: ExecutionStatus }) {
  const c = EXECUTION_STATUS_COLORS[status];
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase ${c.text} ${c.border} ${c.bg}`}
    >
      {status}
    </span>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className={`text-lg font-bold ${accent ?? "text-text-primary"}`}>
        {value}
      </p>
    </div>
  );
}
