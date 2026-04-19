// .graphifyignore parser (gitignore-style patterns)

export interface IgnorePattern {
  pattern: string;
  negated: boolean;
  dirOnly: boolean;
}

export function loadIgnoreFile(root: string): IgnorePattern[] {
  const fs = require('node:fs') as typeof import('node:fs');
  const path = require('node:path') as typeof import('node:path');
  const ignorePath = path.join(root, '.graphifyignore');
  if (!fs.existsSync(ignorePath)) return [];

  const content = fs.readFileSync(ignorePath, 'utf-8');
  return parseIgnore(content);
}

export function parseIgnore(content: string): IgnorePattern[] {
  const lines = content.split('\n');
  const patterns: IgnorePattern[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    let negated = false;
    let pattern = line;

    if (pattern.startsWith('!')) {
      negated = true;
      pattern = pattern.slice(1);
    }

    const dirOnly = pattern.endsWith('/');
    if (dirOnly) pattern = pattern.slice(0, -1);

    patterns.push({ pattern, negated, dirOnly });
  }

  return patterns;
}

export function isIgnored(
  filePath: string,
  root: string,
  patterns: IgnorePattern[],
): boolean {
  const path = require('node:path') as typeof import('node:path');
  const rel = path.relative(root, filePath).replace(/\\/g, '/');

  let ignored = false;

  for (const p of patterns) {
    const matches = matchPattern(p.pattern, rel);
    if (matches) {
      ignored = !p.negated;
    }
  }

  return ignored;
}

function matchPattern(pattern: string, relPath: string): boolean {
  // Convert gitignore pattern to regex
  // ** matches any path segments
  // * matches within a single segment
  const segments = relPath.split('/');

  if (pattern.includes('/')) {
    // Anchored pattern — must match full path
    const regex = patternToRegex(pattern);
    return regex.test(relPath);
  }

  // Non-anchored — match any segment or the full path
  const regex = patternToRegex(pattern);
  return segments.some(seg => regex.test(seg)) || regex.test(relPath);
}

function patternToRegex(pattern: string): RegExp {
  let regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');

  return new RegExp(`(^|/)${regex}(/|$)`);
}
