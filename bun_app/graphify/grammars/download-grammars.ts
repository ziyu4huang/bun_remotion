// Download tree-sitter WASM grammar files from npm packages or GitHub releases.
// Usage: bun run grammars/download-grammars.ts

import { existsSync } from 'node:fs';
import { mkdir, copyFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { $ } from 'bun';

const GRAMMARS_DIR = resolve(import.meta.dir);

// Grammar -> npm package mapping
const NPM_GRAMMARS: Record<string, string> = {
  'tree-sitter-typescript.wasm': 'tree-sitter-typescript',
  'tree-sitter-tsx.wasm': 'tree-sitter-tsx',
  'tree-sitter-javascript.wasm': 'tree-sitter-javascript',
  'tree-sitter-python.wasm': 'tree-sitter-python',
  'tree-sitter-go.wasm': 'tree-sitter-go',
  'tree-sitter-rust.wasm': 'tree-sitter-rust',
  'tree-sitter-java.wasm': 'tree-sitter-java',
  'tree-sitter-c.wasm': 'tree-sitter-c',
  'tree-sitter-cpp.wasm': 'tree-sitter-cpp',
  'tree-sitter-c_sharp.wasm': 'tree-sitter-c-sharp',
  'tree-sitter-ruby.wasm': 'tree-sitter-ruby',
  'tree-sitter-swift.wasm': 'tree-sitter-swift',
  'tree-sitter-kotlin.wasm': 'tree-sitter-kotlin',
  'tree-sitter-php.wasm': 'tree-sitter-php',
  'tree-sitter-lua.wasm': 'tree-sitter-lua',
  'tree-sitter-julia.wasm': 'tree-sitter-julia',
  'tree-sitter-scala.wasm': 'tree-sitter-scala',
  'tree-sitter-zig.wasm': 'tree-sitter-zig',
  'tree-sitter-elixir.wasm': 'tree-sitter-elixir',
  'tree-sitter-objc.wasm': 'tree-sitter-objc',
  'tree-sitter-powershell.wasm': 'tree-sitter-powershell',
  'tree-sitter-verilog.wasm': 'tree-sitter-verilog',
};

// WASM file names that might exist inside npm packages
const WASM_CANDIDATES = [
  'tree-sitter.wasm',
  // Some packages use the language name
];

async function findWasmInDir(dir: string): Promise<string | null> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.wasm')) {
        return join(dir, entry.name);
      }
      if (entry.isDirectory()) {
        const found = await findWasmInDir(join(dir, entry.name));
        if (found) return found;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function downloadGrammar(wasmName: string, npmPackage: string): Promise<boolean> {
  const targetPath = join(GRAMMARS_DIR, wasmName);

  if (existsSync(targetPath)) {
    console.log(`  ✓ ${wasmName} (already exists)`);
    return true;
  }

  console.log(`  Installing ${npmPackage} to find WASM...`);

  // Install the npm package to a temp location
  const tmpDir = join(GRAMMARS_DIR, '.tmp-' + npmPackage);
  await mkdir(tmpDir, { recursive: true });

  try {
    await $`bun add --cwd ${tmpDir} ${npmPackage}@latest`.quiet();

    // Search for .wasm files in the installed package
    const wasmPath = await findWasmInDir(join(tmpDir, 'node_modules', npmPackage));

    if (wasmPath) {
      await copyFile(wasmPath, targetPath);
      console.log(`  ✓ ${wasmName} (from ${wasmPath})`);
      return true;
    }

    // Also check for .wasm in any subdirectory
    console.log(`  ✗ ${wasmName} — no .wasm found in ${npmPackage}`);
    return false;
  } catch (err) {
    console.log(`  ✗ ${wasmName} — error: ${(err as Error).message}`);
    return false;
  } finally {
    // Cleanup temp dir
    try {
      await $`rm -rf ${tmpDir}`.quiet();
    } catch {
      // ignore
    }
  }
}

async function main() {
  console.log('Downloading tree-sitter WASM grammars...\n');
  await mkdir(GRAMMARS_DIR, { recursive: true });

  let success = 0;
  let failed = 0;

  for (const [wasmName, npmPackage] of Object.entries(NPM_GRAMMARS)) {
    const ok = await downloadGrammar(wasmName, npmPackage);
    if (ok) success++;
    else failed++;
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed`);

  if (failed > 0) {
    console.log('\nFor failed grammars, you can:');
    console.log('  1. Build from source: tree-sitter build --wasm <grammar-dir>');
    console.log('  2. Download from GitHub releases');
    console.log('  3. Use Python subprocess fallback (automatic)');
  }
}

main().catch(console.error);
