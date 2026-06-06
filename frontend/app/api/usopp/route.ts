import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {

  const body = await req.json();

  const response =
    await ai.models.generateContent({

      model: "gemini-2.5-flash-lite",

      contents: `
คุณคือ Senior QA Engineer

API Design

${body.apiDesign}

สร้าง

1. Positive Test Cases
2. Negative Test Cases
3. Edge Cases
4. Security Tests
`,
    });

  return Response.json({
    result: response.text,
  });
}