import { getErrorMessage } from "@/lib/get-error-message";
import { runNamiAgent } from "@/lib/agents/nami-agent";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const output = await runNamiAgent(body.backendDesign);

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
