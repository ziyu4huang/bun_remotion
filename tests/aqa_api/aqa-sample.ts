/**
 * AQA (Attributed Question Answering) API test (free tier)
 * Run: bun tests/aqa_api/aqa-sample.ts
 *
 * ── Prerequisites ──────────────────────────────────────────────
 * GOOGLE_API_KEY env var must be set
 *
 * ── Model ──────────────────────────────────────────────────────
 * - aqa (free tier ✅)
 *
 * ── API Pattern ────────────────────────────────────────────────
 * Endpoint: POST /v1beta/models/aqa:generateAnswer
 * Auth:     x-goog-api-key header
 * Body:     { contents, answerStyle: "ABSTRACTIVE", inlinePassages }
 * Response: { answer, answerableProbability, groundingAttributions }
 * ──────────────────────────────────────────────────────────────
 */

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) { console.error("GOOGLE_API_KEY not set"); process.exit(1); }

const URL = "https://generativelanguage.googleapis.com/v1beta/models/aqa:generateAnswer";

const TESTS = [
  {
    name: "Science question",
    context: "Photosynthesis is the process by which green plants convert sunlight, water, and carbon dioxide into glucose and oxygen. This process occurs in the chloroplasts of plant cells, specifically using chlorophyll pigment to capture light energy.",
    question: "What are the three inputs required for photosynthesis?",
  },
  {
    name: "History question",
    context: "The Taiwan Stock Exchange (TWSE) was established in 1961 and officially began operations on February 9, 1962. It is located in Taipei, Taiwan. The TAIEX index is the benchmark index that tracks all listed stocks on the exchange.",
    question: "When did the Taiwan Stock Exchange begin operations?",
  },
  {
    name: "Math question",
    context: "The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones. It commonly starts with 0 and 1. The sequence goes: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144.",
    question: "What is the 10th number in the Fibonacci sequence?",
  },
];

async function testAQA(name: string, context: string, question: string) {
  const body = {
    contents: [{ parts: [{ text: `${context}\n\n${question}` }] }],
    answerStyle: "ABSTRACTIVE",
    inlinePassages: {
      passages: [
        { id: "1", content: { parts: [{ text: context }] } },
      ],
    },
  };

  const t0 = Date.now();
  const res = await fetch(URL, {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    try {
      const j = JSON.parse(err);
      return { ok: false, error: `${res.status}: ${j.error?.message ?? err.slice(0, 200)}` };
    } catch {
      return { ok: false, error: `${res.status}: ${err.slice(0, 200)}` };
    }
  }

  const data = await res.json();
  const answerText = data.answer?.content?.parts?.[0]?.text;
  const probability = data.answerableProbability;

  if (!answerText) {
    return { ok: false, error: `No answer. Keys: ${Object.keys(data).join(", ")}` };
  }

  const attributions = (data.answer?.groundingAttributions ?? []).map(
    (a: any) => a.sourceId?.groundingPassage?.passageId
  );

  return {
    ok: true,
    answer: answerText,
    probability,
    attributions,
    time: Date.now() - t0,
  };
}

console.log("=== AQA (Attributed Question Answering) Free Tier Test ===\n");

for (const t of TESTS) {
  console.log(`--- ${t.name} ---`);
  console.log(`  Q: ${t.question}`);
  const r = await testAQA(t.name, t.context, t.question);
  if (r.ok) {
    console.log(`  [OK] (${r.time}ms, confidence: ${(r.probability * 100).toFixed(2)}%)`);
    console.log(`  A: ${r.answer}`);
    console.log(`  Citations: passage ${r.attributions.join(", ")}`);
  } else {
    console.log(`  [FAIL] ${r.error}`);
  }
  console.log();
}
