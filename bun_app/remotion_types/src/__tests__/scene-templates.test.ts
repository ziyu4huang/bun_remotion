import { describe, test, expect } from "bun:test";
import {
  buildTechExplainerSpec,
  buildGalgameVNSpec,
  buildNarrativeDramaSpec,
  buildCompositionSpec,
} from "../scene-templates";
import type {
  TechExplainerData,
  GalgameVNData,
  NarrativeDramaData,
  SceneSpec,
} from "../scene-templates";
import { storygraphExplainerData } from "../presets/tech-explainer-presets";

// ─── buildTechExplainerSpec (with storygraphExplainerData) ───

describe("buildTechExplainerSpec with storygraphExplainerData", () => {
  const spec = buildTechExplainerSpec(storygraphExplainerData);

  test("category is tech_explainer", () => {
    expect(spec.category).toBe("tech_explainer");
  });

  test("fps === 30", () => {
    expect(spec.fps).toBe(30);
  });

  test("width === 1920, height === 1080", () => {
    expect(spec.width).toBe(1920);
    expect(spec.height).toBe(1080);
  });

  test("id is derived from title", () => {
    expect(spec.id).toBe("storygraph");
  });

  test("feature scene count matches data.features.length", () => {
    const featureScenes = spec.scenes.filter((s) => s.name === "FeatureScene");
    expect(featureScenes).toHaveLength(storygraphExplainerData.features.length);
  });

  test("includes ComparisonScene (data has comparison)", () => {
    const compScene = spec.scenes.find((s) => s.name === "ComparisonScene");
    expect(compScene).toBeDefined();
    expect(compScene!.props).toHaveProperty("before");
    expect(compScene!.props).toHaveProperty("after");
  });

  test("includes all required scene types", () => {
    const sceneNames = spec.scenes.map((s) => s.name);
    expect(sceneNames).toContain("TitleScene");
    expect(sceneNames).toContain("ProblemScene");
    expect(sceneNames).toContain("ArchitectureScene");
    expect(sceneNames).toContain("DemoScene");
    expect(sceneNames).toContain("OutroScene");
  });

  test("totalFrames is targetDurationSec * fps", () => {
    expect(spec.totalFrames).toBe(90 * 30);
  });

  test("scenes are contiguous (no gaps, no overlaps)", () => {
    for (let i = 1; i < spec.scenes.length; i++) {
      const prev = spec.scenes[i - 1];
      const curr = spec.scenes[i];
      expect(curr.startFrame).toBe(prev.startFrame + prev.durationInFrames);
    }
  });

  test("no scene has zero or negative duration", () => {
    for (const scene of spec.scenes) {
      expect(scene.durationInFrames).toBeGreaterThan(0);
    }
  });

  test("first scene starts at frame 0", () => {
    expect(spec.scenes[0].startFrame).toBe(0);
  });
});

describe("buildTechExplainerSpec without comparison", () => {
  const dataNoComp: TechExplainerData = {
    title: "Test Tool",
    tagline: "Test tagline",
    painPoint: "Test pain",
    pipeline: [{ name: "Step1", icon: "A", description: "Do thing" }],
    features: [{ name: "F1", description: "Feat 1", visual: "icon" }],
    demoSteps: ["run foo"],
    cta: "Try now",
    links: ["example.com"],
    // comparison omitted
  };

  const spec = buildTechExplainerSpec(dataNoComp);

  test("no ComparisonScene when comparison is undefined", () => {
    const compScene = spec.scenes.find((s) => s.name === "ComparisonScene");
    expect(compScene).toBeUndefined();
  });
});

describe("buildTechExplainerSpec custom duration", () => {
  const minimalData: TechExplainerData = {
    title: "Minimal",
    tagline: "Tag",
    painPoint: "Pain",
    pipeline: [],
    features: [
      { name: "F1", description: "D1", visual: "icon" },
      { name: "F2", description: "D2", visual: "diagram" },
    ],
    demoSteps: [],
    comparison: { before: "old", after: "new" },
    cta: "Go",
    links: [],
  };

  const spec = buildTechExplainerSpec(minimalData, 60);

  test("totalFrames = 60 * 30", () => {
    expect(spec.totalFrames).toBe(1800);
  });

  test("feature scenes still match features count", () => {
    const featureScenes = spec.scenes.filter((s) => s.name === "FeatureScene");
    expect(featureScenes).toHaveLength(2);
  });
});

// ─── buildGalgameVNSpec ───

