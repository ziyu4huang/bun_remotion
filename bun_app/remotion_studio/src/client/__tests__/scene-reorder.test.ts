import { describe, test, expect } from "bun:test";

function parseSectionBlocks(raw: string): { title: string; content: string }[] {
  const blocks: { title: string; content: string }[] = [];
  const lines = raw.split("\n");
  let currentTitle = "";
  let currentLines: string[] = [];
  let foundFirst = false;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (foundFirst) {
        blocks.push({ title: currentTitle, content: currentLines.join("\n") });
      }
      currentTitle = line.slice(3).trim();
      currentLines = [line];
      foundFirst = true;
    } else if (foundFirst) {
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }
  if (foundFirst) {
    blocks.push({ title: currentTitle, content: currentLines.join("\n") });
  }
  return blocks;
}

function reconstructMarkdown(preamble: string, blocks: { title: string; content: string }[]): string {
  const parts = [preamble.trim()];
  for (const block of blocks) {
    parts.push(block.content.trim());
  }
  return parts.join("\n\n") + "\n";
}

const SAMPLE_PLAN = `# My Series

## Characters
| id | name | voice |
| --- | --- | --- |
| alice | Alice | nova |

## Episode Guide
| id | title | status |
| --- | --- | --- |
| ch01-ep01 | Pilot | planned |

## Story Arcs
### Chapter 1
Theme: Introduction
`;

describe("parseSectionBlocks", () => {
  test("parses all ## sections from markdown", () => {
    const blocks = parseSectionBlocks(SAMPLE_PLAN);
    expect(blocks).toHaveLength(3);
    expect(blocks[0].title).toBe("Characters");
    expect(blocks[1].title).toBe("Episode Guide");
    expect(blocks[2].title).toBe("Story Arcs");
  });

  test("preserves section content including sub-headings", () => {
    const blocks = parseSectionBlocks(SAMPLE_PLAN);
    expect(blocks[2].content).toContain("### Chapter 1");
    expect(blocks[2].content).toContain("Theme: Introduction");
  });

  test("handles single section", () => {
    const md = "# Title\n\n## Only Section\nSome content\n";
    const blocks = parseSectionBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].title).toBe("Only Section");
  });

  test("handles empty sections (title only)", () => {
    const md = "# Title\n\n## Empty\n\n## Next\nContent\n";
    const blocks = parseSectionBlocks(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].title).toBe("Empty");
  });

  test("returns empty array for no ## headings", () => {
    const md = "# Title\nJust some text\nNo sections\n";
    const blocks = parseSectionBlocks(md);
    expect(blocks).toHaveLength(0);
  });
});

describe("reconstructMarkdown", () => {
  test("round-trip: parse then reconstruct preserves section order", () => {
    const blocks = parseSectionBlocks(SAMPLE_PLAN);
    const preamble = SAMPLE_PLAN.match(/^([\s\S]*?)(?=\n## )/)?.[1] ?? "";
    const result = reconstructMarkdown(preamble, blocks);
    const reparsed = parseSectionBlocks(result);
    expect(reparsed.map((b) => b.title)).toEqual(["Characters", "Episode Guide", "Story Arcs"]);
  });

  test("reorder blocks: Episode Guide first", () => {
    const blocks = parseSectionBlocks(SAMPLE_PLAN);
    const preamble = SAMPLE_PLAN.match(/^([\s\S]*?)(?=\n## )/)?.[1] ?? "";
    const reordered = [blocks[1], blocks[0], blocks[2]];
    const result = reconstructMarkdown(preamble, reordered);
    const reparsed = parseSectionBlocks(result);
    expect(reparsed.map((b) => b.title)).toEqual(["Episode Guide", "Characters", "Story Arcs"]);
  });

  test("preamble (h1 title) is preserved after reorder", () => {
    const blocks = parseSectionBlocks(SAMPLE_PLAN);
    const preamble = SAMPLE_PLAN.match(/^([\s\S]*?)(?=\n## )/)?.[1] ?? "";
    const reordered = [blocks[2], blocks[0], blocks[1]];
    const result = reconstructMarkdown(preamble, reordered);
    expect(result).toContain("# My Series");
  });
});
