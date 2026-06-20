import type { EntityDefinition, GeneratedSourceFile } from "@/lib/project-generator/types";
import type {
  DesignContract,
  DesignGenerationResult,
  DesignGeneratorInput,
} from "./types";
import { evaluateUXQuality } from "./ux-quality";

const DESIGN_ROOT = "design";
const WIREFRAME_ROOT = "wireframes";

function toKebabPlural(name: string): string {
  const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return `${kebab}s`;
}

function designFile(
  id: string,
  subPath: string,
  fileName: string,
  content: string,
  language: GeneratedSourceFile["language"] = "json"
): GeneratedSourceFile {
  const root = subPath.startsWith("wireframes") ? WIREFRAME_ROOT : DESIGN_ROOT;
  const relative = subPath.replace(/^design\/?/, "").replace(/^wireframes\/?/, "");
  return {
    id,
    path: relative ? `${root}/${relative}` : root,
    fileName,
    category: "design",
    agent: "Sanji",
    language: fileName.endsWith(".md") ? "markdown" : language,
    content: content.trimStart(),
  };
}

function buildContract(input: DesignGeneratorInput): DesignContract {
  const entityNames = input.entityNames.length > 0 ? input.entityNames : ["Entity"];
  const navPrimary = [
    { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
    ...entityNames.map((name) => ({
      href: `/${toKebabPlural(name)}`,
      label: name,
      icon: "table",
      entity: name,
    })),
  ];

  const designSystem = {
    version: "V33",
    typography: {
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      scale: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
    },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem" },
    radii: { sm: "0.375rem", md: "0.5rem", lg: "0.75rem", xl: "1rem" },
    colors: {
      light: {
        background: "#fafafa",
        foreground: "#0a0a0b",
        card: "#ffffff",
        primary: "#2563eb",
        muted: "#f4f4f5",
        border: "#e4e4e7",
        destructive: "#dc2626",
      },
      dark: {
        background: "#0a0a0b",
        foreground: "#fafafa",
        card: "#111113",
        primary: "#3b82f6",
        muted: "#27272a",
        border: "#27272a",
        destructive: "#ef4444",
      },
    },
    components: ["Button", "Card", "Input", "Label", "Table", "Toast", "Sidebar", "ErrorState"],
  };

  const dashboardLayout = {
    title: `${input.domain || "MyProject"} Dashboard`,
    grid: { columns: { sm: 1, md: 2, xl: 3 } },
    widgets: entityNames.map((name) => ({
      id: `widget-${name}`,
      title: name,
      entity: name,
      href: `/${toKebabPlural(name)}`,
      variant: "card" as const,
    })),
  };

  const themes = {
    default: "dark" as const,
    light: designSystem.colors.light,
    dark: designSystem.colors.dark,
  };

  const accessibility = {
    wcagTarget: "AA" as const,
    focusRing: "2px solid var(--color-primary)",
    minTouchTargetPx: 44,
    guidelines: [
      "Maintain 4.5:1 contrast for body text (WCAG AA)",
      "All interactive controls must be keyboard focusable",
      "Form inputs require associated labels",
      "Use aria-live regions for toast notifications",
      "Tables must include semantic thead/tbody and scope on headers",
      "Provide skip link to main content on dashboard shell",
      "Error messages must be descriptive and actionable",
    ],
  };

  const responsive = {
    breakpoints: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },
    layouts: {
      sidebar: "hidden below lg; drawer on mobile",
      dashboard: "1 col mobile · 2 col tablet · 3 col desktop",
      table: "horizontal scroll on sm; full table md+",
      form: "max-width 42rem centered",
    },
  };

  const userFlows: DesignContract["userFlows"] = [
    { id: "landing", label: "Land on dashboard", route: "/dashboard", next: ["list"] },
    ...entityNames.flatMap((name) => {
      const slug = toKebabPlural(name);
      return [
        {
          id: `${name}-list`,
          label: `Browse ${name}`,
          route: `/${slug}`,
          next: [`${name}-create`, `${name}-edit`],
        },
        {
          id: `${name}-create`,
          label: `Create ${name}`,
          route: `/${slug}/new`,
          next: [`${name}-list`],
        },
        {
          id: `${name}-edit`,
          label: `Edit ${name}`,
          route: `/${slug}/[id]`,
          next: [`${name}-list`],
        },
      ];
    }),
  ];

  return {
    navigation: { primary: navPrimary },
    designSystem,
    dashboardLayout,
    themes,
    accessibility,
    responsive,
    userFlows,
  };
}

