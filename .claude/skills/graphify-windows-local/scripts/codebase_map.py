#!/usr/bin/env python3
"""Generate a compact, agent-readable CODEBASE_MAP.md from graphify output.

Usage:
    python codebase_map.py <graph.json> [--labels <labels.json>] [--output <path>]

Output is a markdown file designed to be:
- Read by an AI agent on session start (auto-loading)
- Appended to CLAUDE.md or .agent/memory/
- Human-scannable in < 60 seconds

Sections:
    1. Architecture summary (communities, god nodes)
    2. Key files to read (top god nodes with source files)
    3. Community overview (name, size, cohesion, top nodes)
    4. Cross-community bridges (high betweenness nodes)
    5. Quick answers (auto-derived from graph structure)
"""

import json
import sys
from pathlib import Path
from collections import defaultdict


def load_graph(graph_path: str) -> dict:
    p = Path(graph_path)
    if not p.exists():
        print(f"ERROR: {graph_path} not found.", file=sys.stderr)
        sys.exit(1)
    data = json.loads(p.read_text(encoding="utf-8"))
    data["_links"] = data.get("links", data.get("edges", []))
    return data


def load_labels(labels_path: str | None) -> dict:
    if not labels_path:
        return {}
    p = Path(labels_path)
    if not p.exists():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def compute_betweenness(data: dict) -> dict[str, float]:
    """Simple betweenness centrality (fraction of shortest paths through each node)."""
    nodes = {n["id"] for n in data.get("nodes", [])}
    links = data.get("_links", [])

    # Build adjacency
    adj = defaultdict(set)
    for e in links:
        src, tgt = e.get("source", ""), e.get("target", "")
        if src != tgt:
            adj[src].add(tgt)
            adj[tgt].add(src)

    # BFS shortest paths from each node
    betweenness = defaultdict(float)
    all_nodes = list(nodes)

    for start in all_nodes:
        if start not in adj:
            continue
        # BFS
        visited = {start: None}
        queue = [start]
        while queue:
            node = queue.pop(0)
            for neighbor in sorted(adj.get(node, [])):
                if neighbor not in visited:
                    visited[neighbor] = node
                    queue.append(neighbor)

        # Count paths through each node (excluding start)
        for node in nodes:
            if node == start or node not in visited:
                continue
            # Trace path from node back to start
            cur = node
            path_nodes = set()
            while cur is not None and cur != start:
                path_nodes.add(cur)
                cur = visited[cur]
            for intermediate in path_nodes:
                if intermediate != node and intermediate != start:
                    betweenness[intermediate] += 1

    # Normalize
    n = len(all_nodes)
    if n > 2:
        norm = (n - 1) * (n - 2)
        for k in betweenness:
            betweenness[k] /= norm

    return dict(betweenness)


def get_god_nodes(data: dict, top_n: int = 10) -> list[tuple[str, str, int, str]]:
    """Get most connected nodes. Returns [(id, label, edge_count, source_file)]."""
    links = data.get("_links", [])
    edge_count = defaultdict(int)
    for e in links:
        edge_count[e.get("source", "")] += 1
        edge_count[e.get("target", "")] += 1

    nodes_map = {n["id"]: n for n in data.get("nodes", [])}
    ranked = sorted(edge_count.items(), key=lambda x: x[1], reverse=True)

    result = []
    for nid, count in ranked[:top_n]:
        n = nodes_map.get(nid, {})
        label = n.get("label", nid)
        src_file = n.get("source_file", "")
        # Skip rationale/docstring nodes for god node list
        if "_rationale_" in nid:
            continue
        result.append((nid, label, count, src_file))
    return result[:top_n]


def get_community_info(data: dict, labels: dict) -> list[dict]:
    """Get community overview: name, size, cohesion-like metric, top nodes."""
    nodes = data.get("nodes", [])
    links = data.get("_links", [])
    nodes_map = {n["id"]: n for n in nodes}

    # Group nodes by community
    communities = defaultdict(list)
    for n in nodes:
        comm = n.get("community", -1)
        if comm >= 0:
            communities[comm].append(n)

    # Count internal edges per community
    comm_internal_edges = defaultdict(int)
    comm_total_possible = defaultdict(int)
    for e in links:
        src_n = nodes_map.get(e.get("source", ""), {})
        tgt_n = nodes_map.get(e.get("target", ""), {})
        src_comm = src_n.get("community", -1)
        tgt_comm = tgt_n.get("community", -1)
        if src_comm >= 0 and tgt_comm >= 0:
            comm_total_possible[src_comm] += 1
            if src_comm == tgt_comm:
                comm_internal_edges[src_comm] += 1

    result = []
    for cid in sorted(communities.keys()):
        members = communities[cid]
        size = len(members)
        name = labels.get(str(cid), f"Community {cid}")
        internal = comm_internal_edges.get(cid, 0)

        # Top 3 non-rationale nodes by label
        top_nodes = []
        for n in members:
            if "_rationale_" not in n.get("id", ""):
                top_nodes.append(n.get("label", n["id"]))
        top_nodes = top_nodes[:3]

        # Files in this community
        files = set()
        for n in members:
            sf = n.get("source_file", "")
            if sf:
                files.add(sf)

        result.append({
            "id": cid,
            "name": name,
            "size": size,
            "internal_edges": internal,
            "top_nodes": top_nodes,
            "files": sorted(files),
        })

    return result


