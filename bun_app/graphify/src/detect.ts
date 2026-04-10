// File detection and classification
// Walks filesystem, classifies files by extension, respects .graphifyignore

import { readdir, stat, readFile } from 'node:fs/promises';
import { join, relative, resolve, extname, basename } from 'node:path';
import type { FileType, DetectResult } from './types';
import { loadIgnoreFile, isIgnored } from './utils/ignore';

// Extension sets — matches Python graphify.detect constants
const CODE_EXTENSIONS = new Set([
  '.c', '.cc', '.cpp', '.cs', '.cxx', '.ex', '.exs', '.go', '.h', '.hpp',
  '.java', '.jl', '.js', '.jsx', '.kt', '.kts', '.lua', '.m', '.mm',
  '.php', '.ps1', '.py', '.rb', '.rs', '.scala', '.swift', '.toc', '.ts',
  '.tsx', '.zig',
  // Extra languages not in Python built-in
  '.v', '.sv', '.vhd', '.vhdl',  // Verilog / SystemVerilog / VHDL
  '.hs',                          // Haskell
  '.ml', '.mli',                  // OCaml
  '.r', '.R',                     // R
]);

const DOC_EXTENSIONS = new Set(['.md', '.rst', '.txt']);
const IMAGE_EXTENSIONS = new Set(['.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const PAPER_EXTENSIONS = new Set(['.pdf']);
const OFFICE_EXTENSIONS = new Set(['.docx', '.xlsx']);

const SKIP_DIRS = new Set([
  '.tox', '.env', '.pytest_cache', 'site-packages', '.ruff_cache', 'lib64',
  'node_modules', 'venv', 'env', '.venv', '.git', 'dist', '.eggs',
  '__pycache__', '*.egg-info', '.mypy_cache', 'out', 'build', 'target',
  '.claude-glm',  // auto-memory dir
]);

// Directories starting with . that we DO want to include
const DOT_DIRS_TO_INCLUDE = new Set(['.agent', '.claude']);

const SENSITIVE_PATTERNS = [
  /(^|[\\/])\.(env|envrc)(\.|$)/i,
  /\.(pem|key|p12|pfx|cert|crt|der|p8)$/i,
  /(credential|secret|passwd|password|token|private_key)/i,
  /(id_rsa|id_dsa|id_ecdsa|id_ed25519)(\.pub)?$/,
  /(\.netrc|\.pgpass|\.htpasswd)$/i,
  /(aws_credentials|gcloud_credentials|service\.account)/i,
];

// Max files before warning
const MAX_FILES_WARN = 200;
const MAX_WORDS_WARN = 2_000_000;

function classifyFile(filePath: string): FileType | null {
  const ext = extname(filePath).toLowerCase();
  if (CODE_EXTENSIONS.has(ext)) return 'code';
  if (DOC_EXTENSIONS.has(ext)) return 'document';
  if (PAPER_EXTENSIONS.has(ext)) return 'paper';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (OFFICE_EXTENSIONS.has(ext)) return 'document'; // office -> document
  return null;
}

function isSensitive(filePath: string): boolean {
  return SENSITIVE_PATTERNS.some(re => re.test(filePath));
}

async function countWords(filePath: string): Promise<number> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content.split(/\s+/).filter(Boolean).length;
  } catch {
    return 0;
  }
}

async function walkDir(
  dir: string,
  root: string,
  ignorePatterns: ReturnType<typeof loadIgnoreFile>,
  includeDotDirs: boolean,
): Promise<{ files: Record<FileType, string[]>; totalWords: number; skippedSensitive: number }> {
  const files: Record<FileType, string[]> = { code: [], document: [], paper: [], image: [] };
  let totalWords = 0;
  let skippedSensitive = 0;

  async function walk(current: string) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      const relToRoot = relative(root, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        // Skip directories
        if (entry.name.startsWith('.')) {
          if (!includeDotDirs || !DOT_DIRS_TO_INCLUDE.has(entry.name)) continue;
        }
        if (SKIP_DIRS.has(entry.name)) continue;
        if (isIgnored(fullPath, root, ignorePatterns)) continue;
        await walk(fullPath);
      } else {
        // Skip hidden files
        if (entry.name.startsWith('.')) continue;
        if (isIgnored(fullPath, root, ignorePatterns)) continue;
        if (isSensitive(fullPath)) {
          skippedSensitive++;
          continue;
        }

        const fileType = classifyFile(fullPath);
        if (!fileType) continue;

        files[fileType].push(fullPath);
      }
    }
  }

  await walk(dir);

  // Count words for text files (sample to avoid being too slow)
  const textFiles = [...files.document, ...files.code.slice(0, 100)];
  for (const f of textFiles) {
    totalWords += await countWords(f);
  }

  return { files, totalWords, skippedSensitive };
}

export async function detect(root: string): Promise<DetectResult> {
  const absRoot = resolve(root);
  const ignorePatterns = loadIgnoreFile(absRoot);

  // Walk main tree (skips dot-dirs by default)
  const main = await walkDir(absRoot, absRoot, ignorePatterns, false);

  // Walk dot-dirs that should be included (.agent, .claude)
  const dotDirFiles: Record<FileType, string[]> = { code: [], document: [], paper: [], image: [] };
  for (const dotDir of DOT_DIRS_TO_INCLUDE) {
    const dotPath = join(absRoot, dotDir);
    try {
      await stat(dotPath);
      const dot = await walkDir(dotPath, absRoot, ignorePatterns, true);
      for (const type of ['code', 'document', 'paper', 'image'] as FileType[]) {
        const existing = new Set(main.files[type].map(f => resolve(f)));
        for (const f of dot.files[type]) {
          if (!existing.has(resolve(f))) {
            dotDirFiles[type].push(f);
          }
        }
      }
    } catch {
      // dot-dir doesn't exist
    }
  }

  // Merge
  const files: Record<FileType, string[]> = { code: [], document: [], paper: [], image: [] };
  for (const type of ['code', 'document', 'paper', 'image'] as FileType[]) {
    files[type] = [...main.files[type], ...dotDirFiles[type]];
  }

  const totalFiles = files.code.length + files.document.length + files.paper.length + files.image.length;

  return {
    files,
    total_files: totalFiles,
    total_words: main.totalWords,
    skipped_sensitive: main.skippedSensitive,
    skipped_binary: 0,
    graphifyignore_patterns: ignorePatterns.length,
  };
}

export { classifyFile, isSensitive, CODE_EXTENSIONS, SKIP_DIRS };
