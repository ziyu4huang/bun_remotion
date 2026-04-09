---
name: graphify-windows-local
description: any input (code, docs, papers, images) to knowledge graph to clustered communities to HTML + JSON + audit report (Windows-enhanced with unsupported language support)
trigger: /graphify-windows
---

# /graphify-windows (Windows-Enhanced)

Enhanced version of graphify for Windows. Adds:
- **PYTHONUTF8=1** — set this env var to fix cp950/cp1252 encoding globally (eliminates need for `encoding='utf-8'` on every write)
- **Unsupported language support** (.v, .sv, .vhd, .vhdl, etc.) via direct tree-sitter extraction
- **Bash commands** (not PowerShell) — matches this project's shell config
- **Standalone extraction script** at `scripts/extract_enhanced.py` — avoids heredoc quoting issues

## Prerequisites

```bash
# Ensure PYTHONUTF8 is set (fixes Windows Unicode encoding globally)
# Add to PowerShell profile ($PROFILE) or set system-wide:
#   $env:PYTHONUTF8 = "1"
#   setx PYTHONUTF8 1
python -c "from pathlib import Path; Path('.test_enc.txt').write_text('test: ≤ ≥ →'); print('UTF-8 OK')" && rm .test_enc.txt
```

## Usage

```
/graphify-windows <path>                              # full pipeline on specific path
/graphify-windows <path> --mode deep                  # thorough extraction, richer INFERRED edges
/graphify-windows <path> --no-viz                     # skip visualization, just report + JSON
/graphify-windows <path> --svg                        # also export graph.svg
/graphify-windows <path> --graphml                    # export graph.graphml (Gephi, yEd)
/graphify-windows <path> --summarize                  # skip pipeline, regenerate CODEBASE_MAP.md only
/graphify-windows <path> --claudemd                   # generate compact CLAUDE.md section from existing graph
/graphify-windows <path> --diff                       # compare current run vs previous (saves baseline)
/graphify-windows <path> --quick                      # skip unchanged files via cache, merge only new
/graphify-windows query "<question>"                  # BFS traversal
/graphify-windows path "NodeA" "NodeB"                # shortest path
/graphify-windows explain "NodeName"                  # node explanation (fuzzy search, one-shot script)
```

## What You Must Do When Invoked

If no path was given, use `.` (current directory). Do not ask the user for a path.

**Early exit for `--summarize`:** If `--summarize` was given, skip Steps 1-8. Go directly to generating CODEBASE_MAP.md:

```bash
export PYTHONUTF8=1
SKILL_DIR=.claude/skills/graphify-windows-local
python $SKILL_DIR/scripts/codebase_map.py graphify-out/graph.json --labels graphify-out/.labels.json --output graphify-out/CODEBASE_MAP.md
# Also save to agent memory
cp graphify-out/CODEBASE_MAP.md .agent/memory/project/codebase-map.md
```

Then show the contents of CODEBASE_MAP.md and stop.

**Early exit for `--claudemd`:** If `--claudemd` was given, skip Steps 1-8. Generate a compact section for CLAUDE.md:

```bash
export PYTHONUTF8=1
SKILL_DIR=.claude/skills/graphify-windows-local
python $SKILL_DIR/scripts/codebase_map.py graphify-out/graph.json --labels graphify-out/.labels.json --claudemd
```

Show the output and suggest the user paste it into CLAUDE.md. Stop.

**Early exit for `--diff`:** If `--diff` was given, compare current graph against the previous run's baseline:

```bash
export PYTHONUTF8=1
SKILL_DIR=.claude/skills/graphify-windows-local
BASELINE=graphify-out/graph.json.bak
CURRENT=graphify-out/graph.json
if [ ! -f "$BASELINE" ]; then
    echo "No previous baseline found. Copying current graph as baseline."
    cp "$CURRENT" "$BASELINE"
    echo "Run --diff again after making code changes to see what changed."
else
    python $SKILL_DIR/scripts/graph_diff.py "$BASELINE" "$CURRENT" --labels graphify-out/.labels.json
    # Update baseline for next diff
    cp "$CURRENT" "$BASELINE"
fi
```

