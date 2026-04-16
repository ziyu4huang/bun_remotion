import { cpSync, mkdirSync, rmSync } from "fs";
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

// 2. Compile ACP demo binary
console.log("[2/3] Compiling ACP demo binary...");
execSync(
  `bun build ${join(APP, "src/demo.ts")} --outfile ${join(DIST, "demo")} --compile --target bun --minify`,
  { stdio: "inherit" }
);

// 3. Copy pi-coding-agent assets for interactive CLI mode
// (package.json is no longer needed — binary creates it on startup via ensurePackageJson)
console.log("[3/3] Copying pi-coding-agent assets (for interactive CLI mode)...");
cpSync(join(PKG_AGENT, "dist", "modes", "interactive", "theme"), join(DIST, "theme"), { recursive: true });
cpSync(join(PKG_AGENT, "dist", "modes", "interactive", "assets"), join(DIST, "assets"), { recursive: true });
cpSync(join(PKG_AGENT, "dist", "core", "export-html"), join(DIST, "export-html"), { recursive: true });

console.log("\nDone! Binaries at: dist/agent-cli, dist/demo");
console.log("  agent-cli: Self-contained server+CLI (needs only bun runtime)");
console.log("  demo:      ACP endpoint demo client");
console.log("  Optional assets: dist/theme/, dist/assets/, dist/export-html/ (for interactive CLI mode)");
