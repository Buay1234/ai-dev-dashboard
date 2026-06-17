"use client";

import { useCallback, useState } from "react";
import type { AgentMessage } from "@/app/types/conversation";
import { createAgentMessage } from "@/lib/conversation";
import type { AgentStatus } from "@/lib/types/agent-results";

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

      setHistory((prev) => [
        `${new Date().toLocaleString()} - ${requirement}`,
        ...prev,
      ]);

      addMessage("Robin", "Analyzing requirements...");
      addLog("Robin Started");

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

      const robinData = await robinResponse.json();

      if (robinData.result?.includes("Gemini Error")) {
        setRobinStatus("Error");
        setLoading(false);
        return;
      }

      setRobinStatus("Completed");
      setProgress(20);
      addMessage("Robin", "Requirement analysis complete.");
      addMessage("Robin", "Sending report to Zoro.");

      setCurrentAgent("Zoro");
      setZoroStatus("Working");
      addMessage("Zoro", "Received Robin report.");
      addMessage("Zoro", "Starting backend development.");
      setRobinResult(robinData.result);

      addLog("Zoro Started");
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

      const zoroData = await zoroResponse.json();

      setZoroResult(zoroData.result);
      setZoroStatus("Completed");
      setProgress(40);
      addMessage("Zoro", "Backend implementation complete.");

      setCurrentAgent("Nami");
      setNamiStatus("Working");
      addMessage("Nami", "Building frontend UI.");

      addLog("Nami Started");
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

      const namiData = await namiResponse.json();

      setNamiResult(namiData.result);
      setNamiStatus("Completed");
      setProgress(60);
      addMessage("Nami", "Frontend implementation complete.");

      setCurrentAgent("Franky");
      setFrankyStatus("Working");
      addMessage("Franky", "Reviewing architecture.");

      addLog("Franky Started");
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

      const frankyData = await frankyResponse.json();

      if (frankyData.result?.startsWith("Franky Error:")) {
        setFrankyResult(frankyData.result);
        setFrankyStatus("Error");
        return;
      }

      setFrankyResult(frankyData.result);
      setFrankyStatus("Completed");
      setProgress(80);
      addMessage("Franky", "Architecture approved.");

      setCurrentAgent("Usopp");
      setUsoppStatus("Working");
      addMessage("Usopp", "Running QA tests.");

      addLog("Usopp Started");
      const usoppResponse = await fetch("/api/usopp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiDesign: `
          ${zoroData.result}

          ${frankyData.result}
          `,
        }),
      });
      addLog("Usopp Completed");
      console.log("Usopp Status", usoppResponse.status);
      console.log("Usopp OK", usoppResponse.ok);

      if (!usoppResponse.ok) {
        throw new Error("usopp Agent Failed");
      }

      const usoppData = await usoppResponse.json();

      setUsoppResult(usoppData.result);
      setUsoppStatus("Completed");
      addMessage("Usopp", "All tests passed.");

      setProjectCount((prev) => prev + 1);
      setSuccessCount((prev) => prev + 1);
      setProgress(100);
      setCurrentAgent("Completed");

      addMessage("System", "All agents completed tasks.");
      addMessage("System", "Moving to Meeting Room.");
      addMessage("System", "Meeting started.");

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
  }, [requirement, addLog, addMessage]);

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
    history,
    startMission,
  };
}