describe("buildGalgameVNSpec", () => {
  const mockData: GalgameVNData = {
    title: "Test Galgame",
    episodeNum: 3,
    characters: [
      { id: "alice", name: "Alice" },
      { id: "bob", name: "Bob" },
    ],
    jokes: [
      {
        setup: [
          { character: "alice", text: "Have you heard?", emotion: "happy" },
        ],
        punchline: [
          { character: "bob", text: "No, what?", emotion: "surprised" },
        ],
      },
      {
        setup: [
          { character: "alice", text: "Setup line 1" },
          { character: "bob", text: "Setup line 2" },
          { character: "alice", text: "Setup line 3" },
        ],
        punchline: [
          { character: "bob", text: "Punchline!" },
        ],
      },
    ],
    nextTeaser: "Next: even more jokes!",
  };

  const spec = buildGalgameVNSpec(mockData);

  test("category is galgame_vn", () => {
    expect(spec.category).toBe("galgame_vn");
  });

  test("fps === 30, width === 1920, height === 1080", () => {
    expect(spec.fps).toBe(30);
    expect(spec.width).toBe(1920);
    expect(spec.height).toBe(1080);
  });

  test("id includes episode number", () => {
    expect(spec.id).toContain("ep3");
  });

  test("joke scene count matches data.jokes.length", () => {
    const jokeScenes = spec.scenes.filter((s) => s.name === "JokeScene");
    expect(jokeScenes).toHaveLength(2);
  });

  test("starts with TitleScene, ends with OutroScene", () => {
    expect(spec.scenes[0].name).toBe("TitleScene");
    expect(spec.scenes[spec.scenes.length - 1].name).toBe("OutroScene");
  });

  test("scene startFrames are sequential", () => {
    for (let i = 1; i < spec.scenes.length; i++) {
      const prev = spec.scenes[i - 1];
      const curr = spec.scenes[i];
      expect(curr.startFrame).toBe(prev.startFrame + prev.durationInFrames);
    }
  });

  test("last scene ends at totalFrames", () => {
    const lastScene = spec.scenes[spec.scenes.length - 1];
    expect(lastScene.startFrame + lastScene.durationInFrames).toBe(spec.totalFrames);
  });

  test("joke scenes with more dialog lines are longer", () => {
    const jokeScenes = spec.scenes.filter((s) => s.name === "JokeScene");
    // joke 1 has 2 lines, joke 2 has 4 lines -> joke 2 should be longer
    expect(jokeScenes[1].durationInFrames).toBeGreaterThanOrEqual(jokeScenes[0].durationInFrames);
  });

  test("scene duration >= 120 frames (minimum)", () => {
    for (const scene of spec.scenes) {
      if (scene.name === "JokeScene") {
        expect(scene.durationInFrames).toBeGreaterThanOrEqual(120);
      }
    }
  });
});

// ─── buildCompositionSpec dispatcher ───

describe("buildCompositionSpec dispatcher", () => {
  test("routes narrative_drama correctly", () => {
    const data: NarrativeDramaData = {
      title: "Test",
      episodeTitle: "Ep1",
      chapterNum: 1,
      episodeNum: 1,
      characters: [{ id: "hero", name: "Hero", side: "left" }],
      scenes: [
        {
          id: "s1",
          background: "bg.png",
          dialogLines: [{ character: "hero", text: "Hello" }],
        },
      ],
      outroQuest: "Quest!",
    };
    const spec = buildCompositionSpec("narrative_drama", data);
    expect(spec.category).toBe("narrative_drama");
  });

  test("routes galgame_vn correctly", () => {
    const data: GalgameVNData = {
      title: "VN",
      episodeNum: 1,
      characters: [{ id: "c1", name: "Char" }],
      jokes: [
        {
          setup: [{ character: "c1", text: "Hi" }],
          punchline: [{ character: "c1", text: "Bye" }],
        },
      ],
    };
    const spec = buildCompositionSpec("galgame_vn", data);
    expect(spec.category).toBe("galgame_vn");
  });

  test("routes tech_explainer correctly", () => {
    const data: TechExplainerData = {
      title: "Tool",
      tagline: "TL",
      painPoint: "Pain",
      pipeline: [],
      features: [{ name: "F1", description: "D1", visual: "icon" }],
      demoSteps: [],
      cta: "Go",
      links: [],
    };
    const spec = buildCompositionSpec("tech_explainer", data);
    expect(spec.category).toBe("tech_explainer");
  });

  test("routes data_story correctly", () => {
    const data = {
      title: "DS",
      dataSource: "src",
      charts: [{ chartType: "line" as const, title: "T", data: {}, insight: "I" }],
      trends: [{ title: "Trend", annotation: "Up" }],
      summary: "S",
      callToAction: "CTA",
    };
    const spec = buildCompositionSpec("data_story", data);
    expect(spec.category).toBe("data_story");
  });

  test("routes listicle correctly", () => {
    const data = {
      title: "Top 5",
      hookStatement: "Check this",
      items: [
        { rank: 1, title: "A", description: "DA" },
        { rank: 2, title: "B", description: "DB" },
      ],
      verdict: "V",
      cta: "CTA",
    };
    const spec = buildCompositionSpec("listicle", data);
    expect(spec.category).toBe("listicle");
  });

  test("routes tutorial correctly", () => {
    const data = {
      title: "How to X",
      prerequisites: ["node"],
      steps: [{ instruction: "Do step 1", code: "npm i" }],
      keyTakeaway: "Learn X",
      cta: "Subscribe",
    };
    const spec = buildCompositionSpec("tutorial", data);
    expect(spec.category).toBe("tutorial");
  });

  test("routes shorts_meme correctly", () => {
    const data = {
      hook: "Did you know?",
      visual: "img.png",
      setup: "Setup",
      punchline: "Punch!",
      reaction: "wow",
    };
    const spec = buildCompositionSpec("shorts_meme", data);
    expect(spec.category).toBe("shorts_meme");
    // shorts_meme uses 9:16 aspect ratio
    expect(spec.width).toBe(1080);
    expect(spec.height).toBe(1920);
  });

  test("throws for unknown category", () => {
    // @ts-expect-error — intentionally passing invalid category
    expect(() => buildCompositionSpec("invalid_category", {})).toThrow();
  });
});
