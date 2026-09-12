#!/usr/bin/env node
/**
 * dump-context.js
 * Dumps a project's folder tree + file contents into a single markdown file,
 * suitable for pasting into an LLM prompt.
 *
 * Usage:
 *   node scripts/dump-context.js [rootDir] [outputFile]
 *
 * Config (edit below or override via CLI flags):
 *   --ext=.ts,.tsx,.js,.jsx,.json,.md   (whitelist extensions; empty = all)
 *   --max-size=200000                  (skip files bigger than this, in bytes)
 *   --no-gitignore                     (don't parse .gitignore)
 *
 * Add to package.json:
 *   "scripts": { "dump-context": "node scripts/dump-context.js" }
 */

const fs = require("fs");
const path = require("path");

// ---------- config ----------
const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? true];
    })
);
const positional = args.filter((a) => !a.startsWith("--"));

const ROOT = path.resolve(positional[0] || ".");
const OUT = path.resolve(positional[1] || "project_dump.md");
const USE_GITIGNORE = flags.gitignore !== false && !flags["no-gitignore"];
const MAX_SIZE = flags["max-size"] ? parseInt(flags["max-size"], 10) : 300_000;
const EXT_WHITELIST = flags.ext
  ? flags.ext.split(",").map((e) => e.trim())
  : []; // empty = allow all extensions

// always-skip directories/files regardless of .gitignore
const HARD_IGNORE = [
  "node_modules",
  ".git",
  ".firebase",
  ".vscode",
  "dist",
  "build",
  ".next",
  ".output",
  ".vercel",
  "coverage",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "serverLibs",
  "lib",
  ".env",
  "config",
  "global",
  "material.ts",
  "index.css",
  "device",
  "navigation",
  "pagination",
  "drawer",
  "scripts",
  "apphosting.yaml",
  ".gitignore",
  ".firebaserc",
  " vite.config.ts",
  "tsconfig.node.json",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.server.json",
  "vite-env.d.ts",
  "layout",
  "material",
  "server",
  "server.ts",
  "vite.config.ts",
  "material-web.d.ts",
  "firebase.json",
  "auth",

];

// files that never make sense to dump as "content" (binary-ish)
const BINARY_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".eot",
  ".mp4", ".mov", ".zip", ".pdf", ".lock",
]);

// ---------- gitignore parsing (minimal glob support) ----------
function loadGitignore(root) {
  const gitignorePath = path.join(root, ".gitignore");
  if (!USE_GITIGNORE || !fs.existsSync(gitignorePath)) return [];
  return fs
    .readFileSync(gitignorePath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((pattern) => {
      let p = pattern.replace(/^\/+/, "").replace(/\/+$/, "");
      const regexStr =
        "^" +
        p
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replace(/\*\*/g, "§DOUBLESTAR§")
          .replace(/\*/g, "[^/]*")
          .replace(/§DOUBLESTAR§/g, ".*")
          .replace(/\?/g, ".") +
        "($|/)";
      return new RegExp(regexStr);
    });
}

function isIgnored(relPath, gitignoreRules) {
  const parts = relPath.split(path.sep);
  if (parts.some((part) => HARD_IGNORE.includes(part))) return true;
  return gitignoreRules.some((re) => re.test(relPath));
}

// ---------- walk ----------
function walk(dir, root, gitignoreRules, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (isIgnored(rel, gitignoreRules)) continue;

    if (entry.isDirectory()) {
      walk(full, root, gitignoreRules, results);
    } else {
      results.push(rel);
    }
  }
  return results;
}

// ---------- tree rendering ----------
function buildTree(files) {
  const treeRoot = {};
  for (const file of files) {
    const parts = file.split(path.sep);
    let node = treeRoot;
    for (const part of parts) {
      node[part] = node[part] || {};
      node = node[part];
    }
  }

  function render(node, prefix = "") {
    const keys = Object.keys(node).sort((a, b) => {
      const aIsDir = Object.keys(node[a]).length > 0;
      const bIsDir = Object.keys(node[b]).length > 0;
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a.localeCompare(b);
    });
    let out = "";
    keys.forEach((key, i) => {
      const isLast = i === keys.length - 1;
      const connector = isLast ? "└── " : "├── ";
      out += `${prefix}${connector}${key}\n`;
      const childPrefix = prefix + (isLast ? "    " : "│   ");
      if (Object.keys(node[key]).length > 0) {
        out += render(node[key], childPrefix);
      }
    });
    return out;
  }

  return render(treeRoot);
}

// ---------- main ----------
function main() {
  if (!fs.existsSync(ROOT)) {
    console.error(`Root path does not exist: ${ROOT}`);
    process.exit(1);
  }

  const gitignoreRules = loadGitignore(ROOT);
  const allFiles = walk(ROOT, ROOT, gitignoreRules);

  const includedFiles = allFiles.filter((rel) => {
    const ext = path.extname(rel);
    if (EXT_WHITELIST.length && !EXT_WHITELIST.includes(ext)) return false;
    return true;
  });

  let md = `# Project dump: ${path.basename(ROOT)}\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `## File tree\n\n\`\`\`\n${path.basename(ROOT)}/\n${buildTree(includedFiles)}\`\`\`\n\n`;
  md += `## File contents\n\n`;

  let skipped = [];

  for (const rel of includedFiles) {
    const full = path.join(ROOT, rel);
    const ext = path.extname(rel);
    const stat = fs.statSync(full);

    if (BINARY_EXT.has(ext)) {
      skipped.push(`${rel} (binary)`);
      continue;
    }
    if (stat.size > MAX_SIZE) {
      skipped.push(`${rel} (${stat.size} bytes, exceeds max-size)`);
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(full, "utf8");
    } catch {
      skipped.push(`${rel} (unreadable)`);
      continue;
    }

    const lang = ext.replace(".", "") || "";
    md += `### ${rel}\n\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
  }

  if (skipped.length) {
    md += `## Skipped files\n\n`;
    skipped.forEach((s) => (md += `- ${s}\n`));
  }

  fs.writeFileSync(OUT, md, "utf8");
  console.log(`Wrote ${includedFiles.length - skipped.length} files (${skipped.length} skipped) to ${OUT}`);
}

main();