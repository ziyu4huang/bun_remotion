# Pipeline Steps 1-9

Full command details for the main graphify pipeline.

## Step 1 - Ensure graphify is installed and PYTHONUTF8 is set

```bash
python -c "import graphify" 2>/dev/null
if [ $? -ne 0 ]; then pip install graphifyy -q 2>&1 | tail -3; fi

# Verify UTF-8 mode — if this fails, set PYTHONUTF8=1 in your environment
python -c "from pathlib import Path; Path('/dev/null').write_text('test: ≤')" 2>/dev/null || echo "WARNING: PYTHONUTF8 not set — Unicode errors likely. Set: export PYTHONUTF8=1"
```

If the import succeeds and UTF-8 check passes, print nothing and move to Step 2.

## Step 2 - Detect files + patch unsupported extensions

```bash
python -c "
import json, graphify.detect as dm
from graphify.detect import detect
from pathlib import Path

# Patch: add unsupported language extensions before detection
# graphify v0.3.20 only supports ~25 languages natively
_EXTRA_CODE_EXTS = {
    '.v', '.sv',          # Verilog / SystemVerilog
    '.vhd', '.vhdl',      # VHDL
    '.hs',                 # Haskell
    '.ml', '.mli',         # OCaml
    '.ex', '.exs',         # Elixir (may already be supported)
    '.r', '.R',            # R
    '.m', '.mm',           # Objective-C (may already be supported)
    '.sc', '.scala',       # Scala (may already be supported)
}
dm.CODE_EXTENSIONS.update(_EXTRA_CODE_EXTS)

INPUT_PATH = 'INPUT_PATH'
result = detect(Path(INPUT_PATH))
print(json.dumps(result))
" > .graphify_detect.json
```

Replace INPUT_PATH with the actual path the user provided. Do NOT cat or print the JSON - read it silently and present a clean summary instead:

```
Corpus: X files · ~Y words
  code:     N files (.py .ts .go .v ...)
  docs:     N files (.md .txt ...)
  papers:   N files (.pdf ...)
  images:   N files
```

Then act on it:
- If `total_files` is 0: stop with "No supported files found in [path]."
- If `skipped_sensitive` is non-empty: mention file count skipped, not the file names.
- If `total_words` > 2,000,000 OR `total_files` > 200: show the warning and the top 5 subdirectories by file count, then ask which subfolder to run on. Wait for the user's answer before proceeding.
- Otherwise: proceed directly to Step 3 - no need to ask anything.

## Step 3 - Extract entities and relationships

**Before starting:** note whether `--mode deep` was given. You must pass `DEEP_MODE=true` to every subagent in Step B2 if it was. Track this from the original invocation - do not lose it.

This step has two parts: **structural extraction** (deterministic, free) and **semantic extraction** (Claude, costs tokens).

**Run Part A (AST) and Part B (semantic) in parallel. Dispatch all semantic subagents AND start AST extraction in the same message. Both can run simultaneously since they operate on different file types. Merge results in Part C as before.**

### Part A - Structural extraction for code files

**Windows enhancement:** This step patches graphify's internal extension sets AND handles unsupported languages via direct tree-sitter extraction.

