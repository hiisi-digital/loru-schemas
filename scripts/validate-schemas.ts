import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

const DEFINITIONS_DIR = "./definitions";

async function main() {
  for await (const entry of Deno.readDir(DEFINITIONS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".json")) continue;
    const path = join(DEFINITIONS_DIR, entry.name);
    const raw = await Deno.readTextFile(path);
    try {
      const parsed = JSON.parse(raw);
      if (parsed.type !== "object") {
        throw new Error("Root schema must be an object");
      }
    } catch (err) {
      console.error(`Schema validation failed for ${path}:`, err.message);
      Deno.exit(1);
    }
  }
  console.log("✓ Schemas parsed");
}

await main();