def get_bridge_nodes(data: dict, labels: dict, betweenness: dict,
                     threshold: float = 0.05) -> list[tuple[str, str, float, list[str]]]:
    """Find nodes that connect multiple communities."""
    nodes_map = {n["id"]: n for n in data.get("nodes", [])}
    links = data.get("_links", [])

    # For each high-betweenness node, find which communities it connects
    bridges = []
    for nid, bw in sorted(betweenness.items(), key=lambda x: x[1], reverse=True):
        if bw < threshold:
            break
        n = nodes_map.get(nid, {})
        if "_rationale_" in nid:
            continue

        # Find connected communities
        connected_comms = set()
        for e in links:
            src, tgt = e.get("source", ""), e.get("target", "")
            other = None
            if src == nid:
                other = tgt
            elif tgt == nid:
                other = src
            if other:
                other_n = nodes_map.get(other, {})
                comm = other_n.get("community", -1)
                if comm >= 0:
                    connected_comms.add(comm)

        label = n.get("label", nid)
        comm_names = [labels.get(str(c), f"C{c}") for c in sorted(connected_comms)]
        bridges.append((nid, label, bw, comm_names))

    return bridges


def generate_quick_answers(data: dict, labels: dict, gods: list,
                          bridges: list) -> list[str]:
    """Derive quick Q&A from graph structure."""
    answers = []
    nodes_map = {n["id"]: n for n in data.get("nodes", [])}
    links = data.get("_links", [])

    # Q: What produces audio? -> find nodes with "produce" or "generate" in label
    for nid, label, count, src_file in gods:
        label_lower = label.lower()
        if any(w in label_lower for w in ["produce", "generate", "render", "build"]):
            answers.append(f"- What produces/builds things? -> `{label}` ({count} edges) in `{src_file}`")

    # Q: Where are characters/models defined? -> find "resolve" or "registry"
    for nid, label, count, src_file in gods:
        label_lower = label.lower()
        if any(w in label_lower for w in ["manager", "registry", "resolve", "config"]):
            answers.append(f"- Where is state managed? -> `{label}` ({count} edges) in `{src_file}`")

    # Q: What connects X and Y? -> bridge nodes
    if bridges:
        top_bridge = bridges[0]
        if len(top_bridge[3]) >= 2:
            answers.append(
                f"- What connects {', '.join(top_bridge[3][:3])}? -> "
                f"`{top_bridge[1]}` (betweenness={top_bridge[2]:.3f})"
            )

    return answers[:5]