```bash
python -c "
import sys, json
from pathlib import Path

# ── Patch graphify for unsupported languages ──
import graphify.detect as dm
import graphify.extract as ex

_EXTRA_EXTS = {'.v', '.sv', '.vhd', '.vhdl', '.hs', '.ml', '.mli', '.r', '.R'}
dm.CODE_EXTENSIONS.update(_EXTRA_EXTS)

# ── Detect which files need direct tree-sitter vs graphify's built-in ──
detect = json.loads(Path('.graphify_detect.json').read_text())
all_code_files = []
for f in detect.get('files', {}).get('code', []):
    p = Path(f)
    if p.is_dir():
        all_code_files.extend(sorted(p.rglob('*')))
    else:
        all_code_files.append(p)

# Separate into supported (graphify built-in) and unsupported
_BUILTIN_EXTS = {'.py','.js','.jsx','.ts','.tsx','.go','.rs','.java','.c','.h',
    '.cpp','.cc','.cxx','.hpp','.rb','.swift','.kt','.kts','.cs','.scala',
    '.php','.lua','.toc','.zig','.ps1','.ex','.exs','.m','.mm','.jl'}
unsupported = [f for f in all_code_files if f.suffix.lower() not in _BUILTIN_EXTS]
supported = [f for f in all_code_files if f.suffix.lower() in _BUILTIN_EXTS]

print(f'Supported: {len(supported)} files, Unsupported: {len(unsupported)} files')
if unsupported:
    print(f'Unsupported extensions: {sorted(set(f.suffix for f in unsupported))}')
" > .graphify_ext_check.json 2>&1 && cat .graphify_ext_check.json
```

**If there are no unsupported files**, run the standard graphify AST extraction:

```bash
python -c "
import sys, json
from graphify.extract import collect_files, extract
from pathlib import Path

detect = json.loads(Path('.graphify_detect.json').read_text())
code_files = []
for f in detect.get('files', {}).get('code', []):
    code_files.extend(collect_files(Path(f)) if Path(f).is_dir() else [Path(f)])

if code_files:
    result = extract(code_files)
    Path('.graphify_ast.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(f'AST: {len(result[\"nodes\"])} nodes, {len(result[\"edges\"])} edges')
else:
    Path('.graphify_ast.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}), encoding='utf-8')
    print('No code files - skipping AST extraction')
"
```

**If there ARE unsupported files** (e.g. `.v`, `.sv`), use the standalone extraction script:

```bash
SKILL_DIR=.claude/skills/graphify-windows-local
python $SKILL_DIR/scripts/extract_enhanced.py .graphify_detect.json -o .graphify_ast.json
```

The script automatically:
- Separates supported files (graphify built-in) from unsupported files (direct tree-sitter)
- Runs graphify's `extract()` for supported languages
- Runs tree-sitter directly for unsupported languages via `EXT_TO_PARSER` config
- Deduplicates nodes and writes the merged AST result

### Part B - Semantic extraction (parallel subagents)

**Fast path:** If detection found zero docs, papers, and images (code-only corpus), skip Part B entirely and go straight to Part C. AST handles code - there is nothing for semantic subagents to do.

**MANDATORY: You MUST use the Agent tool here. Reading files yourself one-by-one is forbidden - it is 5-10x slower. If you do not use the Agent tool you are doing this wrong.**

Before dispatching subagents, print a timing estimate:
- Load `total_words` and file counts from `.graphify_detect.json`
- Estimate agents needed: `ceil(uncached_non_code_files / 22)` (chunk size is 20-25)
- Estimate time: ~45s per agent batch (they run in parallel, so total ~ 45s x ceil(agents/parallel_limit))
- Print: "Semantic extraction: ~N files -> X agents, estimated ~Ys"

**Step B0 - Check extraction cache first**

```bash
python -c "
import json
from graphify.cache import check_semantic_cache
from pathlib import Path

detect = json.loads(Path('.graphify_detect.json').read_text())
all_files = [f for files in detect['files'].values() for f in files]

cached_nodes, cached_edges, cached_hyperedges, uncached = check_semantic_cache(all_files)

if cached_nodes or cached_edges or cached_hyperedges:
    Path('.graphify_cached.json').write_text(json.dumps({'nodes': cached_nodes, 'edges': cached_edges, 'hyperedges': cached_hyperedges}), encoding='utf-8')
Path('.graphify_uncached.txt').write_text('\n'.join(uncached))
print(f'Cache: {len(all_files)-len(uncached)} files hit, {len(uncached)} files need extraction')
"
```

Only dispatch subagents for files listed in `.graphify_uncached.txt`. If all files are cached, skip to Part C directly.

**Step B1 - Split into chunks**

Load files from `.graphify_uncached.txt`. Split into chunks of 20-25 files each. Each image gets its own chunk.

