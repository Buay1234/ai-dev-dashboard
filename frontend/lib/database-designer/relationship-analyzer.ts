import type { ArchitectureContract } from "@/lib/domain-library/types";
import type { EntityRelationship, RelationshipCardinality } from "./entity-relationship";
import { dedupeEntityNames, relationshipId } from "./entity-relationship";

function mapDomainType(
  type: string
): RelationshipCardinality | null {
  if (type === "many-to-many") return "ManyToMany";
  if (type === "one-to-one") return "OneToOne";
  if (type === "one-to-many" || type === "many-to-one") return "OneToMany";
  return null;
}

function resolveOneToMany(
  from: string,
  to: string,
  label: string,
  domainType: string
): EntityRelationship {
  const child = domainType === "many-to-one" ? from : to;
  const parent = domainType === "many-to-one" ? to : from;

  return {
    id: relationshipId(parent, child, "OneToMany"),
    from: parent,
    to: child,
    cardinality: "OneToMany",
    label,
    dependentEntity: child,
    principalEntity: parent,
  };
}

function inferFromBusinessRules(
  entities: string[],
  rules: string[]
): EntityRelationship[] {
  const inferred: EntityRelationship[] = [];
  const lowerRules = rules.map((r) => r.toLowerCase());

  for (let i = 0; i < entities.length; i++) {
    for (let j = 0; j < entities.length; j++) {
      if (i === j) continue;
      const parent = entities[i];
      const child = entities[j];
      const parentLower = parent.toLowerCase();
      const childLower = child.toLowerCase();

      const linked = lowerRules.some(
        (rule) =>
          rule.includes(parentLower) &&
          rule.includes(childLower) &&
          (rule.includes("link") ||
            rule.includes("assign") ||
            rule.includes("belong") ||
            rule.includes("convert"))
      );

      if (linked) {
        inferred.push({
          id: relationshipId(parent, child, "OneToMany"),
          from: parent,
          to: child,
          cardinality: "OneToMany",
          label: `inferred from business rule`,
          dependentEntity: child,
          principalEntity: parent,
        });
      }
    }
  }

  return inferred;
}

function inferFromNaming(entities: string[]): EntityRelationship[] {
  const inferred: EntityRelationship[] = [];
  const lookup = new Set(entities);

  for (const entity of entities) {
    for (const candidate of entities) {
      if (candidate === entity) continue;
      if (entity.endsWith(candidate) && entity.length > candidate.length) {
        if (lookup.has(candidate)) {
          inferred.push({
            id: relationshipId(candidate, entity, "OneToMany"),
            from: candidate,
            to: entity,
            cardinality: "OneToMany",
            label: "naming convention",
            dependentEntity: entity,
            principalEntity: candidate,
          });
        }
      }
    }
  }

  return inferred;
}

export function analyzeRelationships(
  architecture: ArchitectureContract
): EntityRelationship[] {
  const entities = dedupeEntityNames(architecture.entities);
  const relationships: EntityRelationship[] = [];
  const seen = new Set<string>();

  const add = (rel: EntityRelationship) => {
    const key = `${rel.principalEntity}->${rel.dependentEntity}:${rel.cardinality}`;
    if (seen.has(key)) return;
    if (!entities.includes(rel.principalEntity) || !entities.includes(rel.dependentEntity)) {
      return;
    }
    seen.add(key);
    relationships.push(rel);
  };

  for (const domainRel of architecture.relationships) {
    const cardinality = mapDomainType(domainRel.type);
    if (!cardinality) continue;

    if (cardinality === "ManyToMany") {
      add({
        id: relationshipId(domainRel.from, domainRel.to, "ManyToMany"),
        from: domainRel.from,
        to: domainRel.to,
        cardinality: "ManyToMany",
        label: domainRel.label,
        dependentEntity: domainRel.to,
        principalEntity: domainRel.from,
      });
      continue;
    }

    if (cardinality === "OneToOne") {
      add({
        id: relationshipId(domainRel.from, domainRel.to, "OneToOne"),
        from: domainRel.from,
        to: domainRel.to,
        cardinality: "OneToOne",
        label: domainRel.label,
        dependentEntity: domainRel.to,
        principalEntity: domainRel.from,
      });
      continue;
    }

    add(resolveOneToMany(domainRel.from, domainRel.to, domainRel.label, domainRel.type));
  }

  for (const rel of inferFromBusinessRules(entities, architecture.businessRules)) {
    add(rel);
  }

  for (const rel of inferFromNaming(entities)) {
    add(rel);
  }

  if (relationships.length === 0 && entities.length >= 2) {
    add({
      id: relationshipId(entities[0], entities[1], "OneToMany"),
      from: entities[0],
      to: entities[1],
      cardinality: "OneToMany",
      label: "default primary association",
      dependentEntity: entities[1],
      principalEntity: entities[0],
    });
  }

  return relationships;
}
