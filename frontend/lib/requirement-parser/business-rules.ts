import type { BusinessDomain } from "./domain-detector";

const DOMAIN_RULES: Partial<Record<BusinessDomain, string[]>> = {
  "Customer Service": [
    "Support tickets must be assigned to an available agent within SLA window",
    "Customer contact history must be retained for audit purposes",
  ],
  Warehouse: [
    "Pick lists must reflect real-time bin inventory levels",
    "Received goods must be scanned before putaway confirmation",
  ],
  Inventory: [
    "Stock levels cannot fall below configured reorder thresholds without alert",
    "Every stock movement must record user, timestamp, and quantity delta",
  ],
  HR: [
    "Leave requests require manager approval before balance deduction",
    "Employee personal data must be restricted to authorized HR roles",
  ],
  CRM: [
    "Leads must convert to contacts before opportunity creation",
    "Sales activities must be linked to an account or contact record",
  ],
  ERP: [
    "Purchase orders require approval above configured spending limits",
    "Financial postings must balance debits and credits per transaction",
  ],
  POS: [
    "Completed sales must generate immutable receipt records",
    "Cashier shifts must reconcile payments before shift close",
  ],
};

const RULE_PATTERNS = [
  /\b(must|shall|should|required to|cannot|may not|only if|never)\b[^.\n]{8,160}[.\n]/gi,
  /\b(rule|policy|constraint):\s*([^\n]{8,160})/gi,
];

function cleanRule(text: string): string {
  return text.replace(/\s+/g, " ").trim().replace(/^[-*•]\s*/, "");
}

export function extractBusinessRules(
  requirement: string,
  domain: BusinessDomain
): string[] {
  const rules = new Set<string>();

  for (const pattern of RULE_PATTERNS) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(requirement)) !== null) {
      const raw = match[2] ?? match[0];
      const rule = cleanRule(raw);
      if (rule.length >= 12 && rule.length <= 200) {
        rules.add(rule.charAt(0).toUpperCase() + rule.slice(1));
      }
    }
  }

  const sentences = requirement.split(/[.\n;]+/).map((s) => s.trim());
  for (const sentence of sentences) {
    if (/^(must|shall|should|cannot|required|only)\b/i.test(sentence) && sentence.length >= 15) {
      rules.add(cleanRule(sentence.charAt(0).toUpperCase() + sentence.slice(1)));
    }
  }

  const domainDefaults = DOMAIN_RULES[domain] ?? [];
  for (const rule of domainDefaults) {
    if (rules.size < 3) rules.add(rule);
  }

  if (rules.size === 0) {
    rules.add("All CRUD operations must validate input before persistence");
    rules.add("Business records must include created and updated timestamps");
  }

  return [...rules].slice(0, 15);
}
