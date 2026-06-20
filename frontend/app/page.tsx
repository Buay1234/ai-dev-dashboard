"use client";



import { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

import ActivityLog from "./components/ActivityLog";
import ThinkingPanel from "./components/ThinkingPanel";
import DeliverablesPanel from "./components/DeliverablesPanel";
import GeneratedFilesPanel from "./components/GeneratedFilesPanel";
import DatabasePanel from "./components/DatabasePanel";
import ExecutionCenterPanel from "./components/ExecutionCenterPanel";
import ExecutionTimeline from "./components/ExecutionTimeline";
import MigrationProgressPanel from "./components/MigrationProgressPanel";
import BuildStatusPanel from "./components/BuildStatusPanel";
import CompilerErrorAnalysisPanel from "./components/CompilerErrorAnalysisPanel";
import AutoFixReportPanel from "./components/AutoFixReportPanel";
import BuildRetryProgressPanel from "./components/BuildRetryProgressPanel";
import RuntimeVerificationPanel from "./components/RuntimeVerificationPanel";
import BusinessAnalysisPanel from "./components/BusinessAnalysisPanel";
import DomainKnowledgePanel from "./components/DomainKnowledgePanel";
import BusinessArchitecturePanel from "./components/BusinessArchitecturePanel";
import DatabaseDesignPanel from "./components/DatabaseDesignPanel";

import DashboardStats from "./components/DashboardStats";

import CompanyFloor from "./components/CompanyFloor";

import DashboardHeader from "./components/DashboardHeader";

import ExportToolbar from "./components/ExportToolbar";

import ProgressBar from "./components/ProgressBar";

import MissionTimeline from "./components/MissionTimeline";

import MissionForm from "./components/MissionForm";

import HistoryPanel from "./components/HistoryPanel";

import AgentRoster from "./components/AgentRoster";

import Card, { CardHeader } from "./components/ui/Card";

import EmptyState from "./components/ui/EmptyState";

import SectionHeader from "./components/ui/SectionHeader";

import { useMission } from "@/hooks/use-mission";
import { indexLatestMessages } from "@/lib/conversation";
import { thoughtSummariesByAgent } from "@/lib/thinking";

import { extractFiles } from "@/lib/extract-files";

import { downloadMarkdownReport } from "@/lib/export-markdown";

import { downloadPdfReport } from "@/lib/export-pdf";

import { generateProjectZip } from "@/lib/generate-zip";
import { exportGeneratedProjectZip } from "@/lib/export-project-zip";

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

    messages,

    thoughts,

    history,

    artifactBundle,

    artifactHistory,

    projectBundle,

    databaseWorkflow,

    migrationSteps,

    executionReport,

    executionTimeline,

    liveExecutionSteps,

    artifactSteps,

    buildVerification,

    buildVerificationRunning,

    runtimeReport,

    runtimeVerificationRunning,

    requirementAnalysis,

    architectureContract,

    businessArchitecturePlan,

    databaseDesignContract,

    exportEnabled,

    exportReady,

    startMission,

  } = useMission();

  const latestMessages = useMemo(() => {
    const fromConversation = indexLatestMessages(messages);
    const fromThoughts = thoughtSummariesByAgent(thoughts);
    return { ...fromConversation, ...fromThoughts };
  }, [messages, thoughts]);



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



  const projectZipLocked = Boolean(projectBundle) && !exportReady;

  const exportMarkdown = () => downloadMarkdownReport(agentResults);

  const exportPdf = () => downloadPdfReport(agentResults);

  const generateZip = () => {
    if (projectBundle) {
      if (!exportReady) return;
      void exportGeneratedProjectZip(projectBundle, artifactBundle);
      return;
    }
    void generateProjectZip(zoroResult);
  };

  const testExtract = () => console.log(extractFiles(zoroResult));

  const [officeZoom, setOfficeZoom] = useState(1);
  const [officeFullscreen, setOfficeFullscreen] = useState(false);

  const toggleOfficeFullscreen = useCallback(() => {
    setOfficeFullscreen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!officeFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOfficeFullscreen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [officeFullscreen]);

  const officeFloorProps = {
    ...agentStatusProps,
    progress,
    loading,
    latestMessages,
    zoom: officeZoom,
    onZoomChange: setOfficeZoom,
    isFullscreen: officeFullscreen,
    onToggleFullscreen: toggleOfficeFullscreen,
  };



  return (

    <div className="min-h-screen bg-surface-0">

      <div

        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.1)_0%,_transparent_55%)]"

        aria-hidden

      />

      <div

        className="pointer-events-none fixed inset-0 office-floor-grid opacity-[0.15]"

        aria-hidden

      />



      <DashboardHeader

        loading={loading}

        currentAgent={currentAgent}

        projectCount={projectCount}

        successCount={successCount}

      />



      <main className="relative mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

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

            description="Launch missions and monitor the AI software house pipeline"

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

              <Card padding="md">

                <CardHeader

                  title="Mission Brief"

                  description="Current requirement"

                />

                {requirement ? (

                  <p className="text-sm text-text-secondary leading-relaxed">

                    {requirement}

                  </p>

                ) : (

                  <EmptyState

                    icon="📋"

                    title="No active requirement"

                    description="Enter a requirement above to dispatch the crew."

                  />

                )}

              </Card>

            </div>

            <BusinessAnalysisPanel
              analysis={requirementAnalysis}
              loading={loading && !requirementAnalysis && Boolean(requirement.trim())}
            />

            <DomainKnowledgePanel
              contract={architectureContract}
              loading={loading && !architectureContract && Boolean(requirement.trim())}
            />

            <BusinessArchitecturePanel
              plan={businessArchitecturePlan}
              loading={loading && !businessArchitecturePlan && Boolean(requirement.trim())}
            />

            <DatabaseDesignPanel
              contract={databaseDesignContract}
              loading={loading && !databaseDesignContract && Boolean(requirement.trim())}
            />

            <ExportToolbar

              onExportMarkdown={exportMarkdown}

              onExportPdf={exportPdf}

              onGenerateZip={generateZip}

              zipLocked={projectZipLocked}

              exportReady={exportReady}

              onTestExtract={testExtract}

              onDebugFiles={() => console.log(extractFiles(zoroResult))}

              onShowZoroResult={() => console.log(zoroResult)}

            />

          </div>

        </section>



        <section aria-labelledby="company-floor-heading">

          <SectionHeader

            id="company-floor-heading"

            title="Visual AI Office"

            description="VISUAL AI OFFICE · V25 · REAL DATABASE CRUD EXECUTION"

          />

          {officeFullscreen ? (
            <div className="fixed inset-0 z-50 flex flex-col bg-surface-0 p-4 pt-20">
              <CompanyFloor {...officeFloorProps} />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5">
              <div className="xl:col-span-9 space-y-4">
                <CompanyFloor {...officeFloorProps} />
                <AgentRoster
                  {...agentStatusProps}
                  latestMessages={latestMessages}
                />
                <MissionTimeline {...agentStatusProps} messages={messages} />
              </div>

              <aside className="xl:col-span-3 space-y-4 xl:sticky xl:top-24 xl:self-start">
                <ThinkingPanel
                  thoughts={thoughts}
                  progress={progress}
                  artifactSteps={artifactSteps}
                  compact
                  {...agentStatusProps}
                />
                <ActivityLog logs={logs} messages={messages} compact />
              </aside>
            </div>
          )}

          <div className="mt-6 space-y-6">

            <ExecutionCenterPanel
              report={executionReport}
              liveSteps={liveExecutionSteps}
            />

            <BuildStatusPanel
              result={buildVerification}
              running={buildVerificationRunning}
              exportReady={exportReady}
            />

            <CompilerErrorAnalysisPanel
              analysis={buildVerification?.compilerAnalysis ?? null}
              running={buildVerificationRunning}
            />

            <AutoFixReportPanel
              report={buildVerification?.autoFixReport ?? null}
              running={buildVerificationRunning}
            />

            <BuildRetryProgressPanel
              buildRetry={buildVerification?.buildRetry ?? null}
              running={buildVerificationRunning}
              compilerAnalysis={buildVerification?.compilerAnalysis ?? null}
            />

            <RuntimeVerificationPanel
              report={runtimeReport}
              running={runtimeVerificationRunning}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DatabasePanel
                panelInfo={executionReport?.databasePanel ?? null}
                workflow={databaseWorkflow}
              />
              <MigrationProgressPanel
                steps={migrationSteps}
                preview={databaseWorkflow?.preview}
              />
              <ExecutionTimeline events={executionTimeline} />
            </div>

            <GeneratedFilesPanel
              project={projectBundle}
              artifactBundle={artifactBundle}
              exportEnabled={exportReady}
            />

            <DeliverablesPanel
              bundle={artifactBundle}
              history={artifactHistory}
              migrationArtifacts={projectBundle?.migrationArtifacts}
            />

          </div>

        </section>



        <section aria-labelledby="history-heading">

          <SectionHeader

            id="history-heading"

            title="Mission History"

            description="Past deployments"

          />

          <HistoryPanel history={history} />

        </section>

      </main>

    </div>

  );

}


