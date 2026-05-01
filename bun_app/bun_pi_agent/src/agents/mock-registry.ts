import type { AgentTool } from "@mariozechner/pi-agent-core";

/** A recorded tool call for verification */
export interface RecordedToolCall {
  name: string;
  args: Record<string, unknown>;
  result: MockToolResult;
}

/** A canned result for a mock tool */
export interface MockToolResult {
  text: string;
  details?: Record<string, unknown>;
  isError?: boolean;
}

/**
 * Mock tool registry for deterministic agent testing.
 * Register expected tool calls with canned responses,
 * then verify the agent called the right tools in the right order.
 */
export class MockToolRegistry {
  private responses = new Map<string, MockToolResult | ((args: Record<string, unknown>) => MockToolResult)>();
  private calls: RecordedToolCall[] = [];

  /** Register a canned response for a tool name */
  register(name: string, result: MockToolResult | ((args: Record<string, unknown>) => MockToolResult)): this {
    this.responses.set(name, result);
    return this;
  }

  /** Register multiple responses at once */
  registerAll(map: Record<string, MockToolResult>): this {
    for (const [name, result] of Object.entries(map)) {
      this.responses.set(name, result);
    }
    return this;
  }

  /** Create a mock AgentTool for the given name */
  createMockTool(name: string): AgentTool<any> {
    return {
      description: `Mock ${name} tool`,
      parameters: {
        type: "object" as const,
        properties: {},
      },
      execute: async (args: Record<string, unknown>) => {
        const response = this.responses.get(name);
        let result: MockToolResult;

        if (!response) {
          result = { text: `Mock ${name}: no registered response`, isError: true };
        } else if (typeof response === "function") {
          result = response(args);
        } else {
          result = response;
        }

        const recorded: RecordedToolCall = { name, args, result };
        this.calls.push(recorded);

        return {
          text: result.text,
          details: result.details,
          ...(result.isError ? { isError: true } : {}),
        };
      },
    };
  }

  /** Create mock tools for a list of tool names */
  createMockTools(names: string[]): AgentTool<any>[] {
    return names.map(name => this.createMockTool(name));
  }

  /** Get all recorded tool calls */
  getCalls(): RecordedToolCall[] {
    return [...this.calls];
  }

  /** Get calls for a specific tool */
  getCallsFor(name: string): RecordedToolCall[] {
    return this.calls.filter(c => c.name === name);
  }

  /** Reset all recorded calls */
  reset(): void {
    this.calls = [];
  }

  /** Check if a specific tool was called */
  wasCalled(name: string): boolean {
    return this.calls.some(c => c.name === name);
  }

  /** Get the number of times a tool was called */
  callCount(name: string): number {
    return this.calls.filter(c => c.name === name).length;
  }
}

/**
 * Verification helpers for mock tool testing.
 * Usage: `expect(registry).toHaveCalledTool("sg_pipeline")`
 */
export function expectToolCalled(registry: MockToolRegistry, name: string, partialArgs?: Record<string, unknown>) {
  const calls = registry.getCallsFor(name);
  if (calls.length === 0) {
    throw new Error(`Expected tool "${name}" to have been called, but it was not. Calls: ${JSON.stringify(registry.getCalls().map(c => c.name))}`);
  }
  if (partialArgs) {
    const hasMatch = calls.some(call => {
      return Object.entries(partialArgs).every(([key, value]) => {
        const actual = call.args[key];
        return JSON.stringify(actual) === JSON.stringify(value);
      });
    });
    if (!hasMatch) {
      throw new Error(`Expected tool "${name}" to be called with args matching ${JSON.stringify(partialArgs)}, but calls were: ${JSON.stringify(calls.map(c => c.args))}`);
    }
  }
}

export function expectToolCallCount(registry: MockToolRegistry, name: string, expected: number) {
  const actual = registry.callCount(name);
  if (actual !== expected) {
    throw new Error(`Expected tool "${name}" to be called ${expected} times, but was called ${actual} times.`);
  }
}

export function expectToolNotCalled(registry: MockToolRegistry, name: string) {
  if (registry.wasCalled(name)) {
    throw new Error(`Expected tool "${name}" NOT to be called, but it was called ${registry.callCount(name)} times.`);
  }
}

