import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: `
คุณคือ Senior Business Analyst ที่มีประสบการณ์มากกว่า 15 ปี

หน้าที่ของคุณคือวิเคราะห์ Requirement จากผู้ใช้งาน และจัดทำ Business Analysis Document สำหรับทีมพัฒนา

Requirement:
${body.requirement}

กรุณาตอบเป็น Markdown และแบ่งหัวข้อดังนี้

# Business Goal
อธิบายเป้าหมายทางธุรกิจ

# Target Users
ระบุกลุ่มผู้ใช้งานหลัก

# User Stories

- As a <role>
- I want <feature>
- So that <benefit>

# Acceptance Criteria

- Given ...
- When ...
- Then ...

# Functional Requirements

- FR-001
- FR-002
- FR-003

# Non-Functional Requirements

- Security
- Performance
- Scalability
- Availability

# API Requirements

Method: POST
Endpoint: /api/auth/login

Method: POST
Endpoint: /api/auth/register

# Database Entities

User
Role
Permission

พร้อม Field สำคัญของแต่ละ Table

# Assumptions

ระบุข้อสมมติที่ใช้ในการวิเคราะห์

# Risks

ระบุความเสี่ยงหรือประเด็นที่ควรถามเพิ่มเติมจากลูกค้า

ตอบเฉพาะผลวิเคราะห์เท่านั้น
`,
        });

        return Response.json({
            result: response.text,
        });

    } catch (error: any) {
        console.error(
            "Robin Error",
            error
        );

        return Response.json(
            {
                result:
                    "Robin Error: " +
                    error.message,
            },
            {
                status: 500,
            }
        );
    }
}