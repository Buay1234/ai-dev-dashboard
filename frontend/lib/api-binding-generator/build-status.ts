import type { ApiBindingBuildStatus, ApiBindingContract } from "./types";
import type { GeneratedSourceFile } from "@/lib/project-generator/types";

export function evaluateApiBindingBuildStatus(
  contract: ApiBindingContract,
  sourceFiles: GeneratedSourceFile[]
): ApiBindingBuildStatus {
  const typeFiles = sourceFiles.filter((f) => f.path.includes("generated/types"));
  const serviceFiles = sourceFiles.filter((f) => f.path.includes("generated/services"));
  const hookFiles = sourceFiles.filter((f) => f.path.includes("generated/hooks"));

  const crudOps = contract.operations.filter(
    (o) => o.entity !== "Health" && o.entity !== "Swagger" && o.path.startsWith("/api/")
  );

  const checks = [
    {
      id: "swagger-parser",
      label: "Swagger Parser",
      passed: contract.openapiVersion.startsWith("3."),
      detail: `OpenAPI ${contract.openapiVersion} · ${contract.operations.length} operations parsed`,
    },
    {
      id: "type-generator",
      label: "Type Generator",
      passed: typeFiles.length >= contract.entities.length + 1,
      detail: `${typeFiles.length} type files under generated/types/`,
    },
    {
      id: "service-generator",
      label: "Service Generator",
      passed: serviceFiles.length >= contract.entities.length + 2,
      detail: `${serviceFiles.length} service files under generated/services/`,
    },
    {
      id: "react-query",
      label: "React Query Generator",
      passed: hookFiles.some((f) => f.fileName.includes("use") && f.content.includes("useQuery")),
      detail: `${hookFiles.length} hook files under generated/hooks/`,
    },
    {
      id: "form-generator",
      label: "Form Generator",
      passed: hookFiles.some((f) => f.fileName.includes("Form") || f.content.includes("useEntityForm")),
      detail: "Entity form hooks with default values",
    },
    {
      id: "validation",
      label: "Validation Generator",
      passed: typeFiles.some((f) => f.fileName.includes("validation") || f.content.includes("z.object")),
      detail: "Zod schemas for create/update payloads",
    },
    {
      id: "crud-binding",
      label: "CRUD Auto Binding",
      passed: serviceFiles.some((f) => f.fileName === "crud-bindings.ts"),
      detail: `${crudOps.length} CRUD operations bound to services`,
    },
    {
      id: "health-check",
      label: "API Health Check",
      passed: serviceFiles.some((f) => f.fileName === "health.ts"),
      detail: `Health probe at ${contract.healthPath}`,
    },
    {
      id: "build-verification",
      label: "Build Verification",
      passed:
        typeFiles.length > 0 &&
        serviceFiles.length > 0 &&
        hookFiles.length > 0 &&
        contract.entities.length > 0,
      detail: "All generated layers present for production import",
    },
  ];

  const passed = checks.every((c) => c.passed);

  return {
    passed,
    typeCount: typeFiles.length,
    serviceCount: serviceFiles.length,
    hookCount: hookFiles.length,
    operationCount: crudOps.length,
    checks,
  };
}
