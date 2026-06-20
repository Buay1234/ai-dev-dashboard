import type { EntityDefinition, EntityField, GeneratedSourceFile } from "@/lib/project-generator/types";
import {
  collectGeneratedComponents,
  collectGeneratedPages,
  evaluateFrontendBuildStatus,
} from "./build-status";
import type { DesignContract } from "@/lib/design-generator/types";
import type { FrontendGenerationResult, FrontendGeneratorInput } from "./types";

export type {
  BuildStatus,
  FrontendGenerationResult,
  GeneratedComponents,
  GeneratedPages,
  GeneratedPage,
  GeneratedComponent,
} from "./types";

const FRONTEND_ROOT = "frontend";

function file(
  id: string,
  subPath: string,
  fileName: string,
  content: string
): GeneratedSourceFile {
  return {
    id,
    path: subPath ? `${FRONTEND_ROOT}/${subPath}` : FRONTEND_ROOT,
    fileName,
    category: "frontend",
    agent: "Nami",
    language: fileName.endsWith(".json")
      ? "json"
      : fileName.endsWith(".css")
        ? "css"
        : fileName.endsWith(".md")
          ? "markdown"
          : "typescript",
    content: content.trimStart(),
  };
}

function toKebabPlural(name: string): string {
  const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return `${kebab}s`;
}

function toTsType(field: EntityField): string {
  const base = field.csharpType.replace("?", "");
  const map: Record<string, string> = {
    string: "string",
    int: "number",
    long: "number",
    bool: "boolean",
    decimal: "number",
    double: "number",
    float: "number",
    Guid: "string",
    DateTime: "string",
  };
  const ts = map[base] ?? "string";
  return field.csharpType.endsWith("?") ? `${ts} | null` : ts;
}

function formFields(entity: EntityDefinition): EntityField[] {
  return entity.fields.filter(
    (f) => !f.isKey && f.name !== "CreatedAt" && f.name !== "UpdatedAt"
  );
}

function entityTypeBlock(entities: EntityDefinition[]): string {
  return entities
    .map((e) => {
      const props = e.fields
        .map((f) => `  ${f.name}${f.csharpType.endsWith("?") ? "?" : ""}: ${toTsType(f)};`)
        .join("\n");
      const createProps = formFields(e)
        .map((f) => `  ${f.name}${f.isRequired ? "" : "?"}: ${toTsType(f)};`)
        .join("\n");
      return `export type ${e.name} = {
${props}
};

export type ${e.name}CreateRequest = {
${createProps}
};

export type ${e.name}UpdateRequest = Partial<${e.name}CreateRequest>;`;
    })
    .join("\n\n");
}

function serviceBlock(entity: EntityDefinition): string {
  const route = entity.name;
  return `import { apiClient } from "./api-client";
import type { ${entity.name}, ${entity.name}CreateRequest, ${entity.name}UpdateRequest } from "@/types/entities";

const base = "/api/${route}";

export const ${entity.name}Service = {
  getAll: () => apiClient.get<${entity.name}[]>(base),
  getById: (id: number) => apiClient.get<${entity.name}>(\`\${base}/\${id}\`),
  create: (payload: ${entity.name}CreateRequest) =>
    apiClient.post<${entity.name}>(base, payload),
  update: (id: number, payload: ${entity.name}UpdateRequest) =>
    apiClient.put<void>(\`\${base}/\${id}\`, payload),
  remove: (id: number) => apiClient.delete<void>(\`\${base}/\${id}\`),
};
`;
}

function entityListPage(entity: EntityDefinition): string {
  const slug = toKebabPlural(entity.name);
  return `"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ${entity.name}Service } from "@/services/${entity.name}Service";
import type { ${entity.name} } from "@/types/entities";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { EntityTable } from "@/components/entity/entity-table";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "@/components/ui/toast";

export default function ${entity.name}ListPage() {
  const [items, setItems] = useState<${entity.name}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ${entity.name}Service.getAll();
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load ${entity.name}";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this ${entity.name}?")) return;
    try {
      await ${entity.name}Service.remove(id);
      toast.success("${entity.name} deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <AppShell title="${entity.name}" activeHref="/${slug}">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>${entity.name}</CardTitle>
          <Button asChild>
            <Link href="/${slug}/new">Create ${entity.name}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState label="Loading ${entity.name}..." />
          ) : error ? (
            <ErrorState message={error} onRetry={() => void load()} />
          ) : (
            <EntityTable
              rows={items}
              slug="${slug}"
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
`;
}

