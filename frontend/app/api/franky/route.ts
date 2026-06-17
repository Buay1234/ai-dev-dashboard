import { getErrorMessage } from "@/lib/get-error-message";
import { runFrankyAgent } from "@/lib/agents/franky-agent";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const output = await runFrankyAgent(
      body.backendDesign,
      body.frontendDesign
    );

    return Response.json(output);
  } catch (error: unknown) {
    console.error("Franky Error", error);

    return Response.json({
      result: "Franky Error: " + getErrorMessage(error),
      thoughts: ["Architecture review failed"],
      summary: "Review error",
      reasoning: getErrorMessage(error),
    });
  }
}
