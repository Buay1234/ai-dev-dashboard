"use client";

import { useState } from "react";

export default function Home() {

  const [requirement, setRequirement] = useState("");
  const [robinStatus, setRobinStatus] = useState("Idle");
  const [zoroStatus, setZoroStatus] = useState("Idle");
  const [usoppStatus, setUsoppStatus] = useState("Idle");
  const [namiStatus, setNamiStatus] = useState("Idle");
  const [frankyStatus, setFrankyStatus] = useState("Idle");
  const [currentAgent, setCurrentAgent] = useState("Idle");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [frankyResult, setFrankyResult] = useState("");
  const [namiResult, setNamiResult] = useState("");
  const [robinResult, setRobinResult] = useState("");
  const [zoroResult, setZoroResult] = useState("");
  const [usoppResult, setUsoppResult] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const startMission = async () => {
    if (!requirement.trim()) {
      alert("Please enter requirement");
      return;
    }
    try {
      setLoading(true);
      setProgress(0);
      setRobinResult("");
      setZoroResult("");
      setNamiResult("");
      setFrankyResult("");
      setUsoppResult("");
      setRobinStatus("Working");
      setCurrentAgent("Robin");
      setZoroStatus("Idle");
      setNamiStatus("Idle");
      setFrankyStatus("Idle");
      setUsoppStatus("Idle");

      setHistory(prev => [
        `${new Date().toLocaleString()} - ${requirement}`,
        ...prev,
      ]);

      const robinResponse = await fetch("/api/robin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requirement,
        }),

      });
      if (!robinResponse.ok) {
        throw new Error("Robin Agent Failed");
      }
      const robinData = await robinResponse.json();
      if (
        robinData.result?.includes("Gemini Error")
      ) {
        setRobinStatus("Error");
        setLoading(false);
        return;
      }
      setRobinStatus("Completed");
      setProgress(20);
      setCurrentAgent("Zoro");
      setZoroStatus("Working");

      setRobinResult(robinData.result);




      const zoroResponse = await fetch("/api/zoro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis: robinData.result,
        }),
      });
      if (!zoroResponse.ok) {
        throw new Error("zoro Agent Failed");
      }
      const zoroData = await zoroResponse.json();

      setZoroResult(zoroData.result);

      setZoroStatus("Completed");
      setProgress(40);
      setCurrentAgent("Nami");
      setNamiStatus("Working");

      const namiResponse =
        await fetch("/api/nami", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            backendDesign: zoroData.result,
          }),
        });
      if (!namiResponse.ok) {
        throw new Error("Nami Agent Failed");
      }
      const namiData =
        await namiResponse.json();

      setNamiResult(namiData.result);

      setNamiStatus("Completed");
      setProgress(60);
      setCurrentAgent("Franky");
      setFrankyStatus("Working");
      const frankyResponse =
        await fetch("/api/franky", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            backendDesign: zoroData.result,
            frontendDesign: namiData.result,
          }),
        });

      if (!frankyResponse.ok) {
        throw new Error("Franky Agent Failed");
      }

      const frankyData =
        await frankyResponse.json();

      setFrankyResult(
        frankyData.result
      );

      setFrankyStatus("Completed");
      setProgress(80);
      setCurrentAgent("Usopp");
      setUsoppStatus("Working");

      const usoppResponse = await fetch("/api/usopp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiDesign:
            `
          ${zoroData.result}

          ${frankyData.result}
          `
        }),
      });
      if (!usoppResponse.ok) {
        throw new Error("usopp Agent Failed");
      }
      const usoppData = await usoppResponse.json();

      setUsoppResult(usoppData.result);

      setUsoppStatus("Completed");
      setProjectCount(prev => prev + 1);
      setSuccessCount(prev => prev + 1);
      setProgress(100);
      setCurrentAgent("Completed");
      setRequirement("");

    } catch (error) {

      console.error(error);

      setRobinStatus(prev =>
        prev === "Working"
          ? "Error"
          : prev
      );

      setZoroStatus(prev =>
        prev === "Working"
          ? "Error"
          : prev
      );

      setNamiStatus(prev =>
        prev === "Working"
          ? "Error"
          : prev
      );
      setFrankyStatus(prev =>
        prev === "Working"
          ? "Error"
          : prev
      );
      setUsoppStatus(prev =>
        prev === "Working"
          ? "Error"
          : prev
      );
    } finally {

      setLoading(false);

    }


  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10">

      <h1 className="text-4xl font-bold mb-6">
        AI Development Crew
      </h1>
      <p className="text-slate-400">
        AI Software House Dashboard V2.5
      </p>
      <textarea
        value={requirement}
        onChange={(e) => setRequirement(e.target.value)}
        className="w-full h-32 bg-white text-black p-4 rounded-lg"
        placeholder="สร้างระบบ Login..."
      />

      <button
        disabled={loading}
        onClick={startMission}
        className={`
        mt-4 px-5 py-2 rounded-lg flex items-center gap-2
        ${loading
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"}
      `}
      >
        {loading && (
          <span className="animate-spin">
            ⚙️
          </span>
        )}

        {loading
          ? "Running..."
          : "Start Mission"}
      </button>
      <div className="flex gap-3 mt-4">

        <button>
          Start Mission
        </button>

        {/* <button>
          Download Result
        </button> */}

      </div>
      <div className="mt-4">

        <div className="bg-slate-700 h-3 rounded-full">

          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`
            }}
          />

        </div>

        <p className="text-sm text-slate-300 mt-2">
          Progress : {progress}%
        </p>

      </div>
      <div className="mt-2 text-yellow-400">
        Current Agent : {currentAgent}
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">

        <div className="bg-slate-800 p-4 rounded-lg">
          <h3>Total Projects</h3>
          <p className="text-2xl font-bold">
            {projectCount}
          </p>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg">
          <h3>Success</h3>
          <p className="text-2xl font-bold text-green-400">
            {successCount}
          </p>
        </div>

      </div>
      <div className="bg-slate-800 p-4 rounded-lg mt-4">
        <h2 className="font-bold mb-2">
          📋 Current Requirement
        </h2>

        <p className="text-slate-300">
          {requirement || "No Active Requirement"}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-10">

        <div className="bg-slate-800 p-4 rounded-lg">
          <h2>🧠 Robin</h2>
          <p>Business Analyst</p>
          <p>
            Status :
            <span
              className={
                robinStatus === "Completed"
                  ? "text-green-400"
                  : robinStatus === "Error"
                    ? "text-red-400"
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
                  : zoroStatus === "Error"
                    ? "text-red-400"
                    : zoroStatus.includes("Waiting")
                      ? "text-blue-400"
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
          <h2>🧭 Nami</h2>
          <p>Frontend Developer</p>
          <p>
            Status :
            <span
              className={
                namiStatus === "Completed"
                  ? "text-green-400"
                  : namiStatus === "Error"
                    ? "text-red-400"
                    : namiStatus === "Working"
                      ? "text-yellow-400"
                      : "text-gray-400"
              }
            >
              {" "}{namiStatus}
            </span>
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <h2>🔨 Franky</h2>
          <p>Full Stack Architect</p>

          <p>
            Status :
            <span
              className={
                frankyStatus === "Completed"
                  ? "text-green-400"
                  : frankyStatus === "Error"
                    ? "text-red-400"
                    : frankyStatus === "Working"
                      ? "text-yellow-400"
                      : "text-gray-400"
              }
            >
              {" "}{frankyStatus}
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
                  : usoppStatus === "Error"
                    ? "text-red-400"
                    : usoppStatus.includes("Waiting")
                      ? "text-blue-400"
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
      <div
        className="
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-5
        gap-4
        mt-6
      "
      >

        <div className="bg-slate-800 p-4 rounded-lg min-h-[400px]">
          <h2 className="font-bold mb-2">
            🧠 Robin Result
          </h2>

          <pre className="whitespace-pre-wrap text-sm">
            {robinResult}
          </pre>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg min-h-[400px]">
          <h2 className="font-bold mb-2">
            ⚔️ Zoro Result
          </h2>

          <pre className="whitespace-pre-wrap text-sm">
            {zoroResult}
          </pre>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg min-h-[400px]">
          <h2 className="font-bold mb-2">
            🧭 Nami Result
          </h2>

          <pre className="whitespace-pre-wrap text-sm">
            {namiResult}
          </pre>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg min-h-[400px]">
          <h2 className="font-bold mb-2">
            🔨 Franky Result
          </h2>

          <pre className="whitespace-pre-wrap text-sm">
            {frankyResult}
          </pre>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg min-h-[400px]">
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