import { describe, test, expect, mock } from "bun:test";
import {
  checkCharacterNames,
  checkTraitConsistency,
  checkMissingCharacters,
  checkGagGaps,
  checkThemeGaps,
} from "../server/services/continuity-check.js";
import type { GraphNode } from "../server/services/continuity-check.js";

// ── Fixtures ──

const ALL_EPS = ["ch1ep1", "ch1ep2", "ch1ep3", "ch2ep1", "ch2ep2"];

function charNode(id: string, cid: string, ep: string, name: string): GraphNode {
  return { id, label: `${name} (${ep})`, type: "character_instance", episode: ep, properties: { character_id: cid, dialog_count: "5" } };
}

function traitNode(id: string, cid: string, ep: string, trait: string): GraphNode {
  return { id, label: `${cid}: ${trait}`, type: "character_trait", episode: ep, properties: { character_id: cid } };
}

function gagNode(id: string, gagType: string, ep: string): GraphNode {
  return { id, label: `${gagType}: ${gagType}`, type: "gag_manifestation", episode: ep, properties: { gag_type: gagType, episode: ep } };
}

function themeNode(id: string, label: string, ep: string, scope: string): GraphNode {
  return { id, label, type: "theme", episode: ep, properties: { scope } };
}

// ── Character Name ──

describe("checkCharacterNames", () => {
  test("returns empty when all names are consistent", () => {
    const nodes = [
      charNode("ch1ep1_char_a", "alice", "ch1ep1", "Alice"),
      charNode("ch1ep2_char_a", "alice", "ch1ep2", "Alice"),
    ];
    const issues = checkCharacterNames(nodes, ALL_EPS);
    expect(issues).toHaveLength(0);
  });

  test("detects different names for same character_id", () => {
    const nodes = [
      charNode("ch1ep1_char_a", "alice", "ch1ep1", "Alice"),
      charNode("ch1ep2_char_a", "alice", "ch1ep2", "Alicia"),
      charNode("ch1ep3_char_a", "alice", "ch1ep3", "Alice"),
    ];
    const issues = checkCharacterNames(nodes, ALL_EPS);
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("character_name");
    expect(issues[0].severity).toBe("error");
    expect(issues[0].subject).toBe("alice");
    expect(issues[0].episodes).toContain("ch1ep1");
    expect(issues[0].episodes).toContain("ch1ep2");
    expect(issues[0].detail).toContain("Alicia");
  });

  test("ignores nodes without character_id", () => {
    const nodes = [
      { id: "ch1ep1_char_x", label: "Unknown (ch1ep1)", type: "character_instance", episode: "ch1ep1" },
    ];
    const issues = checkCharacterNames(nodes, ALL_EPS);
    expect(issues).toHaveLength(0);
  });
});

// ── Trait Consistency ──

describe("checkTraitConsistency", () => {
  test("returns empty when consistent across episodes", () => {
    const nodes = [
      traitNode("t1", "alice", "ch1ep1", "brave"),
      traitNode("t2", "alice", "ch1ep2", "brave"),
      traitNode("t3", "alice", "ch1ep3", "brave"),
      traitNode("t4", "alice", "ch2ep1", "brave"),
    ];
    const issues = checkTraitConsistency(nodes, ALL_EPS);
    expect(issues).toHaveLength(0);
  });

  test("detects traits missing in some episodes (3+ episodes)", () => {
    const nodes = [
      traitNode("t1", "alice", "ch1ep1", "brave"),
      traitNode("t2", "alice", "ch1ep2", "brave"),
      traitNode("t3", "alice", "ch1ep3", "smart"),
      traitNode("t4", "alice", "ch2ep1", "brave"),
      // alice has traits in 4 eps, "brave" in 3/4 → missing in ch1ep3
    ];
    const issues = checkTraitConsistency(nodes, ALL_EPS);
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("trait_inconsistency");
    expect(issues[0].subject).toContain("brave");
    expect(issues[0].episodes).toEqual(["ch1ep3"]);
  });

  test("skips characters with fewer than 3 episodes", () => {
    const nodes = [
      traitNode("t1", "bob", "ch1ep1", "funny"),
      traitNode("t2", "bob", "ch1ep2", "funny"),
    ];
    const issues = checkTraitConsistency(nodes, ALL_EPS);
    expect(issues).toHaveLength(0);
  });

  test("ignores one-off traits", () => {
    const nodes = [
      traitNode("t1", "alice", "ch1ep1", "rare_trait"),
      traitNode("t2", "alice", "ch1ep2", "brave"),
      traitNode("t3", "alice", "ch1ep3", "brave"),
      traitNode("t4", "alice", "ch2ep1", "brave"),
    ];
    const issues = checkTraitConsistency(nodes, ALL_EPS);
    // "rare_trait" appears only once → ignored
    expect(issues.every((i) => i.subject !== "alice: rare_trait")).toBe(true);
  });
});

