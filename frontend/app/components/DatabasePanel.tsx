"use client";

import type { DatabasePanelInfo } from "@/lib/execution/execution-types";
import type { DatabaseWorkflowState } from "@/lib/database/database-status";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  panelInfo: DatabasePanelInfo | null;
  workflow: DatabaseWorkflowState | null;
};

export default function DatabasePanel({ panelInfo, workflow }: Props) {
  if (!panelInfo && !workflow) {
    return (
      <Card padding="md" className="border-emerald-500/20">
        <CardHeader
          title="Database Panel"
          description="Connection & migration status · V25"
        />
        <EmptyState
          icon="🗄️"
          title="No database info"
          description="Run a mission to configure SQL Server connection and migrations."
        />
      </Card>
    );
  }

  const connection =
    panelInfo?.connection ??
    workflow?.efCommands[1]?.replace(/.*Connection=/, "") ??
    "—";
  const dbName = panelInfo?.databaseName ?? "MyProjectDb";
  const migrationStatus =
    panelInfo?.migrationStatus ??
    workflow?.statusLabel ??
    "Pending";
  const tableCount = panelInfo?.tableCount ?? 0;

  return (
    <Card padding="md" className="border-emerald-500/20">
      <CardHeader
        title="Database Panel"
        description="Connection & migration status · V25"
        action={
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
            SQL Server
          </span>
        }
      />

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Connection" value={truncateConnection(connection)} mono />
        <Field label="Database Name" value={dbName} />
        <Field label="Migration Status" value={migrationStatus} highlight />
        <Field label="Table Count" value={String(tableCount)} />
      </dl>

      {workflow?.efCommands && (
        <div className="mt-4 rounded-lg border border-border-subtle bg-slate-950/60 p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
            EF Core commands
          </p>
          {workflow.efCommands.map((cmd) => (
            <p
              key={cmd}
              className="font-mono text-[10px] text-emerald-300/80 break-all"
            >
              {cmd}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}

function truncateConnection(value: string) {
  if (value.length <= 48) return value;
  return value.slice(0, 45) + "…";
}

function Field({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
      <dt className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm font-semibold break-all ${
          highlight ? "text-amber-300" : "text-text-primary"
        } ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