function wireframeDashboard(contract: DesignContract): string {
  return `# Wireframe — Dashboard

\`\`\`
+------------------------------------------------------------------+
| [=] MyProject                              Dashboard             |
+----------+-------------------------------------------------------+
| Dashboard|  +-------------+  +-------------+  +-------------+  |
| Entity A |  | Entity A    |  | Entity B    |  | Entity C    |  |
| Entity B |  | [Manage ->] |  | [Manage ->] |  | [Manage ->] |  |
| Entity C |  +-------------+  +-------------+  +-------------+  |
+----------+-------------------------------------------------------+
\`\`\`

Grid: ${contract.dashboardLayout.grid.columns.sm}/${contract.dashboardLayout.grid.columns.md}/${contract.dashboardLayout.grid.columns.xl} columns
`;
}

function wireframeList(entity: string): string {
  const slug = toKebabPlural(entity);
  return `# Wireframe — ${entity} List

Route: \`/${slug}\`

\`\`\`
+------------------------------------------------------------------+
| Sidebar  | ${entity}                          [Create ${entity}] |
|          | +----------------------------------------------------+ |
|          | | Id | Field1 | Field2 | ... | Actions [Edit][Del] | |
|          | +----------------------------------------------------+ |
|          | | loading skeleton / empty state / error retry      | |
|          | +----------------------------------------------------+ |
+------------------------------------------------------------------+
\`\`\`
`;
}

function wireframeForm(entity: string, mode: "create" | "edit"): string {
  const slug = toKebabPlural(entity);
  const route = mode === "create" ? `/${slug}/new` : `/${slug}/[id]`;
  return `# Wireframe — ${entity} ${mode === "create" ? "Create" : "Edit"}

Route: \`${route}\`

\`\`\`
+------------------------------------------------------------------+
| Sidebar  | ${mode === "create" ? "Create" : "Edit"} ${entity}                   |
|          | +----------------------------------------------------+ |
|          | | [Label] [ Input field                          ] | |
|          | | [Label] [ Input field                          ] | |
|          | | [ Save / Create ]                                | |
|          | +----------------------------------------------------+ |
+------------------------------------------------------------------+
\`\`\`
`;
}

function userFlowMarkdown(contract: DesignContract, requirement: string): string {
  const flows = contract.userFlows
    .map((f) => `- **${f.label}** (\`${f.route}\`)${f.next?.length ? ` → ${f.next.join(", ")}` : ""}`)
    .join("\n");

  return `# User Flows

> Generated by **Sanji V33** · UI/UX Designer

## Requirement Context

${requirement.slice(0, 500)}

## Primary Flows

${flows}

## CRUD Pattern

1. Dashboard → entity module card
2. List → Create / Edit / Delete
3. Form submit → toast → return to list
`;
}

function accessibilityMarkdown(contract: DesignContract): string {
  return `# Accessibility Guidelines

> WCAG Target: **${contract.accessibility.wcagTarget}**

${contract.accessibility.guidelines.map((g) => `- ${g}`).join("\n")}

- Minimum touch target: ${contract.accessibility.minTouchTargetPx}px
- Focus ring: \`${contract.accessibility.focusRing}\`
`;
}

