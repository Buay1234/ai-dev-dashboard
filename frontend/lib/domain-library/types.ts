import type { BusinessDomain } from "@/lib/requirement-parser/domain-detector";
import type { RequirementAnalysisContract } from "@/lib/requirement-parser/requirement-analyzer";

export type DomainEntityTemplate = {
  name: string;
  description: string;
};

export type DomainRelationship = {
  from: string;
  to: string;
  type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
  label: string;
};

export type DomainStatusValues = {
  entity: string;
  field: string;
  values: string[];
};

export type DomainTemplate = {
  id: string;
  domain: string;
  description: string;
  entities: DomainEntityTemplate[];
  relationships: DomainRelationship[];
  statusValues: DomainStatusValues[];
  businessRules: string[];
  recommendedModules: string[];
};

export type ArchitectureContract = {
  domain: string;
  templateId: string | null;
  templateName: string | null;
  templateLoaded: boolean;
  requirementAnalysis: RequirementAnalysisContract;
  entities: string[];
  parsedEntities: string[];
  recommendedEntities: string[];
  relationships: DomainRelationship[];
  statusValues: DomainStatusValues[];
  modules: string[];
  parsedModules: string[];
  recommendedModules: string[];
  businessRules: string[];
  parsedBusinessRules: string[];
  templateBusinessRules: string[];
  confidenceScore: number;
  rawRequirement: string;
  analyzedAt: string;
};

export type DomainTemplateId =
  | "customer-service"
  | "warehouse"
  | "inventory"
  | "crm"
  | "hr"
  | "pos";

export const DOMAIN_TO_TEMPLATE: Partial<Record<BusinessDomain, DomainTemplateId>> = {
  "Customer Service": "customer-service",
  Warehouse: "warehouse",
  Inventory: "inventory",
  CRM: "crm",
  HR: "hr",
  POS: "pos",
};
