#!/usr/bin/env python3
"""Compare two graphify runs and report what changed.

Usage:
    python graph_diff.py <graph_old.json> <graph_new.json> [--labels <labels.json>] [--output <path>]

Or compare current run against a saved baseline:
    python graph_diff.py graphify-out/graph.json.bak graphify-out/graph.json

Outputs a structured diff report:
    - New/removed nodes
    - New/removed edges
    - New god nodes (nodes that became highly connected)
    - Community changes
    - CLAUDE.md update suggestions

Works with graph.json (node_link format from graphify export).
"""

import json
import sys
from pathlib import Path
from collections import defaultdict

import networkx as nx


def load_graph(graph_path: str) -> nx.Graph:
    """Load graph.json (node_link format) into NetworkX Graph."""
    p = Path(graph_path)
    if not p.exists():
        print(f"ERROR: {graph_path} not found.", file=sys.stderr)
        sys.exit(1)
    data = json.loads(p.read_text(encoding="utf-8"))

    G = nx.Graph()
    for n in data.get("nodes", []):
        G.add_node(n["id"], **{k: v for k, v in n.items() if k != "id"})

    for e in data.get("links", data.get("edges", [])):
        src, tgt = e.get("source", ""), e.get("target", "")
        if src in G.nodes and tgt in G.nodes:
            G.add_edge(src, tgt, **{k: v for k, v in e.items() if k not in ("source", "target")})

    return G


def load_labels(labels_path: str | None) -> dict:
    if not labels_path:
        return {}
    p = Path(labels_path)
    if not p.exists():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def get_top_nodes(G: nx.Graph, top_n: int = 10) -> list[tuple[str, int]]:
    """Get most connected nodes by degree."""
    return sorted(G.degree(), key=lambda x: x[1], reverse=True)[:top_n]


