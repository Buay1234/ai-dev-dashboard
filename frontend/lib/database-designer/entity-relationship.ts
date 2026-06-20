export type RelationshipCardinality = "OneToOne" | "OneToMany" | "ManyToMany";

export type EntityRelationship = {
  id: string;
  from: string;
  to: string;
  cardinality: RelationshipCardinality;
  label: string;
  dependentEntity: string;
  principalEntity: string;
};

export type ForeignKeyDefinition = {
  entity: string;
  property: string;
  referencesEntity: string;
  referencesProperty: string;
  isRequired: boolean;
  sqlType: string;
};

export type NavigationPropertyDefinition = {
  entity: string;
  property: string;
  targetEntity: string;
  isCollection: boolean;
  inverseProperty?: string;
};

export type CascadeDeleteBehavior =
  | "Cascade"
  | "Restrict"
  | "SetNull"
  | "NoAction";

export type CascadeRuleDefinition = {
  relationshipId: string;
  from: string;
  to: string;
  onDelete: CascadeDeleteBehavior;
  reason: string;
};

export type FluentApiConfiguration = {
  entity: string;
  relationshipId: string;
  code: string;
};

export type ErDiagramNode = {
  id: string;
  label: string;
  entity: string;
};

export type ErDiagramEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
  cardinality: RelationshipCardinality;
};

export type ErDiagramJson = {
  nodes: ErDiagramNode[];
  edges: ErDiagramEdge[];
};

export type MigrationPlanStep = {
  order: number;
  action: "CreateTable" | "CreateJoinTable" | "AddForeignKey";
  entity: string;
  detail: string;
};

export type DatabaseDesignContract = {
  entities: string[];
  relationships: EntityRelationship[];
  foreignKeys: ForeignKeyDefinition[];
  navigationProperties: NavigationPropertyDefinition[];
  fluentConfigurations: FluentApiConfiguration[];
  cascadeRules: CascadeRuleDefinition[];
  erDiagram: ErDiagramJson;
  migrationPlan: MigrationPlanStep[];
  generatedAt: string;
};

export function dedupeEntityNames(names: string[]): string[] {
  return [...new Map(names.map((n) => [n, n])).values()];
}

export function relationshipId(from: string, to: string, cardinality: string): string {
  return `${from}_${to}_${cardinality}`.replace(/\s+/g, "");
}
