// Graph construction — merge extraction results into a graphology graph

import Graph from 'graphology';
import type { ExtractionResult, GraphNode, GraphEdge } from './types';

export function buildFromExtraction(extraction: ExtractionResult): Graph {
  const graph = new Graph({ multi: false, type: 'undirected' });

  // Add nodes
  for (const node of extraction.nodes) {
    if (!graph.hasNode(node.id)) {
      graph.addNode(node.id, {
        label: node.label,
        file_type: node.file_type,
        source_file: node.source_file,
        source_location: node.source_location,
        type: node.type,
        properties: node.properties,
      });
    }
  }

  // Add edges (skip self-loops and duplicates)
  for (const edge of extraction.edges) {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue;
    if (edge.source === edge.target) continue;

    if (!graph.hasEdge(edge.source, edge.target)) {
      graph.addEdge(edge.source, edge.target, {
        relation: edge.relation,
        confidence: edge.confidence,
        confidence_score: edge.confidence_score,
        source_file: edge.source_file,
        source_location: edge.source_location,
        weight: edge.weight,
        _src: edge.source,
        _tgt: edge.target,
      });
    }
  }

  return graph;
}

/**
 * Merge multiple extraction results (e.g., AST + semantic).
 */
export function mergeExtractions(extractions: ExtractionResult[]): ExtractionResult {
  const seenNodes = new Set<string>();
  const allNodes: GraphNode[] = [];
  const allEdges: GraphEdge[] = [];
  const allHyperedges = [...extractions.flatMap(e => e.hyperedges)];
  let inputTokens = 0;
  let outputTokens = 0;

  for (const ext of extractions) {
    for (const n of ext.nodes) {
      if (!seenNodes.has(n.id)) {
        seenNodes.add(n.id);
        allNodes.push(n);
      }
    }
    allEdges.push(...ext.edges);
    inputTokens += ext.input_tokens;
    outputTokens += ext.output_tokens;
  }

  return { nodes: allNodes, edges: allEdges, hyperedges: allHyperedges, input_tokens: inputTokens, output_tokens: outputTokens };
}