/** Standard mock responses for common pipeline tools */
export const STANDARD_MOCKS: Record<string, MockToolResult> = {
  sg_pipeline: {
    text: "Pipeline completed: 42 nodes, 38 edges, 5 communities. Gate score: 78.",
    details: { tool: "sg_pipeline", success: true, data: { seriesId: "test-series", nodes: 42, edges: 38, communities: 5, gateScore: 78 } },
  },
  sg_check: {
    text: "Quality check passed. Gate score: 78/100. Decision: PASS.",
    details: { tool: "sg_check", success: true, data: { seriesId: "test-series", gateScore: 78, decision: "PASS", checkCount: 8, failures: [] } },
  },
  sg_score: {
    text: "Blended score: 82/100. Dimensions: character_depth=85, plot_coherence=80.",
    details: { tool: "sg_score", success: true, data: { seriesId: "test-series", blendedScore: 82 } },
  },
  sg_regression: {
    text: "No regression detected. All scores within threshold.",
    details: { tool: "sg_regression", success: true, data: { regressions: [] } },
  },
  sg_health: {
    text: "Health: 6 dimensions checked. 4 improving, 2 stable.",
    details: { tool: "sg_health", success: true, data: { dimensions: 6, improving: 4, stable: 2 } },
  },
  sg_suggest: {
    text: "3 suggestions: deepen character arcs, resolve foreshadowing, vary gag patterns.",
    details: { tool: "sg_suggest", success: true, data: { suggestionCount: 3 } },
  },
  sg_status: {
    text: "Pipeline status: last run 2h ago, 42 nodes extracted.",
    details: { tool: "sg_status", success: true, data: { hasPipeline: true, nodeCount: 42 } },
  },
  sg_baseline_list: {
    text: "Baselines: weapon-forger (score 82), my-core-is-boss (score 76).",
    details: { tool: "sg_baseline_list", success: true, data: { baselines: ["weapon-forger", "my-core-is-boss"] } },
  },
  sg_baseline_update: {
    text: "Baseline updated for test-series. New score: 80.",
    details: { tool: "sg_baseline_update", success: true, data: { seriesId: "test-series", score: 80 } },
  },
  sg_dual_review: {
    text: "Dual review: AGREE on 6/8 dimensions. 2 PARTIAL_AGREE.",
    details: { tool: "sg_dual_review", success: true, data: { agreeCount: 6, partialAgreeCount: 2 } },
  },
  rm_analyze: {
    text: "Episode analysis: 4 scenes, 3 characters, pacing good.",
    details: { tool: "rm_analyze", success: true, data: { episode: "test-ch1-ep1", scenes: 4, characters: 3 } },
  },
  rm_suggest: {
    text: "Content suggestions: add running gag callback, deepen villain arc.",
    details: { tool: "rm_suggest", success: true, data: { suggestionCount: 2 } },
  },
  rm_lint: {
    text: "Lint: 5 checks passed, 1 warning (missing name prop on Sequence).",
    details: { tool: "rm_lint", success: true, data: { passCount: 5, failCount: 1 } },
  },
  sc_scaffold: {
    text: "Scaffolded: test-series-ch1-ep1. 8 files created.",
    details: { tool: "sc_scaffold", success: true, data: { series: "test-series", episode: "ch1-ep1", filesCreated: 8 } },
  },
  sc_series_list: {
    text: "Series: weapon-forger, my-core-is-boss, xianxia-system-meme.",
    details: { tool: "sc_series_list", success: true, data: { seriesCount: 3 } },
  },
  sc_episode_list: {
    text: "Episodes for test-series: ch1-ep1, ch1-ep2, ch1-ep3.",
    details: { tool: "sc_episode_list", success: true, data: { episodeCount: 3 } },
  },
  tts_generate: {
    text: "TTS generated: 4 scenes, engine=mlx, total 45s audio.",
    details: { tool: "tts_generate", success: true, data: { episode: "test-ch1-ep1", engine: "mlx", scenesGenerated: 4 } },
  },
  tts_voices: {
    text: "Voice map: narrator=default, hero=andrew, villain=bella.",
    details: { tool: "tts_voices", success: true, data: { voices: { narrator: "default", hero: "andrew", villain: "bella" } } },
  },
  tts_status: {
    text: "TTS status: 4/4 scenes have audio. Total: 45s.",
    details: { tool: "tts_status", success: true, data: { episode: "test-ch1-ep1", hasAudio: true, fileCount: 4 } },
  },
  render_episode: {
    text: "Rendered: test-ch1-ep1 → out/test-ch1-ep1.mp4 (12.5MB).",
    details: { tool: "render_episode", success: true, data: { episode: "test-ch1-ep1", outputPath: "out/test-ch1-ep1.mp4", fileSizeKb: 12800 } },
  },
  render_status: {
    text: "Render status: test-ch1-ep1 rendered, 12.5MB, not stale.",
    details: { tool: "render_status", success: true, data: { episode: "test-ch1-ep1", hasRender: true, isStale: false, fileSizeKb: 12800 } },
  },
  render_list: {
    text: "Rendered episodes: 3/10 total.",
    details: { tool: "render_list", success: true, data: { total: 10, rendered: 3 } },
  },
  image_generate: {
    text: "Generated: 2/3 images (1 skipped). Files: hero-left.png, villain-right.png.",
    details: { tool: "image_generate", success: true, data: { generated: 2, failed: 0, skipped: 1 } },
  },
  image_status: {
    text: "Image status: 5 characters, 12 variants total.",
    details: { tool: "image_status", success: true, data: { characterCount: 5, variantCount: 12 } },
  },
  image_characters: {
    text: "Characters: hero (3 variants), villain (2 variants), sidekick (2 variants).",
    details: { tool: "image_characters", success: true, data: { characters: ["hero", "villain", "sidekick"] } },
  },
  spawn_task: {
    text: "Sub-agent completed. Turns: 3, tools: 5.",
    details: { tool: "spawn_task", success: true, data: { agent_name: "mock-subagent", turn_count: 3, tool_calls: 5 } },
  },
  Read: {
    text: "File content loaded.",
    details: { tool: "Read", success: true, data: { lines: 100 } },
  },
  Grep: {
    text: "Found 3 matches.",
    details: { tool: "Grep", success: true, data: { matchCount: 3 } },
  },
  Find: {
    text: "Found 5 files.",
    details: { tool: "Find", success: true, data: { fileCount: 5 } },
  },
  Bash: {
    text: "Command executed successfully.",
    details: { tool: "Bash", success: true, data: { exitCode: 0 } },
  },
  Write: {
    text: "File written successfully.",
    details: { tool: "Write", success: true, data: {} },
  },
};
