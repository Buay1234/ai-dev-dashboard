import type { BusinessDomain } from "@/lib/requirement-parser/domain-detector";
import customerService from "./templates/customer-service.json";
import warehouse from "./templates/warehouse.json";
import inventory from "./templates/inventory.json";
import crm from "./templates/crm.json";
import hr from "./templates/hr.json";
import pos from "./templates/pos.json";
import type { DomainTemplate, DomainTemplateId } from "./types";
import { DOMAIN_TO_TEMPLATE } from "./types";

const TEMPLATE_REGISTRY: Record<DomainTemplateId, DomainTemplate> = {
  "customer-service": customerService as DomainTemplate,
  warehouse: warehouse as DomainTemplate,
  inventory: inventory as DomainTemplate,
  crm: crm as DomainTemplate,
  hr: hr as DomainTemplate,
  pos: pos as DomainTemplate,
};

export function resolveTemplateId(domain: BusinessDomain): DomainTemplateId | null {
  return DOMAIN_TO_TEMPLATE[domain] ?? null;
}

export function loadDomainTemplate(domain: BusinessDomain): DomainTemplate | null {
  const templateId = resolveTemplateId(domain);
  if (!templateId) return null;
  return TEMPLATE_REGISTRY[templateId] ?? null;
}

export function getTemplateById(id: DomainTemplateId): DomainTemplate {
  return TEMPLATE_REGISTRY[id];
}

export function listAvailableTemplates(): DomainTemplate[] {
  return Object.values(TEMPLATE_REGISTRY);
}
