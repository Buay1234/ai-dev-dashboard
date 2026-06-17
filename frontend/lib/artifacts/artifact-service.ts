import { saveAs } from "file-saver";
import type { ArtifactBundle, ProjectArtifact } from "@/app/types/artifacts";
import {
  generateProjectArtifacts,
  getArtifactProgressSteps,
  type AgentOutputs,
} from "./artifact-generator";

/** In-memory store — ready for V23 ZIP / PDF / Excel exporters */
const bundleHistory: ArtifactBundle[] = [];
let latestBundle: ArtifactBundle | null = null;

export function runArtifactGeneration(
  outputs: AgentOutputs,
  requirement: string
): ArtifactBundle {
  const artifacts = generateProjectArtifacts(outputs);
  const bundle: ArtifactBundle = {
    id: `mission-${Date.now()}`,
    artifacts,
    generatedAt: new Date().toISOString(),
    requirement,
  };

  latestBundle = bundle;
  bundleHistory.unshift(bundle);
  return bundle;
}

export function getLatestArtifactBundle(): ArtifactBundle | null {
  return latestBundle;
}

export function getArtifactHistory(): ArtifactBundle[] {
  return [...bundleHistory];
}

export function clearArtifactStore() {
  latestBundle = null;
  bundleHistory.length = 0;
}

export function downloadArtifact(artifact: ProjectArtifact) {
  const mime =
    artifact.type === "sql"
      ? "application/sql"
      : artifact.type === "markdown"
        ? "text/markdown"
        : "text/plain";

  const blob = new Blob([artifact.content], { type: `${mime};charset=utf-8` });
  saveAs(blob, artifact.name);
}

export async function copyArtifactToClipboard(
  artifact: ProjectArtifact
): Promise<void> {
  await navigator.clipboard.writeText(artifact.content);
}

/** V23 — prepare flat file list for ZIP export */
export function prepareZipExportFiles(
  artifacts: ProjectArtifact[]
): { path: string; content: string }[] {
  return artifacts.map((artifact) => ({
    path: `${artifact.agent}/${artifact.name}`,
    content: artifact.content,
  }));
}

/** V23 — prepare manifest for PDF / Excel exporters */
export function prepareExportManifest(bundle: ArtifactBundle) {
  return {
    missionId: bundle.id,
    generatedAt: bundle.generatedAt,
    requirement: bundle.requirement,
    files: bundle.artifacts.map((a) => ({
      name: a.name,
      agent: a.agent,
      type: a.type,
      size: a.content.length,
    })),
  };
}

export { generateProjectArtifacts, getArtifactProgressSteps };
export type { AgentOutputs };
