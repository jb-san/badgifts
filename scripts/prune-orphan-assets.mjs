import { readdirSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const client = join(process.cwd(), "dist/client");
const astroDir = join(client, "_astro");

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

const referenced = new Set();
for (const file of walk(client)) {
  if (!/\.(html|css|js|mjs|svg|txt|xml)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(/\/_astro\/([^"'()\s]+)/g)) {
    referenced.add(match[1]);
  }
}

const removed = [];
for (const file of readdirSync(astroDir)) {
  if (referenced.has(file)) continue;
  unlinkSync(join(astroDir, file));
  removed.push(file);
}

if (removed.length) {
  console.log(`Removed ${removed.length} unreferenced asset(s): ${removed.join(", ")}`);
} else {
  console.log("No unreferenced assets.");
}
