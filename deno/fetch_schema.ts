#!/usr/bin/env -S deno run -A
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { parse as parseToml } from "https://deno.land/std@0.208.0/toml/mod.ts";

type SchemaKind = "plugin-metadata" | "tenant-metadata";

interface Args {
  schema: SchemaKind;
  version?: string;
  metaFile?: string;
  cacheDir?: string;
}

const DEFAULT_VERSION = "0.1.0";
const DEFAULT_CACHE = ".loru/cache";

function parseArgs(): Args {
  const flags = new Map<string, string>();
  for (const arg of Deno.args) {
    const [k, v] = arg.split("=");
    if (v !== undefined) flags.set(k.replace(/^--/, ""), v);
  }
  const schema = flags.get("schema") as SchemaKind | undefined;
  if (!schema || !["plugin-metadata", "tenant-metadata"].includes(schema)) {
    console.error(
      "Usage: deno run -A fetch_schema.ts --schema=plugin-metadata|tenant-metadata [--version=x.y.z] [--meta-file=plugin.toml] [--cache-dir=.loru/cache]",
    );
    Deno.exit(1);
  }
  return {
    schema,
    version: flags.get("version"),
    metaFile: flags.get("meta-file"),
    cacheDir: flags.get("cache-dir"),
  };
}

async function readSchemaVersion(
  metaPath?: string,
): Promise<string | undefined> {
  if (!metaPath) return undefined;
  try {
    const text = await Deno.readTextFile(metaPath);
    const parsed = parseToml(text) as Record<string, unknown>;
    const version = parsed["schema_version"];
    return typeof version === "string" ? version : undefined;
  } catch {
    return undefined;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchSchema(
  schema: SchemaKind,
  version: string,
  cacheDir: string,
): Promise<string> {
  const targetDir = join(cacheDir, version);
  await Deno.mkdir(targetDir, { recursive: true });
  const targetPath = join(targetDir, `${schema}.json`);
  if (await fileExists(targetPath)) return targetPath;

  const tagUrl =
    `https://raw.githubusercontent.com/hiisi-digital/loru-schemas/v${version}/definitions/${schema}.json`;
  const mainUrl =
    `https://raw.githubusercontent.com/hiisi-digital/loru-schemas/main/definitions/${schema}.json`;

  for (const url of [tagUrl, mainUrl]) {
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      await Deno.writeTextFile(targetPath, text);
      console.log(`✓ cached ${schema} schema (${version}) at ${targetPath}`);
      return targetPath;
    }
  }

  throw new Error(`Failed to fetch schema ${schema} (version ${version})`);
}

async function main() {
  const args = parseArgs();
  const metaPath = args.metaFile;
  const version = args.version ?? (await readSchemaVersion(metaPath)) ??
    DEFAULT_VERSION;
  const cacheDir = args.cacheDir ?? DEFAULT_CACHE;
  const path = await fetchSchema(args.schema, version, cacheDir);
  console.log(path);
}

if (import.meta.main) {
  await main();
}
