#!/usr/bin/env python3
"""Incremental graph update: detect changed files, load cached extractions, report what needs work.

Usage:
    python graph_update.py <detect.json> [--output-prefix .graphify]

This is the first step of --update mode. It:
1. Checks cache for all detected files
2. Loads cached semantic extractions
3. Identifies which files need fresh extraction
4. Outputs files for the agent to process

The agent then runs extraction on uncached files and calls merge_update.py to combine.
"""

import json
import sys
from pathlib import Path
from collections import defaultdict

# Add graphify to path
import graphify.cache as cache


def main():
    if len(sys.argv) < 2:
        print("Usage: python graph_update.py <detect.json> [--output-prefix .graphify]", file=sys.stderr)
        sys.exit(1)

    detect_path = sys.argv[1]
    prefix = ".graphify"

    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == "--output-prefix" and i + 1 < len(sys.argv):
            prefix = sys.argv[i + 1]
            i += 2
        else:
            i += 1

    detect = json.loads(Path(detect_path).read_text(encoding="utf-8"))
    all_files = [f for files in detect["files"].values() for f in files]

    # Check cache
    cached_nodes, cached_edges, cached_hyperedges, uncached = cache.check_semantic_cache(all_files)

    # Write cached results for later merge
    Path(f"{prefix}_cached.json").write_text(
        json.dumps({"nodes": cached_nodes, "edges": cached_edges, "hyperedges": cached_hyperedges}, indent=2),
        encoding="utf-8",
    )
    Path(f"{prefix}_uncached.txt").write_text("\n".join(uncached))

    # Categorize uncached files
    uncached_code = [f for f in uncached if any(f.endswith(ext) for ext in
        {'.py','.js','.jsx','.ts','.tsx','.go','.rs','.java','.c','.h','.cpp','.cc','.rb','.swift','.kt','.cs','.scala','.php','.lua','.zig','.ps1','.ex','.exs','.v','.sv','.vhd','.vhdl'})]
    uncached_docs = [f for f in uncached if f not in uncached_code]

    total = len(all_files)
    cached_count = total - len(uncached)

    print(f"Update check: {cached_count}/{total} files cached, {len(uncached)} need extraction")
    print(f"  Code (AST):  {len(uncached_code)} files")
    print(f"  Docs/other:  {len(uncached_docs)} files")
    print(f"")
    print(f"Cached extractions saved to {prefix}_cached.json")
    print(f"Uncached file list saved to {prefix}_uncached.txt")

    if not uncached:
        print(f"")
        print(f"All files are cached. No extraction needed — proceed to build step.")
        print(f"NEEDS_EXTRACTION=false")


if __name__ == "__main__":
    main()
