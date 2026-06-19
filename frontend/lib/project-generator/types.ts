export type EntityField = {
  name: string;
  csharpType: string;
  sqlType: string;
  isRequired: boolean;
  isKey: boolean;
  isForeignKey?: boolean;
  fkEntity?: string;
};

export type EntityDefinition = {
  name: string;
  tableName: string;
  fields: EntityField[];
};

export type GeneratedSourceFile = {
  id: string;
  path: string;
  fileName: string;
  category: "entity" | "migration" | "controller" | "test" | "infrastructure" | "docs";
  agent: string;
  language: "csharp" | "sql" | "markdown";
  content: string;
};

import type { DatabaseWorkflowState } from "@/lib/database/database-status";
import type { ProjectArtifact } from "@/app/types/artifacts";

export type GeneratedProjectBundle = {
  id: string;
  generatedAt: string;
  requirement: string;
  entities: EntityDefinition[];
  sourceFiles: GeneratedSourceFile[];
  databaseWorkflow: DatabaseWorkflowState;
  migrationArtifacts: ProjectArtifact[];
};

export const PROJECT_NAMESPACE = "MyProject";
