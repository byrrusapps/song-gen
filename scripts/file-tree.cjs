#!/usr/bin/env node
/**
 * dump-tree.js
 * Dumps a project's folder tree into a single markdown file.
 *
 * Usage:
 *   node scripts/dump-tree.js [rootDir] [outputFile]
 *
 * Config (edit below or override via CLI flags):
 *   --ext=.ts,.tsx,.js,.jsx,.json,.md   (whitelist extensions; empty = all)
 *   --no-gitignore                      (don't parse .gitignore)
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
const OUT = path.resolve(positional[1] || "project_tree.md");
const USE_GITIGNORE = flags.gitignore !== false && !flags["no-gitignore"];
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
];

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
  
  // Skip hard ignores AND any environment files (e.g., .env, .env.local)
  if (parts.some((part) => HARD_IGNORE.includes(part) || part.startsWith(".envs"))) {
    return true;
  }
  
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

  let md = `# Project tree: ${path.basename(ROOT)}\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `## File tree\n\n\`\`\`\n${path.basename(ROOT)}/\n${buildTree(includedFiles)}\`\`\`\n\n`;

  fs.writeFileSync(OUT, md, "utf8");
  console.log(`Wrote tree containing ${includedFiles.length} files to ${OUT}`);
}

main();