import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { parse as parseToml } from "https://deno.land/std@0.208.0/toml/mod.ts";
export type SchemaKind = "loru-config";

export interface FetchOptions {
  schema: SchemaKind;
  version?: string;
  metaFile?: string;
  cacheDir?: string;
}

const DEFAULT_VERSION = "0.3.3";
const DEFAULT_CACHE = ".loru/cache/schemas";

async function readSchemaVersion(
  metaPath?: string,
): Promise<string | undefined> {
  if (!metaPath) return undefined;
  try {
    const text = await Deno.readTextFile(metaPath);
    const parsed = parseToml(text) as Record<string, unknown>;
    const direct = parsed["schema_version"];
    if (typeof direct === "string") return direct;
    const meta = parsed["meta"];
    if (meta && typeof meta === "object" && !Array.isArray(meta)) {
      const nested = (meta as Record<string, unknown>)["schema_version"];
      if (typeof nested === "string") return nested;
    }
    return undefined;
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
  const version = opts.version ?? (await readSchemaVersion(opts.metaFile)) ??
    DEFAULT_VERSION;
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE;

  const targetDir = join(cacheDir, version);
  await Deno.mkdir(targetDir, { recursive: true });
  const targetPath = join(targetDir, `${schema}.json`);
  if (await fileExists(targetPath)) return targetPath;

  const urls = [
    `https://raw.githubusercontent.com/hiisi-digital/loru-schemas/v${version}/definitions/${schema}.json`,
    `https://raw.githubusercontent.com/hiisi-digital/loru-schemas/main/definitions/${schema}.json`,
  ];

  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok) continue;
    const text = await res.text();
    await Deno.writeTextFile(targetPath, text);
    return targetPath;
  }

  throw new Error(`Failed to fetch schema ${schema} (version ${version})`);
}
