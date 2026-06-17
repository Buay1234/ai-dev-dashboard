export interface ProjectArtifact {
  id: string;
  name: string;
  type: string;
  content: string;
  agent: string;
  createdAt: string;
}

export type ArtifactBundle = {
  id: string;
  artifacts: ProjectArtifact[];
  generatedAt: string;
  requirement: string;
};

export type ArtifactProgressStep = {
  id: string;
  label: string;
  done: boolean;
};
