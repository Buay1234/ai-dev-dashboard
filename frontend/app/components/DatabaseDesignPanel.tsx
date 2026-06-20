"use client";

import { motion } from "framer-motion";
import type { DatabaseDesignContract } from "@/lib/database-designer";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  contract: DatabaseDesignContract | null;
  loading?: boolean;
};

function ErDiagramView({
  contract,
}: {
  contract: DatabaseDesignContract;
}) {
  const { nodes, edges } = contract.erDiagram;

  return (
    <div className="rounded-lg border border-emerald-500/20 bg-slate-950/60 p-4 overflow-x-auto">
      <svg
        viewBox={`0 0 ${Math.max(nodes.length * 140, 320)} ${Math.max(edges.length * 40 + 120, 180)}`}
        className="min-w-full h-40"
        role="img"
        aria-label="Entity relationship diagram"
      >
        {nodes.map((node, index) => {
          const x = 20 + index * 130;
          const y = 40;
          return (
            <g key={node.id}>
              <rect
                x={x}
                y={y}
                width={110}
                height={36}
                rx={6}
                fill="rgba(16,185,129,0.15)"
                stroke="rgba(16,185,129,0.5)"
              />
              <text
                x={x + 55}
                y={y + 22}
                textAnchor="middle"
                fill="#6ee7b7"
                fontSize={10}
                fontFamily="monospace"
              >
                {node.label.length > 12 ? `${node.label.slice(0, 11)}…` : node.label}
              </text>
            </g>
          );
        })}
        {edges.map((edge, index) => {
          const fromIndex = nodes.findIndex((n) => n.id === edge.from);
          const toIndex = nodes.findIndex((n) => n.id === edge.to);
          if (fromIndex < 0 || toIndex < 0) return null;
          const x1 = 20 + fromIndex * 130 + 110;
          const y1 = 58;
          const x2 = 20 + toIndex * 130;
          const y2 = 58;
          const midY = 90 + index * 18;
          return (
            <g key={edge.id}>
              <path
                d={`M ${x1} ${y1} C ${x1 + 30} ${midY}, ${x2 - 30} ${midY}, ${x2} ${y2}`}
                fill="none"
                stroke="rgba(56,189,248,0.5)"
                strokeWidth={1}
              />
              <text
                x={(x1 + x2) / 2}
                y={midY - 4}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={8}
                fontFamily="monospace"
              >
                {edge.cardinality}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-[10px] font-mono text-text-muted text-center">
        {nodes.length} entities · {edges.length} relationships
      </p>
    </div>
  );
}

export default function DatabaseDesignPanel({ contract, loading }: Props) {
  if (!contract && !loading) {
    return (
      <Card padding="md" className="border-emerald-500/20">
        <CardHeader
          title="Database Design"
          description="V31 · Database Relationship Designer"
        />
        <EmptyState
          icon="🗄️"
          title="No database design yet"
          description="Start a mission to analyze entities, foreign keys, cascade rules, and ER relationships."
        />
      </Card>
    );
  }

  return (
    <Card padding="md" className="border-emerald-500/20">
      <CardHeader
        title="Database Design"
        description="V31 · Database Relationship Designer"
        action={
          contract ? (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-300">
              {contract.relationships.length} relationships
            </span>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
            Entities
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {(contract?.entities ?? []).map((entity, index) => (
              <span
                key={`${entity}-${index}`}
                className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
            Foreign Keys
          </p>
          <ul className="space-y-1 max-h-24 overflow-y-auto">
            {(contract?.foreignKeys ?? []).map((fk, index) => (
              <li
                key={`${fk.entity}-${fk.property}-${index}`}
                className="text-[10px] font-mono text-cyan-300/90"
              >
                {fk.entity}.{fk.property} → {fk.referencesEntity}
              </li>
            ))}
            {!contract?.foreignKeys.length && (
              <li className="text-[10px] text-text-muted">None detected</li>
            )}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
            Relationships
          </p>
          <ul className="space-y-1 max-h-28 overflow-y-auto">
            {(contract?.relationships ?? []).map((rel) => (
              <li key={rel.id} className="text-[10px] font-mono text-violet-300/90">
                {rel.principalEntity} → {rel.dependentEntity}{" "}
                <span className="text-text-muted">({rel.cardinality})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
            Cascade Rules
          </p>
          <ul className="space-y-1 max-h-28 overflow-y-auto">
            {(contract?.cascadeRules ?? []).map((rule) => (
              <li key={rule.relationshipId} className="text-[10px] font-mono text-amber-300/90">
                {rule.from} → {rule.to}:{" "}
                <span className="text-amber-200">{rule.onDelete}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {contract && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
            ER Diagram
          </p>
          <ErDiagramView contract={contract} />
        </div>
      )}

      {contract && (
        <p className="mt-3 text-[10px] text-emerald-300/80 font-mono">
          Database contract applied to Entity Generator · Migration Generator · Usopp QA
        </p>
      )}

      {loading && !contract && (
        <motion.p
          className="mt-3 text-center text-[10px] font-mono text-emerald-300"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          Designing database relationships…
        </motion.p>
      )}
    </Card>
  );
}
