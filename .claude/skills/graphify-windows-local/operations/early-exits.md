# Early Exit Commands

Pre-pipeline operations that skip Steps 1-9.

## --summarize

Skip Steps 1-8. Generate CODEBASE_MAP.md from existing graph:

```bash
export PYTHONUTF8=1
SKILL_DIR=.claude/skills/graphify-windows-local
python $SKILL_DIR/scripts/codebase_map.py graphify-out/graph.json --labels graphify-out/.labels.json --output graphify-out/CODEBASE_MAP.md
cp graphify-out/CODEBASE_MAP.md .agent/memory/project/codebase-map.md
```

Show the contents of CODEBASE_MAP.md and stop.

## --claudemd

Skip Steps 1-8. Generate compact section for CLAUDE.md:

```bash
export PYTHONUTF8=1
SKILL_DIR=.claude/skills/graphify-windows-local
python $SKILL_DIR/scripts/codebase_map.py graphify-out/graph.json --labels graphify-out/.labels.json --claudemd
```

Show the output and suggest the user paste it into CLAUDE.md. Stop.

## explain-how-it-works

Show internal documentation. No pipeline steps needed:

```bash
export PYTHONUTF8=1
SKILL_DIR=.claude/skills/graphify-windows-local
TOPIC="${ARGUMENT#explain-how-it-works }"
python $SKILL_DIR/scripts/explain_how_it_works.py $TOPIC
```

Topics: `pipeline` (default), `cache`, `extract`, `cluster`, `analyze`, `build`, `export`, `graphjson`.

## --diff

Compare current graph against previous run's baseline:

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
    cp "$CURRENT" "$BASELINE"
fi
```

Show the diff report. If there are CLAUDE.md update suggestions, offer to apply them. Stop.

## --quick

Modify Step 3 to use the cache module. Before Part B, check which files changed:

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

If all files are cached, skip directly to Step 4 using the existing `.graphify_extract.json`. Otherwise, run extraction only on changed files and merge with cached results.

## For --update (incremental re-extraction)

Re-extracts only files that changed since the last run. Uses `graphify.cache` (SHA256-based).

### Update Step 1 — Detect + cache check

Run Steps 1-2 from the main pipeline (install check, file detection). Then:

```bash
export PYTHONUTF8=1
SKILL_DIR=.claude/skills/graphify-windows-local
python $SKILL_DIR/scripts/graph_update.py .graphify_detect.json --output-prefix .graphify
```

Outputs:
- `.graphify_cached.json` — nodes/edges from unchanged files
- `.graphify_uncached.txt` — files that need fresh extraction
- `NEEDS_EXTRACTION=false` if all files are cached

### Update Step 2 — Extract only changed files

If `NEEDS_EXTRACTION=false`, skip to Update Step 3.

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

**Part B — Semantic extraction**: Same as Step 3B in main pipeline, but ONLY for `.graphify_uncached.txt` files.

### Update Step 3 — Merge cached + new, then build

```bash
python -c "
import json
from pathlib import Path

cached = json.loads(Path('.graphify_cached.json').read_text(encoding='utf-8'))
ast = json.loads(Path('.graphify_ast_new.json').read_text(encoding='utf-8')) if Path('.graphify_ast_new.json').exists() else {'nodes':[],'edges':[]}
sem = json.loads(Path('.graphify_semantic_new.json').read_text(encoding='utf-8')) if Path('.graphify_semantic_new.json').exists() else {'nodes':[],'edges':[],'hyperedges':[]}

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
Path('.graphify_extract.json').write_text(json.dumps(merged, indent=2), encoding='utf-8')
print(f'Merged: {len(merged_nodes)} nodes, {len(merged_edges)} edges ({len(cached[\"nodes\"])} cached + {len(ast[\"nodes\"])} AST + {len(sem.get(\"nodes\", []))} semantic)')
"
```

Then continue with **Steps 4-9** from the main pipeline.

**Clear cache:**
```bash
python -c "from graphify.cache import clear_cache; clear_cache(); print('Cache cleared')"
```