def compute_diff_report(G_old: nx.Graph, G_new: nx.Graph, labels: dict) -> str:
    """Generate a human-readable diff report."""
    from graphify.analyze import graph_diff

    diff = graph_diff(G_old, G_new)

    lines = []
    lines.append("# Graph Diff Report")
    lines.append("")
    lines.append(f"**Summary:** {diff['summary']}")
    lines.append(f"**Old graph:** {G_old.number_of_nodes()} nodes, {G_old.number_of_edges()} edges")
    lines.append(f"**New graph:** {G_new.number_of_nodes()} nodes, {G_new.number_of_edges()} edges")
    lines.append("")

    # New nodes
    if diff["new_nodes"]:
        lines.append(f"## New Nodes ({len(diff['new_nodes'])})")
        lines.append("")
        for n in diff["new_nodes"][:20]:
            comm = G_new.nodes[n["id"]].get("community", "?")
            comm_name = labels.get(str(comm), f"Community {comm}")
            src_file = G_new.nodes[n["id"]].get("source_file", "")
            file_hint = f" in `{src_file}`" if src_file else ""
            lines.append(f"- `{n['label']}` ({comm_name}){file_hint}")
        if len(diff["new_nodes"]) > 20:
            lines.append(f"  ... and {len(diff['new_nodes']) - 20} more")
        lines.append("")

    # Removed nodes
    if diff["removed_nodes"]:
        lines.append(f"## Removed Nodes ({len(diff['removed_nodes'])})")
        lines.append("")
        for n in diff["removed_nodes"][:20]:
            lines.append(f"- `{n['label']}`")
        if len(diff["removed_nodes"]) > 20:
            lines.append(f"  ... and {len(diff['removed_nodes']) - 20} more")
        lines.append("")

    # New edges
    if diff["new_edges"]:
        lines.append(f"## New Edges ({len(diff['new_edges'])})")
        lines.append("")
        # Group by relation type
        by_rel = defaultdict(list)
        for e in diff["new_edges"]:
            by_rel[e.get("relation", "unknown")].append(e)
        for rel, edges in sorted(by_rel.items(), key=lambda x: -len(x[1]))[:10]:
            lines.append(f"- **{rel}** ({len(edges)} new):")
            for e in edges[:3]:
                src_label = G_new.nodes[e["source"]].get("label", e["source"]) if e["source"] in G_new.nodes else e["source"]
                tgt_label = G_new.nodes[e["target"]].get("label", e["target"]) if e["target"] in G_new.nodes else e["target"]
                conf = e.get("confidence", "?")
                lines.append(f"    - `{src_label}` -> `{tgt_label}` [{conf}]")
        lines.append("")

    # New god nodes (appeared in top-10 of new but not old)
    old_top = {nid for nid, _ in get_top_nodes(G_old, 10)}
    new_top = get_top_nodes(G_new, 10)
    new_gods = [(nid, deg) for nid, deg in new_top if nid not in old_top]
    if new_gods:
        lines.append("## New God Nodes")
        lines.append("")
        lines.append("These nodes became highly connected — consider documenting in CLAUDE.md:")
        lines.append("")
        for nid, deg in new_gods:
            label = G_new.nodes[nid].get("label", nid)
            src_file = G_new.nodes[nid].get("source_file", "")
            file_hint = f" in `{src_file}`" if src_file else ""
            lines.append(f"- `{label}` (degree {deg}){file_hint}")
        lines.append("")

    # Community changes
    old_comms = {n: G_old.nodes[n].get("community", -1) for n in G_old.nodes}
    new_comms = {n: G_new.nodes[n].get("community", -1) for n in G_new.nodes}
    shared = set(old_comms) & set(new_comms)
    changed = [(n, old_comms[n], new_comms[n]) for n in shared if old_comms[n] != new_comms[n]]
    if changed:
        lines.append(f"## Community Changes ({len(changed)} nodes moved)")
        lines.append("")
        for nid, old_c, new_c in changed[:15]:
            label = G_new.nodes[nid].get("label", nid)
            old_name = labels.get(str(old_c), f"C{old_c}")
            new_name = labels.get(str(new_c), f"C{new_c}")
            lines.append(f"- `{label}`: {old_name} -> {new_name}")
        lines.append("")

    # CLAUDE.md update suggestions
    suggestions = []
    if new_gods:
        god_labels = [f"`{G_new.nodes[nid].get('label', nid)}`" for nid, _ in new_gods[:3]]
        suggestions.append(f"New highly-connected nodes appeared: {', '.join(god_labels)}. Consider adding to CLAUDE.md if they represent core abstractions.")
    if diff["new_nodes"] and len(diff["new_nodes"]) > 5:
        new_files = set()
        for n in diff["new_nodes"]:
            sf = G_new.nodes[n["id"]].get("source_file", "")
            if sf:
                new_files.add(sf)
        if new_files:
            suggestions.append(f"New source files: {', '.join(sorted(new_files)[:5])}. Consider documenting in CLAUDE.md if they're significant.")

    if suggestions:
        lines.append("## CLAUDE.md Update Suggestions")
        lines.append("")
        for s in suggestions:
            lines.append(f"- {s}")
        lines.append("")

    lines.append("---")
    lines.append("*Run `graphify --diff` to regenerate this report.*")

    return "\n".join(lines)


def main():
    if len(sys.argv) < 3:
        print("Usage: python graph_diff.py <old.json> <new.json> [--labels <labels.json>] [--output <path>]", file=sys.stderr)
        sys.exit(1)

    old_path = sys.argv[1]
    new_path = sys.argv[2]
    labels_path = None
    output_path = None

    i = 3
    while i < len(sys.argv):
        if sys.argv[i] == "--labels" and i + 1 < len(sys.argv):
            labels_path = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--output" and i + 1 < len(sys.argv):
            output_path = sys.argv[i + 1]
            i += 2
        else:
            i += 1

    G_old = load_graph(old_path)
    G_new = load_graph(new_path)
    labels = load_labels(labels_path)

    report = compute_diff_report(G_old, G_new, labels)

    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        Path(output_path).write_text(report, encoding="utf-8")
        print(f"Written to {output_path}")
    else:
        print(report)

    # Also output summary line for agent consumption
    print(f"\nDIFF_SUMMARY: {G_new.number_of_nodes() - G_old.number_of_nodes()} nodes, {G_new.number_of_edges() - G_old.number_of_edges()} edges delta")


if __name__ == "__main__":
    main()
