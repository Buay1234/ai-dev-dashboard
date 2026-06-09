import { gemini } from "@/lib/gemini";

export async function POST(req: Request) {
  const body = await req.json();

  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: `
คุณคือ Senior Frontend Developer

Backend Design

${body.backendDesign}

สร้าง

1. UI Screens
2. Components
3. Page Flow
4. Tailwind Layout
5. Responsive Design
`,
  });

  return Response.json({
    result: response.text,
  });
}
