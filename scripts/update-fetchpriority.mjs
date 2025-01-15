import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.cwd(), "dist");
const indexFile = path.join(distDir, "index.html");

try {
  if (!fs.existsSync(indexFile)) {
    console.warn("[fetchpriority] dist/index.html not found; skipping.");
    process.exit(0);
  }

  let html = fs.readFileSync(indexFile, "utf8");

  // Find first <link rel="stylesheet" ...>
  const rels = ["rel=\"stylesheet\"", "rel='stylesheet'"];
  let pos = -1;
  for (const needle of rels) {
    pos = html.indexOf(needle);
    if (pos !== -1) break;
  }

  if (pos === -1) {
    console.warn("[fetchpriority] No stylesheet link found in index.html; nothing to do.");
    process.exit(0);
  }

  const linkStart = html.lastIndexOf("<link", pos);
  const linkEnd = html.indexOf(">", pos);

  if (linkStart === -1 || linkEnd === -1) {
    console.warn("[fetchpriority] Could not isolate stylesheet link tag; skipping.");
    process.exit(0);
  }

  const tag = html.slice(linkStart, linkEnd + 1);

  if (/\bfetchpriority\s*=/.test(tag)) {
    console.log("[fetchpriority] Stylesheet already has fetchpriority; skipping.");
    process.exit(0);
  }

  const newTag = tag.replace("<link ", "<link fetchpriority=\"high\" ");
  html = html.slice(0, linkStart) + newTag + html.slice(linkEnd + 1);

  fs.writeFileSync(indexFile, html);
  console.log("[fetchpriority] Added fetchpriority=\"high\" to main stylesheet link.");
} catch (err) {
  console.error("[fetchpriority] Error:", err);
  process.exitCode = 1;
}







