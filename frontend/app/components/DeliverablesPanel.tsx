"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ArtifactBundle, ProjectArtifact } from "@/app/types/artifacts";
import { AGENT_THEME_STYLES } from "@/lib/agents/config";
import {
  copyArtifactToClipboard,
  downloadArtifact,
} from "@/lib/artifacts/artifact-service";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  bundle: ArtifactBundle | null;
  history: ArtifactBundle[];
};

function artifactIcon(type: string, name: string) {
  if (type === "sql" || name.endsWith(".sql")) return "🗄️";
  if (name.endsWith(".md")) return "📄";
  return "📝";
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString();
}

function PreviewBody({ artifact }: { artifact: ProjectArtifact }) {
  if (artifact.type === "sql") {
    return (
      <pre className="overflow-x-auto rounded-lg border border-emerald-500/20 bg-slate-950 p-4 text-xs leading-relaxed text-emerald-100 font-mono whitespace-pre-wrap">
        {artifact.content}
      </pre>
    );
  }

  if (artifact.type === "markdown") {
    return (
      <div className="prose prose-invert prose-sm max-w-none rounded-lg border border-border-subtle bg-slate-950/80 p-4">
        <MarkdownPreview content={artifact.content} />
      </div>
    );
  }

  return (
    <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-slate-950 p-4 text-xs leading-relaxed text-text-secondary font-mono whitespace-pre-wrap">
      {artifact.content}
    </pre>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2 text-sm text-slate-200">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-lg font-bold text-cyan-300">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-base font-semibold text-purple-300">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="text-sm font-semibold text-orange-300">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-2 border-cyan-500/40 pl-3 text-slate-400 italic"
            >
              {line.slice(2)}
            </blockquote>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <li key={i} className="ml-4 list-disc text-slate-300">
              {line.slice(2)}
            </li>
          );
        }
        if (!line.trim()) return <div key={i} className="h-2" />;
        return (
          <p key={i} className="text-slate-300 leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function ArtifactRow({
  artifact,
  onPreview,
}: {
  artifact: ProjectArtifact;
  onPreview: (artifact: ProjectArtifact) => void;
}) {
  const [copied, setCopied] = useState(false);
  const theme =
    AGENT_THEME_STYLES[
      artifact.agent === "Robin"
        ? "purple"
        : artifact.agent === "Zoro"
          ? "green"
          : artifact.agent === "Nami"
            ? "orange"
            : artifact.agent === "Franky"
              ? "blue"
              : "yellow"
    ];

  const handleCopy = useCallback(async () => {
    await copyArtifactToClipboard(artifact);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [artifact]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-1 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="text-2xl" aria-hidden>
          {artifactIcon(artifact.type, artifact.name)}
        </span>
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-text-primary truncate">
            {artifact.name}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            <span style={{ color: theme.text }}>{artifact.agent}</span>
            {" · "}
            {formatTimestamp(artifact.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadArtifact(artifact)}
          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
        >
          Download
        </button>
        <button
          type="button"
          onClick={() => onPreview(artifact)}
          className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 transition hover:bg-purple-500/20"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </motion.li>
  );
}

export default function DeliverablesPanel({ bundle, history }: Props) {
  const [preview, setPreview] = useState<ProjectArtifact | null>(null);

  const artifacts = bundle?.artifacts ?? [];
  const missionCount = history.length;

  const grouped = useMemo(() => {
    const order = ["Robin", "Zoro", "Nami", "Franky", "Usopp"];
    return order.map((agent) => ({
      agent,
      items: artifacts.filter((a) => a.agent === agent),
    }));
  }, [artifacts]);

  return (
    <>
      <Card padding="md" className="border-cyan-500/20">
        <CardHeader
          title="Deliverables Panel"
          description="Project Artifact Generator · V22"
          action={
            bundle ? (
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-300">
                {artifacts.length} files
              </span>
            ) : undefined
          }
        />

        {!bundle ? (
          <EmptyState
            icon="📦"
            title="No artifacts yet"
            description="Complete a mission to auto-generate Requirement.md, API-Spec.md, Database.sql, and more."
          />
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-text-muted">
              Generated {formatTimestamp(bundle.generatedAt)}
              {missionCount > 1 && ` · ${missionCount} missions in history`}
            </p>

            {grouped.map(({ agent, items }) =>
              items.length > 0 ? (
                <div key={agent}>
                  <h3 className="mb-2 text-[10px] font-mono uppercase tracking-widest text-text-muted">
                    {agent}
                  </h3>
                  <ul className="space-y-2">
                    {items.map((artifact) => (
                      <ArtifactRow
                        key={artifact.id}
                        artifact={artifact}
                        onPreview={setPreview}
                      />
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </div>
        )}
      </Card>

      <AnimatePresence>
        {preview && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
            role="dialog"
            aria-modal
            aria-label={`Preview ${preview.name}`}
          >
            <motion.div
              className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-cyan-500/30 bg-slate-900 shadow-2xl"
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
                <div>
                  <p className="font-mono text-sm font-semibold text-text-primary">
                    {preview.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {preview.agent} · {preview.type} preview
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-lg px-3 py-1.5 text-sm text-text-muted hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <PreviewBody artifact={preview} />
              </div>
              <div className="flex gap-2 border-t border-border-subtle px-5 py-4">
                <button
                  type="button"
                  onClick={() => downloadArtifact(preview)}
                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-medium text-cyan-300"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => void copyArtifactToClipboard(preview)}
                  className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300"
                >
                  Copy
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
