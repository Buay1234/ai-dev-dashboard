"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GeneratedProjectBundle, GeneratedSourceFile } from "@/lib/project-generator/types";
import { AGENT_THEME_STYLES } from "@/lib/agents/config";
import {
  copySourceFileContent,
  downloadSourceFile,
  exportGeneratedProjectZip,
} from "@/lib/export-project-zip";
import type { ArtifactBundle } from "@/app/types/artifacts";
import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  project: GeneratedProjectBundle | null;
  artifactBundle?: ArtifactBundle | null;
};

const CATEGORIES: {
  key: GeneratedSourceFile["category"];
  title: string;
  icon: string;
}[] = [
  { key: "entity", title: "Entity Classes", icon: "🧩" },
  { key: "migration", title: "Migrations & SQL", icon: "🗄️" },
  { key: "infrastructure", title: "DbContext, Configurations & Repos", icon: "⚙️" },
  { key: "controller", title: "Controllers & DTOs", icon: "🌐" },
  { key: "test", title: "Unit Tests", icon: "🧪" },
  { key: "docs", title: "Documentation", icon: "📄" },
];

function fileIcon(file: GeneratedSourceFile) {
  if (file.language === "sql") return "🗄️";
  if (file.fileName.endsWith(".cs")) return "💻";
  return "📄";
}

function PreviewBody({ file }: { file: GeneratedSourceFile }) {
  if (file.language === "sql") {
    return (
      <pre className="overflow-x-auto rounded-lg border border-emerald-500/20 bg-slate-950 p-4 text-xs leading-relaxed text-emerald-100 font-mono whitespace-pre-wrap">
        {file.content}
      </pre>
    );
  }

  if (file.language === "markdown") {
    return (
      <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-slate-950 p-4 text-xs leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">
        {file.content}
      </pre>
    );
  }

  return (
    <pre className="overflow-x-auto rounded-lg border border-violet-500/20 bg-slate-950 p-4 text-xs leading-relaxed text-violet-100 font-mono whitespace-pre-wrap">
      {file.content}
    </pre>
  );
}

function SourceFileRow({
  file,
  onPreview,
}: {
  file: GeneratedSourceFile;
  onPreview: (file: GeneratedSourceFile) => void;
}) {
  const [copied, setCopied] = useState(false);
  const themeKey =
    file.agent === "Robin"
      ? "purple"
      : file.agent === "Zoro"
        ? "green"
        : file.agent === "Nami"
          ? "orange"
          : file.agent === "Franky"
            ? "blue"
            : file.agent === "Usopp"
              ? "yellow"
              : "purple";
  const theme = AGENT_THEME_STYLES[themeKey];

  const handleCopy = useCallback(async () => {
    await copySourceFileContent(file);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [file]);

  const displayPath = file.path ? `${file.path}/${file.fileName}` : file.fileName;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-1 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-2">
        <span className="text-lg">{fileIcon(file)}</span>
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold text-text-primary">
            {displayPath}
          </p>
          <p className="text-[10px] text-text-muted">
            <span style={{ color: theme.text }}>{file.agent}</span>
            {" · "}
            {file.language.toUpperCase()}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => downloadSourceFile(file)}
          className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-300"
        >
          Download
        </button>
        <button
          type="button"
          onClick={() => onPreview(file)}
          className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-[10px] text-purple-300"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-[10px] text-slate-300"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </li>
  );
}

export default function GeneratedFilesPanel({ project, artifactBundle }: Props) {
  const [preview, setPreview] = useState<GeneratedSourceFile | null>(null);

  const grouped = useMemo(() => {
    if (!project) return [];
    return CATEGORIES.map((cat) => ({
      ...cat,
      files: project.sourceFiles.filter((f) => f.category === cat.key),
    })).filter((g) => g.files.length > 0);
  }, [project]);

  const codeFileCount =
    project?.sourceFiles.filter((f) => f.language === "csharp").length ?? 0;

  return (
    <>
      <Card padding="md" className="border-violet-500/25">
        <CardHeader
          title="Generated Files Panel"
          description="Real Database & Migration Generator · V25"
          action={
            project ? (
              <button
                type="button"
                onClick={() =>
                  void exportGeneratedProjectZip(project, artifactBundle)
                }
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/20"
              >
                Export ZIP
              </button>
            ) : undefined
          }
        />

        {!project ? (
          <EmptyState
            icon="💻"
            title="No source files yet"
            description="Complete a mission to generate EF Core entities, migrations, CRUD APIs, and xUnit tests."
          />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3 text-xs text-text-muted">
              <span>{project.entities.length} entities</span>
              <span>·</span>
              <span>{codeFileCount} .cs files</span>
              <span>·</span>
              <span>{project.sourceFiles.length} total files</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {project.entities.map((e) => (
                <span
                  key={e.name}
                  className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[10px] font-mono text-purple-300"
                >
                  {e.name}
                </span>
              ))}
            </div>

            {grouped.map((group) => (
              <div key={group.key}>
                <h3 className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-text-muted">
                  <span>{group.icon}</span>
                  {group.title}
                  <span className="text-zinc-600">({group.files.length})</span>
                </h3>
                <ul className="space-y-2">
                  {group.files.map((file) => (
                    <SourceFileRow
                      key={file.id}
                      file={file}
                      onPreview={setPreview}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AnimatePresence>
        {preview && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
            role="dialog"
            aria-modal
            aria-label={`Preview ${preview.fileName}`}
          >
            <motion.div
              className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-violet-500/30 bg-slate-900 shadow-2xl"
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
                <div>
                  <p className="font-mono text-sm font-semibold text-text-primary">
                    {preview.path}/{preview.fileName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {preview.agent} · {preview.category}
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
                <PreviewBody file={preview} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
