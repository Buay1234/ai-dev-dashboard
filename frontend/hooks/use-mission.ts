"use client";

import { useCallback, useMemo, useState } from "react";
import type { AgentMessage } from "@/app/types/conversation";
import type { AgentThought } from "@/app/types/thinking";
import { createAgentMessage } from "@/lib/conversation";
import {
  STANDBY_THOUGHTS,
  createAgentThought,
  upsertThought,
} from "@/lib/thinking";
import type { AgentWorkflowResult } from "@/lib/agents/types";
import type { AgentStatus } from "@/lib/types/agent-results";
import type { ArtifactBundle, ArtifactProgressStep } from "@/app/types/artifacts";
import type { GeneratedProjectBundle } from "@/lib/project-generator/types";
import type { DatabaseWorkflowState, MigrationProgressStep } from "@/lib/database/database-status";
import { simulateMigrationApplied } from "@/lib/database/database-service";
import type {
  ExecutionReport,
  ExecutionStep,
  ExecutionTimelineEvent,
} from "@/lib/execution/execution-types";
import {
  runFullExecutionPipeline,
  upsertExecutionStep,
} from "@/lib/execution";
import {
  runBuildVerification,
  type BuildVerificationResult,
} from "@/lib/build-verification";
import { computeExportState, logExportState } from "@/lib/export-state";
import {
  runRuntimeVerification,
  type RuntimeReport,
} from "@/lib/runtime";
import {
  analyzeRequirement,
  type RequirementAnalysisContract,
} from "@/lib/requirement-parser";
import {
  buildArchitectureContract,
  formatArchitectureContractForAgent,
  type ArchitectureContract,
} from "@/lib/domain-library";
import {
  buildAgentArchitectureContext,
  generateBusinessArchitecture,
  type BusinessArchitecturePlan,
} from "@/lib/architecture";
import {
  clearArtifactStore,
  getArtifactProgressSteps,
  getProjectGenerationSteps,
  runArtifactGeneration,
} from "@/lib/artifacts/artifact-service";

type AgentApiPayload = AgentWorkflowResult;

function applyAiWorkflow(
  agent: string,
  status: string,
  data: AgentApiPayload,
  progress: number,
  setThought: (entry: AgentThought) => void,
  addMessage: (agent: string, message: string) => void
) {
  setThought(
    createAgentThought(
      agent,
      status,
      data.thoughts?.length ? data.thoughts : ["Processing Gemini output…"],
      data.summary || data.reasoning,
      progress
    )
  );
  if (data.reasoning) {
    addMessage(agent, data.reasoning);
  }
  if (data.summary && data.summary !== data.reasoning) {
    addMessage(agent, data.summary);
  }
}

