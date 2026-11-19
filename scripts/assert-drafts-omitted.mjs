import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist/client");
const banned = [
  "example-screaming-pickle",
  "example-desk-putter",
  "example-overconfident-socks",
  "EXAMPLE:",
  "EXAMPLE",
  "example.com/affiliate",
  "Dev preview:",
];
const bannedLdKeys = new Set([
  "aggregateRating",
  "review",
  "reviewRating",
  "ratingValue",
  "offers",
  "price",
  "priceCurrency",
  "lowPrice",
  "highPrice",
]);

function walk(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

function walkKeys(value, report) {
  if (Array.isArray(value)) {
    for (const item of value) walkKeys(item, report);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (bannedLdKeys.has(key)) report.push(key);
    walkKeys(child, report);
  }
}

const problems = [];
const files = walk(dist);
const textFiles = files.filter((file) => /\.(html|xml|txt|js|mjs|css|svg)$/.test(file));

for (const file of textFiles) {
  const text = readFileSync(file, "utf8");
  for (const needle of banned) {
    if (text.includes(needle)) problems.push(`${file} contains ${JSON.stringify(needle)}`);
  }
  const blocks = text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block[1]);
    } catch {
      problems.push(`${file} has JSON-LD that did not parse`);
      continue;
    }
    const badKeys = [];
    walkKeys(data, badKeys);
    for (const key of badKeys) problems.push(`${file} JSON-LD includes ${key}`);
  }
}

const home = join(dist, "index.html");
if (!existsSync(home)) problems.push("missing dist/index.html");
else {
  const html = readFileSync(home, "utf8");
  for (const needle of ['rel="canonical"', "og:title", "og:description", "og:image", "application/ld+json"]) {
    if (!html.includes(needle)) problems.push(`homepage missing ${needle}`);
  }
  for (const match of html.matchAll(/<script\b([^>]*)>/g)) {
    const attrs = match[1] ?? "";
    if (!attrs.includes("application/ld+json")) problems.push(`homepage has a client script: ${attrs}`);
  }
}

for (const page of ["about/index.html", "disclosure/index.html", "tags/index.html", "404.html", "robots.txt"]) {
  if (!existsSync(join(dist, page))) problems.push(`missing dist/${page}`);
}

if (!files.some((file) => file.endsWith("sitemap-index.xml"))) {
  problems.push("missing sitemap-index.xml");
}

const tagsDir = join(dist, "tags");
if (existsSync(tagsDir)) {
  for (const entry of readdirSync(tagsDir)) {
    const path = join(tagsDir, entry);
    if (entry !== "index.html" && statSync(path).isDirectory()) {
      problems.push(`draft tag page was built: tags/${entry}`);
    }
  }
}

if (existsSync(join(dist, "gifts"))) problems.push("dist/gifts should not exist while every gift is a draft");

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(`Production draft check passed (${textFiles.length} text files).`);
