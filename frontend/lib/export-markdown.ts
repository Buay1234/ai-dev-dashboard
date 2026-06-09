import type { AgentResults } from "@/lib/types/agent-results";

export function buildMarkdownReport(results: AgentResults): string {
  return `
# Business Analysis

${results.robin}

# Backend Design

${results.zoro}

# Frontend Design

${results.nami}

# Architecture

${results.franky}

# Test Cases

${results.usopp}
`;
}

export function downloadMarkdownReport(results: AgentResults): void {
  const content = buildMarkdownReport(results);
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "project-report.md";
  a.click();
}
