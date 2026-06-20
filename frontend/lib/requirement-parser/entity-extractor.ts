import { toPascalCase } from "@/lib/project-generator/entity-parser";
import type { BusinessDomain } from "./domain-detector";

export const GENERIC_ENTITY_BLOCKLIST = new Set([
  "Handle",
  "Core",
  "Manage",
  "Generate",
  "Provide",
  "System",
  "Process",
  "Module",
  "Feature",
  "Service",
  "Application",
  "Platform",
  "Solution",
  "Interface",
  "Component",
  "Function",
  "Operation",
  "Utility",
  "Helper",
  "Manager",
  "Handler",
  "Controller",
  "Repository",
  "Data",
  "Entity",
  "Record",
  "Object",
  "Task",
  "Project",
  "The",
  "And",
  "For",
  "Api",
  "Crud",
  "User",
  "Admin",
]);

const DOMAIN_ENTITIES: Partial<Record<BusinessDomain, string[]>> = {
  "Customer Service": ["SupportTicket", "Customer", "Agent", "ServiceCategory", "Escalation"],
  Warehouse: ["Warehouse", "StorageBin", "PickList", "Shipment", "ReceivingOrder"],
  Inventory: ["InventoryItem", "StockLevel", "Supplier", "PurchaseOrder", "StockMovement"],
  HR: ["Employee", "Department", "LeaveRequest", "PayrollRun", "JobPosition"],
  CRM: ["Lead", "Contact", "Opportunity", "Account", "SalesActivity"],
  ERP: ["Vendor", "PurchaseOrder", "Invoice", "LedgerAccount", "CostCenter"],
  POS: ["Product", "SaleTransaction", "Payment", "Store", "CashierShift"],
};

const KNOWN_NOUNS =
  /\b(customers?|orders?|products?|invoices?|payments?|employees?|departments?|categories?|items?|bookings?|reservations?|students?|courses?|patients?|appointments?|tickets?|suppliers?|warehouses?|shipments?|leads?|contacts?|accounts?|stores?|vendors?|stock|inventory|payroll|attendance|shifts?)\b/gi;

const ENTITY_PATTERNS = [
  /(?:manage|track|handle|store|process|maintain|register|record)\s+(?:the\s+)?([a-z][a-z\s-]{2,30})/gi,
  /(?:create|update|delete|view|list)\s+(?:a\s+|an\s+|the\s+)?([a-z][a-z\s-]{2,30})/gi,
  /(?:entity|module|table|model):\s*([A-Za-z][A-Za-z0-9\s-]{2,30})/gi,
  /\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)\b/g,
];

function toSingularEntity(name: string): string {
  const pascal = toPascalCase(name);
  if (pascal.endsWith("ies")) return pascal.slice(0, -3) + "y";
  if (pascal.endsWith("ses")) return pascal.slice(0, -2);
  if (pascal.endsWith("s") && pascal.length > 3) return pascal.slice(0, -1);
  return pascal;
}

export function isExplicitlyRequiredEntity(name: string, requirement: string): boolean {
  const lower = name.toLowerCase();
  const text = requirement.toLowerCase();
  return (
    new RegExp(`["']${lower}["']`, "i").test(requirement) ||
    new RegExp(`\\b${lower}\\s+(entity|module|table|model|master)\\b`, "i").test(text) ||
    new RegExp(`\\b(the\\s+)?${lower}\\s+(management|tracking|system)\\b`, "i").test(text)
  );
}

export function isGenericEntity(name: string, requirement: string): boolean {
  const pascal = toPascalCase(name);
  if (!GENERIC_ENTITY_BLOCKLIST.has(pascal)) return false;
  return !isExplicitlyRequiredEntity(pascal, requirement);
}

function cleanEntityPhrase(phrase: string): string | null {
  const cleaned = phrase
    .replace(/\b(and|or|for|with|from|into|using|including|such as)\b.*$/i, "")
    .replace(/\b(management|module|system|tracking|records?|data)\b/gi, "")
    .trim();

  if (cleaned.length < 3) return null;
  return toSingularEntity(cleaned);
}

export function extractEntities(requirement: string, domain: BusinessDomain): string[] {
  const found = new Set<string>();
  const add = (name: string | null | undefined) => {
    if (!name || name.length < 3) return;
    const singular = toSingularEntity(name);
    if (isGenericEntity(singular, requirement)) return;
    if (singular.length > 2) found.add(singular);
  };

  for (const pattern of ENTITY_PATTERNS) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(requirement)) !== null) {
      add(cleanEntityPhrase(match[1]));
    }
  }

  let nounMatch: RegExpExecArray | null;
  while ((nounMatch = KNOWN_NOUNS.exec(requirement)) !== null) {
    add(nounMatch[0]);
  }

  const domainDefaults = DOMAIN_ENTITIES[domain] ?? [];
  for (const entity of domainDefaults) {
    if (requirement.toLowerCase().includes(entity.toLowerCase().replace(/([A-Z])/g, " $1").trim().split(" ")[0]!.toLowerCase())) {
      add(entity);
    }
  }

  if (found.size === 0 && domainDefaults.length > 0) {
    domainDefaults.slice(0, 3).forEach(add);
  }

  if (found.size === 0) {
    add("BusinessRecord");
  }

  return [...found].slice(0, 10);
}
