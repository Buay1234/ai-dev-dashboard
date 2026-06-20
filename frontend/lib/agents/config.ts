import type { AgentStatus, AgentStatusProps } from "@/lib/types/agent-results";

export const AGENT_NAMES = [
  "Robin",
  "Zoro",
  "Sanji",
  "Nami",
  "Jinbe",
  "Franky",
  "Usopp",
] as const;

export type AgentTheme = "purple" | "green" | "red" | "orange" | "teal" | "blue" | "yellow";

export type AgentConfig = {
  name: (typeof AGENT_NAMES)[number];
  role: string;
  officeTitle: string;
  icon: string;
  avatar: string;
  image: string;
  theme: AgentTheme;
};

export const RECEPTION_LABEL = "Reception";

export const AGENT_CONFIG: AgentConfig[] = [
  {
    name: "Robin",
    role: "Business Analyst",
    officeTitle: "Robin Business Analysis Office",
    icon: "🧠",
    avatar: "👩‍💼",
    image: "/agents/robin.png",
    theme: "purple",
  },
  {
    name: "Zoro",
    role: "Backend Developer",
    officeTitle: "Zoro Backend Development Team",
    icon: "⚔️",
    avatar: "🗡️",
    image: "/agents/zoro.png",
    theme: "green",
  },
  {
    name: "Sanji",
    role: "UI/UX Designer",
    officeTitle: "Sanji UX Design Studio",
    icon: "🍳",
    avatar: "🎨",
    image: "/agents/nami.png",
    theme: "red",
  },
  {
    name: "Nami",
    role: "Frontend Developer",
    officeTitle: "Nami Frontend Development Team",
    icon: "🧭",
    avatar: "🧭",
    image: "/agents/nami.png",
    theme: "orange",
  },
  {
    name: "Jinbe",
    role: "API Integration Architect",
    officeTitle: "Jinbe API Binding Lab",
    icon: "🐋",
    avatar: "🔗",
    image: "/agents/franky.png",
    theme: "teal",
  },
  {
    name: "Franky",
    role: "Full Stack Architect",
    officeTitle: "Franky Architecture Lab",
    icon: "🔨",
    avatar: "👨‍🔧",
    image: "/agents/franky.png",
    theme: "blue",
  },
  {
    name: "Usopp",
    role: "Build Verification Agent",
    officeTitle: "Usopp Build Verification Center",
    icon: "🔫",
    avatar: "🎯",
    image: "/agents/usopp.png",
    theme: "yellow",
  },
];

export function getCharacterRoomIndex(currentAgent: string): number {
  if (currentAgent === "Idle") return -1;
  return getActiveAgentIndex(currentAgent);
}

export function getSuccessRate(projectCount: number, successCount: number): number {
  if (projectCount === 0) return 0;
  return Math.round((successCount / projectCount) * 100);
}

export function getMissionStatusLabel(
  loading: boolean,
  currentAgent: string
): string {
  if (loading) return "In Progress";
  if (currentAgent === "Completed") return "Complete";
  return "Ready";
}

export const AGENT_THEME_STYLES: Record<
  AgentTheme,
  { glow: string; border: string; bg: string; text: string; ring: string }
> = {
  purple: {
    glow: "rgba(139, 92, 246, 0.55)",
    border: "rgba(139, 92, 246, 0.45)",
    bg: "rgba(139, 92, 246, 0.12)",
    text: "#c4b5fd",
    ring: "rgba(139, 92, 246, 0.35)",
  },
  green: {
    glow: "rgba(34, 197, 94, 0.55)",
    border: "rgba(34, 197, 94, 0.45)",
    bg: "rgba(34, 197, 94, 0.12)",
    text: "#86efac",
    ring: "rgba(34, 197, 94, 0.35)",
  },
  red: {
    glow: "rgba(239, 68, 68, 0.55)",
    border: "rgba(239, 68, 68, 0.45)",
    bg: "rgba(239, 68, 68, 0.12)",
    text: "#fca5a5",
    ring: "rgba(239, 68, 68, 0.35)",
  },
  orange: {
    glow: "rgba(249, 115, 22, 0.55)",
    border: "rgba(249, 115, 22, 0.45)",
    bg: "rgba(249, 115, 22, 0.12)",
    text: "#fdba74",
    ring: "rgba(249, 115, 22, 0.35)",
  },
  teal: {
    glow: "rgba(20, 184, 166, 0.55)",
    border: "rgba(20, 184, 166, 0.45)",
    bg: "rgba(20, 184, 166, 0.12)",
    text: "#5eead4",
    ring: "rgba(20, 184, 166, 0.35)",
  },
  blue: {
    glow: "rgba(59, 130, 246, 0.55)",
    border: "rgba(59, 130, 246, 0.45)",
    bg: "rgba(59, 130, 246, 0.12)",
    text: "#93c5fd",
    ring: "rgba(59, 130, 246, 0.35)",
  },
  yellow: {
    glow: "rgba(234, 179, 8, 0.55)",
    border: "rgba(234, 179, 8, 0.45)",
    bg: "rgba(234, 179, 8, 0.12)",
    text: "#fde047",
    ring: "rgba(234, 179, 8, 0.35)",
  },
};

export function isMissionActive(
  statuses: Record<string, AgentStatus | string>,
  currentAgent: string
): boolean {
  return (
    currentAgent !== "Idle" ||
    Object.values(statuses).some((s) => s !== "Idle")
  );
}

export function getCharacterY(
  index: number,
  status: string,
  missionActive: boolean,
  officeTop: number,
  step: number,
  spawnY: number
): number {
  if (!missionActive) return spawnY + index * 4;

  if (status === "Working" || status === "Completed" || status === "Error") {
    return officeTop + index * step;
  }

  return spawnY;
}

export function getActiveAgentIndex(currentAgent: string): number {
  if (currentAgent === "Completed") {
    return AGENT_NAMES.length - 1;
  }

  const index = AGENT_NAMES.indexOf(
    currentAgent as (typeof AGENT_NAMES)[number]
  );

  return index >= 0 ? index : 0;
}

export function toAgentStatusMap(
  props: AgentStatusProps
): Record<string, string> {
  return {
    Robin: props.robinStatus,
    Zoro: props.zoroStatus,
    Sanji: props.sanjiStatus,
    Nami: props.namiStatus,
    Jinbe: props.jinbeStatus,
    Franky: props.frankyStatus,
    Usopp: props.usoppStatus,
  };
}
