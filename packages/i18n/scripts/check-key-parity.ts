/**
 * Checks that all locale JSON files have the same key structure as en.json (the source of truth).
 * Reports missing and extra keys for each locale.
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const messagesDir = join(__dirname, "../src/messages");

interface KeyDiff {
  locale: string;
  missing: string[];
  extra: string[];
}

function getAllKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...getAllKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadJson(filename: string): Record<string, unknown> {
  const content = readFileSync(join(messagesDir, filename), "utf-8");
  return JSON.parse(content) as Record<string, unknown>;
}

function checkParity(): KeyDiff[] {
  const files = readdirSync(messagesDir).filter((f: string) =>
    f.endsWith(".json"),
  );
  const sourceFile = "en.json";

  if (!files.includes(sourceFile)) {
    console.error(`Source file ${sourceFile} not found in ${messagesDir}`);
    process.exit(1);
  }

  const sourceKeys = new Set(getAllKeys(loadJson(sourceFile)));
  const diffs: KeyDiff[] = [];

  for (const file of files) {
    if (file === sourceFile) continue;

    const locale = file.replace(".json", "");
    const localeKeys = new Set(getAllKeys(loadJson(file)));

    const missing = [...sourceKeys].filter((k) => !localeKeys.has(k));
    const extra = [...localeKeys].filter((k) => !sourceKeys.has(k));

    if (missing.length > 0 || extra.length > 0) {
      diffs.push({ locale, missing, extra });
    }
  }

  return diffs;
}

function main() {
  console.log("Checking i18n key parity against en.json...\n");

  const diffs = checkParity();

  if (diffs.length === 0) {
    console.log("All locale files have matching keys with en.json");
    process.exit(0);
  }

  let hasErrors = false;

  for (const { locale, missing, extra } of diffs) {
    if (missing.length > 0) {
      hasErrors = true;
      console.error(`[${locale}] Missing ${missing.length} keys:`);
      for (const key of missing.slice(0, 10)) {
        console.error(`  - ${key}`);
      }
      if (missing.length > 10) {
        console.error(`  ... and ${missing.length - 10} more`);
      }
      console.log();
    }

    if (extra.length > 0) {
      console.warn(`[${locale}] Extra ${extra.length} keys (not in en.json):`);
      for (const key of extra.slice(0, 10)) {
        console.warn(`  + ${key}`);
      }
      if (extra.length > 10) {
        console.warn(`  ... and ${extra.length - 10} more`);
      }
      console.log();
    }
  }

  if (hasErrors) {
    console.error(
      "\nKey parity check failed. Please add missing translations.",
    );
    process.exit(1);
  }

  console.log(
    "\nKey parity check passed (only extra keys found, which is OK).",
  );
  process.exit(0);
}

main();
