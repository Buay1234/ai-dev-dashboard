export type OfficeRoomTheme = "purple" | "green" | "orange" | "blue" | "yellow";

export const THEME_STYLES: Record<
  OfficeRoomTheme,
  {
    borderColor: string;
    hoverBorder: string;
    glowRgb: string;
    iconBg: string;
    accent: string;
  }
> = {
  purple: {
    borderColor: "rgba(139, 92, 246, 0.35)",
    hoverBorder: "rgba(139, 92, 246, 0.65)",
    glowRgb: "rgb(139, 92, 246)",
    iconBg: "bg-violet-500/20 text-violet-300",
    accent: "text-violet-300",
  },
  green: {
    borderColor: "rgba(16, 185, 129, 0.35)",
    hoverBorder: "rgba(16, 185, 129, 0.65)",
    glowRgb: "rgb(16, 185, 129)",
    iconBg: "bg-emerald-500/20 text-emerald-300",
    accent: "text-emerald-300",
  },
  orange: {
    borderColor: "rgba(249, 115, 22, 0.35)",
    hoverBorder: "rgba(249, 115, 22, 0.65)",
    glowRgb: "rgb(249, 115, 22)",
    iconBg: "bg-orange-500/20 text-orange-300",
    accent: "text-orange-300",
  },
  blue: {
    borderColor: "rgba(6, 182, 212, 0.35)",
    hoverBorder: "rgba(6, 182, 212, 0.65)",
    glowRgb: "rgb(6, 182, 212)",
    iconBg: "bg-cyan-500/20 text-cyan-300",
    accent: "text-cyan-300",
  },
  yellow: {
    borderColor: "rgba(245, 158, 11, 0.35)",
    hoverBorder: "rgba(245, 158, 11, 0.65)",
    glowRgb: "rgb(245, 158, 11)",
    iconBg: "bg-amber-500/20 text-amber-300",
    accent: "text-amber-300",
  },
};

export const STATUS_GLOW_RGB: Record<string, string> = {
  Idle: "rgb(161, 161, 170)",
  Working: "rgb(234, 179, 8)",
  Completed: "rgb(34, 197, 94)",
  Error: "rgb(239, 68, 68)",
};

/** V10 map node — status drives card color */
export const STATUS_NODE_STYLES: Record<
  string,
  { card: string; glowRgb: string }
> = {
  Idle: {
    card: "border-zinc-600/50 bg-zinc-900/80",
    glowRgb: "rgb(161, 161, 170)",
  },
  Working: {
    card: "border-yellow-500/55 bg-yellow-500/10",
    glowRgb: "rgb(234, 179, 8)",
  },
  Completed: {
    card: "border-emerald-500/50 bg-emerald-500/10",
    glowRgb: "rgb(34, 197, 94)",
  },
  Error: {
    card: "border-red-500/55 bg-red-500/10",
    glowRgb: "rgb(239, 68, 68)",
  },
};

export type CharacterStatus = keyof typeof STATUS_GLOW_RGB;

export const CHARACTER_STATUS_GLOW: Record<
  CharacterStatus,
  { ring: string; pulse: [string, string, string] }
> = {
  Idle: {
    ring: "rgba(161, 161, 170, 0.35)",
    pulse: [
      "0 0 10px rgba(161,161,170,0.2)",
      "0 0 18px rgba(161,161,170,0.35)",
      "0 0 10px rgba(161,161,170,0.2)",
    ],
  },
  Working: {
    ring: "rgba(234, 179, 8, 0.55)",
    pulse: [
      "0 0 12px rgba(234,179,8,0.35)",
      "0 0 28px rgba(234,179,8,0.65)",
      "0 0 12px rgba(234,179,8,0.35)",
    ],
  },
  Completed: {
    ring: "rgba(34, 197, 94, 0.55)",
    pulse: [
      "0 0 12px rgba(34,197,94,0.35)",
      "0 0 26px rgba(34,197,94,0.6)",
      "0 0 12px rgba(34,197,94,0.35)",
    ],
  },
  Error: {
    ring: "rgba(239, 68, 68, 0.55)",
    pulse: [
      "0 0 12px rgba(239,68,68,0.35)",
      "0 0 26px rgba(239,68,68,0.65)",
      "0 0 12px rgba(239,68,68,0.35)",
    ],
  },
};
