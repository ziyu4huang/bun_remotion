import { describe, test, expect } from "bun:test";
import { getPipelineOp } from "../components/PipelineToolCard";

describe("getPipelineOp", () => {
  test("maps scaffold tools", () => {
    expect(getPipelineOp("sc_scaffold")).toEqual({ op: "scaffold", label: "Scaffold Episode" });
    expect(getPipelineOp("sc_series_list")).toEqual({ op: "scaffold", label: "List Series" });
    expect(getPipelineOp("sc_episode_list")).toEqual({ op: "scaffold", label: "List Episodes" });
  });

  test("maps render tools", () => {
    expect(getPipelineOp("render_episode")).toEqual({ op: "render", label: "Render Video" });
    expect(getPipelineOp("render_status")).toEqual({ op: "render", label: "Check Render" });
    expect(getPipelineOp("render_list")).toEqual({ op: "render", label: "List Renders" });
  });

  test("maps TTS tools", () => {
    expect(getPipelineOp("tts_generate")).toEqual({ op: "tts", label: "Generate TTS" });
    expect(getPipelineOp("tts_status")).toEqual({ op: "tts", label: "Check TTS" });
    expect(getPipelineOp("tts_voices")).toEqual({ op: "tts", label: "List Voices" });
  });

  test("maps image tools", () => {
    expect(getPipelineOp("image_generate")).toEqual({ op: "image", label: "Generate Image" });
    expect(getPipelineOp("image_status")).toEqual({ op: "image", label: "Check Images" });
    expect(getPipelineOp("image_characters")).toEqual({ op: "image", label: "Character Profiles" });
  });

  test("maps pipeline tools", () => {
    expect(getPipelineOp("sg_pipeline")).toEqual({ op: "pipeline", label: "Extract KG" });
  });

  test("maps check tools", () => {
    expect(getPipelineOp("sg_check")).toEqual({ op: "check", label: "Quality Gate" });
    expect(getPipelineOp("sg_health")).toEqual({ op: "check", label: "Health Check" });
    expect(getPipelineOp("sg_regression")).toEqual({ op: "check", label: "Regression Check" });
    expect(getPipelineOp("sg_suggest")).toEqual({ op: "check", label: "Suggestions" });
    expect(getPipelineOp("sg_status")).toEqual({ op: "check", label: "Pipeline Status" });
    expect(getPipelineOp("sg_baseline_list")).toEqual({ op: "check", label: "List Baselines" });
    expect(getPipelineOp("sg_baseline_update")).toEqual({ op: "check", label: "Update Baseline" });
  });

  test("maps score tools", () => {
    expect(getPipelineOp("sg_score")).toEqual({ op: "score", label: "AI Score" });
  });

  test("maps review tools", () => {
    expect(getPipelineOp("rm_analyze")).toEqual({ op: "review", label: "Analyze" });
    expect(getPipelineOp("rm_lint")).toEqual({ op: "review", label: "Lint" });
    expect(getPipelineOp("rm_suggest")).toEqual({ op: "review", label: "Suggest" });
    expect(getPipelineOp("sg_dual_review")).toEqual({ op: "review", label: "Dual Review" });
  });

  test("maps spawn tool", () => {
    expect(getPipelineOp("spawn_task")).toEqual({ op: "spawn", label: "Delegate Task" });
  });

  test("unknown tool returns other with tool name as label", () => {
    expect(getPipelineOp("unknown_tool")).toEqual({ op: "other", label: "unknown_tool" });
    expect(getPipelineOp("custom_op")).toEqual({ op: "other", label: "custom_op" });
  });

  test("all 25 mapped tools resolve to known ops", () => {
    const toolNames = [
      "sc_scaffold", "render_episode", "render_status", "render_list",
      "tts_generate", "tts_status", "tts_voices",
      "image_generate", "image_status", "image_characters",
      "sg_pipeline", "sg_check", "sg_score",
      "sg_dual_review", "sg_health", "sg_regression", "sg_suggest",
      "sg_status", "sg_baseline_list", "sg_baseline_update",
      "rm_analyze", "rm_lint", "rm_suggest",
      "sc_series_list", "sc_episode_list", "spawn_task",
    ];
    const validOps = ["scaffold", "render", "tts", "image", "pipeline", "check", "score", "review", "spawn"];
    for (const name of toolNames) {
      const { op } = getPipelineOp(name);
      expect(validOps).toContain(op);
    }
  });
});
