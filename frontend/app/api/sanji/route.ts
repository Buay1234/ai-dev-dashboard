import { getErrorMessage } from "@/lib/get-error-message";
import { runSanjiAgent } from "@/lib/agents/sanji-agent";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const output = await runSanjiAgent(body.backendDesign ?? "", {
      requirement: body.requirement ?? "",
      domain: body.domain ?? "MyProject",
      entityNames: body.entityNames ?? [],
      businessAnalysis: body.businessAnalysis,
    });

    return Response.json(output);
  } catch (error: unknown) {
    return Response.json(
      {
        result: "Sanji Error: " + getErrorMessage(error),
        thoughts: ["UX design planning failed"],
        summary: "Design error",
        reasoning: getErrorMessage(error),
        designGeneration: null,
      },
      { status: 500 }
    );
  }
}
