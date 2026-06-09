"use client";

import ActivityLog from "./components/ActivityLog";
import AgentCard from "./components/AgentCard";
import ResultCard from "./components/ResultCard";
import DashboardStats from "./components/DashboardStats";
import ProgressBar from "./components/ProgressBar";
import MissionTimeline from "./components/MissionTimeline";
import MissionForm from "./components/MissionForm";
import HistoryPanel from "./components/HistoryPanel";
import { useMission } from "@/hooks/use-mission";
import { extractFiles } from "@/lib/extract-files";
import { downloadMarkdownReport } from "@/lib/export-markdown";
import { downloadPdfReport } from "@/lib/export-pdf";
import { generateProjectZip } from "@/lib/generate-zip";
import type { AgentResults } from "@/lib/types/agent-results";

export default function Home() {
  const {
    requirement,
    setRequirement,
    robinStatus,
    zoroStatus,
    usoppStatus,
    namiStatus,
    frankyStatus,
    currentAgent,
    loading,
    progress,
    projectCount,
    successCount,
    frankyResult,
    namiResult,
    robinResult,
    zoroResult,
    usoppResult,
    logs,
    history,
    startMission,
  } = useMission();

  const agentResults: AgentResults = {
    robin: robinResult,
    zoro: zoroResult,
    nami: namiResult,
    franky: frankyResult,
    usopp: usoppResult,
  };

  const exportMarkdown = () => downloadMarkdownReport(agentResults);
  const exportPdf = () => downloadPdfReport(agentResults);
  const generateZip = () => {
    void generateProjectZip(zoroResult);
  };
  const testExtract = () => console.log(extractFiles(zoroResult));

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10">
      <h1 className="text-4xl font-bold mb-6">AI Development Crew</h1>
      <p className="text-slate-400">AI Software House Dashboard V2.5</p>
      <MissionForm
        requirement={requirement}
        setRequirement={setRequirement}
        loading={loading}
        startMission={startMission}
      />
      <ProgressBar progress={progress} currentAgent={currentAgent} />
      <MissionTimeline
        currentAgent={currentAgent}
        robinStatus={robinStatus}
        zoroStatus={zoroStatus}
        namiStatus={namiStatus}
        frankyStatus={frankyStatus}
        usoppStatus={usoppStatus}
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
        <button
          onClick={testExtract}
          className="
    bg-purple-600
    px-4
    py-2
    rounded
  "
        >
          Test Extract
        </button>
        <button
          type="button"
          onClick={() => {
            console.log(extractFiles(zoroResult));
          }}
        >
          Debug Files
        </button>

        <button
          onClick={generateZip}
          className="
    bg-blue-600
    hover:bg-blue-700
    px-4
    py-2
    rounded-lg
  "
        >
          📦 ZIP
        </button>

        <button
          onClick={() => {
            console.log(zoroResult);
          }}
        >
          Show Zoro Result
        </button>
      </div>
      <ActivityLog logs={logs} />
      <DashboardStats
        projectCount={projectCount}
        successCount={successCount}
      />

      <div className="bg-slate-800 p-4 rounded-lg mt-4">
        <h2 className="font-bold mb-2">📋 Current Requirement</h2>

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
        <ResultCard title="🧠 Robin Result" result={robinResult} />

        <ResultCard title="⚔️ Zoro Result" result={zoroResult} />

        <ResultCard title="🧭 Nami Result" result={namiResult} />

        <ResultCard title="🔨 Franky Result" result={frankyResult} />

        <ResultCard title="🔫 Usopp Result" result={usoppResult} />
      </div>

      <HistoryPanel history={history} />
    </div>
  );
}
