import type {
  EntityRelationship,
  ErDiagramJson,
  ForeignKeyDefinition,
  MigrationPlanStep,
} from "./entity-relationship";

export function buildErDiagram(
  entities: string[],
  relationships: EntityRelationship[]
): ErDiagramJson {
  const nodes = entities.map((entity) => ({
    id: entity,
    label: entity,
    entity,
  }));

  const edges = relationships.map((rel) => ({
    id: rel.id,
    from: rel.principalEntity,
    to: rel.dependentEntity,
    label: rel.label,
    cardinality: rel.cardinality,
  }));

  return { nodes, edges };
}

export function planMigrations(
  entities: string[],
  relationships: EntityRelationship[],
  foreignKeys: ForeignKeyDefinition[]
): MigrationPlanStep[] {
  const steps: MigrationPlanStep[] = [];
  const entitySet = new Set(entities);
  const dependentEntities = new Set(
    relationships
      .filter((r) => r.cardinality !== "ManyToMany")
      .map((r) => r.dependentEntity)
  );
  const rootEntities = entities.filter((e) => !dependentEntities.has(e));
  const ordered = [...rootEntities, ...entities.filter((e) => dependentEntities.has(e))];
  const uniqueOrdered = [...new Map(ordered.map((e) => [e, e])).values()];

  let order = 1;
  for (const entity of uniqueOrdered) {
    if (!entitySet.has(entity)) continue;
    steps.push({
      order: order++,
      action: "CreateTable",
      entity,
      detail: `Create table for ${entity}`,
    });
  }

  for (const rel of relationships.filter((r) => r.cardinality === "ManyToMany")) {
    steps.push({
      order: order++,
      action: "CreateJoinTable",
      entity: `${rel.from}${rel.to}s`,
      detail: `Join table linking ${rel.from} and ${rel.to}`,
    });
  }

  for (const fk of foreignKeys) {
    steps.push({
      order: order++,
      action: "AddForeignKey",
      entity: fk.entity,
      detail: `${fk.property} → ${fk.referencesEntity}.${fk.referencesProperty}`,
    });
  }

  return steps;
}
