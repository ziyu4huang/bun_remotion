#!/usr/bin/env python3
"""One-shot node explanation for graphify output.

Usage:
    python explain.py <graph.json> <node_name> [--labels <labels.json>] [--top N]

Outputs structured explanation:
    - What it is (type, file, community)
    - Verified connections (EXTRACTED, confidence=1.0)
    - Hypotheses (INFERRED, confidence<1.0) — marked for verification
    - Source file hint (read this for ground truth)
"""

import json
import sys
from pathlib import Path
from collections import defaultdict
from difflib import SequenceMatcher


def load_graph(graph_path: str) -> dict:
    """Load graph.json (NetworkX node_link_data format)."""
    p = Path(graph_path)
    if not p.exists():
        print(f"ERROR: {graph_path} not found. Run graphify first.", file=sys.stderr)
        sys.exit(1)
    data = json.loads(p.read_text(encoding="utf-8"))
    # Support both 'links' (node_link_data) and 'edges' (extraction format)
    data["_links"] = data.get("links", data.get("edges", []))
    return data


def load_labels(labels_path: str | None) -> dict:
    """Load community labels JSON (str(cid) -> label)."""
    if not labels_path:
        return {}
    p = Path(labels_path)
    if not p.exists():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def _fuzzy_score(query: str, text: str) -> float:
    """Fuzzy match score: 1.0 for exact, 0.8+ for close, 0.0 for no match."""
    q = query.lower()
    t = text.lower()
    if q == t:
        return 1.0
    if q in t:
        return 0.9
    # SequenceMatcher for typo tolerance
    ratio = SequenceMatcher(None, q, t).ratio()
    # Also check if all query chars appear in order in text
    j = 0
    for ch in q:
        j = t.find(ch, j)
        if j < 0:
            break
        j += 1
    else:
        # Subsequence match — decent signal
        ratio = max(ratio, 0.5 * (len(q) / max(len(t), 1)))
    return ratio


def find_nodes(data: dict, query: str, fuzzy: bool = True) -> list[tuple[dict, float]]:
    """Find nodes matching query.

    If fuzzy=True (default), uses substring + edit distance scoring.
    Returns list of (node, score) tuples sorted by score descending.
    If fuzzy=False, returns list of (node, 1.0) for exact substring matches.
    """
    query_lower = query.lower()
    matches = []
    for n in data.get("nodes", []):
        nid = n.get("id", "")
        label = n.get("label", "")
        if not fuzzy:
            if query_lower in nid.lower() or query_lower in label.lower():
                matches.append((n, 1.0))
        else:
            # Take best score across id and label
            score_id = _fuzzy_score(query, nid)
            score_label = _fuzzy_score(query, label)
            score = max(score_id, score_label)
            if score >= 0.4:
                matches.append((n, score))
    matches.sort(key=lambda x: x[1], reverse=True)
    return matches


def pick_best_node(matches: list[tuple[dict, float]], data: dict) -> dict | None:
    """Pick the most useful node from matches.

    Combines fuzzy score with graph centrality.
    Preference: class/function nodes > file nodes > rationale nodes.
    """
    if not matches:
        return None
    if len(matches) == 1:
        return matches[0][0]

    # Count links for each match to pick the most connected
    links = data.get("_links", [])
    link_count = defaultdict(int)
    for e in links:
        link_count[e.get("source", "")] += 1
        link_count[e.get("target", "")] += 1

    # Score: fuzzy_score * (link_count * type_weight)
    def score(item):
        node, fuzzy = item
        nid = node.get("id", "")
        cnt = link_count.get(nid, 0)
        if "_rationale_" in nid:
            type_w = 0.1
        elif len(nid.split("_")) >= 2 and not nid.endswith("_py") and not nid.endswith("_ts"):
            type_w = 2.0
        else:
            type_w = 1.0
        return fuzzy * (1 + cnt * type_w)

    return max(matches, key=score)[0]


def get_connections(data: dict, node_id: str) -> tuple[list, list]:
    """Get incoming and outgoing links for a node."""
    links = data.get("_links", [])
    incoming = []
    outgoing = []
    for e in links:
        src, tgt = e.get("source", ""), e.get("target", "")
        if src == node_id and tgt != node_id:
            outgoing.append(e)
        elif tgt == node_id and src != node_id:
            incoming.append(e)
    return incoming, outgoing


def group_by_relation(edges: list, nodes_map: dict, labels: dict) -> dict[str, list]:
    """Group edges by relation type, with resolved labels."""
    groups = defaultdict(list)
    for e in edges:
        other_id = e["target"] if e.get("source") == list(nodes_map.keys())[0] else e["source"]
        # Determine which end is the "other" node
        rel = e.get("relation", "unknown")
        conf = e.get("confidence", "UNKNOWN")
        score = e.get("confidence_score", 0)
        n = nodes_map.get(other_id, {})
        lbl = n.get("label", other_id)
        comm = n.get("community", "?")
        comm_name = labels.get(str(comm), f"Community {comm}")
        src_file = n.get("source_file", "")
        groups[rel].append({
            "label": lbl,
            "id": other_id,
            "confidence": conf,
            "score": score,
            "community": comm_name,
            "source_file": src_file,
        })
    return dict(groups)


