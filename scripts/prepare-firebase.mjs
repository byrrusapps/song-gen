import { cpSync, mkdirSync, rmSync } from "fs";

// Clean
rmSync("public", { recursive: true, force: true });
rmSync("functions/.output", { recursive: true, force: true });

// Static assets → /public (Firebase Hosting)
cpSync(".output/public", "public", { recursive: true });

// Server output → /functions/.output/server
mkdirSync("functions/.output/server", { recursive: true });
cpSync(".output/server", "functions/.output/server", { recursive: true });