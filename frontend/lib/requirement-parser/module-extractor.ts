import { toPascalCase } from "@/lib/project-generator/entity-parser";
import type { BusinessDomain } from "./domain-detector";

const DOMAIN_MODULES: Partial<Record<BusinessDomain, string[]>> = {
  "Customer Service": [
    "Ticket Management",
    "Customer Profile",
    "Agent Assignment",
    "SLA Tracking",
  ],
  Warehouse: [
    "Receiving",
    "Putaway",
    "Picking",
    "Shipping",
    "Bin Management",
  ],
  Inventory: [
    "Stock Control",
    "Reorder Management",
    "Supplier Catalog",
    "Stock Movement",
  ],
  HR: ["Employee Records", "Leave Management", "Payroll", "Recruitment"],
  CRM: ["Lead Management", "Contact Management", "Sales Pipeline", "Account Management"],
  ERP: ["Procurement", "Finance", "Inventory Integration", "Reporting"],
  POS: ["Checkout", "Product Catalog", "Payment Processing", "Shift Management"],
};

const MODULE_PATTERNS = [
  /(?:module|feature|area|section)\s+(?:for|of|:)\s*([a-z][a-z\s/&-]{2,40})/gi,
  /(?:build|create|develop|implement)\s+(?:a\s+|an\s+)?([a-z][a-z\s-]{2,30})\s+(?:module|feature|portal|dashboard)/gi,
  /#+\s*([A-Z][a-zA-Z\s/&-]{2,40})(?:\s+Module)?/g,
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Management\b/g,
];

function normalizeModule(name: string): string {
  return name
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

function entityToModule(entity: string): string {
  return `${entity} Management`;
}

export function extractModules(
  requirement: string,
  domain: BusinessDomain,
  entities: string[]
): string[] {
  const modules = new Set<string>();

  for (const pattern of MODULE_PATTERNS) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(requirement)) !== null) {
      const label = normalizeModule(match[1].trim());
      if (label.length > 3 && !/^(The|And|For|System|Core)$/i.test(label)) {
        modules.add(label);
      }
    }
  }

  for (const entity of entities) {
    if (entity !== "BusinessRecord") {
      modules.add(entityToModule(entity));
    }
  }

  const domainDefaults = DOMAIN_MODULES[domain] ?? ["Core Operations", "Reporting", "Administration"];
  for (const mod of domainDefaults) {
    const keyword = mod.split(" ")[0]!.toLowerCase();
    if (requirement.toLowerCase().includes(keyword) || modules.size < 2) {
      modules.add(mod);
    }
  }

  if (modules.size === 0) {
    domainDefaults.slice(0, 3).forEach((m) => modules.add(m));
  }

  return [...modules].slice(0, 12);
}

export function moduleSlug(name: string): string {
  return toPascalCase(name.replace(/\s+/g, ""));
}
