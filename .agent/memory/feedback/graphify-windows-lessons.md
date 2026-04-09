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

## Rule: Windows write_text() needs UTF-8 — use PYTHONUTF8=1

**Why:** Windows default encoding is cp950 (Traditional Chinese) or cp1252. graphify's report generation uses Unicode characters (≤, ≥, →) that cp950 cannot encode. Causes `UnicodeEncodeError`.

**Best fix:** Set `PYTHONUTF8=1` environment variable (Python 3.7+). This enables Python's UTF-8 mode globally — `sys.stdout.encoding` becomes `utf-8`, and `Path.write_text()` defaults to UTF-8. No need for `encoding='utf-8'` on every call.

Set it permanently via PowerShell profile (`$PROFILE`): `$env:PYTHONUTF8 = "1"`, or system-wide: `setx PYTHONUTF8 1`.

**Fallback:** If `PYTHONUTF8` is not set, pass `encoding='utf-8'` explicitly to every `Path.write_text()` call on Windows.

## Rule: Skill tool loads from ~/.claude-glm/skills/ before project-local .claude/skills/

**Why:** The Claude Code Skill tool resolves `skill: "graphify-windows"` by matching the `name` field in frontmatter. When both `~/.claude-glm/skills/graphify/SKILL.md` (stock) and `.claude/skills/graphify-windows/SKILL.md` (enhanced) exist, the auto-memory path (`~/.claude-glm/`) can take priority depending on trigger matching.

**How to apply:** Use unique trigger names. Don't give two skills the same `trigger` field. The enhanced skill should use `trigger: /graphify-windows` (not `/graphify`).

## Rule: Python heredocs with <<'PYEOF' break in Bash tool on Windows

**Why:** The Bash tool passes commands through bash on Windows. Python heredocs (`<< 'PYEOF'`) with complex Python code containing f-strings, single quotes, or backslashes can cause quoting issues.

**How to apply:** Write Python scripts to files first (using Write tool), then execute with `python script.py`. Or use the `scripts/` subdirectory in the skill for reusable extraction scripts.

## Rule: Verilog AST node names are nested, not direct children

**Why:** In tree-sitter-verilog, `simple_identifier` is inside `module_header` which is inside `module_declaration`. A direct child search (`node.children`) won't find it — need recursive descent.

**How to apply:** Use recursive `find_child_text(node, child_type)` that walks all descendants, not just direct children.
