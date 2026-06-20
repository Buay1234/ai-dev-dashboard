import { getErrorMessage } from "@/lib/get-error-message";
import { runJinbeAgent } from "@/lib/agents/jinbe-agent";
import type { EntityDefinition } from "@/lib/project-generator/types";
import { entitiesFromNames } from "@/lib/project-generator/entity-parser";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entityNames: string[] = body.entityNames ?? [];
    const entities: EntityDefinition[] =
      (body.entities as EntityDefinition[] | undefined)?.length
        ? (body.entities as EntityDefinition[])
        : entitiesFromNames(entityNames);

    const output = await runJinbeAgent(body.backendDesign ?? "", body.frontendDesign ?? "", {
      entities,
      businessAnalysis: body.businessAnalysis,
      baseUrl: body.baseUrl,
      openapiJson: body.openapiJson,
    });

    return Response.json(output);
  } catch (error: unknown) {
    return Response.json(
      {
        result: "Jinbe Error: " + getErrorMessage(error),
        thoughts: ["API binding generation failed"],
        summary: "Integration error",
        reasoning: getErrorMessage(error),
        apiBindingGeneration: null,
      },
      { status: 500 }
    );
  }
}
