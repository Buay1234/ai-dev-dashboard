export type ExtractedFile = {
  name: string;
  content: string;
};

export type AgentResults = {
  robin: string;
  zoro: string;
  nami: string;
  franky: string;
  usopp: string;
};

export type AgentStatus = "Idle" | "Working" | "Completed" | "Error";
