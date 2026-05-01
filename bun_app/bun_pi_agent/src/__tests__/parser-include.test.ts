import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join, resolve } from "path";
import { parseAgentDef, clearIncludeCache } from "../agents/parser.js";

const REPO_ROOT = resolve(import.meta.dir, "../../../../");
const TMP_DIR = join(import.meta.dir, "__tmp_include_test__");
const TMP_AGENTS_DIR = join(TMP_DIR, ".agent", "agents");
const TMP_SHARED_DIR = join(TMP_DIR, ".agent", "shared");

function writeTmpFile(dir: string, name: string, content: string): string {
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, name);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

beforeEach(() => {
  clearIncludeCache();
  mkdirSync(TMP_AGENTS_DIR, { recursive: true });
  mkdirSync(TMP_SHARED_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

describe("!include directive", () => {
  test("inlines shared section content", () => {
    writeTmpFile(TMP_SHARED_DIR, "test-section.md", "Shared content here.\nLine 2.");
    const agentPath = writeTmpFile(TMP_AGENTS_DIR, "test-agent.md", `---
name: test-include
description: Test include
---
Agent body before.

!include test-section.md

Agent body after.`);

    const def = parseAgentDef(agentPath);
    expect(def.prompt).toContain("Shared content here.");
    expect(def.prompt).toContain("Agent body before.");
    expect(def.prompt).toContain("Agent body after.");
    expect(def.prompt).not.toContain("!include");
  });

  test("populates shared array with included section names", () => {
    writeTmpFile(TMP_SHARED_DIR, "rules.md", "Rule 1.");
    const agentPath = writeTmpFile(TMP_AGENTS_DIR, "shared-test.md", `---
name: shared-arr
description: Test
---
Body.
!include rules.md`);

    const def = parseAgentDef(agentPath);
    expect(def.shared).toBeDefined();
    expect(def.shared).toContain("rules");
  });

  test("multiple includes resolve in order", () => {
    writeTmpFile(TMP_SHARED_DIR, "a.md", "Section A.");
    writeTmpFile(TMP_SHARED_DIR, "b.md", "Section B.");
    const agentPath = writeTmpFile(TMP_AGENTS_DIR, "multi.md", `---
name: multi-include
description: Test
---
Top.
!include a.md
Middle.
!include b.md
Bottom.`);

    const def = parseAgentDef(agentPath);
    expect(def.shared).toEqual(["a", "b"]);
    const aIdx = def.prompt.indexOf("Section A.");
    const midIdx = def.prompt.indexOf("Middle.");
    const bIdx = def.prompt.indexOf("Section B.");
    expect(aIdx).toBeLessThan(midIdx);
    expect(midIdx).toBeLessThan(bIdx);
  });

  test("nested includes resolve (depth > 1)", () => {
    writeTmpFile(TMP_SHARED_DIR, "inner.md", "Inner content.");
    writeTmpFile(TMP_SHARED_DIR, "outer.md", "Outer start.\n!include inner.md\nOuter end.");
    const agentPath = writeTmpFile(TMP_AGENTS_DIR, "nested.md", `---
name: nested-include
description: Test
---
!include outer.md`);

    const def = parseAgentDef(agentPath);
    expect(def.prompt).toContain("Outer start.");
    expect(def.prompt).toContain("Inner content.");
    expect(def.prompt).toContain("Outer end.");
    // Nested include resolved in body but only top-level includes tracked in shared
    expect(def.shared).toContain("outer");
    expect(def.prompt).toContain("Inner content.");
  });

  test("missing include throws descriptive error", () => {
    const agentPath = writeTmpFile(TMP_AGENTS_DIR, "bad.md", `---
name: bad-include
description: Test
---
!include nonexistent.md`);

    expect(() => parseAgentDef(agentPath)).toThrow(/!include file not found/);
  });

  test("caches shared file reads on second parse", () => {
    writeTmpFile(TMP_SHARED_DIR, "cached.md", "Cached content.");
    const agentPath = writeTmpFile(TMP_AGENTS_DIR, "cache-test.md", `---
name: cache-test
description: Test
---
!include cached.md`);

    // First parse populates cache
    const def1 = parseAgentDef(agentPath);
    expect(def1.prompt).toContain("Cached content.");

    // Overwrite the file — cache should still return old content
    writeTmpFile(TMP_SHARED_DIR, "cached.md", "NEW content.");
    const def2 = parseAgentDef(agentPath);
    expect(def2.prompt).toContain("Cached content.");
    expect(def2.prompt).not.toContain("NEW content.");
  });

  test("real shared sections resolve correctly", () => {
    const agentPath = join(REPO_ROOT, ".agent/agents/studio-reviewer.md");
    if (!existsSync(agentPath)) return;

    const def = parseAgentDef(agentPath);
    // studio-reviewer includes remotion-conventions.md
    expect(def.shared).toBeDefined();
    expect(def.shared!.length).toBeGreaterThan(0);
    // Included content should appear in prompt
    expect(def.prompt.length).toBeGreaterThan(200);
    expect(def.prompt).not.toContain("!include");
  });

  test("shared array is undefined when no includes used", () => {
    const agentPath = writeTmpFile(TMP_AGENTS_DIR, "no-include.md", `---
name: no-include
description: Test
---
Just a plain prompt. No includes.`);

    const def = parseAgentDef(agentPath);
    expect(def.shared).toBeUndefined();
  });
});
