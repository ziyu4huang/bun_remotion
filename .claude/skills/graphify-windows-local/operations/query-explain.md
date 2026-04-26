# Query, Explain, Path Commands

Post-pipeline operations on existing graph data.

## explain "<NodeName>"

```bash
export PYTHONUTF8=1
SKILL_DIR=.claude/skills/graphify-windows-local
python $SKILL_DIR/scripts/explain.py graphify-out/graph.json "NODE_NAME" --labels graphify-out/.labels.json
```

Output: node metadata, verified connections (EXTRACTED, confidence=1.0), hypotheses (INFERRED, confidence<1.0), source file hint.

**After running:** If node has a `source_file`, read it for semantic depth. Present both graph structure and source semantics.

## query "<question>"

BFS traversal. Try graphify's built-in query first, fall back to manual BFS:

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

## path "NodeA" "NodeB"

Shortest path via BFS:

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

## add <path>

Add files to existing graph. Requires `graphify-out/graph.json`. If graphify's `add_to_graph` API doesn't exist, re-run full pipeline on target path.
