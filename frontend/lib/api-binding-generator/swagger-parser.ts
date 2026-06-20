import type { EntityDefinition, EntityField } from "@/lib/project-generator/types";
import type {
  ApiBindingContract,
  HttpMethod,
  OpenApiDocument,
  OpenApiSchema,
  OpenApiSchemaProperty,
  ParsedCrudOperation,
  ParsedEntitySchemas,
} from "./types";

const HTTP_METHODS: HttpMethod[] = ["get", "post", "put", "delete", "patch"];

function csharpToOpenApiType(csharpType: string): OpenApiSchemaProperty {
  const base = csharpType.replace("?", "");
  const nullable = csharpType.endsWith("?");
  const map: Record<string, OpenApiSchemaProperty> = {
    string: { type: "string" },
    int: { type: "integer", format: "int32" },
    long: { type: "integer", format: "int64" },
    bool: { type: "boolean" },
    decimal: { type: "number", format: "decimal" },
    double: { type: "number", format: "double" },
    float: { type: "number", format: "float" },
    Guid: { type: "string", format: "uuid" },
    DateTime: { type: "string", format: "date-time" },
  };
  const prop = map[base] ?? { type: "string" };
  return nullable ? { ...prop, nullable: true } : prop;
}

function csharpToTsType(csharpType: string): string {
  const base = csharpType.replace("?", "");
  const map: Record<string, string> = {
    string: "string",
    int: "number",
    long: "number",
    bool: "boolean",
    decimal: "number",
    double: "number",
    float: "number",
    Guid: "string",
    DateTime: "string",
  };
  const ts = map[base] ?? "string";
  return csharpType.endsWith("?") ? `${ts} | null` : ts;
}

function csharpToZodType(field: EntityField): string {
  const base = field.csharpType.replace("?", "");
  const optional = !field.isRequired || field.csharpType.endsWith("?");
  let zod: string;
  switch (base) {
    case "int":
    case "long":
    case "decimal":
    case "double":
    case "float":
      zod = "z.coerce.number()";
      break;
    case "bool":
      zod = "z.boolean()";
      break;
    case "DateTime":
      zod = "z.string().datetime({ offset: true }).or(z.string())";
      break;
    case "Guid":
      zod = "z.string().uuid()";
      break;
    default:
      zod = field.isRequired && !field.csharpType.endsWith("?")
        ? "z.string().min(1)"
        : "z.string()";
  }
  return optional ? `${zod}.optional()` : zod;
}

function editableFields(entity: EntityDefinition): EntityField[] {
  return entity.fields.filter(
    (f) => !f.isKey && f.name !== "CreatedAt" && f.name !== "UpdatedAt"
  );
}

function buildEntitySchemas(entity: EntityDefinition): Record<string, OpenApiSchema> {
  const schemas: Record<string, OpenApiSchema> = {};
  const responseProps: Record<string, OpenApiSchemaProperty> = {};
  const responseRequired: string[] = [];

  for (const field of entity.fields) {
    responseProps[field.name] = csharpToOpenApiType(field.csharpType);
    if (field.isRequired && !field.csharpType.endsWith("?")) {
      responseRequired.push(field.name);
    }
  }

  schemas[`${entity.name}Response`] = {
    type: "object",
    properties: responseProps,
    required: responseRequired,
  };

  const createProps: Record<string, OpenApiSchemaProperty> = {};
  const createRequired: string[] = [];
  for (const field of editableFields(entity)) {
    createProps[field.name] = csharpToOpenApiType(field.csharpType);
    if (field.isRequired && !field.csharpType.endsWith("?")) {
      createRequired.push(field.name);
    }
  }

  schemas[`${entity.name}CreateRequest`] = {
    type: "object",
    properties: createProps,
    required: createRequired,
  };

  const updateProps: Record<string, OpenApiSchemaProperty> = {};
  for (const field of editableFields(entity)) {
    updateProps[field.name] = { ...csharpToOpenApiType(field.csharpType), nullable: true };
  }

  schemas[`${entity.name}UpdateRequest`] = {
    type: "object",
    properties: updateProps,
  };

  return schemas;
}

