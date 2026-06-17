import { getErrorMessage } from "@/lib/get-error-message";
import { runRobinAgent } from "@/lib/agents/robin-agent";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const output = await runRobinAgent(body.requirement);

    return Response.json(output);
  } catch (error: unknown) {
    console.error("Robin Error", error);

    return Response.json(
      {
        result: "Robin Error: " + getErrorMessage(error),
        thoughts: ["Gemini request failed"],
        summary: "Analysis failed",
        reasoning: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
