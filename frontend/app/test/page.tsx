"use client";

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
    <div className="p-10">
      <button
        onClick={testApi}
        className="bg-blue-600 text-white p-4 rounded"
      >
        Test Gemini
      </button>
    </div>
  );
}