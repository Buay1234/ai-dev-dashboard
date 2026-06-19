import type { GeneratedProjectBundle } from "@/lib/project-generator/types";
import type {
  CrudOperation,
  EntityCrudResult,
  ExecutionStatus,
} from "./execution-types";

const CRUD_CHECKS: {
  op: CrudOperation;
  controller: RegExp;
  repository: RegExp;
  label: string;
}[] = [
  {
    op: "create",
    controller: /\[HttpPost\]/,
    repository: /AddAsync/,
    label: "Create (POST)",
  },
  {
    op: "read",
    controller: /\[HttpGet/,
    repository: /GetByIdAsync|GetAllAsync/,
    label: "Read (GET)",
  },
  {
    op: "update",
    controller: /\[HttpPut/,
    repository: /UpdateAsync/,
    label: "Update (PUT)",
  },
  {
    op: "delete",
    controller: /\[HttpDelete/,
    repository: /DeleteAsync/,
    label: "Delete (DELETE)",
  },
];

function checkOperation(
  controllerContent: string,
  repoContent: string,
  check: (typeof CRUD_CHECKS)[0]
): { status: ExecutionStatus; detail: string } {
  const hasController = check.controller.test(controllerContent);
  const hasRepo = check.repository.test(repoContent);

  if (hasController && hasRepo) {
    return { status: "success", detail: `${check.label} validated` };
  }
  if (hasController || hasRepo) {
    return {
      status: "failed",
      detail: `${check.label} incomplete — controller:${hasController} repo:${hasRepo}`,
    };
  }
  return { status: "failed", detail: `${check.label} missing` };
}

export function validateCrudForProject(
  project: GeneratedProjectBundle
): EntityCrudResult[] {
  return project.entities.map((entity) => {
    const controller = project.sourceFiles.find(
      (f) => f.fileName === `${entity.name}Controller.cs`
    );
    const repo = project.sourceFiles.find(
      (f) => f.fileName === `${entity.name}Repository.cs`
    );

    const controllerContent = controller?.content ?? "";
    const repoContent = repo?.content ?? "";

    const operations = {} as EntityCrudResult["operations"];

    for (const check of CRUD_CHECKS) {
      operations[check.op] = checkOperation(
        controllerContent,
        repoContent,
        check
      );
    }

    const allSuccess = CRUD_CHECKS.every(
      (c) => operations[c.op].status === "success"
    );
    const anyFailed = CRUD_CHECKS.some(
      (c) => operations[c.op].status === "failed"
    );

    return {
      entity: entity.name,
      operations,
      overall: allSuccess ? "success" : anyFailed ? "failed" : "pending",
    };
  });
}

export function summarizeCrudValidation(
  results: EntityCrudResult[]
): ExecutionStatus {
  if (results.length === 0) return "failed";
  if (results.every((r) => r.overall === "success")) return "success";
  if (results.some((r) => r.overall === "failed")) return "failed";
  return "pending";
}
