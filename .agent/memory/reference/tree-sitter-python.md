---
name: tree-sitter-python
description: How to install and use tree-sitter language grammars in Python (v0.25+ API)
type: reference
---

# Tree-sitter Python Setup Guide

## Current Environment (2026-04-09)

- `tree-sitter` v0.25.2 installed
- `tree-sitter-languages` does NOT work on Windows (no wheel available)
- Each language grammar is a separate pip package: `pip install tree-sitter-<lang>`

## Correct API for tree-sitter v0.25+

```python
import tree_sitter_verilog      # language-specific package
import tree_sitter              # core bindings

# v0.25 API: Language object from the grammar package, then Parser(Language)
lang = tree_sitter.Language(tree_sitter_verilog.language())
parser = tree_sitter.Parser(lang)
tree = parser.parse(b"module test; endmodule")
```

## Common Pitfall

The old API (`Parser()` then `parser.set_language()`) is deprecated. The new v0.25+ pattern is:
1. Import the language package (e.g. `tree_sitter_verilog`)
2. Create `Language` object via `tree_sitter.Language(<pkg>.language())`
3. Pass `Language` to `Parser` constructor

## Available Grammar Packages on PyPI

Naming pattern: `tree-sitter-<language>` (with hyphens)

- `tree-sitter-verilog` (v1.0.3) — IEEE 1364 Verilog
- `tree-sitter-c`, `tree-sitter-cpp`, `tree-sitter-java`, `tree-sitter-python`
- `tree-sitter-javascript`, `tree-sitter-typescript`, `tree-sitter-go`, `tree-sitter-rust`
- Check availability: `pip index versions tree-sitter-<lang>`

## Windows-Specific Notes

- `tree-sitter-languages` (bundled multi-language package) has NO Windows wheels — use individual packages instead
- All individual `tree-sitter-<lang>` packages work on Windows
