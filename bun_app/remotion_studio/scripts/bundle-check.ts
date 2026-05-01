import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const MAX_TOTAL_KB = 600;
const distDir = join(import.meta.dir, "..", "dist", "client", "assets");

let files: string[];
try {
  files = readdirSync(distDir).filter(f => f.endsWith(".js"));
} catch {
  console.error("Bundle check: dist/client/assets/ not found. Run `vite build` first.");
  process.exit(1);
}

type Chunk = { name: string; kb: number };
const chunks: Chunk[] = files.map(f => ({
  name: f,
  kb: Math.round(statSync(join(distDir, f)).size / 1024),
}));

chunks.sort((a, b) => b.kb - a.kb);
const total = chunks.reduce((s, c) => s + c.kb, 0);

console.log("\nBundle chunks (sorted by size):");
for (const c of chunks) {
  const bar = "█".repeat(Math.ceil(c.kb / 10));
  console.log(`  ${c.name.padEnd(45)} ${String(c.kb).padStart(4)} KB  ${bar}`);
}
console.log(`  ${"".padEnd(45)} ${String(total).padStart(4)} KB  total (${chunks.length} chunks)\n`);

if (total > MAX_TOTAL_KB) {
  console.error(`FAIL: Total bundle size ${total}KB exceeds limit ${MAX_TOTAL_KB}KB`);
  process.exit(1);
}
console.log(`OK: Total bundle size ${total}KB within limit ${MAX_TOTAL_KB}KB`);
