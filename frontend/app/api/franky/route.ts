import { gemini } from "@/lib/gemini";
import { getErrorMessage } from "@/lib/get-error-message";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash-lite",
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
  } catch (error: unknown) {
    console.error("Franky Error", error);

    return Response.json({
      result: "Franky Error: " + getErrorMessage(error),
    });
  }
}
