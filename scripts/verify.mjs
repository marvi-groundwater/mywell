// Post-build sanity: fail the deploy rather than publish a broken page.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "_site");
const errors = [];

const html = readFileSync(join(OUT, "index.html"), "utf8");

// 1. Every template slot was filled.
const unfilled = [...html.matchAll(/@@([A-Z_]+)@@/g)].map((m) => m[1]);
if (unfilled.length) errors.push(`unfilled slots: ${[...new Set(unfilled)].join(", ")}`);

// 2. Every local asset the page references exists in the build.
for (const m of html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)) {
  if (!existsSync(join(OUT, m[1]))) errors.push(`missing asset: ${m[1]}`);
}

// 3. The app links point somewhere real (an https origin), not at a relative
//    path that would 404 on GitHub Pages.
if (!/href="https:\/\/[^"]+\/login"/.test(html)) errors.push("no absolute app /login link");

// 4. The CMS is present and pointed at this repo.
const cms = join(OUT, "admin");
for (const f of ["index.html", "config.yml", "sveltia-cms.js"]) {
  if (!existsSync(join(cms, f))) errors.push(`missing admin/${f}`);
}
if (existsSync(join(cms, "config.yml"))) {
  const cfg = readFileSync(join(cms, "config.yml"), "utf8");
  if (!cfg.includes("repo: marvi-groundwater/mywell")) errors.push("admin/config.yml points at the wrong repo");
}

// 5. The content the CMS edits ships with the site (Sveltia previews read it).
if (!existsSync(join(OUT, "content/landing.json"))) errors.push("missing content/landing.json");

if (errors.length) {
  console.error("verify FAILED:");
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log("verify OK");
