---
name: graphify-query-explain-lessons
description: Lessons learned querying and explaining nodes from graphify output (graph.json format, node ID disambiguation, explanation pipeline)
type: feedback
---

# Graphify Query/Explain — Pain Points and Solutions

## Rule: graph.json uses "links" not "edges" — always inspect structure first

**Why:** graphify's internal Python code uses `edges` throughout (extraction, merging, building). But `to_json()` exports via NetworkX's `node_link_data()` which uses `links` as the key. I wasted 2 queries assuming the key name without checking.

**How to apply:** Before querying graph.json, always run `list(data.keys())` or check for `links` vs `edges`. The exported format is: `{directed, multigraph, graph, nodes, links, hyperedges}`. Use `links` for edge queries.

## Rule: Node IDs are compound — file vs class vs rationale nodes share a prefix

**Why:** A single source file like `book_manager.py` produces multiple graph nodes: the file node (`book_manager`), the class node (`book_manager_bookmanager`), method nodes (`book_manager_bookmanager_init`), and rationale/docstring nodes (`book_manager_rationale_1`). Searching for "book" returns 52 nodes. The file-level node has few connections; the class-level node is the one with 62 edges.

**How to apply:** When looking up a node by name:
1. Search nodes by substring match on `id` or `label`
2. Disambiguate: prefer class/function nodes over file nodes (class nodes have more connections)
3. The pattern is `<filestem>_<entity>` for classes/functions, `<filestem>` for files, `<filestem>_rationale_<line>` for docstrings

## Rule: Group edges by relation type + confidence to separate structure from inference

**Why:** A god node like BookManager has 62 edges: 20 `method` (EXTRACTED=1.0) + 40 `uses` (INFERRED=0.5) + 1 `rationale_for` (EXTRACTED=1.0). Grouping by `relation` reveals what the node IS (methods) vs who DEPENDS on it (uses). The confidence score separates fact from inference.

**How to apply:** For any node explanation:
1. Get all links where source or target matches node ID
2. Group by `relation` field
3. Within each group, separate by `confidence` (EXTRACTED vs INFERRED vs AMBIGUOUS)
4. Map target node IDs to their community labels for human-readable consumer names
5. Read the source file for the top god nodes to add semantic depth beyond what the graph provides

## Rule: The graph is a map, not the territory

**Why:** The graph tells you structure (who connects to whom, relation types, confidence) but not semantics (what the code actually does). Method names hint at purpose but don't confirm it. The 40 INFERRED edges at confidence 0.5 are structural guesses, not verified dependencies.

**How to apply:** For high-value nodes (god nodes, bridge nodes), supplement the graph data by reading the actual source file. The graph answers "what exists and what's connected" — reading the source answers "what it actually does and why."

## Rule: The explain/query/path subcommands are stubs in the skill

**Why:** SKILL.md says "Identical to stock graphify. See upstream skill-windows.md" but there IS no upstream skill-windows.md. These commands have no implementation — they're placeholders. When a user asks "explain BookManager" or "summarize this project", the skill has no defined workflow for reading graph.json and presenting node details.

**How to apply:** Implement these subcommands properly in the SKILL.md with concrete Python code that reads graph.json, handles the `links` key, disambiguates node IDs, groups by relation, and reads source files for context.
