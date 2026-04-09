#!/usr/bin/env python3
"""Explain how graphify works — on-demand internal documentation.

Usage:
    python explain_how_it_works.py [topic]

Topics (can be abbreviated, e.g. "cache" or "c"):
    pipeline     — full pipeline overview (default)
    cache        — SHA256 content-hash change detection
    extract      — AST extraction (code) + semantic extraction (Claude)
    cluster      — Leiden community detection + cohesion scoring
    analyze      — god nodes, surprising connections, graph diff
    build        — graph construction from extraction JSON
    export       — graph.json format, HTML, SVG, GraphML
    graphjson    — node_link format reference (links vs edges, node IDs)

If no topic given, shows the full pipeline overview.
"""

import sys
import inspect


TOPICS = {
    "pipeline": """
# How Graphify Works — Full Pipeline

```
Input files → Detect → Extract (AST + Semantic) → Build Graph → Cluster → Analyze → Export
                    ↓                        ↓
               .graphify_detect.json    .graphify_extract.json
                                              ↓
                                    graphify-out/
                                      graph.json      (NetworkX node_link format)
                                      graph.html      (interactive D3 visualization)
                                      GRAPH_REPORT.md (audit report)
                                      CODEBASE_MAP.md (compact agent-readable summary)
                                      cache/          (SHA256-keyed extraction cache)
```

## Step 1 — Detect (`graphify.detect`)
Walks the directory tree, classifies each file into CODE / DOCUMENT / PAPER / IMAGE
based on extension. Respects `.graphifyignore` (like gitignore). Outputs file list + word count.

## Step 2 — Extract (two parallel tracks)

**Track A — AST (structural, free, deterministic):**
For code files, uses tree-sitter to parse the AST and extract:
  - Nodes: classes, functions, methods, imports, variables
  - Edges: `contains`, `imports`, `calls`, `implements`
  - Language-specific extractors for 20+ languages (Python, JS, Go, Rust, etc.)

**Track B — Semantic (Claude, costs tokens):**
For docs/papers/images, dispatches Claude subagents to read files and extract:
  - Named concepts, entities, citations
  - Rationale (why code exists, not just what it does)
  - Confidence scoring: EXTRACTED (1.0), INFERRED (0.6-0.9), AMBIGUOUS (0.1-0.3)
  - Results are cached per-file in graphify-out/cache/{sha256}.json

## Step 3 — Merge
AST nodes + semantic nodes are deduplicated by ID and merged into one extraction.

## Step 4 — Build (`graphify.build`)
Converts extraction JSON into a NetworkX Graph (undirected).
  - Dangling edges (imports to stdlib/external packages) are silently dropped.
  - Edge direction is preserved via `_src`/`_tgt` attributes for display.

## Step 5 — Cluster (`graphify.cluster`)
Runs **Leiden community detection** to find tightly-connected node groups.
  - Isolated nodes (degree=0) become singleton communities.
  - Oversized communities (>25% of graph, min 10 nodes) are split with a second Leiden pass.
  - Community IDs are stable across runs (0 = largest community).

## Step 6 — Analyze (`graphify.analyze`)
  - **God nodes**: top-N most-connected non-file nodes (core abstractions).
  - **Surprising connections**: cross-file INFERRED/AMBIGUOUS edges (non-obvious couplings).
  - **Suggested questions**: auto-generated questions about the graph structure.
  - **Cohesion**: ratio of actual intra-community edges to maximum possible.

## Step 7 — Export
  - `graph.json`: NetworkX `node_link_data()` format (see: `explain-how-it-works graphjson`)
  - `graph.html`: interactive D3 force-directed graph with community colors
  - `GRAPH_REPORT.md`: full audit report with god nodes, surprises, questions
  - `CODEBASE_MAP.md`: compact summary for agent consumption
""".strip(),

    "cache": """
# How Graphify Cache Works — SHA256 Content-Hash Change Detection

## Where
```
graphify-out/cache/{sha256}.json
```
Each file is one cache entry. The filename IS the hash — no separate index.

## Hash Algorithm
```python
def file_hash(path):
    h = SHA256()
    h.update(file_contents)        # what the file contains
    h.update(b"\\x00")             # separator (prevents boundary collision)
    h.update(absolute_path)        # where the file lives
    return h.hexdigest()           # e.g. "47d51259..."
```

**Why include the path?** Two files with identical content at different locations
serve different roles. `src/config.py` and `tests/config.py` get separate entries.

## Change Detection
```python
def load_cached(path):
    current_hash = file_hash(path)         # recompute NOW
    entry = f"graphify-out/cache/{current_hash}.json"
    if exists(entry): return load(entry)   # hit → file unchanged
    return None                            # miss → file changed or new
```

If you edit a file, its content hash changes → the old cache entry becomes an orphan
(harmless, not auto-cleaned). A new entry is created on next extraction.

## Write Safety
```python
def save_cached(path, result):
    entry = f"cache/{file_hash(path)}.json"
    write(entry + ".tmp", result)          # write to temp first
    os.replace(tmp, entry)                 # atomic rename
```
Atomic write prevents corrupted cache if the process crashes mid-write.

## Batch Check (used by --update)
```python
def check_semantic_cache(files):
    cached_nodes, cached_edges = [], []
    uncached = []
    for file in files:
        result = load_cached(file)
        if result:
            cached_nodes += result.nodes   # free — loaded from disk
            cached_edges += result.edges
        else:
            uncached.append(file)          # needs Claude extraction
    return cached_nodes, cached_edges, uncached
```

## Key Behaviors
- **Content-based, not timestamp-based**: `touch file.py` does NOT invalidate cache
- **Moving a file invalidates it**: different path = different hash
- **No expiration**: cache lives until you run `clear_cache()` or delete the directory
- **Per-file granularity**: if 1 of 100 files changes, only that file is re-extracted
""".strip(),

    "extract": """
# How Graphify Extraction Works — AST + Semantic

## Two Parallel Tracks

### Track A — AST Extraction (structural, free, deterministic)

Uses **tree-sitter** to parse source code into an AST, then extracts nodes and edges.

**Supported languages (20+):**
Python, JavaScript, TypeScript, Go, Rust, Java, C, C++, C#, Ruby, Swift, Kotlin,
PHP, Lua, Zig, PowerShell, Elixir, Scala, Julia, Objective-C

**Nodes extracted:**
| Node type | ID pattern | Example |
|-----------|-----------|---------|
| File | `<filestem>` | `book_manager` |
| Class | `<filestem>_<classname>` | `book_manager_BookManager` |
| Method | `<filestem>_<class>_<method>` | `book_manager_BookManager___init__` |
| Function | `<filestem>_<funcname>` | `story_studio_get_generator` |
| Import | `<filestem>_import_<module>` | `story_studio_import_fastapi` |

**Edges extracted:**
| Relation | Meaning | Source |
|----------|---------|--------|
| `contains` | file contains class/function | AST parent-child |
| `imports` | file imports a module | AST import statement |
| `calls` | function calls another | AST call expression |
| `implements` | class implements interface | AST inheritance |

**Limitation:** AST cannot extract semantic relationships — it doesn't know WHY
two functions are related, only that one calls the other.

### Track B — Semantic Extraction (Claude, costs tokens)

Dispatches **Claude subagents** to read docs/papers/images and extract meaning.

**What it extracts that AST cannot:**
- Rationale: why does this code exist? (stored as `_rationale_<line>` nodes)
- Shared data structures: two files both use `SegmentSpec` (INFERRED edge)
- Architectural patterns: "this is a factory pattern" (INFERRED edge)
- Citation chains in papers
- Visual content from images (not just OCR)

**Confidence scoring:**
| Confidence | Score | Meaning |
|-----------|-------|---------|
| EXTRACTED | 1.0 | Explicit in source (import, call, citation) |
| INFERRED | 0.6-0.9 | Reasonable inference (shared data, implied dependency) |
| AMBIGUOUS | 0.1-0.3 | Uncertain — flagged for human review |

**Caching:** Results are saved per-file in `graphify-out/cache/{sha256}.json`.
On `--update`, only files whose hash changed are re-extracted by Claude.

### Merge
AST and semantic results are merged by deduplicating on node ID. If both tracks
extract the same node (e.g., a class), the AST version is kept (more precise).
Semantic edges are appended — they add relationships AST cannot find.
""".strip(),

    "cluster": """
# How Graphify Clustering Works — Leiden Community Detection

## Algorithm: Leiden
Uses the **Leiden algorithm** (successor to Louvain) for community detection.

**How it works (simplified):**
1. Start with each node in its own community
2. Repeatedly move nodes to neighboring communities if it improves "modularity"
   (a score measuring how dense intra-community edges are vs expected)
3. Aggregate communities into super-nodes and repeat
4. Refine: split communities that are not well-connected internally

**Properties:**
- Produces stable community IDs across runs (0 = largest community after splitting)
- Handles isolated nodes (degree=0) as singleton communities
- Oversized communities (>25% of graph, min 10 nodes) are split with a second pass

## Cohesion Score
```python
cohesion = actual_intra_edges / max_possible_intra_edges
         = actual / (n * (n-1) / 2)
```

| Cohesion | Meaning |
|----------|---------|
| 1.0 | Fully connected clique (every node linked to every other) |
| 0.5 | Half of possible edges exist |
| 0.0 | No internal edges (shouldn't happen after clustering) |

## What Communities Mean
A community is a group of nodes that are more connected to each other than to
nodes outside the group. In a codebase, this typically corresponds to:

- **A module/subsystem** (e.g., all nodes from `mlx_tts/webui.py` → "WebUI Server")
- **A feature** (e.g., all TTS-related classes → "MLX TTS Engine")
- **A test suite** (e.g., all test functions → "E2E Test Suite")

## Cross-Boundary Edges
Edges between communities reveal **coupling** between subsystems.

Example from this project:
```
MLX TTS Engine: 45 internal, 53 external (54% cross-boundary)
```
This means the TTS Engine's data models (SegmentSpec, ProduceRequest) are used
by 5 other communities. It's the most coupled subsystem — changing it will
ripple across the codebase.

Compare with:
```
Remotion Compositions: 23 internal, 1 external (4% cross-boundary)
```
Completely isolated — can be refactored independently.
""".strip(),

    "analyze": """
# How Graphify Analysis Works — God Nodes, Surprises, Diff

## God Nodes
Top-N most-connected nodes, **excluding file-level nodes** (file nodes accumulate
import/contains edges mechanically and don't represent meaningful abstractions).

```python
def god_nodes(G, top_n=10):
    degree = dict(G.degree())              # count connections per node
    sorted_nodes = sorted(degree, reverse=True)
    return top-N non-file nodes
```

**What "god node" means:** A class or function that many other things depend on.
It's a core abstraction — changing it has high blast radius.

Example: `BookManager` (62 edges) — used by Story Studio, WebUI, CLI, Voice Analyzer.

## Surprising Connections
Finds edges that are NOT obvious from file structure.

**Multi-file corpora:** cross-file INFERRED/AMBIGUOUS edges sorted by surprise.
These are semantic relationships Claude inferred that aren't in the AST.

**Single-file corpora:** cross-community edges with high betweenness centrality.
These reveal non-obvious structural couplings.

Example: "TTSGenerator uses SegmentSpec" is EXTRACTED (obvious from import).
But "BookManager conceptually depends on ProduceRequest" might be INFERRED
(same data structure pattern, implied by shared function signatures).

## Graph Diff
Compares two graph snapshots (old vs new):

```python
def graph_diff(G_old, G_new):
    new_nodes = G_new.nodes - G_old.nodes
    removed_nodes = G_old.nodes - G_new.nodes
    new_edges = G_new.edges - G_old.edges   # compared by (src, tgt, relation)
    removed_edges = G_old.edges - G_new.edges
```

Used by `--diff` to show what changed between runs:
- New files added (new nodes)
- Deleted files (removed nodes)
- New dependencies (new edges)
- Community migrations (nodes that changed community)
- New god nodes (nodes that became highly connected)

## Suggested Questions
Auto-generates questions about the graph that an agent might want to explore:
- "What connects Community A and Community B?"
- "Which node has the most cross-community edges?"
- "What would break if X was removed?"
""".strip(),

    "build": """
# How Graphify Builds Graphs — Extraction JSON → NetworkX

## Input Format
```json
{
  "nodes": [
    {"id": "book_manager", "label": "book_manager.py", "file_type": "code",
     "source_file": "mlx_tts/book_manager.py", "source_location": "L1"},
    {"id": "book_manager_BookManager", "label": "BookManager", ...}
  ],
  "edges": [
    {"source": "book_manager", "target": "book_manager_BookManager",
     "relation": "contains", "confidence": "EXTRACTED", "confidence_score": 1.0}
  ],
  "hyperedges": [
    {"id": "tts_pipeline", "label": "TTS Pipeline", "nodes": ["A", "B", "C"],
     "relation": "participate_in"}
  ]
}
```

## Build Process
```python
def build_from_json(extraction):
    G = nx.Graph()                          # undirected graph
    for node in extraction.nodes:
        G.add_node(node["id"], **attributes)
    for edge in extraction.edges:
        if edge.source not in G or edge.target not in G:
            continue                        # skip dangling edges (stdlib imports)
        edge._src = source                  # preserve direction for display
        edge._tgt = target
        G.add_edge(source, target, **attributes)
    return G
```

**Key decisions:**
- **Undirected graph**: `A → B` and `B → A` are the same edge. Direction is stored
  as `_src`/`_tgt` attributes for display purposes only.
- **Dangling edges dropped**: imports to `os`, `json`, `React` etc. have no
  corresponding node in the graph and are silently skipped.
- **Node attributes preserved**: community, source_file, file_type, label all
  become node attributes in NetworkX.

## Hyperedges
Stored on the graph object itself (not as standard NetworkX edges):
```python
G.graph["hyperedges"] = [{"id": "...", "nodes": ["A", "B", "C"], ...}]
```
Used to represent n-ary relationships (e.g., "A, B, C all participate in pipeline X").
""".strip(),

    "export": """
# How Graphify Exports — Output Formats

## graph.json (node_link format)
NetworkX `node_link_data()` — the primary data format.

```json
{
  "directed": false,
  "multigraph": false,
  "graph": {"hyperedges": [...]},
  "nodes": [{"id": "...", "label": "...", "community": 0, "source_file": "..."}],
  "links": [{"source": "A", "target": "B", "relation": "...", "confidence": "EXTRACTED",
             "confidence_score": 1.0, "weight": 1.0, "_src": "A", "_tgt": "B"}]
}
```

**CRITICAL:** Edges are `links`, NOT `edges`. Node IDs are strings.

## graph.html (interactive visualization)
D3.js force-directed graph with:
- Nodes colored by community
- Node size proportional to edge count
- Hover tooltips with label + community name
- Click to highlight connections
- Max 5000 nodes (too many = browser lag)

## GRAPH_REPORT.md (audit report)
Markdown report with:
- God nodes (most connected)
- Surprising connections (non-obvious couplings)
- Suggested questions
- Community overview with cohesion scores
- Token cost tracking

## CODEBASE_MAP.md (agent-readable summary)
Compact markdown designed for agent consumption:
- Architecture summary
- God nodes with file paths
- Community overview
- Cross-community bridges
- Quick answers

## Other formats
- `graph.svg` — static SVG image (good for docs)
- `graph.graphml` — Gephi/yEd import format
- `cypher.txt` — Neo4j Cypher statements
""".strip(),

    "graphjson": """
# graph.json Format Reference

## Structure
```json
{
  "directed": false,
  "multigraph": false,
  "graph": {},
  "nodes": [...],
  "links": [...],
  "hyperedges": [...]
}
```

## Edges are "links" NOT "edges"
The JSON uses NetworkX `node_link_data()` format. Edge key is `links`.
If you try to access `data["edges"]` you'll get nothing — use `data["links"]`.

## Node Properties
| Key | Type | Meaning |
|-----|------|---------|
| `id` | string | Unique identifier (compound: `filestem_class_method`) |
| `label` | string | Human-readable display name |
| `community` | int | Community ID (map via `.labels.json`) |
| `file_type` | string | `code`, `document`, `paper`, or `image` |
| `source_file` | string | Relative path to source file |
| `source_location` | string/null | Line number or range (e.g., `"L42"`, `"L10-25"`) |

## Link Properties
| Key | Type | Meaning |
|-----|------|---------|
| `source` | string | Source node ID |
| `target` | string | Target node ID |
| `relation` | string | `calls`, `contains`, `imports`, `implements`, `references`, etc. |
| `confidence` | string | `EXTRACTED`, `INFERRED`, or `AMBIGUOUS` |
| `confidence_score` | float | 1.0=EXTRACTED, 0.6-0.9=INFERRED, 0.1-0.3=AMBIGUOUS |
| `weight` | float | Edge weight (default 1.0) |
| `_src` | string | Original source (for display direction) |
| `_tgt` | string | Original target (for display direction) |

## Node ID Convention
| Node type | ID pattern | Example |
|-----------|-----------|---------|
| File | `<filestem>` | `book_manager` |
| Class | `<filestem>_<classname>` | `book_manager_BookManager` |
| Method | `<filestem>_<class>_<method>` | `book_manager_BookManager___init__` |
| Function | `<filestem>_<funcname>` | `cli_main` |
| Rationale | `<filestem>_rationale_<line>` | `book_manager_rationale_1` |

**When looking up a node by name, prefer class/function nodes.**
File nodes are containers with few edges. Rationale nodes are docstring fragments.
""".strip(),
}


def find_topic(query: str) -> str | None:
    """Match query to a topic (supports abbreviations and substrings)."""
    query_lower = query.lower().strip()
    # Exact match
    if query_lower in TOPICS:
        return query_lower
    # Abbreviation / substring match
    for key in TOPICS:
        if key.startswith(query_lower) or query_lower in key:
            return key
    return None


def main():
    topic = sys.argv[1] if len(sys.argv) > 1 else "pipeline"
    matched = find_topic(topic)

    if matched is None:
        print(f"Unknown topic: '{topic}'", file=sys.stderr)
        print(f"Available: {', '.join(TOPICS.keys())}", file=sys.stderr)
        sys.exit(1)

    print(TOPICS[matched])
    print()
    print(f"---")
    print(f"Source: graphify v0.3.20 | Topic: {matched}")
    print(f"Other topics: {', '.join(TOPICS.keys())}")


if __name__ == "__main__":
    main()
