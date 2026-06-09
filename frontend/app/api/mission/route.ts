import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: body.prompt,
    });

    return Response.json({
      result: response.text,
    });
  } catch (error: any) {
    console.error(error);

    return Response.json({
      result: "Gemini Error : " + error.message,
    });
  }
}