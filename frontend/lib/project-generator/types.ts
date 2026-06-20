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
  category: "entity" | "migration" | "controller" | "test" | "infrastructure" | "docs" | "frontend" | "design";
  agent: string;
  language: "csharp" | "sql" | "markdown" | "typescript" | "json" | "css";
  content: string;
};

import type { DatabaseWorkflowState } from "@/lib/database/database-status";
import type { ProjectArtifact } from "@/app/types/artifacts";
import type { FrontendGenerationResult } from "@/lib/frontend-generator/types";
import type { DesignGenerationResult } from "@/lib/design-generator/types";
import type { ApiBindingGenerationResult } from "@/lib/api-binding-generator/types";

export type GeneratedProjectBundle = {
  id: string;
  generatedAt: string;
  requirement: string;
  entities: EntityDefinition[];
  sourceFiles: GeneratedSourceFile[];
  databaseWorkflow: DatabaseWorkflowState;
  migrationArtifacts: ProjectArtifact[];
  designGeneration: DesignGenerationResult;
  frontendGeneration: FrontendGenerationResult;
  apiBindingGeneration: ApiBindingGenerationResult;
};

export const PROJECT_NAMESPACE = "MyProject";
