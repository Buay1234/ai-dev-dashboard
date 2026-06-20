import type { EntityDefinition, GeneratedSourceFile } from "@/lib/project-generator/types";

export type GeneratedPageKind = "dashboard" | "list" | "create" | "edit" | "redirect";

export type GeneratedPage = {
  route: string;
  entity?: string;
  kind: GeneratedPageKind;
  filePath: string;
};

export type GeneratedPages = {
  total: number;
  items: GeneratedPage[];
};

export type GeneratedComponentKind = "ui" | "layout" | "entity" | "error";

export type GeneratedComponent = {
  name: string;
  filePath: string;
  kind: GeneratedComponentKind;
};

export type GeneratedComponents = {
  total: number;
  items: GeneratedComponent[];
};

export type FrontendBuildCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type BuildStatus = {
  passed: boolean;
  fileCount: number;
  pageCount: number;
  componentCount: number;
  serviceCount: number;
  checks: FrontendBuildCheck[];
};

export type FrontendGenerationResult = {
  agent: "Nami";
  version: "V32";
  generatedAt: string;
  entities: string[];
  sourceFiles: GeneratedSourceFile[];
  pages: GeneratedPages;
  components: GeneratedComponents;
  buildStatus: BuildStatus;
};

export type FrontendGeneratorInput = {
  entities: EntityDefinition[];
  designContract?: import("@/lib/design-generator/types").DesignContract;
};
