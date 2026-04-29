import { describe, test, expect } from "bun:test";
import {
  parseMarkdownTable,
  serializeMarkdownTable,
  replaceSectionInMarkdown,
  isMarkdownTable,
} from "../client/utils/markdown-table";

const CHARACTERS_TABLE = `| Character | Name | Voice | Gender | Color |
|-----------|------|--------|--------|-------|
| zhoumo | 周墨 | ryan | male | #F59E0B |
| examiner | 考官 | serena | female | #34D399 |`;

const EPISODE_TABLE = `| Ch | Ep | Title | Characters | Status |
|----|-----|-------|------------|--------|
| 1 | 1 | 入宗考试 | zhoumo, examiner | Complete |
| 1 | 2 | 成績公布 | zhoumo, examiner, elder | Planned |`;

const FULL_PLAN = `# Weapon Forger

## Characters

| Character | Name | Voice | Gender | Color |
|-----------|------|--------|--------|-------|
| zhoumo | 周墨 | ryan | male | #F59E0B |

## Episode Guide

| Ch | Ep | Title | Status |
|----|-----|-------|--------|
| 1 | 1 | Test | Complete |

## Story Arcs

Some freeform text about arcs.
`;

describe("parseMarkdownTable", () => {
  test("parses characters table", () => {
    const result = parseMarkdownTable(CHARACTERS_TABLE);
    expect(result.headers).toEqual(["Character", "Name", "Voice", "Gender", "Color"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({
      Character: "zhoumo",
      Name: "周墨",
      Voice: "ryan",
      Gender: "male",
      Color: "#F59E0B",
    });
  });

  test("parses episode table", () => {
    const result = parseMarkdownTable(EPISODE_TABLE);
    expect(result.headers).toEqual(["Ch", "Ep", "Title", "Characters", "Status"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].Title).toBe("入宗考试");
  });

  test("returns empty for non-table body", () => {
    const result = parseMarkdownTable("Just some text\nNo tables here");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  test("handles single row", () => {
    const table = "| A | B |\n|---|---|\n| 1 | 2 |";
    const result = parseMarkdownTable(table);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ A: "1", B: "2" });
  });

  test("handles empty cells", () => {
    const table = "| A | B |\n|---|---|\n| 1 | |";
    const result = parseMarkdownTable(table);
    expect(result.rows[0].B).toBe("");
  });
});

describe("serializeMarkdownTable", () => {
  test("roundtrips characters table", () => {
    const parsed = parseMarkdownTable(CHARACTERS_TABLE);
    const serialized = serializeMarkdownTable(parsed.headers, parsed.rows);
    const reparsed = parseMarkdownTable(serialized);
    expect(reparsed.headers).toEqual(parsed.headers);
    expect(reparsed.rows).toEqual(parsed.rows);
  });

  test("roundtrips episode table", () => {
    const parsed = parseMarkdownTable(EPISODE_TABLE);
    const serialized = serializeMarkdownTable(parsed.headers, parsed.rows);
    const reparsed = parseMarkdownTable(serialized);
    expect(reparsed.headers).toEqual(parsed.headers);
    expect(reparsed.rows).toEqual(parsed.rows);
  });

  test("serializes single row", () => {
    const result = serializeMarkdownTable(["A", "B"], [{ A: "1", B: "2" }]);
    expect(result).toBe("| A | B |\n| --- | --- |\n| 1 | 2 |");
  });

  test("handles empty rows", () => {
    const result = serializeMarkdownTable(["A", "B"], []);
    expect(result).toBe("| A | B |\n| --- | --- |");
  });
});

describe("replaceSectionInMarkdown", () => {
  test("replaces Characters section body", () => {
    const newBody = "| Character | Name |\n| --- | --- |\n| test | Test |";
    const result = replaceSectionInMarkdown(FULL_PLAN, "Characters", newBody);
    expect(result).toContain("| test | Test |");
    expect(result).toContain("## Episode Guide");
    expect(result).toContain("## Story Arcs");
  });

  test("replaces Story Arcs section body", () => {
    const newBody = "New arc content here.";
    const result = replaceSectionInMarkdown(FULL_PLAN, "Story Arcs", newBody);
    expect(result).toContain("New arc content here.");
    expect(result).toContain("## Characters");
    expect(result).toContain("## Episode Guide");
  });

  test("returns original if section not found", () => {
    const result = replaceSectionInMarkdown(FULL_PLAN, "Nonexistent", "whatever");
    expect(result).toBe(FULL_PLAN);
  });

  test("replaces last section (no trailing section)", () => {
    const newBody = "Updated arcs.";
    const result = replaceSectionInMarkdown(FULL_PLAN, "Story Arcs", newBody);
    expect(result).toContain("Updated arcs.");
    expect(result).not.toContain("Some freeform text");
  });
});

describe("isMarkdownTable", () => {
  test("returns true for table body", () => {
    expect(isMarkdownTable(CHARACTERS_TABLE)).toBe(true);
  });

  test("returns false for prose body", () => {
    expect(isMarkdownTable("Just some text")).toBe(false);
  });

  test("returns false for single pipe line", () => {
    expect(isMarkdownTable("| only one line")).toBe(false);
  });
});
