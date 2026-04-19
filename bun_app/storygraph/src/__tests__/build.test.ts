import { describe, test, expect } from "bun:test";
import { buildFromExtraction, mergeExtractions } from "../build";
import type { ExtractionResult, GraphNode, GraphEdge, Hyperedge } from "../types";

/** Helper to create a minimal GraphNode */
function makeNode(overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id: `node_${Math.random().toString(36).slice(2, 8)}`,
    label: "Test Node",
    file_type: "code",
    source_file: "test.ts",
    source_location: "1:1",
    ...overrides,
  };
}

/** Helper to create a minimal GraphEdge */
function makeEdge(
  source: string,
  target: string,
  overrides: Partial<GraphEdge> = {},
): GraphEdge {
  return {
    source,
    target,
    relation: "depends_on",
    confidence: "EXTRACTED",
    confidence_score: 0.9,
    source_file: "test.ts",
    source_location: "1:1",
    weight: 1.0,
    ...overrides,
  };
}

function makeHyperedge(overrides: Partial<Hyperedge> = {}): Hyperedge {
  return {
    id: `he_${Math.random().toString(36).slice(2, 8)}`,
    nodes: [],
    ...overrides,
  };
}

describe("buildFromExtraction", () => {
  test("builds an empty graph from empty extraction", () => {
    const extraction: ExtractionResult = {
      nodes: [],
      edges: [],
      hyperedges: [],
      input_tokens: 0,
      output_tokens: 0,
    };
    const graph = buildFromExtraction(extraction);
    expect(graph.order).toBe(0);
    expect(graph.size).toBe(0);
  });

  test("adds all nodes to the graph", () => {
    const nodes = [
      makeNode({ id: "A" }),
      makeNode({ id: "B" }),
      makeNode({ id: "C" }),
    ];
    const extraction: ExtractionResult = {
      nodes,
      edges: [],
      hyperedges: [],
      input_tokens: 0,
      output_tokens: 0,
    };
    const graph = buildFromExtraction(extraction);
    expect(graph.order).toBe(3);
    expect(graph.hasNode("A")).toBe(true);
    expect(graph.hasNode("B")).toBe(true);
    expect(graph.hasNode("C")).toBe(true);
  });

  test("adds edges between existing nodes", () => {
    const nodes = [makeNode({ id: "A" }), makeNode({ id: "B" })];
    const edges = [makeEdge("A", "B", { relation: "imports" })];
    const extraction: ExtractionResult = {
      nodes,
      edges,
      hyperedges: [],
      input_tokens: 10,
      output_tokens: 20,
    };
    const graph = buildFromExtraction(extraction);
    expect(graph.order).toBe(2);
    expect(graph.size).toBe(1);
    expect(graph.hasEdge("A", "B")).toBe(true);
  });

  test("preserves node attributes", () => {
    const nodes = [
      makeNode({
        id: "func_main",
        label: "main()",
        file_type: "code",
        source_file: "src/index.ts",
        source_location: "10:5",
        type: "function",
        properties: { async: "true" },
      }),
    ];
    const extraction: ExtractionResult = {
      nodes,
      edges: [],
      hyperedges: [],
      input_tokens: 5,
      output_tokens: 5,
    };
    const graph = buildFromExtraction(extraction);
    const attrs = graph.getNodeAttributes("func_main");
    expect(attrs.label).toBe("main()");
    expect(attrs.file_type).toBe("code");
    expect(attrs.source_file).toBe("src/index.ts");
    expect(attrs.type).toBe("function");
    expect(attrs.properties).toEqual({ async: "true" });
  });

  test("preserves edge attributes", () => {
    const nodes = [makeNode({ id: "A" }), makeNode({ id: "B" })];
    const edges = [
      makeEdge("A", "B", {
        relation: "calls",
        confidence: "INFERRED",
        confidence_score: 0.75,
        weight: 2.0,
      }),
    ];
    const extraction: ExtractionResult = {
      nodes,
      edges,
      hyperedges: [],
      input_tokens: 5,
      output_tokens: 5,
    };
    const graph = buildFromExtraction(extraction);
    const edgeAttrs = graph.getEdgeAttributes(
      graph.edge("A", "B")!,
    );
    expect(edgeAttrs.relation).toBe("calls");
    expect(edgeAttrs.confidence).toBe("INFERRED");
    expect(edgeAttrs.confidence_score).toBe(0.75);
    expect(edgeAttrs.weight).toBe(2.0);
  });

  test("deduplicates nodes with the same ID", () => {
    const nodes = [
      makeNode({ id: "A", label: "First A" }),
      makeNode({ id: "A", label: "Second A" }),
    ];
    const extraction: ExtractionResult = {
      nodes,
      edges: [],
      hyperedges: [],
      input_tokens: 0,
      output_tokens: 0,
    };
    const graph = buildFromExtraction(extraction);
    expect(graph.order).toBe(1);
    // First occurrence wins
    expect(graph.getNodeAttribute("A", "label")).toBe("First A");
  });

  test("skips edges where source node does not exist", () => {
    const nodes = [makeNode({ id: "B" })];
    const edges = [makeEdge("A_missing", "B")];
    const extraction: ExtractionResult = {
      nodes,
      edges,
      hyperedges: [],
      input_tokens: 0,
      output_tokens: 0,
    };
    const graph = buildFromExtraction(extraction);
    expect(graph.size).toBe(0);
  });

  test("skips edges where target node does not exist", () => {
    const nodes = [makeNode({ id: "A" })];
    const edges = [makeEdge("A", "B_missing")];
    const extraction: ExtractionResult = {
      nodes,
      edges,
      hyperedges: [],
      input_tokens: 0,
      output_tokens: 0,
    };
    const graph = buildFromExtraction(extraction);
    expect(graph.size).toBe(0);
  });

  test("skips self-loop edges", () => {
    const nodes = [makeNode({ id: "A" })];
    const edges = [makeEdge("A", "A")];
    const extraction: ExtractionResult = {
      nodes,
      edges,
      hyperedges: [],
      input_tokens: 0,
      output_tokens: 0,
    };
    const graph = buildFromExtraction(extraction);
    expect(graph.size).toBe(0);
  });

  test("deduplicates edges between the same pair", () => {
    const nodes = [makeNode({ id: "A" }), makeNode({ id: "B" })];
    const edges = [
      makeEdge("A", "B", { relation: "imports" }),
      makeEdge("A", "B", { relation: "depends_on" }),
    ];
    const extraction: ExtractionResult = {
      nodes,
      edges,
      hyperedges: [],
      input_tokens: 0,
      output_tokens: 0,
    };
    const graph = buildFromExtraction(extraction);
    expect(graph.size).toBe(1);
    // First edge wins
    const edgeKey = graph.edge("A", "B")!;
    expect(graph.getEdgeAttribute(edgeKey, "relation")).toBe("imports");
  });

  test("builds a graph with multiple edges forming a chain", () => {
    const nodes = [
      makeNode({ id: "A" }),
      makeNode({ id: "B" }),
      makeNode({ id: "C" }),
      makeNode({ id: "D" }),
    ];
    const edges = [
      makeEdge("A", "B"),
      makeEdge("B", "C"),
      makeEdge("C", "D"),
    ];
    const extraction: ExtractionResult = {
      nodes,
      edges,
      hyperedges: [],
      input_tokens: 50,
      output_tokens: 100,
    };
    const graph = buildFromExtraction(extraction);
    expect(graph.order).toBe(4);
    expect(graph.size).toBe(3);
  });

  test("node IDs are exactly as provided (no transformation)", () => {
    const nodes = [makeNode({ id: "ch1ep1_character_linFeng" })];
    const extraction: ExtractionResult = {
      nodes,
      edges: [],
      hyperedges: [],
      input_tokens: 0,
      output_tokens: 0,
    };
    const graph = buildFromExtraction(extraction);
    expect(graph.hasNode("ch1ep1_character_linFeng")).toBe(true);
  });

  test("edges reference only valid node IDs present in nodes array", () => {
    const nodes = [makeNode({ id: "X" }), makeNode({ id: "Y" })];
    const edges = [
      makeEdge("X", "Y"),
      makeEdge("X", "Z_MISSING"), // should be skipped
      makeEdge("W_MISSING", "Y"), // should be skipped
    ];
    const extraction: ExtractionResult = {
      nodes,
      edges,
      hyperedges: [],
      input_tokens: 0,
      output_tokens: 0,
    };
    const graph = buildFromExtraction(extraction);
    // Only X-Y should exist
    expect(graph.size).toBe(1);
    expect(graph.hasEdge("X", "Y")).toBe(true);
  });
});

