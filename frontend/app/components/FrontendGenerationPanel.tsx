"use client";

import type { FrontendGenerationResult } from "@/lib/frontend-generator/types";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  result: FrontendGenerationResult | null | undefined;
};

export default function FrontendGenerationPanel({ result }: Props) {
  if (!result) {
    return (
      <Card padding="md" className="border-orange-500/20">
        <CardHeader title="Frontend Generation" description="Nami · V32 Next.js Generator" />
        <EmptyState
          icon="🎨"
          title="No frontend generated yet"
          description="Run a mission to generate the Next.js CRUD frontend from domain entities."
        />
      </Card>
    );
  }

  const statusClass = result.buildStatus.passed
    ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
    : "text-red-400 border-red-500/40 bg-red-500/10";

  return (
    <Card padding="md" className="border-orange-500/20">
      <CardHeader
        title="Frontend Generation"
        description="Nami · V32 Next.js Generator"
        action={
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${statusClass}`}
          >
            {result.buildStatus.passed ? "PASS" : "FAIL"}
          </span>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {(
          [
            ["Files", result.buildStatus.fileCount],
            ["Pages", result.buildStatus.pageCount],
            ["Components", result.buildStatus.componentCount],
            ["Services", result.buildStatus.serviceCount],
          ] as const
        ).map(([label, count]) => (
          <div
            key={label}
            className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-center"
          >
            <p className="text-[10px] text-text-muted">{label}</p>
            <p className="font-mono text-sm font-bold text-orange-300">{count}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] font-mono text-text-muted mb-2">
        Entities: {result.entities.join(", ")}
      </p>

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {result.buildStatus.checks.map((check) => (
          <div
            key={check.id}
            className={`rounded px-2 py-1 text-[10px] font-mono ${
              check.passed ? "text-emerald-400/90" : "text-red-400/90"
            }`}
          >
            [{check.passed ? "PASS" : "FAIL"}] {check.label}
          </div>
        ))}
      </div>
    </Card>
  );
}
