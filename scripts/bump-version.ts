#!/usr/bin/env -S deno run -A
/**
 * Bumps the version in deno.json.
 *
 * Usage:
 *   deno run -A scripts/bump-version.ts --level=patch|minor|major
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";

type Level = "patch" | "minor" | "major";

function bumpVersion(current: string, level: Level): string {
  const [maj, min, pat] = current.split(".").map((n) => parseInt(n, 10));
  if ([maj, min, pat].some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid version: ${current}`);
  }
  switch (level) {
    case "patch":
      return `${maj}.${min}.${pat + 1}`;
    case "minor":
      return `${maj}.${min + 1}.0`;
    case "major":
      return `${maj + 1}.0.0`;
  }
}

async function main() {
  const args = parse(Deno.args);
  const level = args.level as Level | undefined;
  if (!level || !["patch", "minor", "major"].includes(level)) {
    console.error("Usage: deno run -A scripts/bump-version.ts --level=patch|minor|major");
    Deno.exit(1);
  }

  const raw = await Deno.readTextFile("deno.json");
  const json = JSON.parse(raw) as { version?: string };
  const current = json.version ?? "0.0.0";
  const next = bumpVersion(current, level);

  json.version = next;
  await Deno.writeTextFile("deno.json", JSON.stringify(json, null, 2) + "\n");
  console.log(next);
}

if (import.meta.main) {
  await main();
}
