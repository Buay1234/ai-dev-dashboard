import type { GeneratedSourceFile } from "@/lib/project-generator/types";
import { PROJECT_NAMESPACE } from "@/lib/project-generator/types";
import { createCheckResult, type RuntimeCheckDetail } from "./runtime-report";

const SWAGGER_PATHS = ["/swagger/v1/swagger.json", "/swagger/index.html", "/swagger"];

export async function verifySwaggerEndpoint(
  baseUrl: string,
  timeoutMs = 15_000
): Promise<RuntimeCheckDetail> {
  const normalized = baseUrl.replace(/\/$/, "");
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    for (const path of SWAGGER_PATHS) {
      try {
        const res = await fetch(`${normalized}${path}`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type") ?? "";
          const isJson = path.endsWith(".json") || contentType.includes("json");
          if (isJson) {
            const body = await res.text();
            if (body.includes('"openapi"') || body.includes('"swagger"')) {
              return createCheckResult(
                "Swagger Endpoint",
                true,
                `Swagger OpenAPI document reachable at ${path}`
              );
            }
          } else {
            return createCheckResult(
              "Swagger Endpoint",
              true,
              `Swagger UI reachable at ${path}`
            );
          }
        }
      } catch {
        // retry
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return createCheckResult(
    "Swagger Endpoint",
    false,
    `Swagger not reachable at ${normalized} (${SWAGGER_PATHS.join(", ")})`
  );
}

export function verifySwaggerInSource(files: GeneratedSourceFile[]): RuntimeCheckDetail {
  const program =
    files.find(
      (f) =>
        f.fileName === "Program.cs" &&
        f.path.includes(`${PROJECT_NAMESPACE}.API`)
    ) ?? files.find((f) => f.fileName === "Program.cs");

  if (!program) {
    return createCheckResult(
      "Swagger Endpoint",
      false,
      "Program.cs not found in generated API project"
    );
  }

  const hasAddSwagger = program.content.includes("AddSwaggerGen");
  const hasUseSwagger =
    program.content.includes("UseSwagger") || program.content.includes("UseSwaggerUI");

  if (hasAddSwagger && hasUseSwagger) {
    return createCheckResult(
      "Swagger Endpoint",
      true,
      "AddSwaggerGen and UseSwagger configured in Program.cs (static verification)"
    );
  }

  return createCheckResult(
    "Swagger Endpoint",
    false,
    "Swagger middleware not configured in Program.cs"
  );
}
