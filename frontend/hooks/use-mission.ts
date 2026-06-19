"use client";

import { useCallback, useState } from "react";
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
          ["Extracting entities", "Building EF Core project", "Generating CRUD APIs"],
          "V23 project generation",
          92
        )
      );
      addLog("Project Generation Started — V23");

      const { bundle, project } = runArtifactGeneration(
        {
          requirement,
          robin: robinData.result,
          zoro: zoroData.result,
          nami: namiData.result,
          franky: frankyData.result,
          usopp: usoppData.result,
        },
        requirement
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

      setArtifactBundle(bundle);
      setProjectBundle(project);
      setArtifactHistory((prev) => [bundle, ...prev]);
      setArtifactSteps([
        ...docSteps.map((s) => ({ ...s, done: true })),
        ...codeSteps.map((s) => ({ id: s.id, label: s.label, done: s.done })),
      ]);

      setThought(
        createAgentThought(
          "System",
          "Generating",
          [
            ...codeSteps.map((s) => `${s.label} ✓`),
            "Project ZIP ready",
          ],
          "EF Core project generated",
          98
        )
      );

      setProjectCount((prev) => prev + 1);
      setSuccessCount((prev) => prev + 1);
      setProgress(100);
      setCurrentAgent("Completed");

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
      addMessage("System", "EF Core source project generated — export ZIP from Generated Files Panel");

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
    artifactSteps,
    startMission,
  };
}