**Step B2 - Dispatch ALL subagents in a single message**

Call the Agent tool multiple times IN THE SAME RESPONSE - one call per chunk.

Each subagent receives this prompt (substitute FILE_LIST, CHUNK_NUM, TOTAL_CHUNKS, DEEP_MODE):

```
You are a graphify extraction subagent. Read the files listed and extract a knowledge graph fragment.
Output ONLY valid JSON matching the schema below - no explanation, no markdown fences, no preamble.

Files (chunk CHUNK_NUM of TOTAL_CHUNKS):
FILE_LIST

Rules:
- EXTRACTED: relationship explicit in source (import, call, citation, "see 3.2")
- INFERRED: reasonable inference (shared data structure, implied dependency)
- AMBIGUOUS: uncertain - flag for review, do not omit

Code files: focus on semantic edges AST cannot find (call relationships, shared data, arch patterns).
  Do not re-extract imports - AST already has those.
Doc/paper files: extract named concepts, entities, citations. Also extract rationale.
Image files: use vision to understand what the image IS - do not just OCR.

DEEP_MODE (if --mode deep was given): be aggressive with INFERRED edges.

confidence_score is REQUIRED on every edge:
- EXTRACTED: confidence_score = 1.0 always
- INFERRED: 0.6-0.9 (reason about each individually)
- AMBIGUOUS: 0.1-0.3

Output exactly this JSON (no other text):
{"nodes":[{"id":"filestem_entityname","label":"Human Readable Name","file_type":"code|document|paper|image","source_file":"relative/path","source_location":null}],"edges":[{"source":"node_id","target":"node_id","relation":"calls|implements|references|cites|conceptually_related_to|shares_data_with|semantically_similar_to|rationale_for","confidence":"EXTRACTED|INFERRED|AMBIGUOUS","confidence_score":1.0,"source_file":"relative/path","source_location":null,"weight":1.0}],"hyperedges":[{"id":"snake_case_id","label":"Human Readable Label","nodes":["node_id1","node_id2","node_id3"],"relation":"participate_in|implement|form","confidence":"EXTRACTED|INFERRED","confidence_score":0.75,"source_file":"relative/path"}],"input_tokens":0,"output_tokens":0}
```

**Step B3 - Collect, cache, and merge**

Save new results to cache:
```bash
python -c "
import json
from graphify.cache import save_semantic_cache
from pathlib import Path

new = json.loads(Path('.graphify_semantic_new.json').read_text()) if Path('.graphify_semantic_new.json').exists() else {'nodes':[],'edges':[],'hyperedges':[]}
saved = save_semantic_cache(new.get('nodes', []), new.get('edges', []), new.get('hyperedges', []))
print(f'Cached {saved} files')
"
```

Merge cached + new results into `.graphify_semantic.json`:
```bash
python -c "
import json
from pathlib import Path

cached = json.loads(Path('.graphify_cached.json').read_text()) if Path('.graphify_cached.json').exists() else {'nodes':[],'edges':[],'hyperedges':[]}
new = json.loads(Path('.graphify_semantic_new.json').read_text()) if Path('.graphify_semantic_new.json').exists() else {'nodes':[],'edges':[],'hyperedges':[]}

all_nodes = cached['nodes'] + new.get('nodes', [])
all_edges = cached['edges'] + new.get('edges', [])
all_hyperedges = cached.get('hyperedges', []) + new.get('hyperedges', [])
seen = set()
deduped = []
for n in all_nodes:
    if n['id'] not in seen:
        seen.add(n['id'])
        deduped.append(n)

merged = {
    'nodes': deduped,
    'edges': all_edges,
    'hyperedges': all_hyperedges,
    'input_tokens': new.get('input_tokens', 0),
    'output_tokens': new.get('output_tokens', 0),
}
Path('.graphify_semantic.json').write_text(json.dumps(merged, indent=2), encoding='utf-8')
print(f'Extraction complete - {len(deduped)} nodes, {len(all_edges)} edges')
"
rm -f .graphify_cached.json .graphify_uncached.txt .graphify_semantic_new.json
```

