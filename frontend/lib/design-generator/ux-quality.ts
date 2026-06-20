import type {
  DesignContract,
  UXQualityMetric,
  UXQualityScore,
} from "./types";

function grade(percentage: number): UXQualityScore["grade"] {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
}

export function evaluateUXQuality(
  contract: DesignContract,
  entityCount: number,
  wireframeCount: number
): UXQualityScore {
  const metrics: UXQualityMetric[] = [
    {
      id: "navigation",
      label: "Navigation structure",
      score: contract.navigation.primary.length >= 2 ? 10 : 5,
      maxScore: 10,
      passed: contract.navigation.primary.length >= 2,
    },
    {
      id: "dashboard",
      label: "Dashboard layout",
      score: contract.dashboardLayout.widgets.length >= entityCount ? 10 : 6,
      maxScore: 10,
      passed: contract.dashboardLayout.widgets.length > 0,
    },
    {
      id: "wireframes",
      label: "Wireframe coverage",
      score: Math.min(10, Math.round((wireframeCount / Math.max(entityCount * 2 + 1, 1)) * 10)),
      maxScore: 10,
      passed: wireframeCount >= entityCount,
    },
    {
      id: "design-system",
      label: "Design system tokens",
      score: Object.keys(contract.designSystem.colors.dark).length >= 6 ? 10 : 6,
      maxScore: 10,
      passed: Boolean(contract.designSystem.typography.fontFamily),
    },
    {
      id: "responsive",
      label: "Responsive layouts",
      score: Object.keys(contract.responsive.breakpoints).length >= 3 ? 10 : 5,
      maxScore: 10,
      passed: contract.responsive.layouts.sidebar !== undefined,
    },
    {
      id: "accessibility",
      label: "Accessibility guidelines",
      score: contract.accessibility.guidelines.length >= 5 ? 10 : 5,
      maxScore: 10,
      passed: contract.accessibility.wcagTarget === "AA",
    },
    {
      id: "themes",
      label: "Light & dark themes",
      score:
        Object.keys(contract.themes.light).length >= 4 &&
        Object.keys(contract.themes.dark).length >= 4
          ? 10
          : 5,
      maxScore: 10,
      passed: contract.themes.default === "dark" || contract.themes.default === "light",
    },
    {
      id: "userflows",
      label: "User flows documented",
      score: contract.userFlows.length >= 3 ? 10 : 5,
      maxScore: 10,
      passed: contract.userFlows.length >= 3,
    },
  ];

  const total = metrics.reduce((sum, m) => sum + m.score, 0);
  const maxTotal = metrics.reduce((sum, m) => sum + m.maxScore, 0);
  const percentage = Math.round((total / maxTotal) * 100);

  return {
    total,
    maxTotal,
    percentage,
    grade: grade(percentage),
    metrics,
  };
}
