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
คุณคือ Senior ASP.NET Core 10 Developer

Business Analysis

${body.analysis}

สร้าง Source Code

ตอบเป็น Markdown

ใช้รูปแบบ

# File: User.cs

\`\`\`csharp
code
\`\`\`

# File: LoginRequest.cs

\`\`\`csharp
code
\`\`\`

# File: AuthController.cs

\`\`\`csharp
code
\`\`\`

สร้างไฟล์ต่อไปนี้

User.cs
LoginRequest.cs
RegisterRequest.cs
IAuthService.cs
AuthService.cs
IUserRepository.cs
UserRepository.cs
AuthController.cs

ใช้

ASP.NET Core 10
Entity Framework Core 10
SQL Server
JWT

`,
    });

  return Response.json({
    result: response.text,
  });
}