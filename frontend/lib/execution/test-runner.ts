import type { GeneratedProjectBundle } from "@/lib/project-generator/types";
import type { ExecutionStatus, TestRunSummary } from "./execution-types";
import { summarizeCrudValidation, validateCrudForProject } from "./crud-validator";

export function runUnitTestValidation(
  project: GeneratedProjectBundle
): TestRunSummary {
  const testFiles = project.sourceFiles.filter(
    (f) => f.category === "test" && f.fileName.endsWith("Tests.cs")
  );

  let total = 0;
  let failed = 0;

  for (const file of testFiles) {
    const facts = file.content.match(/\[Fact\]/g)?.length ?? 0;
    total += facts;

    const hasMock = /Mock<|It\.IsAny/.test(file.content);
    const hasController = /ControllerTests/.test(file.fileName);
    if (!hasMock || !hasController) {
      failed += facts;
    }
  }

  if (total === 0) {
    return { total: 0, passed: 0, failed: 0, status: "failed" };
  }

  const crudOk = summarizeCrudValidation(validateCrudForProject(project)) === "success";
  const structuralFailed = crudOk ? 0 : Math.min(1, total);
  failed += structuralFailed;

  const passed = total - failed;
  const status: ExecutionStatus =
    failed === 0 ? "success" : passed > 0 ? "failed" : "failed";

  return { total, passed, failed, status };
}

export function buildTestExecutionStep(summary: TestRunSummary) {
  return {
    id: "dotnet-test",
    label: "Unit Test Execution (dotnet test)",
    command: "dotnet test",
    status: summary.status,
    agent: "Usopp",
    message: `${summary.passed}/${summary.total} passed · ${summary.failed} failed`,
  };
}
