import type { EntityDefinition, EntityField } from "./types";

const SQL_TO_CSHARP: Record<string, string> = {
  int: "int",
  bigint: "long",
  bit: "bool",
  decimal: "decimal",
  float: "double",
  datetime: "DateTime",
  datetime2: "DateTime",
  date: "DateTime",
  uniqueidentifier: "Guid",
  nvarchar: "string",
  varchar: "string",
  text: "string",
};

function toPascalCase(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toSingular(name: string): string {
  if (name.endsWith("ies")) return name.slice(0, -3) + "y";
  if (name.endsWith("ses")) return name.slice(0, -2);
  if (name.endsWith("s") && name.length > 3) return name.slice(0, -1);
  return name;
}

function defaultFields(entityName: string): EntityField[] {
  return [
    {
      name: "Id",
      csharpType: "int",
      sqlType: "INT IDENTITY(1,1) PRIMARY KEY",
      isRequired: true,
      isKey: true,
    },
    {
      name: "Name",
      csharpType: "string",
      sqlType: "NVARCHAR(200) NOT NULL",
      isRequired: true,
      isKey: false,
    },
    {
      name: "Description",
      csharpType: "string?",
      sqlType: "NVARCHAR(MAX) NULL",
      isRequired: false,
      isKey: false,
    },
    {
      name: "CreatedAt",
      csharpType: "DateTime",
      sqlType: "DATETIME2 NOT NULL DEFAULT GETUTCDATE()",
      isRequired: true,
      isKey: false,
    },
    {
      name: "UpdatedAt",
      csharpType: "DateTime?",
      sqlType: "DATETIME2 NULL",
      isRequired: false,
      isKey: false,
    },
  ];
}

const RESERVED_ENTITY_NAMES = new Set([
  "System", "Task", "Object", "String", "Guid", "Type", "Enum", "Void",
  "Int32", "Boolean", "DateTime", "Exception", "Action", "Func", "Thread",
  "Timer", "Math", "Console", "Convert", "Char", "Byte", "Int16", "Int64",
  "Single", "Double", "Decimal", "Array", "EventArgs",
]);

function sanitizeEntityName(name: string): string {
  if (RESERVED_ENTITY_NAMES.has(name) && !name.endsWith("Entity")) {
    return `${name}Entity`;
  }
  return name;
}

function entityFromName(name: string): EntityDefinition {
  const pascal = sanitizeEntityName(toPascalCase(toSingular(name)));
  return {
    name: pascal,
    tableName: pascal.endsWith("s") ? pascal : `${pascal}s`,
    fields: defaultFields(pascal),
  };
}

function parseCreateTableBlocks(sql: string): EntityDefinition[] {
  const entities: EntityDefinition[] = [];
  const regex = /CREATE\s+TABLE\s+(?:\[?(\w+)\]?\.?)?\[?(\w+)\]?\s*\(([\s\S]*?)\);/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sql)) !== null) {
    const tableName = match[2];
    const body = match[3];
    const fields: EntityField[] = [];

    for (const line of body.split("\n")) {
      const trimmed = line.trim().replace(/,$/, "");
      if (!trimmed || /^CONSTRAINT|^PRIMARY KEY|^FOREIGN KEY|^UNIQUE/i.test(trimmed)) {
        continue;
      }

      const colMatch = trimmed.match(
        /^(\w+)\s+(\w+(?:\(\d+(?:,\d+)?\))?)\s*(.*)$/i
      );
      if (!colMatch) continue;

      const colName = toPascalCase(colMatch[1]);
      const rawType = colMatch[2].toLowerCase();
      const baseType = rawType.replace(/\(\d+(?:,\d+)?\)/, "");
      const flags = colMatch[3].toUpperCase();
      const isKey = /PRIMARY KEY|IDENTITY/.test(flags);
      const isRequired = !/NULL/.test(flags) || /NOT NULL/.test(flags);
      const csharpType =
        baseType === "nvarchar" || baseType === "varchar"
          ? isRequired
            ? "string"
            : "string?"
          : SQL_TO_CSHARP[baseType] ?? "string";

      fields.push({
        name: colName,
        csharpType,
        sqlType: `${colMatch[2].toUpperCase()}${flags.includes("NOT NULL") ? " NOT NULL" : " NULL"}`,
        isRequired,
        isKey,
      });
    }

    if (fields.length === 0) continue;

    if (!fields.some((f) => f.isKey)) {
      fields.unshift({
        name: "Id",
        csharpType: "int",
        sqlType: "INT IDENTITY(1,1) PRIMARY KEY",
        isRequired: true,
        isKey: true,
      });
    }

    const entityName = toPascalCase(toSingular(tableName));
    entities.push({ name: entityName, tableName, fields });
  }

  return entities;
}

function parseRobinEntityNames(robin: string): string[] {
  const names = new Set<string>();

  const sectionMatch = robin.match(
    /(?:^|\n)#+\s*(?:Entities|Domain Model|Modules|Data Model)[^\n]*\n([\s\S]*?)(?=\n#+\s|$)/i
  );
  const block = sectionMatch?.[1] ?? robin;

  const patterns = [
    /(?:^|\n)\s*[-*•]\s*\*?\*?([A-Z][a-zA-Z0-9]+)\*?\*?/gm,
    /(?:Entity|Module|Table):\s*([A-Z][a-zA-Z0-9]+)/gi,
    /\|\s*([A-Z][a-zA-Z0-9]+)\s*\|/g,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(block)) !== null) {
      const name = m[1].trim();
      if (name.length > 2 && !/^(The|And|For|Api|Crud)$/i.test(name)) {
        names.add(name);
      }
    }
  }

  return [...names].slice(0, 8);
}

function inferFromRequirement(requirement: string): string[] {
  const words = requirement.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g) ?? [];
  const nouns = requirement.match(/\b(user|order|product|customer|task|project|invoice|payment|employee|department|category|item|booking|reservation|student|course|patient|appointment)s?\b/gi) ?? [];
  const combined = [...words, ...nouns.map((n) => toPascalCase(n))];
  const unique = [...new Set(combined.map(toPascalCase))].filter(
    (n) => n.length > 2
  );
  return unique.slice(0, 5);
}

export function extractEntities(
  robin: string,
  zoro: string,
  requirement: string
): EntityDefinition[] {
  const fromSql = parseCreateTableBlocks(zoro);
  if (fromSql.length > 0) return fromSql;

  const robinNames = parseRobinEntityNames(robin);
  if (robinNames.length > 0) {
    return robinNames.map(entityFromName);
  }

  const inferred = inferFromRequirement(requirement);
  if (inferred.length > 0) {
    return inferred.map(entityFromName);
  }

  return [entityFromName("ProjectTask")];
}

export { toPascalCase };
