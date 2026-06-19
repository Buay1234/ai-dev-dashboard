"use client";

import { motion } from "framer-motion";
import type { DatabaseWorkflowState } from "@/lib/database/database-status";
import { STATUS_COLORS } from "@/lib/database/database-status";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  workflow: DatabaseWorkflowState | null;
  onSimulateApply?: () => void;
};

export default function DatabaseStatusPanel({ workflow, onSimulateApply }: Props) {
  if (!workflow) {
    return (
      <Card padding="md" className="border-emerald-500/20">
        <CardHeader
          title="Database Status"
          description="EF Core Migration Runner · V24"
        />
        <EmptyState
          icon="🗄️"
          title="No database workflow"
          description="Complete a mission to generate DbContext, migrations, and connection status."
        />
      </Card>
    );
  }

  const colors = STATUS_COLORS[workflow.statusLabel];
  const canApply =
    workflow.migrationState === "pending" && onSimulateApply;

  return (
    <Card padding="md" className="border-emerald-500/20">
      <CardHeader
        title="Database Status"
        description="EF Core Migration Runner · V24"
        action={
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${colors.text} ${colors.border} ${colors.bg}`}
          >
            {workflow.statusLabel}
          </span>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <StatusTile
          label="Connection"
          value={workflow.connectionState === "connected" ? "Connected" : "Disconnected"}
          active={workflow.connectionState === "connected"}
        />
        <StatusTile
          label="Migration"
          value={
            workflow.migrationState === "applied"
              ? "Applied"
              : workflow.migrationState === "pending"
                ? "Pending"
                : "None"
          }
          active={workflow.migrationState === "applied"}
          warn={workflow.migrationState === "pending"}
        />
        <StatusTile
          label="Tables"
          value={`${workflow.migrationFileNames.length > 0 ? "Ready" : "—"}`}
          active={workflow.migrationFileNames.length > 0}
        />
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
          EF Core CLI (Visual Studio 2022)
        </p>
        <ul className="space-y-1.5">
          {workflow.efCommands.map((cmd) => (
            <li
              key={cmd}
              className="rounded bg-slate-950 px-2 py-1.5 font-mono text-[10px] text-emerald-300/90 break-all"
            >
              {cmd}
            </li>
          ))}
        </ul>
      </div>

      {canApply && (
        <motion.button
          type="button"
          onClick={onSimulateApply}
          className="mt-4 w-full rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2 text-xs font-mono uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20"
          whileTap={{ scale: 0.98 }}
        >
          Simulate dotnet ef database update
        </motion.button>
      )}

      {workflow.migrationState === "applied" && (
        <p className="mt-3 text-center text-[10px] font-mono text-emerald-400/80">
          ✓ Migration Applied — database schema ready
        </p>
      )}
    </Card>
  );
}

function StatusTile({
  label,
  value,
  active,
  warn,
}: {
  label: string;
  value: string;
  active?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 text-center ${
        active
          ? "border-emerald-500/30 bg-emerald-500/10"
          : warn
            ? "border-amber-500/30 bg-amber-500/10"
            : "border-border-subtle bg-surface-1"
      }`}
    >
      <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          active ? "text-emerald-300" : warn ? "text-amber-300" : "text-text-secondary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
