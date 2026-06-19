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

export type GeneratedProjectBundle = {
  id: string;
  generatedAt: string;
  requirement: string;
  entities: EntityDefinition[];
  sourceFiles: GeneratedSourceFile[];
};

export const PROJECT_NAMESPACE = "MyProject";