Show the diff report. If there are CLAUDE.md update suggestions, offer to apply them. Stop.

**`--quick` flag:** If `--quick` was given, modify Step 3 to use the cache module. Before Part B (semantic extraction), check which files have changed:

```bash
python -c "
import json
from graphify.cache import cached_files, file_hash
from pathlib import Path

detect = json.loads(Path('.graphify_detect.json').read_text())
all_files = [f for files in detect['files'].values() for f in files]
cached = cached_files()
changed = [f for f in all_files if file_hash(Path(f)) != cached.get(f)]
Path('.graphify_uncached.txt').write_text('\n'.join(changed))
print(f'Quick mode: {len(changed)}/{len(all_files)} files changed, {len(all_files)-len(changed)} cached')
"
```

If all files are cached, skip directly to Step 4 using the existing `.graphify_extract.json` (if it exists). Otherwise, run extraction only on changed files and merge with cached results.

Follow these steps in order. Do not skip steps.

### Step 1 - Ensure graphify is installed and PYTHONUTF8 is set

```bash
python -c "import graphify" 2>/dev/null
if [ $? -ne 0 ]; then pip install graphifyy -q 2>&1 | tail -3; fi

# Verify UTF-8 mode — if this fails, set PYTHONUTF8=1 in your environment
python -c "from pathlib import Path; Path('/dev/null').write_text('test: ≤')" 2>/dev/null || echo "WARNING: PYTHONUTF8 not set — Unicode errors likely. Set: export PYTHONUTF8=1"
```

If the import succeeds and UTF-8 check passes, print nothing and move to Step 2.

### Step 2 - Detect files + patch unsupported extensions

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

### Step 3 - Extract entities and relationships

**Before starting:** note whether `--mode deep` was given. You must pass `DEEP_MODE=true` to every subagent in Step B2 if it was. Track this from the original invocation - do not lose it.

This step has two parts: **structural extraction** (deterministic, free) and **semantic extraction** (Claude, costs tokens).

**Run Part A (AST) and Part B (semantic) in parallel. Dispatch all semantic subagents AND start AST extraction in the same message. Both can run simultaneously since they operate on different file types. Merge results in Part C as before.**

#### Part A - Structural extraction for code files

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

#### Part B - Semantic extraction (parallel subagents)

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

#### Part C - Merge AST + semantic into final extraction

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

### Step 4 - Build graph, cluster, analyze, generate outputs

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

### Step 5 - Label communities

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

### Step 6 - Generate HTML

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

### Step 7 - Optional exports

**SVG** (if --svg): add `from graphify.export import to_svg` and call `to_svg(G, communities, 'graphify-out/graph.svg', community_labels=labels)`.

**GraphML** (if --graphml): add `from graphify.export import to_graphml` and call `to_graphml(G, communities, 'graphify-out/graph.graphml')`.

**Neo4j** (if --neo4j): add `from graphify.export import to_cypher` and call `to_cypher(G, 'graphify-out/cypher.txt')`.

**MCP** (if --mcp): run `python -m graphify.serve graphify-out/graph.json`.

### Step 8 - Token benchmark (only if total_words > 5000)

Skip if total_words <= 5000.

### Step 9 - Save manifest, clean up, report

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

---

## For --update (incremental re-extraction)

Re-extracts only files that changed since the last run. Uses `graphify.cache` (SHA256-based) to skip unchanged files entirely — no Claude tokens spent on them.

**How it works:**
1. Run detection (Step 2) to get the current file list
2. Check cache — each file's SHA256 is compared against `graphify-out/cache/{hash}.json`
3. Unchanged files: load their cached nodes/edges directly (instant, free)
4. Changed/new files: run AST + semantic extraction (same as Step 3, but only on the delta)
5. Merge cached + new, then continue with Steps 4-9 (build, cluster, report)

**Instructions:**

### Update Step 1 — Detect + cache check

Run Step 1 and Step 2 from the main pipeline (install check, file detection). Then:

