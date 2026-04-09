---
name: graphify-windows
description: any input (code, docs, papers, images) to knowledge graph to clustered communities to HTML + JSON + audit report (Windows-enhanced with unsupported language support)
trigger: /graphify
---

# /graphify (Windows-Enhanced)

Enhanced version of graphify for Windows. Adds:
- **UTF-8 encoding fix** on all file writes (prevents cp950/cp1252 UnicodeEncodeError)
- **Unsupported language support** (.v, .sv, .vhd, .vhdl, etc.) via tree-sitter
- **Bash commands** (not PowerShell) — matches this project's shell config

All graphify features work identically. This skill only patches the Windows-specific pain points.

## Usage

```
/graphify                                             # full pipeline on current directory
/graphify <path>                                      # full pipeline on specific path
/graphify <path> --mode deep                          # thorough extraction, richer INFERRED edges
/graphify <path> --update                             # incremental - re-extract only new/changed files
/graphify <path> --cluster-only                       # rerun clustering on existing graph
/graphify <path> --no-viz                             # skip visualization, just report + JSON
/graphify <path> --svg                                # also export graph.svg
/graphify <path> --graphml                            # export graph.graphml (Gephi, yEd)
/graphify <path> --neo4j                              # generate cypher.txt for Neo4j
/graphify <path> --neo4j-push bolt://localhost:7687   # push directly to Neo4j
/graphify <path> --mcp                                # start MCP stdio server
/graphify <path> --watch                              # watch folder, auto-rebuild on code changes
/graphify add <url>                                   # fetch URL, save to ./raw, update graph
/graphify query "<question>"                          # BFS traversal - broad context
/graphify query "<question>" --dfs                    # DFS - trace a specific path
/graphify path "AuthModule" "Database"                # shortest path between two concepts
/graphify explain "SwinTransformer"                   # plain-language explanation of a node
```

## What You Must Do When Invoked

If no path was given, use `.` (current directory). Do not ask the user for a path.

Follow these steps in order. Do not skip steps.

### Step 1 - Ensure graphify is installed

```bash
python -c "import graphify" 2>/dev/null
if [ $? -ne 0 ]; then pip install graphifyy -q 2>&1 | tail -3; fi
python -c "import sys; open('.graphify_python', 'w').write(sys.executable)"
```

If the import succeeds, print nothing and move straight to Step 2.

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

**If there ARE unsupported files** (e.g. `.v`, `.sv`), run this enhanced extraction that uses tree-sitter directly for unsupported languages and graphify's built-in for the rest:

