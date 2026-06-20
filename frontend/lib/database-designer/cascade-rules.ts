import type {
  CascadeDeleteBehavior,
  CascadeRuleDefinition,
  EntityRelationship,
  FluentApiConfiguration,
} from "./entity-relationship";

const RESTRICT_PRINCIPALS = new Set([
  "Customer",
  "Account",
  "Contact",
  "Employee",
  "Supplier",
  "Vendor",
  "Store",
  "Warehouse",
  "Product",
  "InventoryItem",
]);

export function resolveCascadeRules(
  relationships: EntityRelationship[]
): CascadeRuleDefinition[] {
  return relationships.map((rel) => {
    if (rel.cardinality === "ManyToMany") {
      return {
        relationshipId: rel.id,
        from: rel.from,
        to: rel.to,
        onDelete: "Cascade",
        reason: "Join table rows removed when unlinked",
      };
    }

    const cascadeChildPatterns = /movement|line|payment|activity|escalation|item|shift|request/i;
    const childIsOwned =
      cascadeChildPatterns.test(rel.dependentEntity) ||
      !RESTRICT_PRINCIPALS.has(rel.principalEntity);

    if (rel.cardinality === "OneToOne") {
      return {
        relationshipId: rel.id,
        from: rel.principalEntity,
        to: rel.dependentEntity,
        onDelete: "Restrict",
        reason: "One-to-one requires explicit unlink before delete",
      };
    }

    if (RESTRICT_PRINCIPALS.has(rel.principalEntity) && !childIsOwned) {
      return {
        relationshipId: rel.id,
        from: rel.principalEntity,
        to: rel.dependentEntity,
        onDelete: "Restrict",
        reason: `Protect ${rel.principalEntity} records referenced by ${rel.dependentEntity}`,
      };
    }

    return {
      relationshipId: rel.id,
      from: rel.principalEntity,
      to: rel.dependentEntity,
      onDelete: "Cascade",
      reason: `${rel.dependentEntity} is owned by ${rel.principalEntity}`,
    };
  });
}

export function generateFluentApiConfigurations(
  relationships: EntityRelationship[],
  cascadeRules: CascadeRuleDefinition[],
  navigationProperties: { entity: string; property: string; targetEntity: string; isCollection: boolean; inverseProperty?: string }[]
): FluentApiConfiguration[] {
  const configs: FluentApiConfiguration[] = [];
  const cascadeById = new Map(cascadeRules.map((r) => [r.relationshipId, r.onDelete]));

  for (const rel of relationships) {
    const onDelete = cascadeById.get(rel.id) ?? "Restrict";
    const dependentNav = navigationProperties.find(
      (n) => n.entity === rel.dependentEntity && n.targetEntity === rel.principalEntity && !n.isCollection
    );
    const principalNav = navigationProperties.find(
      (n) => n.entity === rel.principalEntity && n.targetEntity === rel.dependentEntity && n.isCollection
    );

    if (rel.cardinality === "ManyToMany") {
      const joinTable = `${rel.from}${rel.to}s`;
      configs.push({
        entity: rel.from,
        relationshipId: rel.id,
        code: `builder.HasMany(x => x.${rel.to}s)
            .WithMany(x => x.${rel.from}s)
            .UsingEntity(j => j.ToTable("${joinTable}"));`,
      });
      continue;
    }

    const dependentProperty = dependentNav?.property ?? rel.principalEntity;
    const principalProperty = principalNav?.property ?? `${rel.dependentEntity}s`;
    const fkProperty = `${rel.principalEntity}Id`;

    if (rel.cardinality === "OneToOne") {
      configs.push({
        entity: rel.dependentEntity,
        relationshipId: rel.id,
        code: `builder.HasOne(x => x.${dependentProperty})
            .WithOne()
            .HasForeignKey<${rel.dependentEntity}>(x => x.${fkProperty})
            .OnDelete(DeleteBehavior.${onDelete});`,
      });
      continue;
    }

    configs.push({
      entity: rel.dependentEntity,
      relationshipId: rel.id,
      code: `builder.HasOne(x => x.${dependentProperty})
            .WithMany(x => x.${principalProperty})
            .HasForeignKey(x => x.${fkProperty})
            .OnDelete(DeleteBehavior.${onDelete});`,
    });
  }

  return configs;
}

export function toDeleteBehavior(behavior: CascadeDeleteBehavior): string {
  return behavior;
}