```bash
export PYTHONUTF8=1
SKILL_DIR=.claude/skills/graphify-windows-local
python $SKILL_DIR/scripts/graph_update.py .graphify_detect.json --output-prefix .graphify
```

This outputs:
- `.graphify_cached.json` — nodes/edges from unchanged files
- `.graphify_uncached.txt` — files that need fresh extraction
- `NEEDS_EXTRACTION=false` if all files are cached

### Update Step 2 — Extract only changed files

If `NEEDS_EXTRACTION=false` was printed, skip to Update Step 3.

Otherwise, extract only the files in `.graphify_uncached.txt`:

**Part A — AST extraction** (code files only):

```bash
python -c "
import sys, json
from graphify.extract import collect_files, extract
from pathlib import Path

uncached = Path('.graphify_uncached.txt').read_text().strip().split('\n') if Path('.graphify_uncached.txt').exists() else []
code_files = [Path(f) for f in uncached if Path(f).exists() and any(f.endswith(ext) for ext in
    {'.py','.js','.jsx','.ts','.tsx','.go','.rs','.java','.c','.h','.cpp','.cc','.rb','.swift','.kt','.cs','.scala','.php','.lua','.zig','.ps1','.ex','.exs','.v','.sv','.vhd','.vhdl'})]

if code_files:
    result = extract(code_files)
    Path('.graphify_ast_new.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(f'AST: {len(result[\"nodes\"])} nodes, {len(result[\"edges\"])} edges from {len(code_files)} files')
else:
    Path('.graphify_ast_new.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}), encoding='utf-8')
    print('No code files to extract')
"
```

**Part B — Semantic extraction** (docs/papers/images only):

Follow the same subagent dispatch as Step 3B in the main pipeline, but ONLY for files listed in `.graphify_uncached.txt`. Split into chunks of 20-25 files each. Merge results into `.graphify_semantic_new.json`.

### Update Step 3 — Merge cached + new, then build

```bash
python -c "
import json
from pathlib import Path

# Load cached extractions
cached = json.loads(Path('.graphify_cached.json').read_text(encoding='utf-8'))

# Load new AST extraction
ast = json.loads(Path('.graphify_ast_new.json').read_text(encoding='utf-8')) if Path('.graphify_ast_new.json').exists() else {'nodes':[],'edges':[]}

# Load new semantic extraction
sem = json.loads(Path('.graphify_semantic_new.json').read_text(encoding='utf-8')) if Path('.graphify_semantic_new.json').exists() else {'nodes':[],'edges':[],'hyperedges':[]}

# Deduplicate nodes by id
seen = {n['id'] for n in ast['nodes']}
merged_nodes = list(ast['nodes'])
for n in cached['nodes'] + sem.get('nodes', []):
    if n['id'] not in seen:
        merged_nodes.append(n)
        seen.add(n['id'])

merged_edges = ast['edges'] + cached['edges'] + sem.get('edges', [])
merged_hyperedges = cached.get('hyperedges', []) + sem.get('hyperedges', [])

merged = {
    'nodes': merged_nodes,
    'edges': merged_edges,
    'hyperedges': merged_hyperedges,
    'input_tokens': sem.get('input_tokens', 0),
    'output_tokens': sem.get('output_tokens', 0),
}
Path('.graphify_extract.json').write_text(json.dumps(merged, indent=2), encoding='utf-8'))
print(f'Merged: {len(merged_nodes)} nodes, {len(merged_edges)} edges ({len(cached[\"nodes\"])} cached + {len(ast[\"nodes\"])} AST + {len(sem.get(\"nodes\", []))} semantic)')
"
```

Then continue with **Steps 4-9** from the main pipeline (build graph, cluster, label, HTML, cleanup, CODEBASE_MAP.md).

**To clear cache and force full re-extraction:**

```bash
python -c "from graphify.cache import clear_cache; clear_cache(); print('Cache cleared')"
```

## For /graphify explain "<NodeName>"

Explain a specific node using the one-shot script.

```bash
export PYTHONUTF8=1
SKILL_DIR=.claude/skills/graphify-windows-local
python $SKILL_DIR/scripts/explain.py graphify-out/graph.json "NODE_NAME" --labels graphify-out/.labels.json
```

