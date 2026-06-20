"use client";

import type { ApiBindingGenerationResult } from "@/lib/api-binding-generator/types";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  result: ApiBindingGenerationResult | null | undefined;
};

export default function ApiBindingPanel({ result }: Props) {
  if (!result) {
    return (
      <Card padding="md" className="border-teal-500/20">
        <CardHeader
          title="API Auto Binding"
          description="Jinbe · V34 Swagger Integration"
        />
        <EmptyState
          icon="🔗"
          title="No API bindings generated yet"
          description="Run a mission to parse Swagger/OpenAPI and generate types, services, and React Query hooks."
        />
      </Card>
    );
  }

  const statusClass = result.buildStatus.passed
    ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
    : "text-red-400 border-red-500/40 bg-red-500/10";

  return (
    <Card padding="md" className="border-teal-500/20">
      <CardHeader
        title="API Auto Binding"
        description="Jinbe · V34 Swagger Integration"
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
            ["Types", result.buildStatus.typeCount],
            ["Services", result.buildStatus.serviceCount],
            ["Hooks", result.buildStatus.hookCount],
            ["Operations", result.buildStatus.operationCount],
          ] as const
        ).map(([label, count]) => (
          <div
            key={label}
            className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-center"
          >
            <p className="text-[10px] text-text-muted">{label}</p>
            <p className="font-mono text-sm font-bold text-teal-300">{count}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] font-mono text-text-muted mb-2">
        OpenAPI {result.contract.openapiVersion} · {result.contract.title} · Entities:{" "}
        {result.entities.join(", ")}
      </p>

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {result.buildStatus.checks.map((check) => (
          <div
            key={check.id}
            className={`rounded px-2 py-1 text-[10px] font-mono ${
              check.passed ? "text-emerald-400/90" : "text-red-400/90"
            }`}
          >
            [{check.passed ? "PASS" : "FAIL"}] {check.label} — {check.detail}
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] font-mono text-text-muted">
        Outputs: generated/types/ · generated/services/ · generated/hooks/ · openapi.json
      </p>
    </Card>
  );
}