def generate_map(data: dict, labels: dict) -> str:
    """Generate the full CODEBASE_MAP.md content."""
    nodes = data.get("nodes", [])
    links = data.get("_links", [])
    n_nodes = len(nodes)
    n_links = len(links)
    communities = len({n.get("community", -1) for n in nodes if n.get("community", -1) >= 0})

    gods = get_god_nodes(data, top_n=10)
    betweenness = compute_betweenness(data)
    bridges = get_bridge_nodes(data, labels, betweenness)
    comm_info = get_community_info(data, labels)
    quick_answers = generate_quick_answers(data, labels, gods, bridges)

    lines = []
    lines.append("# Codebase Map (auto-generated by graphify)")
    lines.append("")
    lines.append(f"**Stats:** {n_nodes} nodes, {n_links} edges, {communities} communities")
    lines.append("")

    # --- Architecture ---
    lines.append("## Architecture")
    lines.append("")
    if gods:
        lines.append(f"**God nodes** (most connected, core abstractions):")
        for nid, label, count, src_file in gods:
            comm = "?"
            for n in nodes:
                if n["id"] == nid:
                    comm = labels.get(str(n.get("community", "?")), "?")
                    break
            file_hint = f" — `{src_file}`" if src_file else ""
            lines.append(f"- `{label}` ({count} edges, {comm}){file_hint}")
    lines.append("")

    # --- Key files ---
    lines.append("## Key Files to Read")
    lines.append("")
    seen_files = set()
    for nid, label, count, src_file in gods:
        if src_file and src_file not in seen_files and Path(src_file).exists():
            seen_files.add(src_file)
            # Get a short description from rationale nodes
            rationale = ""
            for n in nodes:
                if n.get("source_file") == src_file and "_rationale_" in n.get("id", ""):
                    rtext = n.get("label", "")
                    if len(rtext) > 10 and not rationale:
                        rationale = rtext[:100]
                        if len(rtext) > 100:
                            rationale += "..."
                        break
            lines.append(f"- `{src_file}` — {label} ({count} edges)")
            if rationale:
                lines.append(f"  > {rationale}")
    lines.append("")

    # --- Bridge nodes ---
    if bridges:
        lines.append("## Cross-Community Bridges")
        lines.append("")
        for nid, label, bw, comm_names in bridges[:5]:
            lines.append(f"- `{label}` (betweenness={bw:.3f}) connects: {', '.join(comm_names)}")
        lines.append("")

    # --- Community overview ---
    lines.append("## Communities")
    lines.append("")
    # Only show communities with > 2 nodes
    big_comms = [c for c in comm_info if c["size"] > 2]
    for c in sorted(big_comms, key=lambda x: x["size"], reverse=True):
        lines.append(f"### {c['name']} ({c['size']} nodes, {c['internal_edges']} internal edges)")
        if c["top_nodes"]:
            lines.append(f"  Top: {', '.join(c['top_nodes'])}")
        if c["files"]:
            lines.append(f"  Files: {', '.join(c['files'][:3])}")
        lines.append("")

    # --- Quick answers ---
    if quick_answers:
        lines.append("## Quick Answers")
        lines.append("")
        for a in quick_answers:
            lines.append(a)
        lines.append("")

    # --- Footer ---
    lines.append("---")
    lines.append("*Generated by graphify. Read source files for ground truth — the graph shows structure, not semantics.*")

    return "\n".join(lines)


def generate_claudemd_section(data: dict, labels: dict) -> str:
    """Generate a compact section for pasting into CLAUDE.md.

    Focuses on: architecture summary, god nodes with files, key communities.
    Designed to be ~20-30 lines, agent-readable, not redundant with existing docs.
    """
    nodes = data.get("nodes", [])
    links = data.get("_links", [])
    n_nodes = len(nodes)
    n_links = len(links)
    communities = len({n.get("community", -1) for n in nodes if n.get("community", -1) >= 0})

    gods = get_god_nodes(data, top_n=7)
    comm_info = get_community_info(data, labels)
    bridges = get_bridge_nodes(data, labels, compute_betweenness(data))

    lines = []
    lines.append("## Codebase Architecture (auto-generated by graphify)")
    lines.append("")
    lines.append(f"**Graph:** {n_nodes} nodes, {n_links} edges, {communities} communities")
    lines.append("")

    # God nodes — the most important 5-7
    lines.append("**Core abstractions** (most connected nodes):")
    for nid, label, count, src_file in gods[:7]:
        file_hint = f" in `{src_file}`" if src_file else ""
        lines.append(f"- `{label}` ({count} edges){file_hint}")
    lines.append("")

    # Top communities (size > 2)
    big_comms = [c for c in comm_info if c["size"] > 2]
    if big_comms:
        lines.append("**Major components:**")
        for c in sorted(big_comms, key=lambda x: x["size"], reverse=True)[:6]:
            top = ", ".join(c["top_nodes"][:2]) if c["top_nodes"] else ""
            files = ", ".join(c["files"][:2]) if c["files"] else ""
            lines.append(f"- **{c['name']}** ({c['size']} nodes) — {top}")
            if files:
                lines.append(f"  `{files}`")
        lines.append("")

    # Bridges — cross-cutting concerns
    if bridges:
        lines.append("**Cross-cutting concerns:**")
        for nid, label, bw, comm_names in bridges[:3]:
            lines.append(f"- `{label}` connects: {', '.join(comm_names[:4])}")
        lines.append("")

    lines.append("<!-- Re-run `graphify --summarize` to update this section -->")

    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("Usage: python codebase_map.py <graph.json> [--labels <labels.json>] [--output <path>]", file=sys.stderr)
        sys.exit(1)

    graph_path = sys.argv[1]
    labels_path = None
    output_path = None
    claudemd_mode = False

    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == "--labels" and i + 1 < len(sys.argv):
            labels_path = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--output" and i + 1 < len(sys.argv):
            output_path = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--claudemd":
            claudemd_mode = True
            i += 1
        else:
            i += 1

    data = load_graph(graph_path)
    labels = load_labels(labels_path)

    if claudemd_mode:
        content = generate_claudemd_section(data, labels)
    else:
        content = generate_map(data, labels)

    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        Path(output_path).write_text(content, encoding="utf-8")
        print(f"Written to {output_path}")
    else:
        print(content)


if __name__ == "__main__":
    main()
