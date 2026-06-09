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

สร้าง Source Code สำหรับระบบนี้

กฎสำคัญ

1. ตอบเป็น Markdown เท่านั้น
2. ห้ามอธิบาย
3. ห้ามมีข้อความก่อน # File:
4. ทุกไฟล์ต้องใช้รูปแบบนี้เท่านั้น

# File: User.cs

\`\`\`csharp
// code
\`\`\`

# File: LoginRequest.cs

\`\`\`csharp
// code
\`\`\`

สร้างไฟล์ต่อไปนี้

Program.cs

appsettings.json

User.cs

LoginRequest.cs
RegisterRequest.cs

IAuthService.cs
AuthService.cs

IUserRepository.cs
UserRepository.cs

AppDbContext.cs

ServiceCollectionExtensions.cs

ExceptionMiddleware.cs

AuthController.cs

Technology

- ASP.NET Core 10
- C# 14
- Entity Framework Core 10
- SQL Server
- JWT Authentication

ตอบเฉพาะ Code Files เท่านั้น
`,
    });

  return Response.json({
    result: response.text,
  });
}