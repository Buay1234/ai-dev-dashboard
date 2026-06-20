import type { GeneratedSourceFile } from "@/lib/project-generator/types";
import type {
  ApiBindingContract,
  ApiBindingGenerationResult,
  ApiBindingGeneratorInput,
  OpenApiDocument,
} from "./types";
import { buildContractFromEntities } from "./swagger-parser";
import { evaluateApiBindingBuildStatus } from "./build-status";

const GENERATED_ROOT = "frontend/generated";

function bindingFile(
  id: string,
  subPath: "types" | "services" | "hooks" | "",
  fileName: string,
  content: string
): GeneratedSourceFile {
  const path = subPath ? `${GENERATED_ROOT}/${subPath}` : GENERATED_ROOT;
  return {
    id,
    path,
    fileName,
    category: "frontend",
    agent: "Jinbe",
    language: fileName.endsWith(".json")
      ? "json"
      : fileName.endsWith(".md")
        ? "markdown"
        : "typescript",
    content: content.trimStart(),
  };
}

function generateTypes(contract: ApiBindingContract): GeneratedSourceFile[] {
  const entityBlocks = contract.entities
    .map((e) => {
      const props = e.fields.map((f) => `  ${f.name}${f.required ? "" : "?"}: ${f.tsType};`).join("\n");
      const createProps = e.formFields
        .map((f) => `  ${f.name}${f.required ? "" : "?"}: ${f.tsType};`)
        .join("\n");
      return `export type ${e.entity} = {
${props}
};

export type ${e.entity}CreateInput = {
${createProps}
};

export type ${e.entity}UpdateInput = Partial<${e.entity}CreateInput>;`;
    })
    .join("\n\n");

  const validationBlocks = contract.entities
    .map((e) => {
      const createFields = e.formFields
        .map((f) => `  ${f.name}: ${f.zodType},`)
        .join("\n");
      return `export const ${e.entity}CreateSchema = z.object({
${createFields}
});

export const ${e.entity}UpdateSchema = ${e.entity}CreateSchema.partial();`;
    })
    .join("\n\n");

  return [
    bindingFile(
      "ab-types-index",
      "types",
      "index.ts",
      `export * from "./entities";
export * from "./validation";
export * from "./api-errors";
`
    ),
    bindingFile(
      "ab-types-entities",
      "types",
      "entities.ts",
      `/** Auto-generated from OpenAPI · Jinbe V34 */
${entityBlocks}
`
    ),
    bindingFile(
      "ab-types-validation",
      "types",
      "validation.ts",
      `import { z } from "zod";

/** Zod validation schemas · Jinbe V34 */
${validationBlocks}
`
    ),
    bindingFile(
      "ab-types-errors",
      "types",
      "api-errors.ts",
      `export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function parseApiError(status: number, body: unknown): ApiError {
  const message =
    typeof body === "object" &&
    body !== null &&
    "title" in body &&
    typeof (body as { title: unknown }).title === "string"
      ? (body as { title: string }).title
      : \`Request failed with status \${status}\`;
  return new ApiError(message, status, body);
}
`
    ),
  ];
}

