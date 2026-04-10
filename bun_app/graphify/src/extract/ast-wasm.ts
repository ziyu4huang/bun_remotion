// WASM-based tree-sitter extraction (reserved for future use)
// This will be used once WASM grammar files are available.

import { readFile } from 'node:fs/promises';
import { resolve, basename, extname } from 'node:path';
import { Parser, Language } from 'web-tree-sitter';
import type { GrammarConfig } from './grammar-registry';
import { getGrammarConfig } from './grammar-registry';
import type { GraphNode, GraphEdge } from '../types';

let parserInstance: Parser | null = null;
let loadedLanguages = new Map<string, Language>();

export async function getParser(): Promise<Parser> {
  if (!parserInstance) {
    await Parser.init();
    parserInstance = new Parser();
  }
  return parserInstance;
}

export async function loadLanguage(wasmFile: string): Promise<Language | null> {
  if (loadedLanguages.has(wasmFile)) {
    return loadedLanguages.get(wasmFile)!;
  }

  try {
    const wasmPath = resolve(import.meta.dir, '..', '..', 'grammars', wasmFile);
    const bytes = await readFile(wasmPath);
    const language = await Language.load(new Uint8Array(bytes));
    loadedLanguages.set(wasmFile, language);
    return language;
  } catch (err) {
    console.error(`  WARNING: Failed to load grammar ${wasmFile}: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Extract a single file using web-tree-sitter WASM.
 */
export async function extractFileWASM(
  filePath: string,
  config: GrammarConfig,
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const parser = await getParser();
  const language = await loadLanguage(config.wasm);
  if (!language) return { nodes: [], edges: [] };

  parser.setLanguage(language);
  const absPath = resolve(filePath);
  const source = await readFile(absPath);
  const tree = parser.parse(source);
  const root = tree.rootNode;

  const stem = basename(absPath, extname(absPath));
  const strPath = absPath;
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenIds = new Set<string>();

  const fileNid = stem.replace(/[-\s]+/g, '_');
  if (!seenIds.has(fileNid)) {
    seenIds.add(fileNid);
    nodes.push({ id: fileNid, label: basename(absPath), file_type: 'code', source_file: strPath, source_location: 'L1' });
  }

  function walk(node: typeof root, parentClassNid: string | null = null): void {
    const t = node.type;
    const line = node.startPosition.row + 1;

    if (config.classTypes.includes(t)) {
      const nameNode = node.childForFieldName(config.nameField) || node.children.find(c => c.type === 'identifier' || c.type === 'simple_identifier' || c.type === 'type_identifier');
      if (!nameNode) { for (const c of node.children) walk(c, parentClassNid); return; }

      const className = new TextDecoder().decode(source.slice(nameNode.startIndex, nameNode.endIndex));
      const classNid = `${fileNid}_${className}`;
      if (!seenIds.has(classNid)) {
        seenIds.add(classNid);
        nodes.push({ id: classNid, label: className, file_type: 'code', source_file: strPath, source_location: `L${line}` });
      }
      edges.push({ source: fileNid, target: classNid, relation: 'contains', confidence: 'EXTRACTED', confidence_score: 1.0, source_file: strPath, source_location: `L${line}`, weight: 1.0 });

      for (const child of node.children) walk(child, classNid);
      return;
    }

    if (config.functionTypes.includes(t)) {
      const nameNode = node.childForFieldName(config.nameField) || node.children.find(c => c.type === 'identifier' || c.type === 'simple_identifier');
      if (!nameNode) { for (const c of node.children) walk(c, parentClassNid); return; }

      const funcName = new TextDecoder().decode(source.slice(nameNode.startIndex, nameNode.endIndex));
      const funcNid = parentClassNid ? `${parentClassNid}_${funcName}` : `${fileNid}_${funcName}`;
      if (!seenIds.has(funcNid)) {
        seenIds.add(funcNid);
        nodes.push({ id: funcNid, label: funcName, file_type: 'code', source_file: strPath, source_location: `L${line}` });
      }
      edges.push({ source: parentClassNid || fileNid, target: funcNid, relation: 'contains', confidence: 'EXTRACTED', confidence_score: 1.0, source_file: strPath, source_location: `L${line}`, weight: 1.0 });
      return;
    }

    if (config.importTypes.includes(t)) {
      const nameNode = node.childForFieldName(config.importNameField || config.nameField) || node.children.find(c => c.type === 'identifier' || c.type === 'string');
      if (nameNode) {
        const importName = new TextDecoder().decode(source.slice(nameNode.startIndex, nameNode.endIndex)).replace(/['"]/g, '').split('/').pop() || '';
        const importNid = importName.replace(/[-\s.]+/g, '_');
        if (importNid) {
          edges.push({ source: fileNid, target: importNid, relation: 'imports_from', confidence: 'EXTRACTED', confidence_score: 1.0, source_file: strPath, source_location: `L${line}`, weight: 1.0 });
        }
      }
      return;
    }

    for (const child of node.children) walk(child, parentClassNid);
  }

  for (const child of root.children) walk(child);
  return { nodes, edges };
}