### Part C - Merge AST + semantic into final extraction

```bash
python -c "
import sys, json
from pathlib import Path

ast = json.loads(Path('.graphify_ast.json').read_text())
sem = json.loads(Path('.graphify_semantic.json').read_text())

seen = {n['id'] for n in ast['nodes']}
merged_nodes = list(ast['nodes'])
for n in sem['nodes']:
    if n['id'] not in seen:
        merged_nodes.append(n)
        seen.add(n['id'])

merged_edges = ast['edges'] + sem['edges']
merged_hyperedges = sem.get('hyperedges', [])
merged = {
    'nodes': merged_nodes,
    'edges': merged_edges,
    'hyperedges': merged_hyperedges,
    'input_tokens': sem.get('input_tokens', 0),
    'output_tokens': sem.get('output_tokens', 0),
}
Path('.graphify_extract.json').write_text(json.dumps(merged, indent=2), encoding='utf-8')
total = len(merged_nodes)
edges = len(merged_edges)
print(f'Merged: {total} nodes, {edges} edges ({len(ast[\"nodes\"])} AST + {len(sem[\"nodes\"])} semantic)')
"
```

## Step 4 - Build graph, cluster, analyze, generate outputs

```bash
mkdir -p graphify-out
python -c "
import sys, json
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json
from pathlib import Path

extraction = json.loads(Path('.graphify_extract.json').read_text())
detection  = json.loads(Path('.graphify_detect.json').read_text())

G = build_from_json(extraction)
communities = cluster(G)
cohesion = score_all(G, communities)
tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}
gods = god_nodes(G)
surprises = surprising_connections(G, communities)
labels = {cid: 'Community ' + str(cid) for cid in communities}
questions = suggest_questions(G, communities, labels)

report = generate(G, communities, cohesion, labels, gods, surprises, detection, tokens, 'INPUT_PATH', suggested_questions=questions)
Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')
to_json(G, communities, 'graphify-out/graph.json')

analysis = {
    'communities': {str(k): v for k, v in communities.items()},
    'cohesion': {str(k): v for k, v in cohesion.items()},
    'gods': gods,
    'surprises': surprises,
    'questions': questions,
}
Path('.graphify_analysis.json').write_text(json.dumps(analysis, indent=2), encoding='utf-8')
if G.number_of_nodes() == 0:
    print('ERROR: Graph is empty - extraction produced no nodes.')
    raise SystemExit(1)
print(f'Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities')
"
```

If this step prints `ERROR: Graph is empty`, stop and tell the user what happened.

Replace INPUT_PATH with the actual path.

## Step 5 - Label communities

Read `.graphify_analysis.json`. For each community key, look at its node labels and write a 2-5 word plain-language name.

Then regenerate the report and save the labels:

```bash
python -c "
import sys, json
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from pathlib import Path

extraction = json.loads(Path('.graphify_extract.json').read_text())
detection  = json.loads(Path('.graphify_detect.json').read_text())
analysis   = json.loads(Path('.graphify_analysis.json').read_text())

G = build_from_json(extraction)
communities = {int(k): v for k, v in analysis['communities'].items()}
cohesion = {int(k): v for k, v in analysis['cohesion'].items()}
tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}

labels = LABELS_DICT

questions = suggest_questions(G, communities, labels)

report = generate(G, communities, cohesion, labels, analysis['gods'], analysis['surprises'], detection, tokens, 'INPUT_PATH', suggested_questions=questions)
Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')
Path('.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}), encoding='utf-8')
Path('graphify-out/.labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}), encoding='utf-8')
print('Report updated with community labels')
"
```

Replace `LABELS_DICT` and `INPUT_PATH`.

## Step 6 - Generate HTML