def format_explanation(node: dict, incoming: list, outgoing: list,
                       nodes_map: dict, labels: dict) -> str:
    """Format a structured explanation of a node."""
    nid = node.get("id", "?")
    label = node.get("label", "?")
    comm = node.get("community", "?")
    comm_name = labels.get(str(comm), f"Community {comm}")
    src_file = node.get("source_file", "")

    lines = []
    lines.append(f"# {label}")
    lines.append(f"")
    lines.append(f"**Node ID:** `{nid}`")
    lines.append(f"**Community:** {comm_name}")
    if src_file:
        lines.append(f"**File:** {src_file}")
    total = len(incoming) + len(outgoing)
    lines.append(f"**Connections:** {len(incoming)} incoming + {len(outgoing)} outgoing = {total}")
    lines.append(f"")

    # --- OUTGOING ---
    if outgoing:
        lines.append(f"## Outgoing ({label} -> ...)")
        _format_edge_group(outgoing, nodes_map, labels, nid, lines)

    # --- INCOMING ---
    if incoming:
        lines.append(f"")
        lines.append(f"## Incoming (... -> {label})")
        _format_edge_group(incoming, nodes_map, labels, nid, lines)

    # --- SOURCE FILE HINT ---
    if src_file and Path(src_file).exists():
        lines.append(f"")
        lines.append(f"## Source (ground truth)")
        lines.append(f"Read `{src_file}` for full implementation details.")
        lines.append(f"The graph above shows structure; the source shows semantics.")

    return "\n".join(lines)


def _format_edge_group(edges: list, nodes_map: dict, labels: dict,
                       focus_id: str, lines: list):
    """Format a group of edges, separating EXTRACTED from INFERRED."""
    # Separate by confidence
    extracted = [e for e in edges if e.get("confidence") == "EXTRACTED"]
    inferred = [e for e in edges if e.get("confidence") == "INFERRED"]
    ambiguous = [e for e in edges if e.get("confidence") == "AMBIGUOUS"]
    other = [e for e in edges if e not in extracted and e not in inferred and e not in ambiguous]

    # Group each by relation
    for conf_label, conf_edges, note in [
        ("Verified", extracted, ""),
        ("Hypotheses", inferred, " — verify before relying on these"),
        ("Uncertain", ambiguous, " — needs manual review"),
    ]:
        if not conf_edges:
            continue
        # Determine the "other" node for each edge
        by_rel = defaultdict(list)
        for e in conf_edges:
            other_id = e["target"] if e.get("source") == focus_id else e.get("source", e.get("target", ""))
            n = nodes_map.get(other_id, {})
            lbl = n.get("label", other_id)
            comm = n.get("community", "?")
            comm_name = labels.get(str(comm), f"Community {comm}")
            rel = e.get("relation", "unknown")
            score = e.get("confidence_score", 0)
            by_rel[rel].append((lbl, other_id, score, comm_name))

        lines.append(f"### {conf_label} ({len(conf_edges)}){note}")
        for rel, items in sorted(by_rel.items()):
            lines.append(f"  **{rel}** ({len(items)}):")
            for lbl, oid, score, comm_name in items:
                lines.append(f"    - {lbl} [{score}] ({comm_name})")

    if other:
        lines.append(f"### Other ({len(other)})")
        for e in other:
            other_id = e["target"] if e.get("source") == focus_id else e.get("source", e.get("target", ""))
            n = nodes_map.get(other_id, {})
            lbl = n.get("label", other_id)
            rel = e.get("relation", "unknown")
            lines.append(f"    - {lbl} --[{rel}]--")


def main():
    if len(sys.argv) < 3:
        print("Usage: python explain.py <graph.json> <node_name> [--labels <labels.json>]", file=sys.stderr)
        sys.exit(1)

    graph_path = sys.argv[1]
    query = sys.argv[2]
    labels_path = None
    top_n = 10

    i = 3
    while i < len(sys.argv):
        if sys.argv[i] == "--labels" and i + 1 < len(sys.argv):
            labels_path = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--top" and i + 1 < len(sys.argv):
            top_n = int(sys.argv[i + 1])
            i += 2
        else:
            i += 1

    data = load_graph(graph_path)
    labels = load_labels(labels_path)
    nodes_map = {n["id"]: n for n in data.get("nodes", [])}

    matches = find_nodes(data, query, fuzzy=True)
    if not matches:
        print(f"No nodes matching '{query}' found.", file=sys.stderr)
        # Suggest similar using fuzzy on all labels
        all_labels = [(n.get("label", n["id"]), n["id"]) for n in data["nodes"][:30]]
        from difflib import SequenceMatcher as SM
        scored = [(SM(None, query.lower(), lbl.lower()).ratio(), lbl, nid) for lbl, nid in all_labels]
        scored.sort(reverse=True)
        print(f"Did you mean: {scored[0][1]} (`{scored[0][2]}`)?", file=sys.stderr)
        sys.exit(1)

    best = pick_best_node(matches, data)
    incoming, outgoing = get_connections(data, best["id"])
    explanation = format_explanation(best, incoming, outgoing, nodes_map, labels)
    print(explanation)

    if len(matches) > 1:
        others = [(n, s) for n, s in matches if n["id"] != best["id"]]
        print(f"\n---\nOther matches ({len(others)}): ", end="")
        print(", ".join(f"`{n['id']}` [{s:.2f}]" for n, s in others[:top_n]))


if __name__ == "__main__":
    main()
