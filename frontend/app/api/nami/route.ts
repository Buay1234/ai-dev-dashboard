import { getErrorMessage } from "@/lib/get-error-message";
import { runNamiAgent } from "@/lib/agents/nami-agent";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const output = await runNamiAgent(
      body.backendDesign,
      body.businessAnalysis,
      body.uxDesign
    );

    return Response.json(output);
  } catch (error: unknown) {
    return Response.json(
      {
        result: "Nami Error: " + getErrorMessage(error),
        thoughts: ["Frontend planning failed"],
        summary: "Frontend error",
        reasoning: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
