"use client";

import { motion } from "framer-motion";
import ActivityLog from "./components/ActivityLog";
import AgentCard from "./components/AgentCard";
import ResultCard from "./components/ResultCard";
import DashboardStats from "./components/DashboardStats";
import CompanyFloor from "./components/CompanyFloor";
import DashboardHeader from "./components/DashboardHeader";
import ExportToolbar from "./components/ExportToolbar";
import ProgressBar from "./components/ProgressBar";
import MissionTimeline from "./components/MissionTimeline";
import MissionForm from "./components/MissionForm";
import HistoryPanel from "./components/HistoryPanel";
import Card, { CardHeader } from "./components/ui/Card";
import EmptyState from "./components/ui/EmptyState";
import SectionHeader from "./components/ui/SectionHeader";
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

  const agentStatusProps = {
    currentAgent,
    robinStatus,
    zoroStatus,
    namiStatus,
    frankyStatus,
    usoppStatus,
  };

  const exportMarkdown = () => downloadMarkdownReport(agentResults);
  const exportPdf = () => downloadPdfReport(agentResults);
  const generateZip = () => {
    void generateProjectZip(zoroResult);
  };
  const testExtract = () => console.log(extractFiles(zoroResult));

  return (
    <div className="min-h-screen bg-surface-0">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.08)_0%,_transparent_50%)]"
        aria-hidden
      />

      <DashboardHeader loading={loading} currentAgent={currentAgent} />

      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DashboardStats
            projectCount={projectCount}
            successCount={successCount}
          />
        </motion.div>

        <section aria-labelledby="mission-control-heading">
          <SectionHeader
            id="mission-control-heading"
            title="Mission Control"
            description="Configure, launch, and monitor your AI development crew"
          />
          <div className="space-y-4">
            <MissionForm
              requirement={requirement}
              setRequirement={setRequirement}
              loading={loading}
              startMission={startMission}
            />
            <ProgressBar
              progress={progress}
              currentAgent={currentAgent}
              loading={loading}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MissionTimeline {...agentStatusProps} />
              <Card padding="md">
                <CardHeader
                  title="Current Requirement"
                  description="Active mission brief"
                />
                {requirement ? (
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {requirement}
                  </p>
                ) : (
                  <EmptyState
                    icon="📋"
                    title="No active requirement"
                    description="Enter a requirement above to begin a new mission."
                  />
                )}
              </Card>
            </div>
            <ExportToolbar
              onExportMarkdown={exportMarkdown}
              onExportPdf={exportPdf}
              onGenerateZip={generateZip}
              onTestExtract={testExtract}
              onDebugFiles={() => console.log(extractFiles(zoroResult))}
              onShowZoroResult={() => console.log(zoroResult)}
            />
          </div>
        </section>

        <section aria-labelledby="company-floor-heading">
          <SectionHeader
            id="company-floor-heading"
            title="Operations"
            description="Live floor view and agent activity"
          />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <CompanyFloor {...agentStatusProps} />
              <div>
                <SectionHeader
                  title="Agent Roster"
                  description="Individual agent status and roles"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
              </div>
            </div>
            <div className="space-y-6">
              <ActivityLog logs={logs} />
            </div>
          </div>
        </section>

        <section aria-labelledby="deliverables-heading">
          <SectionHeader
            id="deliverables-heading"
            title="Deliverables"
            description="Output from each agent in the pipeline"
          />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ResultCard
              title="Robin — Business Analysis"
              result={robinResult}
              status={robinStatus}
            />
            <ResultCard
              title="Zoro — Backend Design"
              result={zoroResult}
              status={zoroStatus}
            />
            <ResultCard
              title="Nami — Frontend Design"
              result={namiResult}
              status={namiStatus}
            />
            <ResultCard
              title="Franky — Architecture"
              result={frankyResult}
              status={frankyStatus}
            />
            <ResultCard
              title="Usopp — Test Cases"
              result={usoppResult}
              status={usoppStatus}
            />
          </div>
        </section>

        <section aria-labelledby="history-heading">
          <SectionHeader id="history-heading" title="History" description="Past missions" />
          <HistoryPanel history={history} />
        </section>
      </main>
    </div>
  );
}
