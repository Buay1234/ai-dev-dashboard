export type BusinessDomain =
  | "Customer Service"
  | "Warehouse"
  | "Inventory"
  | "HR"
  | "CRM"
  | "ERP"
  | "POS"
  | "General Business";

export type DomainDetectionResult = {
  domain: BusinessDomain;
  score: number;
  matchedKeywords: string[];
};

const DOMAIN_KEYWORDS: Record<Exclude<BusinessDomain, "General Business">, string[]> = {
  "Customer Service": [
    "customer service",
    "helpdesk",
    "help desk",
    "support ticket",
    "service desk",
    "call center",
    "complaint",
    "case management",
    "sla",
  ],
  Warehouse: [
    "warehouse",
    "fulfillment",
    "picking",
    "packing",
    "dock",
    "bin location",
    "receiving",
    "shipping bay",
    "storage location",
  ],
  Inventory: [
    "inventory",
    "stock level",
    "sku",
    "reorder",
    "stocktake",
    "stock count",
    "warehouse stock",
    "item master",
    "supply stock",
  ],
  HR: [
    "human resources",
    " hr ",
    "payroll",
    "leave request",
    "recruitment",
    "onboarding",
    "employee record",
    "attendance",
    "performance review",
  ],
  CRM: [
    "crm",
    "customer relationship",
    "sales pipeline",
    "lead",
    "opportunity",
    "contact management",
    "prospect",
    "account manager",
  ],
  ERP: [
    "erp",
    "enterprise resource",
    "procurement",
    "general ledger",
    "accounts payable",
    "accounts receivable",
    "supply chain",
    "manufacturing",
    "finance module",
  ],
  POS: [
    "pos",
    "point of sale",
    "checkout",
    "cash register",
    "retail store",
    "cashier",
    "receipt",
    "barcode scan",
    "store terminal",
  ],
};

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/\s+/g, " ")} `;
}

export function detectDomain(requirement: string): DomainDetectionResult {
  const text = normalize(requirement);
  let best: DomainDetectionResult = {
    domain: "General Business",
    score: 0,
    matchedKeywords: [],
  };

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [
    Exclude<BusinessDomain, "General Business">,
    string[],
  ][]) {
    const matched = keywords.filter((kw) => text.includes(kw));
    const score = matched.length * 10 + matched.reduce((s, kw) => s + kw.length, 0);

    if (score > best.score) {
      best = { domain, score, matchedKeywords: matched };
    }
  }

  if (best.score === 0) {
    return { domain: "General Business", score: 5, matchedKeywords: [] };
  }

  return best;
}

export function domainConfidenceScore(detection: DomainDetectionResult): number {
  if (detection.domain === "General Business") return 35;
  const keywordBoost = Math.min(detection.matchedKeywords.length * 12, 48);
  const base = 42 + keywordBoost;
  return Math.min(98, base);
}
