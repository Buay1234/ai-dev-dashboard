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

export type AgentStatusProps = {
  currentAgent: string;
  robinStatus: string;
  zoroStatus: string;
  namiStatus: string;
  frankyStatus: string;
  usoppStatus: string;
};
