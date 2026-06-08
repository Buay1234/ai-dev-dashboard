"use client";
import ActivityLog
  from "./components/ActivityLog";
import { useState } from "react";
import AgentCard from "./components/AgentCard";
import ResultCard from "./components/ResultCard";
import DashboardStats from "./components/DashboardStats";
import ProgressBar from "./components/ProgressBar";
import MissionForm from "./components/MissionForm";
import HistoryPanel from "./components/HistoryPanel";
import jsPDF from "jspdf";
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



  const [logs, setLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const addLog = (message: string) => {
    setLogs(prev => [
      `${new Date().toLocaleTimeString()} - ${message}`,
      ...prev,
    ]);
  };
  const exportMarkdown = () => {

    const content = `
# Business Analysis

${robinResult}

# Backend Design

${zoroResult}

# Frontend Design

${namiResult}

# Architecture

${frankyResult}

# Test Cases

${usoppResult}
`;

    const blob =
      new Blob(
        [content],
        { type: "text/markdown" }
      );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download = "project-report.md";

    a.click();
  };
  const exportPdf = () => {

    const pdf = new jsPDF();

    const report = `
AI Development Crew Report

=====================

Business Analysis

${robinResult}

=====================

Backend Design

${zoroResult}

=====================

Frontend Design

${namiResult}

=====================

Architecture

${frankyResult}

=====================

Test Cases

${usoppResult}
`;

    const lines =
      pdf.splitTextToSize(
        report,
        180
      );

    pdf.text(
      lines,
      10,
      10
    );

    pdf.save(
      "project-report.pdf"
    );
  };
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
      addLog("Robin Started");
      addLog("Robin Completed");
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


      addLog("Zoro Started");
      addLog("Zoro Completed");
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

      addLog("Nami Started");
      addLog("Nami Completed");
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

      addLog("Franky Started");
      addLog("Franky Completed");
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

      addLog("Usopp Started");
      addLog("Usopp Completed");
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
      <MissionForm
        requirement={requirement}
        setRequirement={setRequirement}
        loading={loading}
        startMission={startMission}
      />
      <ProgressBar
        progress={progress}
        currentAgent={currentAgent}
      />
      <div className="flex gap-3 mt-4">

        <button
          onClick={exportMarkdown}
          className="
      bg-green-600
      hover:bg-green-700
      px-4
      py-2
      rounded-lg
    "
        >
          📄 Markdown
        </button>

        <button
          onClick={exportPdf}
          className="
      bg-red-600
      hover:bg-red-700
      px-4
      py-2
      rounded-lg
    "
        >
          📕 PDF
        </button>

      </div>
      <ActivityLog logs={logs} />
      <DashboardStats
        projectCount={projectCount}
        successCount={successCount}
      />

      <div className="bg-slate-800 p-4 rounded-lg mt-4">
        <h2 className="font-bold mb-2">
          📋 Current Requirement
        </h2>

        <p className="text-slate-300">
          {requirement || "No Active Requirement"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-6">

        <AgentCard
          icon="🧠"
          name="Robin"
          role="Business Analyst"
          status={robinStatus}
        />

        <AgentCard
          icon="⚔️"
          name="Zoro"
          role="Backend Developer"
          status={zoroStatus}
        />

        <AgentCard
          icon="🧭"
          name="Nami"
          role="Frontend Developer"
          status={namiStatus}
        />

        <AgentCard
          icon="🔨"
          name="Franky"
          role="Full Stack Architect"
          status={frankyStatus}
        />

        <AgentCard
          icon="🔫"
          name="Usopp"
          role="QA Tester"
          status={usoppStatus}
        />

      </div>


      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">

        <ResultCard
          title="🧠 Robin Result"
          result={robinResult}
        />

        <ResultCard
          title="⚔️ Zoro Result"
          result={zoroResult}
        />

        <ResultCard
          title="🧭 Nami Result"
          result={namiResult}
        />

        <ResultCard
          title="🔨 Franky Result"
          result={frankyResult}
        />

        <ResultCard
          title="🔫 Usopp Result"
          result={usoppResult}
        />

      </div>


      <HistoryPanel history={history} />

    </div>
  );
}