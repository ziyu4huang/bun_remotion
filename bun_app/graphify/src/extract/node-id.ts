// Node ID generation — matches Python graphify conventions

import { basename, extname } from 'node:path';

/**
 * Generate a file-level node ID from file path.
 * Python convention: <stem> (e.g., "generate_tts" from "generate-tts.ts")
 */
export function fileId(filePath: string): string {
  const stem = basename(filePath, extname(filePath));
  return stem.replace(/[-\s]+/g, '_');
}

/**
 * Generate a class/module node ID.
 * Python convention: <fileId>_<className>
 */
export function classId(filePath: string, className: string): string {
  return `${fileId(filePath)}_${className}`;
}

/**
 * Generate a function/method node ID.
 * Python convention: <fileId>_<className>_<methodName> or <fileId>_<funcName>
 */
export function functionId(filePath: string, funcName: string, parentClass?: string): string {
  const fid = fileId(filePath);
  if (parentClass) {
    return `${fid}_${parentClass}_${funcName}`;
  }
  return `${fid}_${funcName}`;
}

/**
 * Generate a call/import node ID.
 * Python convention: <fileId>_<targetName> or more specific patterns
 */
export function callId(filePath: string, targetName: string): string {
  return `${fileId(filePath)}_${targetName}`;
}

/**
 * Generate an instantiation node ID.
 * Python convention: <fileId>_<targetName>_inst
 */
export function instanceId(filePath: string, targetName: string): string {
  return `${fileId(filePath)}_${targetName}_inst`;
}

/**
 * Generate a rationale/docstring node ID.
 * Python convention: <fileId>_rationale_<line>
 */
export function rationaleId(filePath: string, line: number): string {
  return `${fileId(filePath)}_rationale_${line}`;
}