// ── Missing Characters ──

describe("checkMissingCharacters", () => {
  test("returns empty when character appears in all episodes", () => {
    const nodes = ALL_EPS.map((ep) => charNode(`${ep}_char_a`, "alice", ep, "Alice"));
    const issues = checkMissingCharacters(nodes, ALL_EPS);
    expect(issues).toHaveLength(0);
  });

  test("detects major character missing from some episodes", () => {
    // alice in 4/5 episodes (80% > 60% threshold)
    const eps = ["ch1ep1", "ch1ep2", "ch1ep3", "ch2ep1"];
    const nodes = eps.map((ep) => charNode(`${ep}_char_a`, "alice", ep, "Alice"));
    const issues = checkMissingCharacters(nodes, ALL_EPS);
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("missing_character");
    expect(issues[0].episodes).toEqual(["ch2ep2"]);
    expect(issues[0].severity).toBe("info");
  });

  test("ignores minor characters (< 60% episodes)", () => {
    // bob in 2/5 episodes (40% < 60%)
    const nodes = [
      charNode("ch1ep1_char_b", "bob", "ch1ep1", "Bob"),
      charNode("ch1ep2_char_b", "bob", "ch1ep2", "Bob"),
    ];
    const issues = checkMissingCharacters(nodes, ALL_EPS);
    expect(issues).toHaveLength(0);
  });

  test("skips when fewer than 3 episodes", () => {
    const nodes = [charNode("e1_a", "alice", "ep1", "Alice")];
    const issues = checkMissingCharacters(nodes, ["ep1", "ep2"]);
    expect(issues).toHaveLength(0);
  });
});

// ── Gag Gaps ──

describe("checkGagGaps", () => {
  test("returns empty when gag is continuous", () => {
    const nodes = [
      gagNode("g1", "slapstick", "ch1ep1"),
      gagNode("g2", "slapstick", "ch1ep2"),
      gagNode("g3", "slapstick", "ch1ep3"),
    ];
    const issues = checkGagGaps(nodes, ["ch1ep1", "ch1ep2", "ch1ep3"]);
    expect(issues).toHaveLength(0);
  });

  test("detects gap in middle episodes", () => {
    const nodes = [
      gagNode("g1", "slapstick", "ch1ep1"),
      gagNode("g2", "slapstick", "ch2ep2"),
    ];
    const issues = checkGagGaps(nodes, ALL_EPS);
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("gag_gap");
    expect(issues[0].episodes).toContain("ch1ep2");
    expect(issues[0].episodes).toContain("ch1ep3");
    expect(issues[0].episodes).toContain("ch2ep1");
  });

  test("ignores one-off gags", () => {
    const nodes = [gagNode("g1", "oneoff", "ch1ep1")];
    const issues = checkGagGaps(nodes, ALL_EPS);
    expect(issues).toHaveLength(0);
  });
});

// ── Theme Gaps ──

describe("checkThemeGaps", () => {
  test("detects series theme not spanning all episodes", () => {
    const nodes = [
      themeNode("th1", "courage", "ch1ep1", "series"),
      themeNode("th2", "courage", "ch1ep2", "series"),
      // Missing in ch1ep3, ch2ep1, ch2ep2
    ];
    const issues = checkThemeGaps(nodes, ALL_EPS);
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("theme_gap");
    expect(issues[0].subject).toBe("courage");
    expect(issues[0].episodes).toHaveLength(3);
  });

  test("ignores episode-scope themes", () => {
    const nodes = [
      themeNode("th1", "local", "ch1ep1", "episode"),
    ];
    const issues = checkThemeGaps(nodes, ALL_EPS);
    expect(issues).toHaveLength(0);
  });

  test("returns empty when series theme spans all episodes", () => {
    const nodes = ALL_EPS.map((ep) => themeNode(`th_${ep}`, "growth", ep, "series"));
    const issues = checkThemeGaps(nodes, ALL_EPS);
    expect(issues).toHaveLength(0);
  });
});
