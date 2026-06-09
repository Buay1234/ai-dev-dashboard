import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {

    const body = await req.json();

    const response =
      await ai.models.generateContent({

        model: "gemini-2.0-flash",

        contents: `
คุณคือ Senior Full Stack Architect

Backend Design
${body.backendDesign}

Frontend Design
${body.frontendDesign}

สร้าง

# Project Structure

# Folder Structure

# Recommended Tech Stack

# Database Design

# Coding Standards

# Deployment Architecture
`,
      });

    return Response.json({
      result: response.text,
    });

  } catch (error: any) {

  console.error(
    "Franky Error",
    error
  );

  return Response.json({
    result:
      "Franky Error: " +
      error.message
  });
}
}