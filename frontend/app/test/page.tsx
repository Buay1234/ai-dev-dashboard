"use client";

import Button from "../components/ui/Button";
import Card, { CardHeader } from "../components/ui/Card";

export default function TestPage() {
  const testApi = async () => {
    const response = await fetch("/api/mission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "อธิบาย AI Agent แบบสั้นๆ",
      }),
    });

    const data = await response.json();

    alert(data.result);
  };

  return (
    <div className="min-h-screen bg-surface-0 p-8">
      <div className="mx-auto max-w-md">
        <Card padding="lg">
          <CardHeader
            title="API Test"
            description="Verify Gemini integration"
          />
          <Button variant="primary" onClick={testApi}>
            Test Gemini
          </Button>
        </Card>
      </div>
    </div>
  );
}
