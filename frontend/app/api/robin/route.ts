import { getErrorMessage } from "@/lib/get-error-message";
import { isGeminiConfigured } from "@/lib/gemini-env";
import { runRobinAgent } from "@/lib/agents/robin-agent";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    if (!isGeminiConfigured()) {
      return Response.json(
        {
          result: "Robin Error: GEMINI_API_KEY is not set",
          thoughts: ["Missing Gemini API key"],
          summary: "Configure GEMINI_API_KEY",
          reasoning:
            "Create frontend/.env.local with GEMINI_API_KEY=your_key from Google AI Studio, then restart npm run dev.",
        },
        { status: 503 }
      );
    }

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