describe("mergeExtractions", () => {
  test("merges two extractions, deduplicating nodes", () => {
    const ext1: ExtractionResult = {
      nodes: [makeNode({ id: "A" }), makeNode({ id: "B" })],
      edges: [makeEdge("A", "B")],
      hyperedges: [],
      input_tokens: 10,
      output_tokens: 20,
    };
    const ext2: ExtractionResult = {
      nodes: [makeNode({ id: "B" }), makeNode({ id: "C" })],
      edges: [makeEdge("B", "C")],
      hyperedges: [makeHyperedge({ id: "he1" })],
      input_tokens: 15,
      output_tokens: 25,
    };

    const merged = mergeExtractions([ext1, ext2]);
    // Node B deduplicated
    expect(merged.nodes).toHaveLength(3);
    const nodeIds = merged.nodes.map((n) => n.id);
    expect(nodeIds).toContain("A");
    expect(nodeIds).toContain("B");
    expect(nodeIds).toContain("C");
    // B appears only once
    expect(nodeIds.filter((id) => id === "B")).toHaveLength(1);

    // Edges are NOT deduplicated (all kept)
    expect(merged.edges).toHaveLength(2);

    // Hyperedges are concatenated
    expect(merged.hyperedges).toHaveLength(1);

    // Tokens summed
    expect(merged.input_tokens).toBe(25);
    expect(merged.output_tokens).toBe(45);
  });

  test("merges empty extractions", () => {
    const merged = mergeExtractions([]);
    expect(merged.nodes).toHaveLength(0);
    expect(merged.edges).toHaveLength(0);
    expect(merged.hyperedges).toHaveLength(0);
    expect(merged.input_tokens).toBe(0);
    expect(merged.output_tokens).toBe(0);
  });
});
