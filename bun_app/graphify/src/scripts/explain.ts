// Node explanation — port of explain.py
// Fuzzy search + graph traversal on graph.json

import { readFile } from 'node:fs/promises';

interface GraphData {
  nodes: Array<{ id: string; label: string; community?: number; source_file?: string; file_type?: string }>;
  links: Array<{ source: string; target: string; relation: string; confidence: string; confidence_score: number; source_file?: string }>;
}

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (q === t) return 1.0;
  if (t.includes(q)) return 0.9;
  if (q.includes(t)) return 0.7;
  // Simple subsequence check
  let ji = 0;
  let allFound = true;
  for (const ch of q) {
    ji = t.indexOf(ch, ji);
    if (ji < 0) { allFound = false; break; }
    ji++;
  }
  if (allFound && q.length > 0) {
    return 0.5 * (q.length / Math.max(t.length, 1));
  }
  return 0;
}

function findNodes(data: GraphData, query: string) {
  const matches: Array<{ node: typeof data.nodes[0]; score: number }> = [];
  for (const n of data.nodes) {
    const score = Math.max(fuzzyScore(query, n.id), fuzzyScore(query, n.label));
    if (score >= 0.4) matches.push({ node: n, score });
  }
  matches.sort((a, b) => b.score - a.score);
  return matches;
}

function pickBestNode(matches: Array<{ node: typeof data.nodes[0]; score: number }>, data: GraphData) {
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0].node;

  const linkCount = new Map<string, number>();
  for (const e of data.links) {
    linkCount.set(e.source, (linkCount.get(e.source) || 0) + 1);
    linkCount.set(e.target, (linkCount.get(e.target) || 0) + 1);
  }

  return matches.reduce((best, m) => {
    const cnt = linkCount.get(m.node.id) || 0;
    const bestCnt = linkCount.get(best.node.id) || 0;
    const typeW = m.node.id.includes('_rationale_') ? 0.1 : 1.0;
    const bestTypeW = best.node.id.includes('_rationale_') ? 0.1 : 1.0;
    return m.score * (1 + cnt * typeW) > best.score * (1 + bestCnt * bestTypeW) ? m : best;
  }).node;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: bun run src/scripts/explain.ts <graph.json> <node_name> [--labels <labels.json>]');
    process.exit(1);
  }

  const graphPath = args[0];
  const query = args[1];
  let labelsPath: string | undefined;

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--labels' && i + 1 < args.length) { labelsPath = args[++i]; }
  }

  const data: GraphData = JSON.parse(await readFile(graphPath, 'utf-8'));
  const labels: Record<string, string> = labelsPath ? JSON.parse(await readFile(labelsPath, 'utf-8')) : {};

  const matches = findNodes(data, query);
  if (matches.length === 0) {
    console.error(`No nodes matching '${query}' found.`);
    process.exit(1);
  }

  const best = pickBestNode(matches, data);

  // Get connections
  const incoming: typeof data.links = [];
  const outgoing: typeof data.links = [];
  for (const e of data.links) {
    if (e.target === best.id && e.source !== best.id) incoming.push(e);
    else if (e.source === best.id && e.target !== best.id) outgoing.push(e);
  }

  const nodesMap = new Map(data.nodes.map(n => [n.id, n]));
  const commName = best.community != null ? (labels[String(best.community)] || `Community ${best.community}`) : '?';

  console.log(`# ${best.label}`);
  console.log('');
  console.log(`**Node ID:** \`${best.id}\``);
  console.log(`**Community:** ${commName}`);
  if (best.source_file) console.log(`**File:** ${best.source_file}`);
  console.log(`**Connections:** ${incoming.length} incoming + ${outgoing.length} outgoing = ${incoming.length + outgoing.length}`);
  console.log('');

  if (outgoing.length > 0) {
    console.log('## Outgoing');
    for (const e of outgoing.slice(0, 15)) {
      const other = nodesMap.get(e.target);
      const lbl = other?.label || e.target;
      const conf = e.confidence;
      console.log(`  ${lbl} --[${e.relation}]-- [${conf}]`);
    }
  }

  if (incoming.length > 0) {
    console.log('');
    console.log('## Incoming');
    for (const e of incoming.slice(0, 15)) {
      const other = nodesMap.get(e.source);
      const lbl = other?.label || e.source;
      console.log(`  ${lbl} --[${e.relation}]-- [${e.confidence}]`);
    }
  }
}

main().catch(console.error);