function entityFormPage(entity: EntityDefinition, mode: "new" | "edit"): string {
  const slug = toKebabPlural(entity.name);
  const isNew = mode === "new";
  const fields = formFields(entity);

  const initialState = fields
    .map((f) => {
      const defaultVal =
        f.csharpType.includes("bool")
          ? "false"
          : f.csharpType.includes("int") || f.csharpType.includes("decimal")
            ? "0"
            : '""';
      return `    ${f.name}: ${defaultVal},`;
    })
    .join("\n");

  return `"use client";

import { useEffect, useState } from "react";
import { useRouter${isNew ? "" : ", useParams"} } from "next/navigation";
import { ${entity.name}Service } from "@/services/${entity.name}Service";
import type { ${entity.name}CreateRequest } from "@/types/entities";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityForm } from "@/components/entity/entity-form";
import { LoadingState } from "@/components/ui/loading-state";
import { toast } from "@/components/ui/toast";

const fields = ${JSON.stringify(
    fields.map((f) => ({
      name: f.name,
      label: f.name.replace(/([A-Z])/g, " $1").trim(),
      type: f.csharpType.includes("bool")
        ? "checkbox"
        : f.csharpType.includes("int") || f.csharpType.includes("decimal")
          ? "number"
          : f.csharpType.includes("DateTime")
            ? "datetime-local"
            : "text",
      required: f.isRequired,
    })),
    null,
    2
  )} as const;

export default function ${entity.name}${isNew ? "Create" : "Edit"}Page() {
  const router = useRouter();
  ${isNew ? "" : "const params = useParams<{ id: string }>();"}
  const [form, setForm] = useState<${entity.name}CreateRequest>({
${initialState}
  });
  const [loading, setLoading] = useState(${isNew ? "false" : "true"});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ${isNew ? "return;" : `
    const id = Number(params.id);
    if (!id) return;
    (async () => {
      try {
        const item = await ${entity.name}Service.getById(id);
        setForm(
          Object.fromEntries(
            fields.map((f) => [f.name, (item as Record<string, unknown>)[f.name] ?? ""])
          ) as ${entity.name}CreateRequest
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();`}
  }, [${isNew ? "" : "params.id"}]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      ${
        isNew
          ? `await ${entity.name}Service.create(form);
      toast.success("${entity.name} created");`
          : `await ${entity.name}Service.update(Number(params.id), form);
      toast.success("${entity.name} updated");`
      }
      router.push("/${slug}");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="${isNew ? "New" : "Edit"} ${entity.name}" activeHref="/${slug}">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>${isNew ? "Create" : "Edit"} ${entity.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState label="Loading..." />
          ) : (
            <EntityForm
              fields={fields}
              values={form as Record<string, unknown>}
              onChange={(name, value) =>
                setForm((prev) => ({ ...prev, [name]: value }))
              }
              onSubmit={onSubmit}
              submitting={submitting}
              submitLabel="${isNew ? "Create" : "Save"}"
            />
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
`;
}

function generateFrontendSourceFiles(
  entities: EntityDefinition[],
  designContract?: DesignContract
): GeneratedSourceFile[] {
  const navItems = designContract
    ? designContract.navigation.primary
        .filter((item) => item.href !== "/dashboard")
        .map((item) => `  { href: "${item.href}", label: "${item.label}" },`)
        .join("\n")
    : entities
        .map(
          (e) =>
            `  { href: "/${toKebabPlural(e.name)}", label: "${e.name}" },`
        )
        .join("\n");

  const dark = designContract?.designSystem.colors.dark;
  const cssTheme = dark
    ? `  --color-background: ${dark.background};
  --color-foreground: ${dark.foreground};
  --color-card: ${dark.card};
  --color-card-foreground: ${dark.foreground};
  --color-primary: ${dark.primary};
  --color-primary-foreground: #ffffff;
  --color-muted: ${dark.muted};
  --color-muted-foreground: #a1a1aa;
  --color-border: ${dark.border};
  --color-destructive: ${dark.destructive};`
    : `  --color-background: #0a0a0b;
  --color-foreground: #fafafa;
  --color-card: #111113;
  --color-card-foreground: #fafafa;
  --color-primary: #3b82f6;
  --color-primary-foreground: #ffffff;
  --color-muted: #27272a;
  --color-muted-foreground: #a1a1aa;
  --color-border: #27272a;
  --color-destructive: #ef4444;`;

  const gridCols = designContract?.dashboardLayout.grid.columns ?? {
    sm: 1,
    md: 2,
    xl: 3,
  };

  const dashboardCards = entities
    .map(
      (e) => `          <Link href="/${toKebabPlural(e.name)}" className="block">
            <Card className="transition hover:border-primary/40 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">${e.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Manage ${e.name} records</p>
              </CardContent>
            </Card>
          </Link>`
    )
    .join("\n");

  const files: GeneratedSourceFile[] = [
    file("fe-package", "", "package.json", `{
  "name": "myproject-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "next lint"
  },
  "dependencies": {
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "next": "15.1.7",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sonner": "^2.0.1",
    "tailwind-merge": "^3.0.1",
    "@tanstack/react-query": "^5.66.9",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.6",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4.0.6",
    "typescript": "^5"
  }
}`),
    file("fe-tsconfig", "", "tsconfig.json", `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`),
    file("fe-next-config", "", "next.config.ts", `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
`),
    file("fe-postcss", "", "postcss.config.mjs", `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`),
    file("fe-env", "", ".env.local.example", `NEXT_PUBLIC_API_URL=http://localhost:5199
`),
    file("fe-globals", "app", "globals.css", `@import "tailwindcss";

@theme inline {
${cssTheme}
  --radius-lg: 0.75rem;
}

* { border-color: var(--color-border); }
body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: ui-sans-serif, system-ui, sans-serif;
}
`),
    file("fe-layout", "app", "layout.tsx", `import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "MyProject Dashboard",
  description: "Generated by Nami · Next.js App Router",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
`),
    file("fe-page", "app", "page.tsx", `import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard");
}
`),
    file("fe-dashboard", "app/dashboard", "page.tsx", `"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" activeHref="/dashboard">
      <div className="grid gap-4 sm:grid-cols-${gridCols.sm} md:grid-cols-${gridCols.md} xl:grid-cols-${gridCols.xl}">
${dashboardCards}
      </div>
    </AppShell>
  );
}
`),
    file("fe-utils", "lib", "utils.ts", `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`),
    file("fe-types", "types", "entities.ts", entityTypeBlock(entities)),
    file("fe-api-client", "services", "api-client.ts", `const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5199";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(\`\${API_BASE}\${path}\`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(text || \`HTTP \${res.status}\`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
`),
    file("fe-nav", "components/layout", "app-shell.tsx", `"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
${navItems}
] as const;

type Props = {
  title: string;
  activeHref: string;
  children: React.ReactNode;
};

export function AppShell({ title, activeHref, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside
        className={cn(
          "border-b border-border bg-card p-4 lg:border-b-0 lg:border-r",
          open ? "block" : "hidden lg:block"
        )}
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          MyProject
        </p>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm transition",
                activeHref === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
`),
    file("fe-btn", "components/ui", "button.tsx", `import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        ghost: "hover:bg-muted",
        destructive: "bg-destructive text-white hover:opacity-90",
        outline: "border border-border bg-transparent hover:bg-muted",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
`),
    file("fe-card", "components/ui", "card.tsx", `import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}
`),
    file("fe-input", "components/ui", "input.tsx", `import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      {...props}
    />
  );
}
`),
    file("fe-label", "components/ui", "label.tsx", `"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  );
}
`),
    file("fe-loading", "components/ui", "loading-state.tsx", `import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
`),
    file("fe-error-state", "components/ui", "error-state.tsx", `"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-10 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="max-w-md text-sm text-destructive">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
`),
    file("fe-app-error", "app", "error.tsx", `"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <ErrorState message={error.message || "Something went wrong"} onRetry={reset} />
    </div>
  );
}
`),
    file("fe-toast", "components/ui", "toast.ts", `import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
};
`),
    file("fe-toaster", "components/ui", "toaster.tsx", `"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      richColors
      position="top-right"
      toastOptions={{ classNames: { toast: "font-sans" } }}
    />
  );
}
`),
    file("fe-entity-table", "components/entity", "entity-table.tsx", `"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  rows: Array<Record<string, unknown>>;
  slug: string;
  onDelete: (id: number) => void;
};

export function EntityTable({ rows, slug, onDelete }: Props) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No records found.</p>;
  }

  const columns = Object.keys(rows[0]).slice(0, 5);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 font-medium">
                {col}
              </th>
            ))}
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = Number(row.Id ?? row.id);
            return (
              <tr key={id} className="border-t border-border">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3">
                    {String(row[col] ?? "")}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={\`/\${slug}/\${id}\`}>Edit</Link>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
`),
    file("fe-entity-form", "components/entity", "entity-form.tsx", `"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";

type Field = {
  name: string;
  label: string;
  type: string;
  required?: boolean;
};

type Props = {
  fields: readonly Field[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function EntityForm({
  fields,
  values,
  onChange,
  onSubmit,
  submitting,
  submitLabel = "Save",
}: Props) {
  if (submitting) return <LoadingState label="Saving..." />;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          {field.type === "checkbox" ? (
            <input
              id={field.name}
              type="checkbox"
              checked={Boolean(values[field.name])}
              onChange={(e) => onChange(field.name, e.target.checked)}
            />
          ) : (
            <Input
              id={field.name}
              type={field.type}
              required={field.required}
              value={String(values[field.name] ?? "")}
              onChange={(e) =>
                onChange(
                  field.name,
                  field.type === "number" ? Number(e.target.value) : e.target.value
                )
              }
            />
          )}
        </div>
      ))}
      <Button type="submit" disabled={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
`),
    file(
      "fe-readme",
      "",
      "README.md",
      `# MyProject Frontend

Generated by **Nami V32** · Next.js App Router + TypeScript + TailwindCSS + Shadcn UI

## Setup

\`\`\`bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
\`\`\`

Set \`NEXT_PUBLIC_API_URL\` to your MyProject.API base URL (default \`http://localhost:5199\`).

## Features

- Dashboard with entity modules
- CRUD pages for: ${entities.map((e) => e.name).join(", ")}
- API service layer (\`services/\`)
- Toast notifications (Sonner)
- Loading states on list/form pages
- Error handling with retry UI
- Responsive sidebar layout
`
    ),
  ];

  for (const entity of entities) {
    const slug = toKebabPlural(entity.name);
    files.push(
      file(
        `fe-service-${entity.name}`,
        "services",
        `${entity.name}Service.ts`,
        serviceBlock(entity)
      ),
      file(
        `fe-list-${entity.name}`,
        `app/${slug}`,
        "page.tsx",
        entityListPage(entity)
      ),
      file(
        `fe-new-${entity.name}`,
        `app/${slug}/new`,
        "page.tsx",
        entityFormPage(entity, "new")
      ),
      file(
        `fe-edit-${entity.name}`,
        `app/${slug}/[id]`,
        "page.tsx",
        entityFormPage(entity, "edit")
      )
    );
  }

  return files;
}

export function generateFrontendApp(entities: EntityDefinition[]): GeneratedSourceFile[] {
  return runFrontendGeneration({ entities }).sourceFiles;
}

export function runFrontendGeneration(input: FrontendGeneratorInput): FrontendGenerationResult {
  const { entities, designContract } = input;
  const sourceFiles = generateFrontendSourceFiles(entities, designContract);
  const pages = collectGeneratedPages(entities, sourceFiles);
  const components = collectGeneratedComponents(sourceFiles);
  const buildStatus = evaluateFrontendBuildStatus(
    entities,
    sourceFiles,
    pages,
    components
  );

  return {
    agent: "Nami",
    version: "V32",
    generatedAt: new Date().toISOString(),
    entities: entities.map((e) => e.name),
    sourceFiles,
    pages,
    components,
    buildStatus,
  };
}
