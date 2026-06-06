import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {

  const body = await req.json();

  const response =
    await ai.models.generateContent({

      model: "gemini-2.5-flash",

      contents: `
คุณคือ Senior Backend Developer

Business Analysis:

${body.analysis}

ออกแบบ

1. REST API
2. Database Table
3. Entity Model
4. SQL Schema
`,
    });

  return Response.json({
    result: response.text,
  });
}