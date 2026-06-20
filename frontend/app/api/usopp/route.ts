import { getErrorMessage } from "@/lib/get-error-message";
import { runUsoppAgent } from "@/lib/agents/usopp-agent";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const frankyOutput = body.frankyDesign ?? body.apiDesign ?? "";
    const zoroOutput = body.backendDesign ?? body.apiDesign ?? "";
    const output = await runUsoppAgent(
      frankyOutput,
      zoroOutput,
      body.businessAnalysis,
      body.databaseDesign
    );

    return Response.json(output);
  } catch (error: unknown) {
    return Response.json(
      {
        result: "Usopp Error: " + getErrorMessage(error),
        thoughts: ["QA planning failed"],
        summary: "QA error",
        reasoning: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
