import { ZaiImageEngine, type BrowserSessionConfig } from "./image-engine";
import { sanitizeFilename } from "./url-utils";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

// ── Types ──

// ── Types ──

export interface ImageGenerateOptions {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
  resolution?: "1K" | "2K";
  removeWatermark?: boolean;
  timeout?: number;
  onProgress?: (msg: string) => void;
}

export interface ImageResult {
  downloadUrl: string;
  localPath?: string;
  prompt: string;
  aspectRatio: string;
  generatedAt: number;
}

export interface ImageBatchItem {
  filename: string;
  prompt: string;
  aspectRatio?: ImageGenerateOptions["aspectRatio"];
  resolution?: ImageGenerateOptions["resolution"];
  metadata?: Record<string, unknown>;
}

export interface EngineLike {
  generateSingle(opts: { prompt: string; aspectRatio?: string; resolution?: string; timeout?: number }): Promise<{ downloadUrl: string; prompt: string }>;
  downloadImage(url: string, path: string): Promise<void>;
  close(): Promise<void>;
}

export interface ImageBatchOptions {
  images: ImageBatchItem[];
  outputDir: string;
  skipExisting?: boolean;
  browserConfig?: BrowserSessionConfig;
  /** Inject a custom engine (for testing or custom backends) */
  engine?: EngineLike;
  onProgress?: (msg: string) => void;
  onImageComplete?: (result: ImageResult, index: number, total: number) => void;
}

export interface ImageBatchResult {
  generated: number;
  skipped: number;
  failed: number;
  results: ImageResult[];
}

export type { BrowserSessionConfig };

// ── CDP bridge (Node.js subprocess) ──
// Bun's WebSocket is incompatible with Playwright connectOverCDP,
// so we spawn Node.js to handle the CDP connection.

const BRIDGE_SCRIPT = resolve(import.meta.dir, "cdp-image-bridge.cjs");

interface CDPBridgeResult {
  generated: number;
  skipped: number;
  failed: number;
  results: Array<{ downloadUrl?: string; localPath?: string; prompt?: string; filename: string; error?: string }>;
  error?: string;
}

async function generateViaCDPBridge(opts: ImageBatchOptions & { cdpEndpoint?: string }): Promise<ImageBatchResult> {
  const imagesJson = JSON.stringify(opts.images.map((img) => ({
    filename: img.filename,
    prompt: img.prompt,
    aspectRatio: img.aspectRatio,
    resolution: img.resolution,
  })));

  const args = [
    BRIDGE_SCRIPT,
    "--cdp-endpoint", opts.cdpEndpoint ?? "http://localhost:9222",
    "--output-dir", opts.outputDir,
    "--images", imagesJson,
  ];
  if (opts.skipExisting) args.push("--skip-existing");

  const result = spawnSync("node", args, {
    encoding: "utf-8",
    timeout: 300_000,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`CDP bridge failed: ${result.error.message}`);
  }

  const bridgeResult: CDPBridgeResult = JSON.parse(result.stdout.trim());
  if (bridgeResult.error) {
    throw new Error(`CDP bridge error: ${bridgeResult.error}`);
  }

  return {
    generated: bridgeResult.generated,
    skipped: bridgeResult.skipped,
    failed: bridgeResult.failed,
    results: bridgeResult.results.map((r) => ({
      downloadUrl: r.downloadUrl ?? "",
      localPath: r.localPath,
      prompt: r.prompt ?? "",
      aspectRatio: "1:1",
      generatedAt: Date.now(),
    })),
  };
}

// ── Single image generation ──

export async function generateImage(
  opts: ImageGenerateOptions & { outputDir?: string; filename?: string },
): Promise<ImageResult> {
  const engine = new ZaiImageEngine();
  try {
    const { downloadUrl } = await engine.generateSingle({
      prompt: opts.prompt,
      aspectRatio: opts.aspectRatio,
      resolution: opts.resolution,
      removeWatermark: opts.removeWatermark,
      timeout: opts.timeout,
    });

    let localPath: string | undefined;
    if (opts.outputDir && opts.filename) {
      const outPath = resolve(opts.outputDir, sanitizeFilename(opts.filename));
      mkdirSync(dirname(outPath), { recursive: true });
      await engine.downloadImage(downloadUrl, outPath);
      localPath = outPath;
    }

    return {
      downloadUrl,
      localPath,
      prompt: opts.prompt,
      aspectRatio: opts.aspectRatio ?? "1:1",
      generatedAt: Date.now(),
    };
  } finally {
    await engine.close();
  }
}

// ── Batch generation ──

export async function generateImageBatch(opts: ImageBatchOptions): Promise<ImageBatchResult> {
  // CDP mode: use Node.js bridge (Bun WebSocket incompatible with Playwright CDP)
  if (opts.browserConfig?.mode === "cdp" && !opts.engine) {
    return generateViaCDPBridge({
      ...opts,
      cdpEndpoint: opts.browserConfig?.cdpEndpoint,
    });
  }

  const engine: EngineLike = opts.engine ?? new ZaiImageEngine(opts.browserConfig);
  const results: ImageResult[] = [];
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  const total = opts.images.length;

  try {
    for (let i = 0; i < total; i++) {
      const item = opts.images[i];
      const filename = sanitizeFilename(item.filename);
      const outPath = resolve(opts.outputDir, filename);

      // Skip existing
      if (opts.skipExisting && existsSync(outPath)) {
        skipped++;
        opts.onProgress?.(`[${i + 1}/${total}] Skipped (exists): ${filename}`);
        continue;
      }

      opts.onProgress?.(`[${i + 1}/${total}] Generating: ${filename}`);

      try {
        mkdirSync(dirname(outPath), { recursive: true });

        const { downloadUrl } = await engine.generateSingle({
          prompt: item.prompt,
          aspectRatio: item.aspectRatio,
          resolution: item.resolution,
          timeout: 90_000,
        });

        await engine.downloadImage(downloadUrl, outPath);

        const result: ImageResult = {
          downloadUrl,
          localPath: outPath,
          prompt: item.prompt,
          aspectRatio: item.aspectRatio ?? "1:1",
          generatedAt: Date.now(),
        };

        // Write metadata companion if provided
        if (item.metadata) {
          const metaPath = outPath.replace(/\.png$/, ".json");
          await Bun.write(metaPath, JSON.stringify({ ...item.metadata, file: filename }, null, 2));
        }

        results.push(result);
        generated++;
        opts.onImageComplete?.(result, i, total);
        opts.onProgress?.(`[${i + 1}/${total}] Done: ${filename}`);
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        opts.onProgress?.(`[${i + 1}/${total}] Failed: ${filename} — ${msg}`);
      }
    }
  } finally {
    await engine.close();
  }

  return { generated, skipped, failed, results };
}
