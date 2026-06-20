import type { GeneratedSourceFile } from "@/lib/project-generator/types";

export type NavigationItem = {
  href: string;
  label: string;
  icon?: string;
  entity?: string;
};

export type NavigationSpec = {
  primary: NavigationItem[];
  footer?: NavigationItem[];
};

export type DesignSystemSpec = {
  version: string;
  typography: {
    fontFamily: string;
    scale: Record<string, string>;
  };
  spacing: Record<string, string>;
  radii: Record<string, string>;
  colors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  components: string[];
};

export type DashboardWidget = {
  id: string;
  title: string;
  entity?: string;
  href: string;
  variant: "stat" | "card" | "chart";
};

export type DashboardLayoutSpec = {
  title: string;
  grid: { columns: { sm: number; md: number; xl: number } };
  widgets: DashboardWidget[];
};

export type ThemeSpec = {
  default: "dark" | "light";
  light: Record<string, string>;
  dark: Record<string, string>;
};

export type AccessibilitySpec = {
  wcagTarget: "AA" | "AAA";
  guidelines: string[];
  focusRing: string;
  minTouchTargetPx: number;
};

export type ResponsiveSpec = {
  breakpoints: Record<string, string>;
  layouts: Record<string, string>;
};

export type UserFlowStep = {
  id: string;
  label: string;
  route: string;
  next?: string[];
};

export type DesignContract = {
  navigation: NavigationSpec;
  designSystem: DesignSystemSpec;
  dashboardLayout: DashboardLayoutSpec;
  themes: ThemeSpec;
  accessibility: AccessibilitySpec;
  responsive: ResponsiveSpec;
  userFlows: UserFlowStep[];
};

export type UXQualityMetric = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  passed: boolean;
};

export type UXQualityScore = {
  total: number;
  maxTotal: number;
  percentage: number;
  grade: "A" | "B" | "C" | "D" | "F";
  metrics: UXQualityMetric[];
};

export type DesignGenerationResult = {
  agent: "Sanji";
  version: "V33";
  generatedAt: string;
  domain: string;
  entities: string[];
  sourceFiles: GeneratedSourceFile[];
  contract: DesignContract;
  uxQuality: UXQualityScore;
};

export type DesignGeneratorInput = {
  requirement: string;
  domain: string;
  entityNames: string[];
  modules?: string[];
};
