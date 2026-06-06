"use client";

import { useState } from "react";

export default function Home() {

  const [requirement, setRequirement] = useState("");
  const [result, setResult] = useState("");
  const [robinStatus, setRobinStatus] = useState("Idle");
  const [zoroStatus, setZoroStatus] = useState("Idle");
  const [usoppStatus, setUsoppStatus] = useState("Idle");
  const [loading, setLoading] = useState(false);
  const [robinResult, setRobinResult] = useState("");
  const [zoroResult, setZoroResult] = useState("");
  const [usoppResult, setUsoppResult] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const startMission = async () => {

    setLoading(true);

    setRobinStatus("Working");
    setZoroStatus("Idle");
    setUsoppStatus("Idle");

    const response = await fetch("/api/mission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `
คุณคือทีมพัฒนา Software

Requirement:
${requirement}

ตอบกลับเป็น

ROBIN:
วิเคราะห์ Requirement

ZORO:
ออกแบบ API

USOPP:
สร้าง Test Case
`,
      }),
    });
    setHistory(prev => [
      requirement,
      ...prev,
    ]);
    const data = await response.json();
    const text = data.result;

    const robin =
      text.split("ZORO:")[0].replace("ROBIN:", "");

    const zoro =
      text.split("ZORO:")[1]?.split("USOPP:")[0] || "";

    const usopp =
      text.split("USOPP:")[1] || "";

    setRobinResult(robin);
    setZoroResult(zoro);
    setUsoppResult(usopp);
    // Robin เสร็จ
    setRobinStatus("Completed");

    // Zoro เริ่ม
    setZoroStatus("Working");

    await new Promise(resolve =>
      setTimeout(resolve, 1500)
    );

    setZoroStatus("Completed");

    // Usopp เริ่ม
    setUsoppStatus("Working");

    await new Promise(resolve =>
      setTimeout(resolve, 1500)
    );

    setUsoppStatus("Completed");

    setResult(data.result);

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10">

      <h1 className="text-4xl font-bold mb-6">
        AI Development Crew
      </h1>

      <textarea
        value={requirement}
        onChange={(e) => setRequirement(e.target.value)}
        className="w-full h-32 bg-white text-black p-4 rounded-lg"
        placeholder="สร้างระบบ Login..."
      />

      <button
        onClick={startMission}
        className="mt-4 bg-blue-600 px-5 py-2 rounded-lg"
      >
        {loading ? "Running..." : "Start Mission"}
      </button>

      <div className="grid grid-cols-3 gap-4 mt-10">

        <div className="bg-slate-800 p-4 rounded-lg">
          <h2>🧠 Robin</h2>
          <p>Business Analyst</p>
          <p>
            Status :
            <span
              className={
                robinStatus === "Completed"
                  ? "text-green-400"
                  : robinStatus === "Working"
                    ? "text-yellow-400"
                    : "text-gray-400"
              }
            >
              {" "}{robinStatus}
            </span>
          </p>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg">
          <h2>⚔️ Zoro</h2>
          <p>Backend Developer</p>
          <p>
            Status :
            <span
              className={
                zoroStatus === "Completed"
                  ? "text-green-400"
                  : zoroStatus === "Working"
                    ? "text-yellow-400"
                    : "text-gray-400"
              }
            >
              {" "}{zoroStatus}
            </span>
          </p>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg">
          <h2>🔫 Usopp</h2>
          <p>QA Tester</p>
          <p>
            Status :
            <span
              className={
                usoppStatus === "Completed"
                  ? "text-green-400"
                  : usoppStatus === "Working"
                    ? "text-yellow-400"
                    : "text-gray-400"
              }
            >
              {" "}{usoppStatus}
            </span>
          </p>
        </div>

      </div>
      <div className="grid grid-cols-3 gap-4 mt-6">

        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="font-bold mb-2">
            🧠 Robin Result
          </h2>

          <pre className="whitespace-pre-wrap text-sm">
            {robinResult}
          </pre>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="font-bold mb-2">
            ⚔️ Zoro Result
          </h2>

          <pre className="whitespace-pre-wrap text-sm">
            {zoroResult}
          </pre>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="font-bold mb-2">
            🔫 Usopp Result
          </h2>

          <pre className="whitespace-pre-wrap text-sm">
            {usoppResult}
          </pre>
        </div>

      </div>
      <div className="mt-10 bg-slate-800 p-5 rounded-lg">

        <h2 className="text-xl mb-3">
          Project History
        </h2>

        {history.map((item, index) => (
          <div
            key={index}
            className="border-b border-slate-700 py-2"
          >
            {item}
          </div>
        ))}

      </div>

    </div>
  );
}