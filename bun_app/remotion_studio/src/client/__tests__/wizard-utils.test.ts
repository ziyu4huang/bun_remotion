import { describe, test, expect } from "bun:test";
import { findCurrentStep, STEPS } from "../components/WizardTypes";
import type { EpisodeStepProgress } from "../../shared/types";

function makeEpisode(overrides: Partial<EpisodeStepProgress> = {}): {
  completedSteps: number;
  totalSteps: number;
  steps: EpisodeStepProgress;
} {
  const steps: EpisodeStepProgress = {
    scaffold: true,
    pipeline: true,
    check: true,
    score: true,
    image: true,
    tts: true,
    render: true,
    ...overrides,
  };
  const completedSteps = Object.values(steps).filter(Boolean).length;
  return { completedSteps, totalSteps: 7, steps };
}

describe("findCurrentStep", () => {
  test("returns null for empty episodes array", () => {
    expect(findCurrentStep([])).toBeNull();
  });

  test("returns null when all episodes are fully complete", () => {
    expect(findCurrentStep([makeEpisode(), makeEpisode()])).toBeNull();
  });

  test("returns scaffold for episodes with no steps done", () => {
    const ep = makeEpisode({
      scaffold: false, pipeline: false, check: false,
      score: false, image: false, tts: false, render: false,
    });
    expect(findCurrentStep([ep])).toBe("scaffold");
  });

  test("returns pipeline when scaffold is done but pipeline is not", () => {
    const ep = makeEpisode({
      pipeline: false, check: false, score: false,
      image: false, tts: false, render: false,
    });
    expect(findCurrentStep([ep])).toBe("pipeline");
  });

  test("returns render when only render is remaining", () => {
    expect(findCurrentStep([makeEpisode({ render: false })])).toBe("render");
  });

  test("returns most common incomplete step across episodes", () => {
    const episodes = [
      makeEpisode({ tts: false, render: false }),
      makeEpisode({ tts: false, render: false }),
      makeEpisode({ pipeline: false, check: false, score: false, image: false, tts: false, render: false }),
    ];
    // tts blocked for 2 eps, pipeline for 1 — tts wins
    expect(findCurrentStep(episodes)).toBe("tts");
  });

  test("skips fully completed episodes", () => {
    const episodes = [
      makeEpisode(),
      makeEpisode({ image: false, tts: false, render: false }),
    ];
    expect(findCurrentStep(episodes)).toBe("image");
  });

  test("STEPS array has 7 entries matching pipeline order", () => {
    expect(STEPS).toHaveLength(7);
    expect(STEPS.map((s) => s.key)).toEqual([
      "scaffold", "pipeline", "check", "score", "image", "tts", "render",
    ]);
  });

  test("each STEP has required fields", () => {
    for (const step of STEPS) {
      expect(step.pageId).toBeTruthy();
      expect(step.icon).toBeTruthy();
      expect(step.estimatedTime).toBeTruthy();
    }
  });
});
