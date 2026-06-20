import type { ParsedCompilerError } from "../types";

export type CompilerErrorGroup = {
  code: string;
  count: number;
  message: string;
  messages: string[];
  files: string[];
  sampleLines: number[];
};

export type RootCauseAnalysis = {
  id: string;
  rootCause: string;
  impact: string;
  impactCount: number;
  suggestedFix: string;
  relatedCodes: string[];
};

export type CompilerDiagnosticsReport = {
  totalErrors: number;
  totalWarnings: number;
  errorGroups: CompilerErrorGroup[];
  rootCauses: RootCauseAnalysis[];
  suggestedFixes: string[];
  diagnostics: ParsedCompilerError[];
  generatedAt: string;
};

export type CompilerDiagnosticsJson = {
  totalErrors: number;
  totalWarnings?: number;
  errorGroups: Array<{
    code: string;
    count: number;
    message: string;
  }>;
  rootCauses?: Array<{
    rootCause: string;
    impact: string;
    suggestedFix: string;
    relatedCodes: string[];
  }>;
  suggestedFixes?: string[];
};
