import jsPDF from "jspdf";
import type { AgentResults } from "@/lib/types/agent-results";

export function downloadPdfReport(results: AgentResults): void {
  const pdf = new jsPDF();

  const report = `
AI Development Crew Report

=====================

Business Analysis

${results.robin}

=====================

Backend Design

${results.zoro}

=====================

Frontend Design

${results.nami}

=====================

Architecture

${results.franky}

=====================

Test Cases

${results.usopp}
`;

  const lines = pdf.splitTextToSize(report, 180);

  pdf.text(lines, 10, 10);
  pdf.save("project-report.pdf");
}
