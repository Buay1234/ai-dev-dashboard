import type { EntityDefinition, GeneratedSourceFile } from "@/lib/project-generator/types";

export type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

export type OpenApiSchemaProperty = {
  type?: string;
  format?: string;
  nullable?: boolean;
  items?: OpenApiSchemaProperty;
};

export type OpenApiSchema = {
  type?: string;
  properties?: Record<string, OpenApiSchemaProperty>;
  required?: string[];
  items?: OpenApiSchema;
};

export type OpenApiOperation = {
  operationId: string;
  tags: string[];
  summary?: string;
  requestBody?: { content: { "application/json": { schema: { $ref?: string } } } };
  responses: Record<string, { description: string; content?: { "application/json": { schema: unknown } } }>;
};

export type OpenApiDocument = {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers: { url: string; description?: string }[];
  paths: Record<string, Partial<Record<HttpMethod, OpenApiOperation>>>;
  components: { schemas: Record<string, OpenApiSchema> };
};

export type ParsedCrudOperation = {
  entity: string;
  method: HttpMethod;
  path: string;
  operationId: string;
  requestSchema?: string;
  responseSchema?: string;
  hasPathId: boolean;
};

export type ParsedEntitySchemas = {
  entity: string;
  response: string;
  createRequest: string;
  updateRequest: string;
  fields: { name: string; tsType: string; required: boolean }[];
  formFields: { name: string; tsType: string; required: boolean; zodType: string }[];
};

export type ApiBindingContract = {
  openapiVersion: string;
  title: string;
  baseUrl: string;
  swaggerPath: string;
  entities: ParsedEntitySchemas[];
  operations: ParsedCrudOperation[];
  healthPath: string;
};

export type ApiBindingBuildCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type ApiBindingBuildStatus = {
  passed: boolean;
  typeCount: number;
  serviceCount: number;
  hookCount: number;
  operationCount: number;
  checks: ApiBindingBuildCheck[];
};

export type ApiBindingGenerationResult = {
  agent: "Jinbe";
  version: "V34";
  generatedAt: string;
  entities: string[];
  sourceFiles: GeneratedSourceFile[];
  contract: ApiBindingContract;
  openapi: OpenApiDocument;
  buildStatus: ApiBindingBuildStatus;
};

export type ApiBindingGeneratorInput = {
  entities: EntityDefinition[];
  baseUrl?: string;
  openapiJson?: string;
  projectTitle?: string;
};