export function useMission() {
  const [requirement, setRequirement] = useState("");
  const [robinStatus, setRobinStatus] = useState<AgentStatus>("Idle");
  const [zoroStatus, setZoroStatus] = useState<AgentStatus>("Idle");
  const [usoppStatus, setUsoppStatus] = useState<AgentStatus>("Idle");
  const [namiStatus, setNamiStatus] = useState<AgentStatus>("Idle");
  const [frankyStatus, setFrankyStatus] = useState<AgentStatus>("Idle");
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
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [thoughts, setThoughts] = useState<AgentThought[]>(STANDBY_THOUGHTS);
  const [artifactBundle, setArtifactBundle] = useState<ArtifactBundle | null>(null);
  const [artifactHistory, setArtifactHistory] = useState<ArtifactBundle[]>([]);
  const [projectBundle, setProjectBundle] = useState<GeneratedProjectBundle | null>(null);
  const [databaseWorkflow, setDatabaseWorkflow] = useState<DatabaseWorkflowState | null>(null);
  const [migrationSteps, setMigrationSteps] = useState<MigrationProgressStep[]>([]);
  const [executionReport, setExecutionReport] = useState<ExecutionReport | null>(null);
  const [executionTimeline, setExecutionTimeline] = useState<ExecutionTimelineEvent[]>([]);
  const [liveExecutionSteps, setLiveExecutionSteps] = useState<ExecutionStep[]>([]);
  const [buildVerification, setBuildVerification] =
    useState<BuildVerificationResult | null>(null);
  const [buildVerificationRunning, setBuildVerificationRunning] = useState(false);
  const [runtimeReport, setRuntimeReport] = useState<RuntimeReport | null>(null);
  const [runtimeVerificationRunning, setRuntimeVerificationRunning] =
    useState(false);
  const [requirementAnalysis, setRequirementAnalysis] =
    useState<RequirementAnalysisContract | null>(null);
  const [architectureContract, setArchitectureContract] =
    useState<ArchitectureContract | null>(null);
  const [businessArchitecturePlan, setBusinessArchitecturePlan] =
    useState<BusinessArchitecturePlan | null>(null);
  const [artifactSteps, setArtifactSteps] = useState<ArtifactProgressStep[]>([]);

  const setThought = useCallback((entry: AgentThought) => {
    setThoughts((prev) => upsertThought(prev, entry));
  }, []);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [
      `${new Date().toLocaleTimeString()} - ${message}`,
      ...prev,
    ]);
  }, []);

  const addMessage = useCallback((agent: string, message: string) => {
    const entry = createAgentMessage(agent, message);
    setMessages((prev) => [...prev, entry]);
    setLogs((prev) => [
      `${entry.timestamp} - ${agent}: ${message}`,
      ...prev,
    ]);
  }, []);

  const startMission = useCallback(async () => {
    if (!requirement.trim()) {
      alert("Please enter requirement");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);
      setMessages([]);
      setThoughts(STANDBY_THOUGHTS);
      setArtifactBundle(null);
      setProjectBundle(null);
      setDatabaseWorkflow(null);
      setMigrationSteps([]);
      setExecutionReport(null);
      setExecutionTimeline([]);
      setLiveExecutionSteps([]);
      setBuildVerification(null);
      setBuildVerificationRunning(false);
      setRuntimeReport(null);
      setRuntimeVerificationRunning(false);
      setRequirementAnalysis(null);
      setArchitectureContract(null);
      setBusinessArchitecturePlan(null);
      setArtifactSteps([]);
      clearArtifactStore();
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

      setThought(
        createAgentThought(
          "Robin",
          "Thinking",
          ["Connecting to Gemini…", "Preparing business analysis prompt"],
          "Consulting Gemini",
          5
        )
      );

      setHistory((prev) => [
        `${new Date().toLocaleString()} - ${requirement}`,
        ...prev,
      ]);

      const analysis = analyzeRequirement(requirement);
      setRequirementAnalysis(analysis);

      const architecture = buildArchitectureContract(analysis);
      setArchitectureContract(architecture);

      const architecturePlan = generateBusinessArchitecture(analysis, architecture);
      setBusinessArchitecturePlan(architecturePlan);

      addLog(
        `V28 Requirement Parser — domain: ${analysis.domain}, entities: ${analysis.entities.length}, confidence: ${analysis.confidenceScore}%`
      );
      addLog(
        architecture.templateLoaded
          ? `V29 Domain Library — loaded ${architecture.templateId}.json · ${architecture.entities.length} merged entities`
          : "V29 Domain Library — no template for domain, using requirement analysis only"
      );
      addLog(
        `V30 Business Architecture — ${architecturePlan.architectureType} · complexity ${architecturePlan.complexityScore} · confidence ${architecturePlan.confidenceScore}%`
      );
      addMessage(
        "System",
        `Business Analysis — ${analysis.domain} · ${architecture.entities.join(", ")}`
      );
      addMessage(
        "System",
        `Architecture Plan — ${architecturePlan.architectureType} with ${architecturePlan.patterns.length} patterns`
      );

      const domainAnalysisPayload = formatArchitectureContractForAgent(architecture);
      const agentArchitecturePayload = buildAgentArchitectureContext(
        architecture,
        architecturePlan,
        formatArchitectureContractForAgent
      );

      addLog("Robin Started — Gemini workflow");

      const robinResponse = await fetch("/api/robin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requirement,
        }),
      });
      addLog("Robin Completed");

      if (!robinResponse.ok) {
        const errorText = await robinResponse.text();

        console.error("Robin API Error:", errorText);

        throw new Error(errorText);
      }

      const robinData = (await robinResponse.json()) as AgentApiPayload;

      if (robinData.result?.includes("Gemini Error") || robinData.result?.includes("Robin Error")) {
        setRobinStatus("Error");
        applyAiWorkflow("Robin", "Error", robinData, 0, setThought, addMessage);
        setLoading(false);
        return;
      }

      setRobinStatus("Completed");
      setProgress(20);
      setRobinResult(robinData.result);
      applyAiWorkflow("Robin", "Thinking", robinData, 20, setThought, addMessage);

      setCurrentAgent("Zoro");
      setZoroStatus("Working");
      setThought(
        createAgentThought(
          "Zoro",
          "Developing",
          ["Waiting for Robin report…", "Connecting to Gemini…"],
          "Consulting Gemini",
          22
        )
      );

      addLog("Zoro Started — Gemini workflow");
      const zoroResponse = await fetch("/api/zoro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis: robinData.result,
          businessAnalysis: agentArchitecturePayload,
        }),
      });
      addLog("Zoro Completed");

      if (!zoroResponse.ok) {
        throw new Error("zoro Agent Failed");
      }

      const zoroData = (await zoroResponse.json()) as AgentApiPayload;

      setZoroResult(zoroData.result);
      setZoroStatus("Completed");
      setProgress(40);
      applyAiWorkflow("Zoro", "Developing", zoroData, 40, setThought, addMessage);

      setCurrentAgent("Nami");
      setNamiStatus("Working");
      setThought(
        createAgentThought(
          "Nami",
          "Building UI",
          ["Reviewing backend plan…", "Connecting to Gemini…"],
          "Consulting Gemini",
          42
        )
      );

      addLog("Nami Started — Gemini workflow");
      const namiResponse = await fetch("/api/nami", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backendDesign: zoroData.result,
          businessAnalysis: agentArchitecturePayload,
        }),
      });
      addLog("Nami Completed");

      if (!namiResponse.ok) {
        throw new Error("Nami Agent Failed");
      }

      const namiData = (await namiResponse.json()) as AgentApiPayload;

      setNamiResult(namiData.result);
      setNamiStatus("Completed");
      setProgress(60);
      applyAiWorkflow("Nami", "Building UI", namiData, 60, setThought, addMessage);

      setCurrentAgent("Franky");
      setFrankyStatus("Working");
      setThought(
        createAgentThought(
          "Franky",
          "Reviewing",
          ["Reviewing deliverables…", "Connecting to Gemini…"],
          "Consulting Gemini",
          62
        )
      );

      addLog("Franky Started — Gemini workflow");
      const frankyResponse = await fetch("/api/franky", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backendDesign: zoroData.result,
          frontendDesign: namiData.result,
          businessAnalysis: domainAnalysisPayload,
        }),
      });
      addLog("Franky Completed");

      if (!frankyResponse.ok) {
        throw new Error("Franky Agent Failed");
      }

      const frankyData = (await frankyResponse.json()) as AgentApiPayload;

      if (frankyData.result?.startsWith("Franky Error:")) {
        setFrankyResult(frankyData.result);
        setFrankyStatus("Error");
        applyAiWorkflow("Franky", "Error", frankyData, 60, setThought, addMessage);
        return;
      }

      setFrankyResult(frankyData.result);
      setFrankyStatus("Completed");
      setProgress(80);
      applyAiWorkflow("Franky", "Reviewing", frankyData, 80, setThought, addMessage);

      setCurrentAgent("Usopp");
      setUsoppStatus("Working");
      setThought(
        createAgentThought(
          "Usopp",
          "Testing",
          ["Preparing QA plan…", "Connecting to Gemini…"],
          "Consulting Gemini",
          82
        )
      );

      addLog("Usopp Started — Gemini workflow");
      const usoppResponse = await fetch("/api/usopp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frankyDesign: frankyData.result,
          backendDesign: zoroData.result,
          businessAnalysis: agentArchitecturePayload,
        }),
      });
      addLog("Usopp Completed");
      console.log("Usopp Status", usoppResponse.status);
      console.log("Usopp OK", usoppResponse.ok);

      if (!usoppResponse.ok) {
        throw new Error("usopp Agent Failed");
      }

      const usoppData = (await usoppResponse.json()) as AgentApiPayload;

      setUsoppResult(usoppData.result);
      setUsoppStatus("Completed");
      applyAiWorkflow("Usopp", "Testing", usoppData, 90, setThought, addMessage);

      setCurrentAgent("Artifacts");
      setThought(
        createAgentThought(
          "System",
          "Generating",
          ["Franky: DbContext", "Franky: Entity Configurations", "Franky: EF Migrations"],
          "V25 execution pipeline",
          92
        )
      );
      addLog("Project Generation Started — V25 CRUD Execution");

      const { bundle, project } = runArtifactGeneration(
        {
          requirement,
          robin: robinData.result,
          zoro: zoroData.result,
          nami: namiData.result,
          franky: frankyData.result,
          usopp: usoppData.result,
        },
        requirement,
        analysis,
        architecture
      );

      const docSteps = getArtifactProgressSteps(bundle.artifacts);
      const codeSteps = getProjectGenerationSteps(project.entities);

      for (const artifact of bundle.artifacts) {
        addMessage(artifact.agent, `generated ${artifact.name}`);
        addLog(`${artifact.agent} generated ${artifact.name}`);
      }

      for (const file of project.sourceFiles.filter((f) => f.language === "csharp")) {
        addLog(`${file.agent} generated ${file.fileName}`);
      }

      for (const ma of project.migrationArtifacts) {
        addMessage("Franky", `generated ${ma.name}`);
      }

      setArtifactBundle(bundle);
      setDatabaseWorkflow(project.databaseWorkflow);
      setMigrationSteps(project.databaseWorkflow.progressSteps);
      setArtifactHistory((prev) => [bundle, ...prev]);
      setArtifactSteps([
        ...docSteps.map((s) => ({ ...s, done: true })),
        ...codeSteps.map((s) => ({ id: s.id, label: s.label, done: s.done })),
      ]);

      setCurrentAgent("Usopp");
      setBuildVerificationRunning(true);
      setThought(
        createAgentThought(
          "Usopp",
          "Testing",
          ["dotnet restore", "dotnet build", "Auto-fix compiler errors", "dotnet test"],
          "Build Verification Agent",
          92
        )
      );
      addLog("Usopp Started — Build Verification (restore · build · test)");

      const { result: buildResult, sourceFiles: verifiedFiles } =
        await runBuildVerification(
          project,
          (partial) => {
            setBuildVerification((prev) => ({
              complete: false,
              restore: "pending",
              build: "pending",
              tests: "pending",
              buildStatus: "FAIL",
              compilerErrorCount: 0,
              compilerWarningCount: 0,
              compilerAnalysis: null,
              autoFixReport: null,
              buildRetry: null,
              retryStatus: "RUNNING",
              qaScore: 0,
              attempts: 0,
              maxAttempts: 5,
              ...prev,
              ...partial,
              errorsFixed: partial.errorsFixed ?? prev?.errorsFixed ?? [],
            }));
          },
          addLog
        );

      setBuildVerificationRunning(false);
      setBuildVerification(buildResult);

      const verifiedProject: GeneratedProjectBundle = {
        ...project,
        sourceFiles: verifiedFiles,
      };
      setProjectBundle(verifiedProject);

      for (const fix of buildResult.errorsFixed) {
        addLog(`Usopp auto-fix: ${fix}`);
      }
      addMessage(
        "Usopp",
        `V26 Build Integrity — Restore: ${buildResult.restore}, Build: ${buildResult.buildStatus}, Compiler Errors: ${buildResult.compilerErrorCount}, Warnings: ${buildResult.compilerWarningCount}`
      );

      if (buildResult.autoFixReport) {
        addLog(
          `Usopp Auto Fix — fixed ${buildResult.autoFixReport.fixedErrors}, remaining ${buildResult.autoFixReport.remainingErrors}, attempt ${buildResult.autoFixReport.attempts}`
        );
      }

      if (buildResult.compilerAnalysis) {
        const top = buildResult.compilerAnalysis.errorGroups[0];
        addLog(
          `Usopp Compiler Analysis — ${buildResult.compilerAnalysis.totalErrors} errors, top: ${top?.code ?? "N/A"} (${top?.count ?? 0})`
        );
        addMessage(
          "Usopp",
          `Root cause: ${buildResult.compilerAnalysis.rootCauses[0]?.rootCause ?? "See Compiler Error Analysis panel"}`
        );
      }

      addMessage("Usopp", `QA Score: ${buildResult.qaScore}%`);

      if (buildResult.retryStatus === "FAILED") {
        addMessage(
          "System",
          `Build Retry FAILED — ${buildResult.compilerErrorCount} compiler errors remain after ${buildResult.attempts} attempts`
        );
      } else if (!buildResult.complete) {
        addMessage(
          "System",
          `Export locked — ${buildResult.compilerErrorCount} compiler error(s) remain after dotnet build`
        );
      }

      setThought(
        createAgentThought(
          "Usopp",
          "Testing",
          [
            `Restore: ${buildResult.restore}`,
            `Build: ${buildResult.buildStatus}`,
            `Compiler Errors: ${buildResult.compilerErrorCount}`,
            `Warnings: ${buildResult.compilerWarningCount}`,
          ],
          buildResult.complete ? "Build verified" : "Build needs fixes",
          94
        )
      );

      let runtimeResult: RuntimeReport | null = null;

      if (buildResult.complete && buildResult.compilerErrorCount === 0) {
        setRuntimeVerificationRunning(true);
        addLog("Usopp Started — Runtime Verification (dotnet run · swagger · database · migration)");
        addMessage("Usopp", "V27 Runtime Verification — validating API startup and infrastructure");

        runtimeResult = await runRuntimeVerification(
          verifiedProject,
          (partial) => setRuntimeReport(partial),
          addLog
        );

        setRuntimeVerificationRunning(false);
        setRuntimeReport(runtimeResult);

        addMessage(
          "Usopp",
          `Runtime Verification — API: ${runtimeResult.apiStartup ? "PASS" : "FAIL"}, Swagger: ${runtimeResult.swagger ? "PASS" : "FAIL"}, Database: ${runtimeResult.database ? "PASS" : "FAIL"}, Migration: ${runtimeResult.migration ? "PASS" : "FAIL"}`
        );

        if (!runtimeResult.runtimePassed) {
          addMessage(
            "System",
            "Export locked — runtime verification must pass (API · Swagger · Database · Migration)"
          );
        }
      } else {
        addLog("Runtime Verification skipped — build did not pass with 0 compiler errors");
      }

      addLog("Usopp Started — CRUD & unit test execution");

      setLiveExecutionSteps([]);
      setExecutionTimeline([]);

      const execReport = await runFullExecutionPipeline(verifiedProject, (step, evt) => {
        setLiveExecutionSteps((prev) => upsertExecutionStep(prev, step));
        setExecutionTimeline((prev) => [...prev, evt]);
        addLog(`${step.agent ?? "System"}: ${step.label} — ${step.status}`);
      });

      setExecutionReport(execReport);
      setLiveExecutionSteps(execReport.steps);

      if (
        execReport.steps.find((s) => s.id === "dotnet-ef-update")?.status ===
        "success"
      ) {
        setDatabaseWorkflow((prev) =>
          prev ? simulateMigrationApplied(prev) : prev
        );
      }

      addMessage(
        "Usopp",
        `CRUD validation: ${execReport.crudResults.filter((r) => r.overall === "success").length}/${execReport.crudResults.length} entities passed`
      );
      addMessage(
        "Usopp",
        `Unit tests: ${execReport.testSummary.passed}/${execReport.testSummary.total} passed`
      );

      setThought(
        createAgentThought(
          "System",
          "Generating",
          [
            ...codeSteps.map((s) => `${s.label} ✓`),
            `Execution: ${execReport.overallStatus}`,
            "dotnet restore · build · ef update · test ready",
          ],
          "V25 execution complete",
          98
        )
      );

      addMessage("Franky", "DbContext and InitialCreate migration generated.");
      addMessage("System", `Execution status: ${execReport.overallStatus}`);

      setProjectCount((prev) => prev + 1);
      setSuccessCount((prev) => prev + 1);
      setProgress(100);
      setCurrentAgent("Completed");

      const exportStateAtComplete = computeExportState(
        "Completed",
        buildResult,
        verifiedProject,
        runtimeResult
      );
      logExportState(exportStateAtComplete);

      if (exportStateAtComplete.exportReady) {
        addMessage("System", "Export Ready ✅ — Download ZIP enabled");
      }

      setThought(
        createAgentThought(
          "System",
          "Meeting",
          ["Mission complete", "Gathering team", "Starting meeting"],
          "Crew meeting",
          100
        )
      );

      addMessage("System", "All agents completed tasks. Moving to Meeting Room.");
      addMessage("System", "Project Deliverables Ready");
      addMessage("System", "V25 execution complete — export ZIP for Visual Studio 2022");

      setRequirement("");
    } catch (error) {
      console.error(error);

      setRobinStatus((prev) => (prev === "Working" ? "Error" : prev));
      setZoroStatus((prev) => (prev === "Working" ? "Error" : prev));
      setNamiStatus((prev) => (prev === "Working" ? "Error" : prev));
      setFrankyStatus((prev) => (prev === "Working" ? "Error" : prev));
      setUsoppStatus((prev) => (prev === "Working" ? "Error" : prev));
    } finally {
      setLoading(false);
    }
  }, [requirement, addLog, addMessage, setThought]);

  const exportState = useMemo(
    () =>
      computeExportState(
        currentAgent,
        buildVerification,
        projectBundle,
        runtimeReport
      ),
    [currentAgent, buildVerification, projectBundle, runtimeReport]
  );

  const simulateMigrationApply = useCallback(() => {
    setDatabaseWorkflow((prev) => {
      if (!prev) return prev;
      const next = simulateMigrationApplied(prev);
      addLog("Migration Applied — dotnet ef database update (simulated)");
      addMessage("System", "Database status: Migration Applied");
      return next;
    });
  }, [addLog, addMessage]);

  return {
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
    buildVerification,
    buildVerificationRunning,
    runtimeReport,
    runtimeVerificationRunning,
    requirementAnalysis,
    architectureContract,
    businessArchitecturePlan,
    exportState,
    canExport: exportState.canExport,
    exportEnabled: exportState.exportEnabled,
    exportReady: exportState.exportReady,
    exportLocked: exportState.exportLocked,
    validationPassed: exportState.validationPassed,
    buildPassed: exportState.buildPassed,
    testsPassed: exportState.testsPassed,
    artifactSteps,
    simulateMigrationApply,
    startMission,
  };
}