This outputs a structured explanation with:
- Node metadata (ID, community, file, connection count)
- **Verified** connections (EXTRACTED, confidence=1.0) — methods, imports
- **Hypotheses** (INFERRED, confidence<1.0) — explicitly marked "verify before relying on these"
- Source file hint — "Read X for ground truth"

**After running the script:** If the node has a `source_file`, read it to add semantic depth. The graph shows structure; the source shows semantics. Present both.

## For /graphify query "<question>"

BFS traversal to answer a question about the graph. Uses graphify's built-in query.

```bash
python -c "
import json
from graphify.build import build_from_json
from graphify.query import bfs_query
from pathlib import Path

extraction = json.loads(Path('graphify-out/graph.json').read_text(encoding='utf-8'))
# graph.json is node_link format; need to convert back to extraction format
# Use the raw extraction if available, otherwise parse from node_link
labels_raw = json.loads(Path('graphify-out/.labels.json').read_text(encoding='utf-8')) if Path('graphify-out/.labels.json').exists() else {}
"
```

**Fallback:** If graphify's query module doesn't work with node_link format, read graph.json directly and do manual BFS:

```bash
python -c "
import json
from pathlib import Path
from collections import deque

data = json.loads(Path('graphify-out/graph.json').read_text(encoding='utf-8'))
nodes_map = {n['id']: n for n in data['nodes']}
adj = {}
for e in data.get('links', []):
    adj.setdefault(e['source'], []).append(e['target'])
    adj.setdefault(e['target'], []).append(e['source'])

# BFS from a starting node
START = 'START_NODE_ID'
visited = set()
queue = deque([START])
while queue:
    node = queue.popleft()
    if node in visited: continue
    visited.add(node)
    for neighbor in adj.get(node, []):
        if neighbor not in visited:
            queue.append(neighbor)

print(f'Reachable from {START}: {len(visited)} nodes')
for nid in sorted(visited):
    n = nodes_map.get(nid, {})
    print(f'  {n.get(\"label\", nid)} [{nid}]')
"
```

## For /graphify path "NodeA" "NodeB"

Shortest path between two nodes.

```bash
python -c "
import json
from pathlib import Path
from collections import deque

data = json.loads(Path('graphify-out/graph.json').read_text(encoding='utf-8'))
nodes_map = {n['id']: n for n in data['nodes']}
adj = {}
for e in data.get('links', []):
    adj.setdefault(e['source'], []).append((e['target'], e.get('relation','')))
    adj.setdefault(e['target'], []).append((e['source'], e.get('relation','')))

SOURCE = 'SOURCE_NODE_ID'
TARGET = 'TARGET_NODE_ID'

# BFS shortest path
visited = {SOURCE: None}
queue = deque([SOURCE])
while queue and TARGET not in visited:
    node = queue.popleft()
    for neighbor, rel in adj.get(node, []):
        if neighbor not in visited:
            visited[neighbor] = (node, rel)
            queue.append(neighbor)

if TARGET in visited:
    path = []
    cur = TARGET
    while cur is not None:
        info = visited[cur]
        if info:
            path.append((cur, info[1]))
            cur = info[0]
        else:
            path.append((cur, None))
            cur = None
    path.reverse()
    print(f'Shortest path ({len(path)} hops):')
    for i, (nid, rel) in enumerate(path):
        n = nodes_map.get(nid, {})
        arrow = f' --[{rel}]--> ' if rel else ''
        print(f'  {n.get(\"label\", nid)} {arrow}')
else:
    print(f'No path found between {SOURCE} and {TARGET}')
"
```

## For /graphify add <path>

Add files to an existing graph. Requires `graphify-out/graph.json` to exist.

```bash
python -c "
import json
from graphify.build import build_from_json, add_to_graph
from graphify.export import to_json, to_html
from pathlib import Path

data = json.loads(Path('graphify-out/graph.json').read_text(encoding='utf-8'))
# ... incrementally add new files and re-export
"
```