```bash
python << 'PYEOF'
import sys, json, importlib
from pathlib import Path

# ── Config: map unsupported extensions to tree-sitter modules ──
# Format: extension -> (ts_module_name, LanguageConfig kwargs)
# ts_module_name: pip package name (e.g. "tree_sitter_verilog")
EXT_TO_PARSER = {
    '.v': {
        'ts_module': 'tree_sitter_verilog',
        'ts_language_fn': 'language',
        'class_types': frozenset({'module_declaration'}),
        'function_types': frozenset({'always_construct', 'assign', 'initial_construct',
                                     'function_declaration', 'task_declaration'}),
        'import_types': frozenset(),
        'call_types': frozenset({'module_instantiation'}),
        'name_field': 'simple_identifier',
    },
    '.sv': {
        'ts_module': 'tree_sitter_verilog',  # tree-sitter-verilog also handles SV
        'ts_language_fn': 'language',
        'class_types': frozenset({'module_declaration', 'class_declaration', 'interface_declaration'}),
        'function_types': frozenset({'always_construct', 'assign', 'initial_construct',
                                     'function_declaration', 'task_declaration'}),
        'import_types': frozenset(),
        'call_types': frozenset({'module_instantiation'}),
        'name_field': 'simple_identifier',
    },
}

def find_nodes(node, node_type):
    """Recursively find all nodes of a given type."""
    results = []
    if node.type == node_type:
        results.append(node)
    for child in node.children:
        results.extend(find_nodes(child, node_type))
    return results

def find_child_text(node, child_type, source_bytes):
    """Recursively find first child of given type and return its text."""
    for child in node.children:
        if child.type == child_type:
            return source_bytes[child.start_byte:child.end_byte].decode('utf-8', errors='replace')
        result = find_child_text(child, child_type, source_bytes)
        if result is not None:
            return result
    return None

def extract_unsupported_file(fpath, config):
    """Extract nodes/edges from an unsupported language file using tree-sitter directly."""
    try:
        mod = importlib.import_module(config['ts_module'])
    except ImportError:
        print(f'  WARNING: {config["ts_module"]} not installed. Run: pip install {config["ts_module"]}')
        return {'nodes': [], 'edges': []}

    from tree_sitter import Language, Parser
    lang_fn = getattr(mod, config['ts_language_fn'], None)
    if not lang_fn:
        return {'nodes': [], 'edges': []}

    language = Language(lang_fn())
    parser = Parser(language)
    source_bytes = fpath.read_bytes()
    source_file = str(fpath)
    stem = fpath.stem
    tree = parser.parse(source_bytes)

    nodes = []
    edges = []

    # Extract class/module declarations
    for cls_type in config['class_types']:
        for cls_node in find_nodes(tree.root_node, cls_type):
            cls_name = find_child_text(cls_node, config['name_field'], source_bytes)
            if not cls_name:
                continue
            nodes.append({
                'id': cls_name, 'label': f'{cls_name} ({cls_type})',
                'file_type': 'code', 'source_file': source_file,
                'source_location': f'L{cls_node.start_point[0]+1}',
            })

    # Extract function-like constructs
    for func_type in config['function_types']:
        for func_node in find_nodes(tree.root_node, func_type):
            # Find parent module to scope the ID
            parent_mod = None
            for cls_type in config['class_types']:
                for cls_node in find_nodes(tree.root_node, cls_type):
                    if (cls_node.start_byte <= func_node.start_byte <= cls_node.end_byte):
                        mod_name = find_child_text(cls_node, config['name_field'], source_bytes)
                        if mod_name:
                            parent_mod = mod_name
                            break
                if parent_mod:
                    break

            prefix = f'{parent_mod}_' if parent_mod else f'{stem}_'
            fid = f'{prefix}{func_type}_{func_node.start_point[0]}'
            nodes.append({
                'id': fid, 'label': f'{func_type} @{func_node.start_point[0]+1}',
                'file_type': 'code', 'source_file': source_file,
                'source_location': f'L{func_node.start_point[0]+1}',
            })
            if parent_mod:
                edges.append({
                    'source': parent_mod, 'target': fid,
                    'relation': 'contains', 'confidence': 'EXTRACTED',
                    'confidence_score': 1.0, 'source_file': source_file, 'weight': 1.0,
                })

    # Extract call/instantiation edges
    for call_type in config['call_types']:
        for call_node in find_nodes(tree.root_node, call_type):
            target_name = find_child_text(call_node, config['name_field'], source_bytes)
            inst_name = find_child_text(call_node, 'instance_identifier', source_bytes)
            if target_name:
                # Find parent module
                parent_mod = None
                for cls_type in config['class_types']:
                    for cls_node in find_nodes(tree.root_node, cls_type):
                        if (cls_node.start_byte <= call_node.start_byte <= cls_node.end_byte):
                            mod_name = find_child_text(cls_node, config['name_field'], source_bytes)
                            if mod_name:
                                parent_mod = mod_name
                                break
                    if parent_mod:
                        break

                nid = f'{stem}_{target_name}_inst'
                label = f'{inst_name} ({target_name})' if inst_name else f'{target_name} inst'
                nodes.append({
                    'id': nid, 'label': label, 'file_type': 'code',
                    'source_file': source_file,
                    'source_location': f'L{call_node.start_point[0]+1}',
                })
                edges.append({
                    'source': nid, 'target': target_name,
                    'relation': 'instantiates', 'confidence': 'EXTRACTED',
                    'confidence_score': 1.0, 'source_file': source_file, 'weight': 1.0,
                })
                if parent_mod:
                    edges.append({
                        'source': parent_mod, 'target': nid,
                        'relation': 'contains', 'confidence': 'EXTRACTED',
                        'confidence_score': 1.0, 'source_file': source_file, 'weight': 1.0,
                    })

    return {'nodes': nodes, 'edges': edges}


# ── Main: extract all files ──
from graphify.extract import collect_files, extract

detect = json.loads(Path('.graphify_detect.json').read_text())
all_code_files = []
for f in detect.get('files', {}).get('code', []):
    p = Path(f)
    if p.is_dir():
        all_code_files.extend(sorted(p.rglob('*')))
    else:
        all_code_files.append(p)

_BUILTIN_EXTS = {'.py','.js','.jsx','.ts','.tsx','.go','.rs','.java','.c','.h',
    '.cpp','.cc','.cxx','.hpp','.rb','.swift','.kt','.kts','.cs','.scala',
    '.php','.lua','.toc','.zig','.ps1','.ex','.exs','.m','.mm','.jl'}

unsupported_files = [f for f in all_code_files if f.suffix.lower() not in _BUILTIN_EXTS]
supported_files = [f for f in all_code_files if f.suffix.lower() in _BUILTIN_EXTS]

all_nodes = []
all_edges = []

# 1. Built-in extraction via graphify
if supported_files:
    result = extract(supported_files)
    all_nodes.extend(result.get('nodes', []))
    all_edges.extend(result.get('edges', []))
    print(f'Built-in AST: {len(result.get("nodes",[]))} nodes, {len(result.get("edges",[]))} edges')

# 2. Direct tree-sitter for unsupported languages
if unsupported_files:
    # Group by extension for efficiency
    by_ext = {}
    for f in unsupported_files:
        by_ext.setdefault(f.suffix.lower(), []).append(f)

    for ext, files in sorted(by_ext.items()):
        config = EXT_TO_PARSER.get(ext)
        if not config:
            print(f'  WARNING: No parser config for {ext} - skipping {len(files)} files')
            print(f'    To add support: pip install tree-sitter-{ext[1:]} and update EXT_TO_PARSER in skill')
            continue
        for f in files:
            result = extract_unsupported_file(f, config)
            all_nodes.extend(result['nodes'])
            all_edges.extend(result['edges'])
            print(f'  {f.name}: {len(result["nodes"])} nodes, {len(result["edges"])} edges')

# Deduplicate nodes by id
seen = {}
deduped = []
for n in all_nodes:
    if n['id'] not in seen:
        seen[n['id']] = True
        deduped.append(n)

ast_result = {'nodes': deduped, 'edges': all_edges, 'input_tokens': 0, 'output_tokens': 0}
Path('.graphify_ast.json').write_text(json.dumps(ast_result, indent=2), encoding='utf-8')
print(f'\nTotal AST: {len(deduped)} nodes, {len(all_edges)} edges')
PYEOF
```

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

