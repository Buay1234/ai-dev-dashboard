export type ExecutionStatus = "pending" | "running" | "success" | "failed";

export type CrudOperation = "create" | "read" | "update" | "delete";

export type ExecutionStep = {
  id: string;
  label: string;
  command?: string;
  status: ExecutionStatus;
  agent?: string;
  message?: string;
};

export type EntityCrudResult = {
  entity: string;
  operations: Record<
    CrudOperation,
    { status: ExecutionStatus; detail: string }
  >;
  overall: ExecutionStatus;
};

export type TestRunSummary = {
  total: number;
  passed: number;
  failed: number;
  status: ExecutionStatus;
};

export type DatabasePanelInfo = {
  connection: string;
  databaseName: string;
  migrationStatus: string;
  tableCount: number;
};

export type ExecutionTimelineEvent = {
  id: string;
  timestamp: string;
  agent: string;
  label: string;
  status: ExecutionStatus;
};

export type ExecutionReport = {
  id: string;
  startedAt: string;
  completedAt: string;
  overallStatus: ExecutionStatus;
  steps: ExecutionStep[];
  crudResults: EntityCrudResult[];
  testSummary: TestRunSummary;
  databasePanel: DatabasePanelInfo;
  timeline: ExecutionTimelineEvent[];
  dotnetCommands: string[];
};

export const EXECUTION_STATUS_COLORS: Record<
  ExecutionStatus,
  { text: string; border: string; bg: string }
> = {
  pending: {
    text: "text-zinc-400",
    border: "border-zinc-500/30",
    bg: "bg-zinc-500/10",
  },
  running: {
    text: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  success: {
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
  failed: {
    text: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
  },
};
