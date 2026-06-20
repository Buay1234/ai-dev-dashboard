export {
  buildArchitectureContract,
  formatArchitectureContractForAgent,
  exportArchitectureContractJson,
} from "./contract-merger";
export {
  loadDomainTemplate,
  resolveTemplateId,
  getTemplateById,
  listAvailableTemplates,
} from "./template-loader";
export type {
  ArchitectureContract,
  DomainTemplate,
  DomainEntityTemplate,
  DomainRelationship,
  DomainStatusValues,
  DomainTemplateId,
} from "./types";
export { DOMAIN_TO_TEMPLATE } from "./types";