function generateServices(contract: ApiBindingContract): GeneratedSourceFile[] {
  const bindings = contract.entities
    .map(
      (e) => `  ${e.entity}: {
    list: ${e.entity}Api.list,
    get: ${e.entity}Api.get,
    create: ${e.entity}Api.create,
    update: ${e.entity}Api.update,
    remove: ${e.entity}Api.remove,
  },`
    )
    .join("\n");

  const files: GeneratedSourceFile[] = [
    bindingFile(
      "ab-svc-client",
      "services",
      "api-client.ts",
      `import { parseApiError } from "@/generated/types/api-errors";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "${contract.baseUrl}";

export type ApiFetchOptions = RequestInit & { parseJson?: boolean };

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { parseJson = true, headers, ...rest } = options;
  const url = path.startsWith("http") ? path : \`\${API_BASE.replace(/\\/$/, "")}\${path}\`;

  const res = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw parseApiError(res.status, body);
  }

  if (res.status === 204 || !parseJson) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export function getSwaggerUrl(): string {
  return \`\${API_BASE.replace(/\\/$/, "")}${contract.swaggerPath}\`;
}
`
    ),
    bindingFile(
      "ab-svc-health",
      "services",
      "health.ts",
      `import { apiFetch, getSwaggerUrl } from "./api-client";

export type HealthStatus = {
  status: string;
  timestamp?: string;
};

export async function checkApiHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>("${contract.healthPath}");
}

export async function fetchOpenApiDocument(): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(getSwaggerUrl());
}
`
    ),
    bindingFile(
      "ab-svc-crud",
      "services",
      "crud-bindings.ts",
      `${contract.entities.map((e) => `import { ${e.entity}Api } from "./${e.entity}Api";`).join("\n")}

/** CRUD auto-binding map · operationId → service method */
export const crudBindings = {
${bindings}
} as const;

export type CrudEntityName = keyof typeof crudBindings;
`
    ),
    bindingFile(
      "ab-svc-index",
      "services",
      "index.ts",
      `export * from "./api-client";
export * from "./health";
export * from "./crud-bindings";
${contract.entities.map((e) => `export * from "./${e.entity}Api";`).join("\n")}
`
    ),
  ];

  for (const e of contract.entities) {
    files.push(
      bindingFile(
        `ab-svc-${e.entity}`,
        "services",
        `${e.entity}Api.ts`,
        `import { apiFetch } from "./api-client";
import type { ${e.entity}, ${e.entity}CreateInput, ${e.entity}UpdateInput } from "@/generated/types/entities";

const BASE = "/api/${e.entity}";

export const ${e.entity}Api = {
  list: () => apiFetch<${e.entity}[]>(BASE),
  get: (id: number) => apiFetch<${e.entity}>(\`\${BASE}/\${id}\`),
  create: (payload: ${e.entity}CreateInput) =>
    apiFetch<${e.entity}>(BASE, { method: "POST", body: JSON.stringify(payload) }),
  update: (id: number, payload: ${e.entity}UpdateInput) =>
    apiFetch<void>(\`\${BASE}/\${id}\`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id: number) => apiFetch<void>(\`\${BASE}/\${id}\`, { method: "DELETE" }),
};
`
      )
    );
  }

  return files;
}

function generateHooks(contract: ApiBindingContract): GeneratedSourceFile[] {
  const files: GeneratedSourceFile[] = [
    bindingFile(
      "ab-hooks-provider",
      "hooks",
      "query-provider.tsx",
      `"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function ApiQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
`
    ),
    bindingFile(
      "ab-hooks-health",
      "hooks",
      "useApiHealth.ts",
      `import { useQuery } from "@tanstack/react-query";
import { checkApiHealth } from "@/generated/services/health";

export function useApiHealth(pollMs = 60_000) {
  return useQuery({
    queryKey: ["api-health"],
    queryFn: checkApiHealth,
    refetchInterval: pollMs,
    retry: 2,
  });
}
`
    ),
  ];

  for (const e of contract.entities) {
    const defaultValues = e.formFields
      .map((f) => {
        const val = f.tsType.includes("boolean")
          ? "false"
          : f.tsType.includes("number")
            ? "0"
            : '""';
        return `    ${f.name}: ${val},`;
      })
      .join("\n");

    files.push(
      bindingFile(
        `ab-hook-${e.entity}`,
        "hooks",
        `use${e.entity}.ts`,
        `import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ${e.entity}Api } from "@/generated/services/${e.entity}Api";
import {
  ${e.entity}CreateSchema,
  ${e.entity}UpdateSchema,
} from "@/generated/types/validation";
import type { ${e.entity}CreateInput, ${e.entity}UpdateInput } from "@/generated/types/entities";

export const ${e.entity}Keys = {
  all: ["${e.entity}"] as const,
  detail: (id: number) => ["${e.entity}", id] as const,
};

export function use${e.entity}List() {
  return useQuery({
    queryKey: ${e.entity}Keys.all,
    queryFn: () => ${e.entity}Api.list(),
  });
}

export function use${e.entity}(id: number) {
  return useQuery({
    queryKey: ${e.entity}Keys.detail(id),
    queryFn: () => ${e.entity}Api.get(id),
    enabled: id > 0,
  });
}

export function use${e.entity}Mutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (payload: ${e.entity}CreateInput) => {
      const parsed = ${e.entity}CreateSchema.parse(payload);
      return ${e.entity}Api.create(parsed);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ${e.entity}Keys.all });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ${e.entity}UpdateInput }) => {
      const parsed = ${e.entity}UpdateSchema.parse(payload);
      return ${e.entity}Api.update(id, parsed);
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ${e.entity}Keys.all });
      void queryClient.invalidateQueries({ queryKey: ${e.entity}Keys.detail(id) });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => ${e.entity}Api.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ${e.entity}Keys.all });
    },
  });

  return { create, update, remove };
}

export function use${e.entity}Form(initial?: Partial<${e.entity}CreateInput>) {
  const defaults: ${e.entity}CreateInput = {
${defaultValues}
    ...initial,
  };

  return {
    defaultValues: defaults,
    validateCreate: (values: ${e.entity}CreateInput) => ${e.entity}CreateSchema.safeParse(values),
    validateUpdate: (values: ${e.entity}UpdateInput) => ${e.entity}UpdateSchema.safeParse(values),
  };
}
`
      )
    );
  }

  files.push(
    bindingFile(
      "ab-hooks-index",
      "hooks",
      "index.ts",
      `export * from "./query-provider";
export * from "./useApiHealth";
${contract.entities.map((e) => `export * from "./use${e.entity}";`).join("\n")}
`
    )
  );

  return files;
}

