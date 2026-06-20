import { saveAs } from "file-saver";
import type { ArtifactBundle, ProjectArtifact } from "@/app/types/artifacts";
import type { GeneratedProjectBundle } from "@/lib/project-generator/types";
import {
  generateProjectArtifacts,
  getArtifactProgressSteps,
  type AgentOutputs,
} from "./artifact-generator";
import {
  generateProjectBundle,
  getProjectGenerationSteps,
} from "@/lib/project-generator";
import type { RequirementAnalysisContract } from "@/lib/requirement-parser";
import type { ArchitectureContract } from "@/lib/domain-library/types";

/** In-memory store — V22 docs + V23 source project */
const bundleHistory: ArtifactBundle[] = [];
const projectHistory: GeneratedProjectBundle[] = [];
let latestBundle: ArtifactBundle | null = null;
let latestProject: GeneratedProjectBundle | null = null;

export function runArtifactGeneration(
  outputs: AgentOutputs,
  requirement: string,
  analysis?: RequirementAnalysisContract | null,
  architecture?: ArchitectureContract | null
): { bundle: ArtifactBundle; project: GeneratedProjectBundle } {
  const artifacts = generateProjectArtifacts(outputs);
  const project = generateProjectBundle(outputs, requirement, analysis, architecture);

  const bundle: ArtifactBundle = {
    id: `mission-${Date.now()}`,
    artifacts,
    generatedAt: new Date().toISOString(),
    requirement,
  };

  latestBundle = bundle;
  latestProject = project;
  bundleHistory.unshift(bundle);
  projectHistory.unshift(project);
  return { bundle, project };
}

export function getLatestProjectBundle(): GeneratedProjectBundle | null {
  return latestProject;
}

export function getProjectHistory(): GeneratedProjectBundle[] {
  return [...projectHistory];
}

export function getLatestArtifactBundle(): ArtifactBundle | null {
  return latestBundle;
}

export function getArtifactHistory(): ArtifactBundle[] {
  return [...bundleHistory];
}

export function clearArtifactStore() {
  latestBundle = null;
  latestProject = null;
  bundleHistory.length = 0;
  projectHistory.length = 0;
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

export { generateProjectArtifacts, getArtifactProgressSteps, getProjectGenerationSteps };
export type { AgentOutputs };
