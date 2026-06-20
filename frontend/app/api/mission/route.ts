import { gemini } from "@/lib/gemini";
import { getErrorMessage } from "@/lib/get-error-message";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: body.prompt,
    });

    return Response.json({
      result: response.text,
    });
  } catch (error: unknown) {
    console.error(error);

    return Response.json({
      result: "Gemini Error : " + getErrorMessage(error),
    });
  }
}
