---
name: graphify-windows-lessons
description: Lessons learned running graphify on Windows with unsupported languages (Verilog)
type: feedback
---

# Graphify on Windows — Pain Points and Solutions

## Rule: Patch extensions BEFORE detect(), use direct tree-sitter for unsupported languages

**Why:** graphify v0.3.20 has 3 separate hardcoded extension sets that all need patching:
1. `graphify.detect.CODE_EXTENSIONS` — controls which files detect() finds
2. `graphify.extract._EXTENSIONS` (local inside extract()) — controls collect_files()
3. `graphify.extract._DISPATCH` (local inside extract()) — maps extensions to extractors

`_DISPATCH` and `_EXTENSIONS` are LOCAL variables inside their respective functions — cannot monkey-patch from outside. Only `detect.CODE_EXTENSIONS` is a module-level mutable set.

**How to apply:** For unsupported languages (`.v`, `.sv`, `.vhd`, etc.), bypass `_extract_generic` entirely. Use `tree-sitter-<lang>` directly with `tree_sitter.Language(ts_mod.language())` + `tree_sitter.Parser(lang)`, then feed the extracted nodes/edges into graphify's `build_from_json()`.

## Rule: tree-sitter-languages does NOT work on Windows

**Why:** No wheels available for Windows. Must use individual `tree-sitter-<lang>` packages.

**How to apply:** `pip install tree-sitter-<lang>` (e.g. `tree-sitter-verilog`). Use v0.25 API: `Language(ts_mod.language())` then `Parser(Language)`.

## Rule: extra_walk_fn in LanguageConfig is NOT wired up

**Why:** `LanguageConfig.extra_walk_fn` field exists (line 60 of extract.py) but `_extract_generic()` never calls it. Only hardcoded language-specific walkers (_js_extra_walk, _csharp_extra_walk, _swift_extra_walk) are invoked based on `config.ts_module` string matching.

**How to apply:** Do not rely on extra_walk_fn. Either write a standalone extraction function or monkey-patch the module-level hardcoded checks.

## Rule: Windows write_text() needs explicit encoding='utf-8'

**Why:** Windows default encoding is cp950 (Traditional Chinese) or cp1252. graphify's report generation uses Unicode characters (≤, ≥, →) that cp950 cannot encode. Causes `UnicodeEncodeError`.

**How to apply:** Always pass `encoding='utf-8'` to `Path.write_text()` on Windows. This affects GRAPH_REPORT.md and any other text output files.

## Rule: Verilog AST node names are nested, not direct children

**Why:** In tree-sitter-verilog, `simple_identifier` is inside `module_header` which is inside `module_declaration`. A direct child search (`node.children`) won't find it — need recursive descent.

**How to apply:** Use recursive `find_child_text(node, child_type)` that walks all descendants, not just direct children.