function responsiveMarkdown(contract: DesignContract): string {
  const bp = Object.entries(contract.responsive.breakpoints)
    .map(([k, v]) => `- **${k}**: ${v}`)
    .join("\n");
  const layouts = Object.entries(contract.responsive.layouts)
    .map(([k, v]) => `- **${k}**: ${v}`)
    .join("\n");

  return `# Responsive Layouts

## Breakpoints

${bp}

## Layout Rules

${layouts}
`;
}

function generateDesignSourceFiles(
  input: DesignGeneratorInput,
  contract: DesignContract
): GeneratedSourceFile[] {
  const entityNames = input.entityNames.length > 0 ? input.entityNames : ["Entity"];
  const files: GeneratedSourceFile[] = [
    designFile("dg-nav", "", "navigation.json", JSON.stringify(contract.navigation, null, 2)),
    designFile(
      "dg-system",
      "",
      "design-system.json",
      JSON.stringify(contract.designSystem, null, 2)
    ),
    designFile(
      "dg-dashboard",
      "",
      "dashboard-layout.json",
      JSON.stringify(contract.dashboardLayout, null, 2)
    ),
    designFile("dg-themes", "", "themes.json", JSON.stringify(contract.themes, null, 2)),
    designFile(
      "dg-a11y-json",
      "",
      "accessibility.json",
      JSON.stringify(contract.accessibility, null, 2)
    ),
    designFile(
      "dg-responsive",
      "",
      "responsive.json",
      JSON.stringify(contract.responsive, null, 2)
    ),
    designFile("dg-userflow", "", "userflow.md", userFlowMarkdown(contract, input.requirement)),
    designFile("dg-a11y-md", "", "accessibility.md", accessibilityMarkdown(contract)),
    designFile("dg-responsive-md", "", "responsive-layouts.md", responsiveMarkdown(contract)),
    designFile(
      "wf-dashboard",
      "wireframes",
      "dashboard.md",
      wireframeDashboard(contract),
      "markdown"
    ),
  ];

  for (const name of entityNames) {
    files.push(
      designFile(
        `wf-list-${name}`,
        "wireframes",
        `${toKebabPlural(name)}-list.md`,
        wireframeList(name),
        "markdown"
      ),
      designFile(
        `wf-form-${name}`,
        "wireframes",
        `${toKebabPlural(name)}-form.md`,
        wireframeForm(name, "create"),
        "markdown"
      )
    );
  }

  files.push(
    designFile(
      "dg-readme",
      "",
      "README.md",
      `# Design Artifacts (Sanji V33)

Consumed by **Nami Frontend Generator**.

- \`navigation.json\` — app shell routes
- \`design-system.json\` — tokens for Tailwind/Shadcn
- \`dashboard-layout.json\` — dashboard grid/widgets
- \`themes.json\` — light/dark palettes
- \`userflow.md\` — UX flows
- \`wireframes/\` — ASCII wireframes per screen
`,
      "markdown"
    )
  );

  return files;
}

export function runDesignGeneration(input: DesignGeneratorInput): DesignGenerationResult {
  const contract = buildContract(input);
  const sourceFiles = generateDesignSourceFiles(input, contract);
  const wireframeCount = sourceFiles.filter((f) => f.path.includes("wireframes")).length;
  const uxQuality = evaluateUXQuality(
    contract,
    input.entityNames.length || 1,
    wireframeCount
  );

  return {
    agent: "Sanji",
    version: "V33",
    generatedAt: new Date().toISOString(),
    domain: input.domain,
    entities: input.entityNames,
    sourceFiles,
    contract,
    uxQuality,
  };
}

export function runDesignGenerationFromEntities(
  entities: EntityDefinition[],
  requirement: string,
  domain = "MyProject"
): DesignGenerationResult {
  return runDesignGeneration({
    requirement,
    domain,
    entityNames: entities.map((e) => e.name),
  });
}

export type { DesignContract, DesignGenerationResult, DesignGeneratorInput } from "./types";