function generateMeta(openapi: OpenApiDocument, contract: ApiBindingContract): GeneratedSourceFile[] {
  return [
    bindingFile(
      "ab-openapi",
      "",
      "openapi.json",
      JSON.stringify(openapi, null, 2)
    ),
    bindingFile(
      "ab-readme",
      "",
      "README.md",
      `# Generated API Bindings (Jinbe V34)

ASP.NET Core Swagger/OpenAPI → production-ready frontend integration.

## Structure

- \`types/\` — TypeScript types + Zod validation schemas
- \`services/\` — Fetch-based API client + CRUD services + health check
- \`hooks/\` — TanStack React Query hooks + form helpers
- \`openapi.json\` — OpenAPI 3 document (${contract.openapiVersion})

## Usage

\`\`\`tsx
import { ApiQueryProvider } from "@/generated/hooks/query-provider";
import { use${contract.entities[0]?.entity ?? "Entity"}List } from "@/generated/hooks/use${contract.entities[0]?.entity ?? "Entity"}";

// Wrap app layout
<ApiQueryProvider>{children}</ApiQueryProvider>
\`\`\`

## Health Check

\`\`\`ts
import { useApiHealth } from "@/generated/hooks/useApiHealth";
\`\`\`

Entities: ${contract.entities.map((e) => e.entity).join(", ")}
Swagger: \`${contract.swaggerPath}\`
`
    ),
  ];
}

export function runApiBindingGeneration(
  input: ApiBindingGeneratorInput
): ApiBindingGenerationResult {
  const { openapi, contract } = buildContractFromEntities(input.entities, {
    baseUrl: input.baseUrl,
    projectTitle: input.projectTitle,
    openapiJson: input.openapiJson,
  });

  const typeFiles = generateTypes(contract);
  const serviceFiles = generateServices(contract);
  const hookFiles = generateHooks(contract);
  const metaFiles = generateMeta(openapi, contract);

  const sourceFiles = [...typeFiles, ...serviceFiles, ...hookFiles, ...metaFiles];

  const buildStatus = evaluateApiBindingBuildStatus(contract, sourceFiles);

  return {
    agent: "Jinbe",
    version: "V34",
    generatedAt: new Date().toISOString(),
    entities: input.entities.map((e) => e.name),
    sourceFiles,
    contract,
    openapi,
    buildStatus,
  };
}

export type {
  ApiBindingContract,
  ApiBindingGenerationResult,
  ApiBindingGeneratorInput,
  OpenApiDocument,
} from "./types";

export { buildAspNetOpenApiSpec, parseOpenApiDocument, parseOpenApiJson } from "./swagger-parser";