export function buildAspNetOpenApiSpec(
  entities: EntityDefinition[],
  options: { baseUrl?: string; projectTitle?: string } = {}
): OpenApiDocument {
  const baseUrl = options.baseUrl ?? "http://localhost:5199";
  const title = options.projectTitle ?? "MyProject API";
  const paths: OpenApiDocument["paths"] = {};
  const schemas: Record<string, OpenApiSchema> = {};

  for (const entity of entities) {
    Object.assign(schemas, buildEntitySchemas(entity));
    const tag = entity.name;
    const collectionPath = `/api/${entity.name}`;
    const itemPath = `/api/${entity.name}/{id}`;

    paths[collectionPath] = {
      get: {
        operationId: `${entity.name}_GetAll`,
        tags: [tag],
        summary: `List all ${entity.name}`,
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: `#/components/schemas/${entity.name}Response` },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: `${entity.name}_Create`,
        tags: [tag],
        summary: `Create ${entity.name}`,
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${entity.name}CreateRequest` },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${entity.name}Response` },
              },
            },
          },
        },
      },
    };

    paths[itemPath] = {
      get: {
        operationId: `${entity.name}_GetById`,
        tags: [tag],
        summary: `Get ${entity.name} by id`,
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${entity.name}Response` },
              },
            },
          },
          "404": { description: "Not found" },
        },
      },
      put: {
        operationId: `${entity.name}_Update`,
        tags: [tag],
        summary: `Update ${entity.name}`,
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${entity.name}UpdateRequest` },
            },
          },
        },
        responses: {
          "204": { description: "No content" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        operationId: `${entity.name}_Delete`,
        tags: [tag],
        summary: `Delete ${entity.name}`,
        responses: {
          "204": { description: "No content" },
          "404": { description: "Not found" },
        },
      },
    };
  }

  paths["/health"] = {
    get: {
      operationId: "Health_Check",
      tags: ["Health"],
      summary: "API health check",
      responses: {
        "200": {
          description: "Healthy",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string" },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
  };

  paths["/swagger/v1/swagger.json"] = {
    get: {
      operationId: "Swagger_GetDocument",
      tags: ["Swagger"],
      summary: "OpenAPI document",
      responses: { "200": { description: "OpenAPI JSON" } },
    },
  };

  return {
    openapi: "3.0.1",
    info: {
      title,
      version: "v1",
      description: "ASP.NET Core Web API with Swagger · generated for Jinbe V34 auto-binding",
    },
    servers: [{ url: baseUrl, description: "Development server" }],
    paths,
    components: { schemas },
  };
}

function resolveRef(ref: string | undefined, schemas: Record<string, OpenApiSchema>): string | undefined {
  if (!ref) return undefined;
  const name = ref.replace("#/components/schemas/", "");
  return schemas[name] ? name : undefined;
}

function parseEntityFromSchemas(
  entityName: string,
  schemas: Record<string, OpenApiSchema>
): ParsedEntitySchemas | null {
  const responseKey = `${entityName}Response`;
  const createKey = `${entityName}CreateRequest`;
  const updateKey = `${entityName}UpdateRequest`;

  if (!schemas[responseKey]) return null;

  const responseSchema = schemas[responseKey];
  const fields = Object.entries(responseSchema.properties ?? {}).map(([name, prop]) => ({
    name,
    tsType: openApiPropToTs(prop),
    required: responseSchema.required?.includes(name) ?? false,
  }));

  const formSource = schemas[createKey] ?? schemas[updateKey] ?? responseSchema;
  const formFields = Object.entries(formSource.properties ?? {})
    .filter(([name]) => name !== "Id" && name !== "CreatedAt" && name !== "UpdatedAt")
    .map(([name, prop]) => {
      const required = formSource.required?.includes(name) ?? false;
      const mockField: EntityField = {
        name,
        csharpType: prop.type === "integer" ? "int" : prop.type === "boolean" ? "bool" : "string",
        sqlType: "",
        isRequired: required,
        isKey: name === "Id",
      };
      return {
        name,
        tsType: openApiPropToTs(prop),
        required,
        zodType: csharpToZodType(mockField),
      };
    });

  return {
    entity: entityName,
    response: responseKey,
    createRequest: createKey,
    updateRequest: updateKey,
    fields,
    formFields,
  };
}

function openApiPropToTs(prop: OpenApiSchemaProperty): string {
  if (prop.type === "integer" || prop.type === "number") {
    return prop.nullable ? "number | null" : "number";
  }
  if (prop.type === "boolean") {
    return prop.nullable ? "boolean | null" : "boolean";
  }
  if (prop.type === "array" && prop.items) {
    return `${openApiPropToTs(prop.items)}[]`;
  }
  return prop.nullable ? "string | null" : "string";
}

export function parseOpenApiDocument(
  doc: OpenApiDocument,
  entities: EntityDefinition[]
): ApiBindingContract {
  const schemas = doc.components?.schemas ?? {};
  const operations: ParsedCrudOperation[] = [];

  for (const [path, methods] of Object.entries(doc.paths)) {
    for (const method of HTTP_METHODS) {
      const op = methods[method];
      if (!op) continue;

      const tag = op.tags?.[0] ?? "Unknown";
      const entity =
        entities.find((e) => e.name === tag)?.name ??
        entities.find((e) => path.includes(`/api/${e.name}`))?.name ??
        tag;

      const requestRef = op.requestBody?.content?.["application/json"]?.schema?.$ref;
      const response200 = op.responses["200"] ?? op.responses["201"];
      const responseRef =
        response200 &&
        typeof response200 === "object" &&
        "content" in response200 &&
        response200.content?.["application/json"]?.schema &&
        typeof response200.content["application/json"].schema === "object" &&
        "$ref" in (response200.content["application/json"].schema as { $ref?: string })
          ? (response200.content["application/json"].schema as { $ref: string }).$ref
          : undefined;

      operations.push({
        entity,
        method,
        path,
        operationId: op.operationId,
        requestSchema: resolveRef(requestRef, schemas),
        responseSchema: resolveRef(responseRef, schemas),
        hasPathId: path.includes("{id}"),
      });
    }
  }

  const parsedEntities: ParsedEntitySchemas[] = entities
    .map((e) => parseEntityFromSchemas(e.name, schemas))
    .filter((e): e is ParsedEntitySchemas => e !== null);

  return {
    openapiVersion: doc.openapi,
    title: doc.info.title,
    baseUrl: doc.servers[0]?.url ?? "http://localhost:5199",
    swaggerPath: "/swagger/v1/swagger.json",
    entities: parsedEntities,
    operations,
    healthPath: "/health",
  };
}

export function parseOpenApiJson(
  json: string,
  entities: EntityDefinition[]
): ApiBindingContract {
  const doc = JSON.parse(json) as OpenApiDocument;
  return parseOpenApiDocument(doc, entities);
}

export function buildContractFromEntities(
  entities: EntityDefinition[],
  options: { baseUrl?: string; projectTitle?: string; openapiJson?: string } = {}
): { openapi: OpenApiDocument; contract: ApiBindingContract } {
  if (options.openapiJson) {
    const doc = JSON.parse(options.openapiJson) as OpenApiDocument;
    return { openapi: doc, contract: parseOpenApiDocument(doc, entities) };
  }

  const openapi = buildAspNetOpenApiSpec(entities, options);
  return { openapi, contract: parseOpenApiDocument(openapi, entities) };
}

export { csharpToTsType, csharpToZodType, editableFields };
