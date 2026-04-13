// AST extraction via Python tree-sitter subprocess
// Uses the already-installed Python tree-sitter bindings as primary method
// (native tree-sitter npm has Bun compatibility issues on Windows)

import { execSync } from 'node:child_process';
import { extname, resolve, dirname } from 'node:path';
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { GraphNode, GraphEdge, ExtractionResult } from './types';
import { getSupportedExtensions } from './grammar-registry';

const EXTRACT_SCRIPT_CONTENT = `import sys, json, os
os.environ['PYTHONUTF8'] = '1'
from pathlib import Path

# argv[1] = root directory, argv[2] = files JSON path
root_dir = sys.argv[1]
os.chdir(root_dir)

try:
    import graphify.detect as dm
    import graphify.extract as ex
except ImportError:
    print(json.dumps({"error": "graphify not installed"}))
    sys.exit(1)

# Patch extensions for unsupported languages
_EXTRA_EXTS = {'.v', '.sv', '.vhd', '.vhdl', '.hs', '.ml', '.mli', '.r', '.R'}
dm.CODE_EXTENSIONS.update(_EXTRA_EXTS)

files_path = sys.argv[2]
files = json.loads(Path(files_path).read_text(encoding='utf-8'))
files = [Path(f) for f in files]

if not files:
    print(json.dumps({"nodes": [], "edges": [], "input_tokens": 0, "output_tokens": 0}))
    sys.exit(0)

try:
    result = ex.extract(files)
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
`;

/**
 * Extract AST from code files using Python tree-sitter (subprocess).
 * @param files Absolute file paths
 * @param rootDir Root directory for resolving relative paths
 */
export function extractASTPython(files: string[], rootDir?: string): ExtractionResult {
  const filtered = files.filter(f => {
    const ext = extname(f).toLowerCase();
    return getSupportedExtensions().includes(ext);
  });

  if (filtered.length === 0) {
    return { nodes: [], edges: [], hyperedges: [], input_tokens: 0, output_tokens: 0 };
  }

  // Write both script and file list to temp files
  const tmpDir = join(tmpdir(), 'graphify-bun');
  mkdirSync(tmpDir, { recursive: true });

  const scriptPath = join(tmpDir, 'extract_runner.py');
  const filesPath = join(tmpDir, `extract_files_${Date.now()}.json`);

  writeFileSync(scriptPath, EXTRACT_SCRIPT_CONTENT, 'utf-8');
  writeFileSync(filesPath, JSON.stringify(filtered), 'utf-8');

  try {
    const result = execSync(
      `python "${scriptPath}" "${rootDir || process.cwd()}" "${filesPath}"`,
      { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, timeout: 120_000 },
    );

    // Python extract() prints progress lines — find the JSON output (last line)
    const lines = result.trim().split('\n');
    const jsonLine = lines[lines.length - 1];
    const parsed = JSON.parse(jsonLine);
    if (parsed.error) {
      console.error(`  Python extract error: ${parsed.error}`);
      return { nodes: [], edges: [], hyperedges: [], input_tokens: 0, output_tokens: 0 };
    }

    return {
      nodes: (parsed.nodes || []) as GraphNode[],
      edges: (parsed.edges || []) as GraphEdge[],
      hyperedges: (parsed.hyperedges || []) as ExtractionResult['hyperedges'],
      input_tokens: parsed.input_tokens || 0,
      output_tokens: parsed.output_tokens || 0,
    };
  } catch (err) {
    console.error(`  Python extract failed: ${(err as Error).message}`);
    return { nodes: [], edges: [], hyperedges: [], input_tokens: 0, output_tokens: 0 };
  } finally {
    try { unlinkSync(filesPath); } catch { /* ignore */ }
  }
}

/**
 * Extract AST from code files. Uses Python subprocess.
 * @param files Absolute file paths
 * @param scanRoot The root directory that was scanned (for Python CWD)
 */
export async function extractAST(files: string[], scanRoot?: string): Promise<ExtractionResult> {
  const byExt = new Map<string, string[]>();
  for (const f of files) {
    const ext = extname(f).toLowerCase();
    if (!byExt.has(ext)) byExt.set(ext, []);
    byExt.get(ext)!.push(f);
  }

  console.log(`Extracting AST from ${files.length} code files...`);
  for (const [ext, extFiles] of byExt) {
    console.log(`  ${ext}: ${extFiles.length} files`);
  }

  // The Python extract needs to run from the scan root directory
  const rootDir = scanRoot || (files.length > 0 ? dirname(files[0]) : process.cwd());

  return extractASTPython(files, rootDir);
}

export { loadLanguage, getParser } from './ast-wasm';
