import { getErrorMessage } from "@/lib/get-error-message";
import { runZoroAgent } from "@/lib/agents/zoro-agent";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const output = await runZoroAgent(body.analysis, body.businessAnalysis);

    return Response.json(output);
  } catch (error: unknown) {
    return Response.json(
      {
        result: "Zoro Error: " + getErrorMessage(error),
        thoughts: ["Backend planning failed"],
        summary: "Backend error",
        reasoning: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
