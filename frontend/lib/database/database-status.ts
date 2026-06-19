export type DatabaseConnectionState = "disconnected" | "connected";

export type MigrationState = "none" | "pending" | "applied";

export type DatabaseStatusLabel =
  | "Disconnected"
  | "Connected"
  | "Pending Migration"
  | "Migration Applied";

export type MigrationProgressStep = {
  id: string;
  label: string;
  done: boolean;
  agent?: string;
};

export type DatabaseWorkflowState = {
  connectionState: DatabaseConnectionState;
  migrationState: MigrationState;
  statusLabel: DatabaseStatusLabel;
  preview: string;
  progressSteps: MigrationProgressStep[];
  efCommands: string[];
  migrationFileNames: string[];
  updatedAt: string;
};

export function resolveStatusLabel(
  connection: DatabaseConnectionState,
  migration: MigrationState
): DatabaseStatusLabel {
  if (connection === "disconnected") return "Disconnected";
  if (migration === "applied") return "Migration Applied";
  if (migration === "pending") return "Pending Migration";
  return "Connected";
}

export const STATUS_COLORS: Record<
  DatabaseStatusLabel,
  { text: string; border: string; bg: string }
> = {
  Disconnected: {
    text: "text-zinc-400",
    border: "border-zinc-500/30",
    bg: "bg-zinc-500/10",
  },
  Connected: {
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
  "Pending Migration": {
    text: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  "Migration Applied": {
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
  },
};
