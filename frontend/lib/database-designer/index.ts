import type { ArchitectureContract } from "@/lib/domain-library/types";
import { resolveCascadeRules, generateFluentApiConfigurations } from "./cascade-rules";
import {
  applyDatabaseDesignToEntities,
  generateForeignKeys,
  generateNavigationProperties,
} from "./foreign-key-generator";
import type { DatabaseDesignContract } from "./entity-relationship";
import { dedupeEntityNames } from "./entity-relationship";
import { buildErDiagram, planMigrations } from "./migration-planner";
import { analyzeRelationships } from "./relationship-analyzer";
import type { EntityDefinition } from "@/lib/project-generator/types";

export function alignDatabaseDesignWithEntities(
  design: DatabaseDesignContract,
  entities: EntityDefinition[]
): DatabaseDesignContract {
  const names = new Set(entities.map((e) => e.name));
  const entityList = [...names];

  const relationships = design.relationships.filter(
    (r) => names.has(r.principalEntity) && names.has(r.dependentEntity)
  );

  const navigationProperties = design.navigationProperties.filter(
    (n) => names.has(n.entity) && names.has(n.targetEntity)
  );

  const foreignKeys = design.foreignKeys.filter(
    (fk) => names.has(fk.entity) && names.has(fk.referencesEntity)
  );

  const cascadeRules = resolveCascadeRules(relationships);
  const fluentConfigurations = generateFluentApiConfigurations(
    relationships,
    cascadeRules,
    navigationProperties
  );

  return {
    ...design,
    entities: entityList,
    relationships,
    foreignKeys,
    navigationProperties,
    cascadeRules,
    fluentConfigurations,
    erDiagram: buildErDiagram(entityList, relationships),
    migrationPlan: planMigrations(entityList, relationships, foreignKeys),
  };
}

export function designDatabase(
  architecture: ArchitectureContract
): DatabaseDesignContract {
  const entities = dedupeEntityNames(architecture.entities);
  const relationships = analyzeRelationships(architecture);
  const foreignKeys = generateForeignKeys(relationships);
  const navigationProperties = generateNavigationProperties(relationships);
  const cascadeRules = resolveCascadeRules(relationships);
  const fluentConfigurations = generateFluentApiConfigurations(
    relationships,
    cascadeRules,
    navigationProperties
  );
  const erDiagram = buildErDiagram(entities, relationships);
  const migrationPlan = planMigrations(entities, relationships, foreignKeys);

  return {
    entities,
    relationships,
    foreignKeys,
    navigationProperties,
    fluentConfigurations,
    cascadeRules,
    erDiagram,
    migrationPlan,
    generatedAt: new Date().toISOString(),
  };
}

export function formatDatabaseDesignForAgent(
  contract: DatabaseDesignContract
): string {
  const fkLines = contract.foreignKeys.map(
    (fk) => `- ${fk.entity}.${fk.property} → ${fk.referencesEntity}.${fk.referencesProperty}`
  );
  const relLines = contract.relationships.map(
    (r) => `- ${r.principalEntity} → ${r.dependentEntity} (${r.cardinality}): ${r.label}`
  );
  const cascadeLines = contract.cascadeRules.map(
    (c) => `- ${c.from} → ${c.to}: OnDelete ${c.onDelete} — ${c.reason}`
  );
  const migrationLines = contract.migrationPlan.map(
    (s) => `${s.order}. [${s.action}] ${s.entity} — ${s.detail}`
  );

  return `# Database Design Contract (V31)

Entities: ${contract.entities.join(", ")}

## Relationships
${relLines.join("\n")}

## Foreign Keys
${fkLines.join("\n") || "- None"}

## Cascade Rules
${cascadeLines.join("\n")}

## Migration Plan
${migrationLines.join("\n")}

## ER Diagram Summary
Nodes: ${contract.erDiagram.nodes.length} · Edges: ${contract.erDiagram.edges.length}

Validate QA against FK integrity, cascade behavior, and relationship coverage.`;
}

export function exportErDiagramJson(contract: DatabaseDesignContract): string {
  return JSON.stringify(contract.erDiagram, null, 2);
}

export type { DatabaseDesignContract } from "./entity-relationship";
export { applyDatabaseDesignToEntities } from "./foreign-key-generator";