Tell the user:
```
Graph complete. Outputs in PATH_TO_DIR/graphify-out/

  graph.html            - interactive graph, open in browser
  GRAPH_REPORT.md       - audit report
  graph.json            - raw graph data
```

Then paste these sections from GRAPH_REPORT.md:
- God Nodes
- Surprising Connections
- Suggested Questions

Then immediately offer to explore the most interesting question.

---

## For --update (incremental re-extraction)

Same as stock graphify, but with the same extension patching in Step 2 and the same UTF-8 encoding on all writes.

## For /graphify query, /graphify path, /graphify explain

Identical to stock graphify. See the upstream skill-windows.md for full implementations.

## For /graphify add

Identical to stock graphify.

## For --watch, --cluster-only, --neo4j, --neo4j-push, --mcp, --svg, --graphml

Identical to stock graphify.

---

## Windows-Specific Troubleshooting

### UnicodeEncodeError on report generation

**Cause:** Windows default encoding (cp950/cp1252) can't handle Unicode chars in graphify's report (arrows, <=, etc).

**Fix:** This skill already adds `encoding='utf-8'` to all `write_text()` calls. If you see this error, the stock graphify skill is being used instead of this one.

### Unsupported language (.v, .sv, .vhd) not detected

**Cause:** graphify v0.3.20 has a hardcoded `CODE_EXTENSIONS` set that doesn't include these.

**Fix:** This skill patches `graphify.detect.CODE_EXTENSIONS` in Step 2 before detection. Also installs the corresponding `tree-sitter-<lang>` pip package if needed.

### tree-sitter-languages doesn't work on Windows

**Cause:** No wheels available for Windows.

**Fix:** Use individual `tree-sitter-<lang>` packages instead (e.g. `tree-sitter-verilog`). This skill handles this automatically via the `EXT_TO_PARSER` config.

### extra_walk_fn in LanguageConfig doesn't work

**Cause:** graphify v0.3.20 defines `extra_walk_fn` in `LanguageConfig` but never calls it in `_extract_generic()`. Only hardcoded language-specific walkers are invoked.

**Fix:** This skill bypasses `_extract_generic()` entirely for unsupported languages, using tree-sitter directly with a standalone extraction function.

## Honesty Rules

- Never invent an edge. If unsure, use AMBIGUOUS.
- Never skip the corpus check warning.
- Always show token cost in the report.
- Never hide cohesion scores behind symbols - show the raw number.
- Never run HTML viz on a graph with more than 5,000 nodes without warning the user.