```bash
python -c "
import sys, json
from graphify.build import build_from_json
from graphify.export import to_html
from pathlib import Path

extraction = json.loads(Path('.graphify_extract.json').read_text())
analysis   = json.loads(Path('.graphify_analysis.json').read_text())
labels_raw = json.loads(Path('.graphify_labels.json').read_text()) if Path('.graphify_labels.json').exists() else {}

G = build_from_json(extraction)
communities = {int(k): v for k, v in analysis['communities'].items()}
labels = {int(k): v for k, v in labels_raw.items()}

if G.number_of_nodes() > 5000:
    print(f'Graph has {G.number_of_nodes()} nodes - too large for HTML viz.')
else:
    to_html(G, communities, 'graphify-out/graph.html', community_labels=labels or None)
    print('graph.html written')
"
```

## Step 7 - Optional exports

**SVG** (if --svg): add `from graphify.export import to_svg` and call `to_svg(G, communities, 'graphify-out/graph.svg', community_labels=labels)`.

**GraphML** (if --graphml): add `from graphify.export import to_graphml` and call `to_graphml(G, communities, 'graphify-out/graph.graphml')`.

**Neo4j** (if --neo4j): add `from graphify.export import to_cypher` and call `to_cypher(G, 'graphify-out/cypher.txt')`.

**MCP** (if --mcp): run `python -m graphify.serve graphify-out/graph.json`.

## Step 8 - Token benchmark (only if total_words > 5000)

Skip if total_words <= 5000.

## Step 9 - Save manifest, clean up, report

```bash
python -c "
import json
from pathlib import Path
from datetime import datetime, timezone
from graphify.detect import save_manifest

detect = json.loads(Path('.graphify_detect.json').read_text())
save_manifest(detect['files'])

extract = json.loads(Path('.graphify_extract.json').read_text())
input_tok = extract.get('input_tokens', 0)
output_tok = extract.get('output_tokens', 0)

cost_path = Path('graphify-out/cost.json')
if cost_path.exists():
    cost = json.loads(cost_path.read_text(encoding='utf-8'))
else:
    cost = {'runs': [], 'total_input_tokens': 0, 'total_output_tokens': 0}

cost['runs'].append({
    'date': datetime.now(timezone.utc).isoformat(),
    'input_tokens': input_tok,
    'output_tokens': output_tok,
    'files': detect.get('total_files', 0),
})
cost['total_input_tokens'] += input_tok
cost['total_output_tokens'] += output_tok
cost_path.write_text(json.dumps(cost, indent=2), encoding='utf-8')

print(f'This run: {input_tok:,} input tokens, {output_tok:,} output tokens')
print(f'All time: {cost[\"total_input_tokens\"]:,} input, {cost[\"total_output_tokens\"]:,} output ({len(cost[\"runs\"])} runs)')
"
rm -f .graphify_detect.json .graphify_extract.json .graphify_ast.json .graphify_semantic.json .graphify_analysis.json .graphify_labels.json .graphify_ext_check.json
rm -f graphify-out/.needs_update
```

**Generate CODEBASE_MAP.md** (compact agent-readable summary):

```bash
export PYTHONUTF8=1
SKILL_DIR=.claude/skills/graphify-windows-local
python $SKILL_DIR/scripts/codebase_map.py graphify-out/graph.json --labels graphify-out/.labels.json --output graphify-out/CODEBASE_MAP.md
# Also save to agent memory for auto-loading
mkdir -p .agent/memory/project
cp graphify-out/CODEBASE_MAP.md .agent/memory/project/codebase-map.md
```

Tell the user:
```
Graph complete. Outputs in PATH_TO_DIR/graphify-out/

  graph.html            - interactive graph, open in browser
  GRAPH_REPORT.md       - full audit report
  graph.json            - raw graph data
  CODEBASE_MAP.md       - compact agent-readable summary (also in .agent/memory/project/)
```

Then paste these sections from GRAPH_REPORT.md:
- God Nodes
- Surprising Connections
- Suggested Questions

Then immediately offer to explore the most interesting question.
