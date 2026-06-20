export type ExtractedFile = {
  name: string;
  content: string;
};

export type AgentResults = {
  robin: string;
  zoro: string;
  sanji: string;
  nami: string;
  jinbe: string;
  franky: string;
  usopp: string;
};

export type AgentStatus = "Idle" | "Working" | "Completed" | "Error";

export type AgentStatusProps = {
  currentAgent: string;
  robinStatus: string;
  zoroStatus: string;
  sanjiStatus: string;
  namiStatus: string;
  jinbeStatus: string;
  frankyStatus: string;
  usoppStatus: string;
};