**Note:** graphify's incremental API may vary by version. If `add_to_graph` doesn't exist, re-run the full pipeline on the target path.

## For --watch, --cluster-only, --neo4j, --neo4j-push, --mcp, --svg, --graphml

These flags modify Step 4/7 behavior. They are NOT standalone commands — they are modifiers to the main pipeline:

- `--watch`: Not implemented (would need file watcher)
- `--cluster-only`: Skip Steps 1-3, load existing `.graphify_extract.json`, re-cluster with different parameters
- `--neo4j` / `--neo4j-push`: Add `from graphify.export import to_cypher` in Step 7
- `--mcp`: Run `python -m graphify.serve graphify-out/graph.json` after Step 9
- `--svg`: Add `from graphify.export import to_svg` in Step 7
- `--graphml`: Add `from graphify.export import to_graphml` in Step 7

---

## graph.json Format Reference

**CRITICAL:** The exported JSON uses NetworkX `node_link_data()` format:

```json
{
  "directed": true,
  "multigraph": false,
  "graph": {},
  "nodes": [{"id": "...", "label": "...", "community": 0, "source_file": "..."}],
  "links": [{"source": "node_id", "target": "node_id", "relation": "...", "confidence": "EXTRACTED", "confidence_score": 1.0, "weight": 1.0}],
  "hyperedges": []
}
```

- Key for edges is **`links`**, NOT `edges`
- Node `community` is an integer (map to label via `.labels.json` if saved)
- `confidence_score`: 1.0 = EXTRACTED (AST truth), 0.6-0.9 = INFERRED, 0.1-0.3 = AMBIGUOUS

### Node ID Convention

A source file produces multiple graph nodes with compound IDs:

| Node type | ID pattern | Example |
|-----------|-----------|---------|
| File | `<filestem>` | `book_manager` |
| Class | `<filestem>_<classname>` | `book_manager_bookmanager` |
| Method | `<filestem>_<classname>_<method>` | `book_manager_bookmanager_init` |
| Function | `<filestem>_<funcname>` | `cli_main` |
| Docstring/rationale | `<filestem>_rationale_<line>` | `book_manager_rationale_1` |

**When looking up a node by name, prefer class/function nodes** (they have the most connections). File nodes are containers with few edges; rationale nodes are docstring fragments.

---

## Windows-Specific Troubleshooting

### UnicodeEncodeError on report generation

**Best fix:** Set `PYTHONUTF8=1` environment variable globally. This enables Python UTF-8 mode on Windows, making all `write_text()` calls default to UTF-8.

```bash
# One-time: add to PowerShell profile
echo '$env:PYTHONUTF8 = "1"' >> "$HOME/Documents/PowerShell/Microsoft.PowerShell_profile.ps1"

# Or system-wide (requires restart)
setx PYTHONUTF8 1
```

**Fallback:** If PYTHONUTF8 is not set, this skill passes `encoding='utf-8'` explicitly on all writes.

### Unsupported language (.v, .sv, .vhd) not detected

**Cause:** graphify v0.3.20 has a hardcoded `CODE_EXTENSIONS` set.

**Fix:** Step 2 patches `graphify.detect.CODE_EXTENSIONS` before detection. The extraction script (`scripts/extract_enhanced.py`) handles unsupported languages via direct tree-sitter.

### tree-sitter-languages doesn't work on Windows

**Cause:** No wheels available for Windows.

**Fix:** Use individual `tree-sitter-<lang>` packages instead (e.g. `tree-sitter-verilog`).

### Python heredoc fails in Bash tool on Windows

**Cause:** Complex Python code in bash heredocs (`<< 'PYEOF'`) hits quoting issues with f-strings and single quotes.

**Fix:** Write Python scripts to files first, then execute. The extraction script at `scripts/extract_enhanced.py` avoids this entirely.

## Honesty Rules

- Never invent an edge. If unsure, use AMBIGUOUS.
- Never skip the corpus check warning.
- Always show token cost in the report.
- Never hide cohesion scores behind symbols - show the raw number.
- Never run HTML viz on a graph with more than 5,000 nodes without warning the user.
