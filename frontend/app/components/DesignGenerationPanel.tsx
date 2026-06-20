"use client";

import type { DesignGenerationResult } from "@/lib/design-generator/types";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  result: DesignGenerationResult | null | undefined;
};

function gradeClass(grade: string) {
  if (grade === "A" || grade === "B") {
    return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
  }
  if (grade === "C") {
    return "text-amber-400 border-amber-500/40 bg-amber-500/10";
  }
  return "text-red-400 border-red-500/40 bg-red-500/10";
}

export default function DesignGenerationPanel({ result }: Props) {
  if (!result) {
    return (
      <Card padding="md" className="border-red-500/20">
        <CardHeader title="Design Generation" description="Sanji · V33 UI/UX Designer" />
        <EmptyState
          icon="🎨"
          title="No design artifacts yet"
          description="Run a mission to generate navigation, wireframes, design system, and UX quality score before frontend generation."
        />
      </Card>
    );
  }

  const wireframeCount = result.sourceFiles.filter((f) => f.path.includes("wireframes")).length;
  const designFileCount = result.sourceFiles.filter((f) => !f.path.includes("wireframes")).length;

  return (
    <Card padding="md" className="border-red-500/20">
      <CardHeader
        title="Design Generation"
        description="Sanji · V33 UI/UX Designer"
        action={
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${gradeClass(result.uxQuality.grade)}`}
          >
            {result.uxQuality.percentage}% · {result.uxQuality.grade}
          </span>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {(
          [
            ["UX Score", `${result.uxQuality.percentage}%`],
            ["Design Files", designFileCount],
            ["Wireframes", wireframeCount],
            ["Nav Items", result.contract.navigation.primary.length],
          ] as const
        ).map(([label, count]) => (
          <div
            key={label}
            className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-center"
          >
            <p className="text-[10px] text-text-muted">{label}</p>
            <p className="font-mono text-sm font-bold text-red-300">{count}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] font-mono text-text-muted mb-2">
        Domain: {result.domain} · Entities: {result.entities.join(", ")}
      </p>

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {result.uxQuality.metrics.map((metric) => (
          <div
            key={metric.id}
            className={`rounded px-2 py-1 text-[10px] font-mono ${
              metric.passed ? "text-emerald-400/90" : "text-amber-400/90"
            }`}
          >
            [{metric.passed ? "PASS" : "WARN"}] {metric.label} — {metric.score}/{metric.maxScore}
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] font-mono text-text-muted">
        Outputs: design/navigation.json · design-system.json · dashboard-layout.json · userflow.md · wireframes/
      </p>
    </Card>
  );
}
