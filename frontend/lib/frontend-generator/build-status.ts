import type { EntityDefinition, GeneratedSourceFile } from "@/lib/project-generator/types";
import type {
  BuildStatus,
  FrontendBuildCheck,
  GeneratedComponent,
  GeneratedComponents,
  GeneratedPage,
  GeneratedPages,
} from "./types";

const FRONTEND_ROOT = "frontend";

function fullPath(file: GeneratedSourceFile): string {
  return file.path ? `${file.path}/${file.fileName}` : `${FRONTEND_ROOT}/${file.fileName}`;
}

function toKebabPlural(name: string): string {
  const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return `${kebab}s`;
}

export function collectGeneratedPages(
  entities: EntityDefinition[],
  files: GeneratedSourceFile[]
): GeneratedPages {
  const items: GeneratedPage[] = [
    {
      route: "/",
      kind: "redirect",
      filePath: `${FRONTEND_ROOT}/app/page.tsx`,
    },
    {
      route: "/dashboard",
      kind: "dashboard",
      filePath: `${FRONTEND_ROOT}/app/dashboard/page.tsx`,
    },
  ];

  for (const entity of entities) {
    const slug = toKebabPlural(entity.name);
    items.push(
      {
        route: `/${slug}`,
        entity: entity.name,
        kind: "list",
        filePath: `${FRONTEND_ROOT}/app/${slug}/page.tsx`,
      },
      {
        route: `/${slug}/new`,
        entity: entity.name,
        kind: "create",
        filePath: `${FRONTEND_ROOT}/app/${slug}/new/page.tsx`,
      },
      {
        route: `/${slug}/[id]`,
        entity: entity.name,
        kind: "edit",
        filePath: `${FRONTEND_ROOT}/app/${slug}/[id]/page.tsx`,
      }
    );
  }

  const fileSet = new Set(files.map(fullPath));
  return {
    total: items.length,
    items: items.filter((p) => fileSet.has(p.filePath)),
  };
}

export function collectGeneratedComponents(
  files: GeneratedSourceFile[]
): GeneratedComponents {
  const items: GeneratedComponent[] = [];

  for (const file of files) {
    if (file.category !== "frontend" || !file.path.includes("components/")) continue;
    const rel = fullPath(file).replace(`${FRONTEND_ROOT}/components/`, "");
    const kind: GeneratedComponent["kind"] = rel.startsWith("ui/")
      ? "ui"
      : rel.startsWith("layout/")
        ? "layout"
        : rel.startsWith("entity/")
          ? "entity"
          : "error";

    items.push({
      name: file.fileName.replace(/\.tsx?$/, ""),
      filePath: fullPath(file),
      kind,
    });
  }

  return { total: items.length, items };
}

export function evaluateFrontendBuildStatus(
  entities: EntityDefinition[],
  files: GeneratedSourceFile[],
  pages: GeneratedPages,
  components: GeneratedComponents
): BuildStatus {
  const paths = new Set(files.map(fullPath));
  const checks: FrontendBuildCheck[] = [];

  const requireFile = (id: string, label: string, filePath: string) => {
    const passed = paths.has(filePath);
    checks.push({
      id,
      label,
      passed,
      detail: passed ? `${label} present` : `Missing ${filePath}`,
    });
    return passed;
  };

  requireFile("scaffold", "Next.js scaffold", `${FRONTEND_ROOT}/package.json`);
  requireFile("layout", "Root layout", `${FRONTEND_ROOT}/app/layout.tsx`);
  requireFile("globals", "Tailwind globals", `${FRONTEND_ROOT}/app/globals.css`);
  requireFile("dashboard", "Dashboard page", `${FRONTEND_ROOT}/app/dashboard/page.tsx`);
  requireFile("api-client", "API service layer", `${FRONTEND_ROOT}/services/api-client.ts`);
  requireFile("entities-types", "Entity types", `${FRONTEND_ROOT}/types/entities.ts`);
  requireFile("loading", "Loading state UI", `${FRONTEND_ROOT}/components/ui/loading-state.tsx`);
  requireFile("error-ui", "Error handling UI", `${FRONTEND_ROOT}/components/ui/error-state.tsx`);
  requireFile("data-table", "Data table", `${FRONTEND_ROOT}/components/entity/entity-table.tsx`);
  requireFile("form", "Entity form", `${FRONTEND_ROOT}/components/entity/entity-form.tsx`);

  for (const entity of entities) {
    const slug = toKebabPlural(entity.name);
    requireFile(`svc-${entity.name}`, `${entity.name} service`, `${FRONTEND_ROOT}/services/${entity.name}Service.ts`);
    requireFile(`list-${entity.name}`, `${entity.name} list`, `${FRONTEND_ROOT}/app/${slug}/page.tsx`);
    requireFile(`create-${entity.name}`, `${entity.name} create`, `${FRONTEND_ROOT}/app/${slug}/new/page.tsx`);
    requireFile(`edit-${entity.name}`, `${entity.name} edit`, `${FRONTEND_ROOT}/app/${slug}/[id]/page.tsx`);
  }

  const serviceCount = files.filter(
    (f) => f.category === "frontend" && f.path.endsWith("services") && f.fileName.endsWith("Service.ts")
  ).length;

  const passed = checks.every((c) => c.passed);

  return {
    passed,
    fileCount: files.length,
    pageCount: pages.total,
    componentCount: components.total,
    serviceCount,
    checks,
  };
}
