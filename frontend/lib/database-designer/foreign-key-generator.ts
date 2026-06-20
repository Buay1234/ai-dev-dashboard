import type { EntityDefinition } from "@/lib/project-generator/types";
import type {
  EntityRelationship,
  ForeignKeyDefinition,
  NavigationPropertyDefinition,
} from "./entity-relationship";

export function generateForeignKeys(
  relationships: EntityRelationship[]
): ForeignKeyDefinition[] {
  const keys: ForeignKeyDefinition[] = [];

  for (const rel of relationships) {
    if (rel.cardinality === "ManyToMany") continue;

    const fkProperty = `${rel.principalEntity}Id`;
    keys.push({
      entity: rel.dependentEntity,
      property: fkProperty,
      referencesEntity: rel.principalEntity,
      referencesProperty: "Id",
      isRequired: rel.cardinality !== "OneToOne" || rel.dependentEntity !== rel.principalEntity,
      sqlType: "INT NOT NULL",
    });
  }

  return keys;
}

export function generateNavigationProperties(
  relationships: EntityRelationship[]
): NavigationPropertyDefinition[] {
  const nav: NavigationPropertyDefinition[] = [];
  const collectionAdded = new Set<string>();

  for (const rel of relationships) {
    if (rel.cardinality === "ManyToMany") {
      const fromCollection = `${rel.to}s`;
      const toCollection = `${rel.from}s`;
      const fromKey = `${rel.from}:${fromCollection}`;
      const toKey = `${rel.to}:${toCollection}`;

      if (!collectionAdded.has(fromKey)) {
        nav.push({
          entity: rel.from,
          property: fromCollection,
          targetEntity: rel.to,
          isCollection: true,
          inverseProperty: toCollection,
        });
        collectionAdded.add(fromKey);
      }
      if (!collectionAdded.has(toKey)) {
        nav.push({
          entity: rel.to,
          property: toCollection,
          targetEntity: rel.from,
          isCollection: true,
          inverseProperty: fromCollection,
        });
        collectionAdded.add(toKey);
      }
      continue;
    }

    const fkNavName = rel.principalEntity;
    const inverseName = `${rel.dependentEntity}s`;

    nav.push({
      entity: rel.dependentEntity,
      property: fkNavName,
      targetEntity: rel.principalEntity,
      isCollection: false,
      inverseProperty: inverseName,
    });

    const inverseKey = `${rel.principalEntity}:${inverseName}`;
    if (!collectionAdded.has(inverseKey)) {
      nav.push({
        entity: rel.principalEntity,
        property: inverseName,
        targetEntity: rel.dependentEntity,
        isCollection: true,
        inverseProperty: fkNavName,
      });
      collectionAdded.add(inverseKey);
    }
  }

  return nav;
}

export function applyDatabaseDesignToEntities(
  entities: EntityDefinition[],
  foreignKeys: ForeignKeyDefinition[]
): EntityDefinition[] {
  const byName = new Map(entities.map((e) => [e.name, { ...e, fields: [...e.fields] }]));

  for (const fk of foreignKeys) {
    const entity = byName.get(fk.entity);
    if (!entity) continue;

    if (entity.fields.some((f) => f.name === fk.property)) continue;

    entity.fields.push({
      name: fk.property,
      csharpType: "int",
      sqlType: fk.sqlType,
      isRequired: fk.isRequired,
      isKey: false,
      isForeignKey: true,
      fkEntity: fk.referencesEntity,
    });
  }

  return [...byName.values()];
}
