// Export graphology graph to NetworkX-compatible node_link JSON format

import Graph from 'graphology';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { GraphJSON, CommunityMap, Hyperedge } from '../types';

export function graphToJSON(
  graph: Graph,
  communities: CommunityMap,
  hyperedges: Hyperedge[],
): GraphJSON {
  // Build node -> community reverse map
  const nodeCommunity = new Map<string, number>();
  for (const [cid, members] of Object.entries(communities)) {
    for (const nodeId of members) {
      nodeCommunity.set(nodeId, Number(cid));
    }
  }

  const nodes = graph.mapNodes((id, attrs) => {
    const a = attrs as Record<string, unknown>;
    return {
      id,
      label: (a.label as string) || id,
      file_type: (a.file_type as string) || 'code',
      source_file: (a.source_file as string) || '',
      source_location: (a.source_location as string) || null,
      community: nodeCommunity.get(id) ?? 0,
      ...(a.type ? { type: a.type as string } : {}),
      ...(a.properties ? { properties: a.properties as Record<string, string> } : {}),
    };
  });

  const links = graph.mapEdges((_edge, attrs, source, target) => {
    const a = attrs as Record<string, unknown>;
    return {
      source,
      target,
      relation: (a.relation as string) || 'unknown',
      confidence: (a.confidence as string) || 'EXTRACTED',
      confidence_score: (a.confidence_score as number) ?? 1.0,
      source_file: (a.source_file as string) || '',
      source_location: (a.source_location as string) || null,
      weight: (a.weight as number) ?? 1.0,
      _src: source,
      _tgt: target,
      ...(a.type ? { type: a.type as string } : {}),
      ...(a.properties ? { properties: a.properties as Record<string, string> } : {}),
    };
  });

  return {
    directed: false,
    multigraph: false,
    graph: { hyperedges },
    nodes,
    links,
  };
}

export async function writeGraphJSON(
  graph: Graph,
  communities: CommunityMap,
  hyperedges: Hyperedge[],
  outputPath: string,
): Promise<void> {
  const data = graphToJSON(graph, communities, hyperedges);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
}
