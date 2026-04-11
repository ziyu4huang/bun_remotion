import { cpSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";

const ROOT = import.meta.dir;
const APP = dirname(ROOT);
const DIST = join(APP, "dist");
const PKG_AGENT = join(APP, "node_modules", "@mariozechner", "pi-coding-agent");

// Clean dist
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// 1. Compile standalone binary
console.log("[1/3] Compiling standalone binary...");
execSync(
  `bun build ${join(APP, "src/index.ts")} --outfile ${join(DIST, "agent-cli")} --compile --target bun --minify`,
  { stdio: "inherit" }
);

// 2. Copy pi-coding-agent assets expected next to the binary
console.log("[2/3] Copying pi-coding-agent assets...");
cpSync(join(PKG_AGENT, "dist", "modes", "interactive", "theme"), join(DIST, "theme"), { recursive: true });
cpSync(join(PKG_AGENT, "dist", "modes", "interactive", "assets"), join(DIST, "assets"), { recursive: true });
cpSync(join(PKG_AGENT, "dist", "core", "export-html"), join(DIST, "export-html"), { recursive: true });

// 3. Write a minimal package.json (pi-coding-agent reads it for piConfig)
console.log("[3/3] Writing dist/package.json...");
writeFileSync(join(DIST, "package.json"), JSON.stringify({
  name: "bun-pi-agent",
  version: "0.1.0",
  private: true,
}, null, 2));

console.log("\nDone! Binary at: dist/agent-cli");
