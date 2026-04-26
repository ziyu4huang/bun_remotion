import { describe, test, expect } from "bun:test";
import { scanProjects, getProject } from "../server/services/project-scanner";

describe("project-scanner", () => {
  test("scanProjects returns all series", () => {
    const projects = scanProjects();
    expect(projects.length).toBeGreaterThanOrEqual(5);

    const ids = projects.map((p) => p.id).sort();
    expect(ids).toContain("galgame-meme-theater");
    expect(ids).toContain("my-core-is-boss");
    expect(ids).toContain("storygraph-explainer");
    expect(ids).toContain("weapon-forger");
    expect(ids).toContain("xianxia-system-meme");
  });

  test("weapon-forger has correct structure", () => {
    const wf = getProject("weapon-forger");
    expect(wf).not.toBeNull();
    expect(wf!.category).toBe("narrative_drama");
    expect(wf!.episodes.length).toBeGreaterThanOrEqual(7);
    expect(wf!.hasPlan).toBe(true);
    expect(wf!.scaffoldedCount).toBeGreaterThan(0);
  });

  test("weapon-forger episodes have chapter+episode numbers", () => {
    const wf = getProject("weapon-forger")!;
    const first = wf.episodes[0];
    expect(first.chapter).toBe(1);
    expect(first.episode).toBe(1);
    expect(first.id).toBe("weapon-forger-ch1-ep1");
  });

  test("galgame-meme-theater has episode-only numbering", () => {
    const gmt = getProject("galgame-meme-theater")!;
    expect(gmt.category).toBe("galgame_vn");
    expect(gmt.episodes.length).toBeGreaterThanOrEqual(5);

    const first = gmt.episodes[0];
    expect(first.episode).toBe(1);
    expect(first.chapter).toBeUndefined();
  });

  test("storygraph-explainer is tech_explainer", () => {
    const sge = getProject("storygraph-explainer");
    expect(sge).not.toBeNull();
    expect(sge!.category).toBe("tech_explainer");
    expect(sge!.episodes.length).toBeGreaterThanOrEqual(3);
  });

  test("episodes sorted by chapter then episode", () => {
    const wf = getProject("weapon-forger")!;
    for (let i = 1; i < wf.episodes.length; i++) {
      const prev = wf.episodes[i - 1];
      const curr = wf.episodes[i];
      if (prev.chapter !== curr.chapter) {
        expect(prev.chapter!).toBeLessThan(curr.chapter!);
      } else {
        expect(prev.episode!).toBeLessThan(curr.episode!);
      }
    }
  });

  test("gate scores read from series-level storygraph_out", () => {
    // At least one series should have a gate.json
    const projects = scanProjects();
    const withScores = projects.filter((p) => p.gateScore !== undefined);
    expect(withScores.length).toBeGreaterThanOrEqual(1);
  });

  test("getProject returns null for unknown", () => {
    expect(getProject("nonexistent-series-xyz")).toBeNull();
  });

  test("every project has required fields", () => {
    const projects = scanProjects();
    for (const p of projects) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.seriesId).toBe(p.id);
      expect(p.category).toBeTruthy();
      expect(p.path).toBeTruthy();
      expect(typeof p.episodeCount).toBe("number");
      expect(typeof p.scaffoldedCount).toBe("number");
    }
  });

  test("every episode has required fields", () => {
    const projects = scanProjects();
    for (const p of projects) {
      for (const ep of p.episodes) {
        expect(ep.id).toBeTruthy();
        expect(ep.path).toBeTruthy();
        expect(typeof ep.hasScaffold).toBe("boolean");
        expect(typeof ep.hasTTS).toBe("boolean");
        expect(typeof ep.hasRender).toBe("boolean");
      }
    }
  });
});
