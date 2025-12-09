import { basename, join } from "https://deno.land/std@0.208.0/path/mod.ts";

export type JSONSchema = {
  title?: string;
  type?: string | string[];
  $ref?: string;
  allOf?: JSONSchema[];
  $defs?: Record<string, JSONSchema>;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  additionalProperties?: boolean | JSONSchema;
  description?: string;
  enum?: string[];
  pattern?: string;
};

/** Convert a dashed/underscored identifier into PascalCase. */
export function pascalCase(input: string): string {
  return input
    .replace(/[-_]+/g, " ")
    .replace(/\s+(\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** Convert identifiers into snake_case. */
export function toSnake(input: string): string {
  return input
    .replace(/-/g, "_")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

/** Normalize a $ref of form #/$defs/Name into the def key. */
export function normalizeRef(ref: string): string | undefined {
  const match = ref.match(/#\/\$defs\/(.+)$/);
  return match ? match[1] : undefined;
}

/** Merge allOf schemas, resolving nested refs for composed interfaces/structs. */
export function mergeAllOf(
  schema: JSONSchema,
  defs: Record<string, JSONSchema>,
): JSONSchema {
  if (!schema.allOf?.length) return schema;
  const merged: JSONSchema = {
    ...schema,
    allOf: undefined,
    properties: {},
    required: [],
  };
  for (const part of schema.allOf) {
    const normalized = resolveSchema(part, defs);
    merged.properties = {
      ...(merged.properties ?? {}),
      ...(normalized.properties ?? {}),
    };
    merged.required = [
      ...new Set([...(merged.required ?? []), ...(normalized.required ?? [])]),
    ];
  }
  return merged;
}

/** Resolve a schema by following refs and merging compositions. */
export function resolveSchema(
  schema: JSONSchema,
  defs: Record<string, JSONSchema>,
): JSONSchema {
  if (schema.$ref) {
    const refName = normalizeRef(schema.$ref);
    if (refName && defs[refName]) return resolveSchema(defs[refName], defs);
  }
  if (schema.allOf?.length) return mergeAllOf(schema, defs);
  return schema;
}

/**
 * Load all schemas under ./definitions and expand $defs into concrete
 * top-level schema entries to simplify code generation.
 */
export async function loadSchemas(
  definitionsDir = "./definitions",
): Promise<
  Array<{ name: string; schema: JSONSchema; defs: Record<string, JSONSchema> }>
> {
  const result: Array<
    { name: string; schema: JSONSchema; defs: Record<string, JSONSchema> }
  > = [];
  for await (const entry of Deno.readDir(definitionsDir)) {
    if (!entry.isFile || !entry.name.endsWith(".json")) continue;
    if (!entry.name.startsWith("loru-config")) continue;
    const raw = await Deno.readTextFile(join(definitionsDir, entry.name));
    const schema = JSON.parse(raw) as JSONSchema;
    const defs = schema.$defs ?? {};
    const name = pascalCase(schema.title ?? basename(entry.name, ".json"));
    result.push({ name, schema, defs });
    for (const [defName, defSchema] of Object.entries(defs)) {
      result.push({ name: pascalCase(defName), schema: defSchema, defs });
    }
  }
  return result;
}
