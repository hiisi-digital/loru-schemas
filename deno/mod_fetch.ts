import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { parse as parseToml } from "https://deno.land/std@0.208.0/toml/mod.ts";

export type SchemaKind = "plugin-metadata" | "tenant-metadata";

export interface FetchOptions {
  schema: SchemaKind;
  version?: string;
  metaFile?: string;
  cacheDir?: string;
}

const DEFAULT_VERSION = "0.1.0";
const DEFAULT_CACHE = ".loru/cache";

async function readSchemaVersion(metaPath?: string): Promise<string | undefined> {
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

export async function fetchSchema(opts: FetchOptions): Promise<string> {
  const { schema } = opts;
  const version = opts.version ?? (await readSchemaVersion(opts.metaFile)) ?? DEFAULT_VERSION;
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE;

  const targetDir = join(cacheDir, version);
  await Deno.mkdir(targetDir, { recursive: true });
  const targetPath = join(targetDir, `${schema}.json`);
  if (await fileExists(targetPath)) return targetPath;

  const tagUrl = `https://raw.githubusercontent.com/hiisi-digital/loru-schemas/v${version}/definitions/${schema}.json`;
  const mainUrl = `https://raw.githubusercontent.com/hiisi-digital/loru-schemas/main/definitions/${schema}.json`;

  for (const url of [tagUrl, mainUrl]) {
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      await Deno.writeTextFile(targetPath, text);
      return targetPath;
    }
  }

  throw new Error(`Failed to fetch schema ${schema} (version ${version})`);
}
