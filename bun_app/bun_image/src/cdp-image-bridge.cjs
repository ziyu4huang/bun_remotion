/**
 * CDP Image Bridge — Node.js subprocess for Playwright CDP image generation.
 *
 * Bun's WebSocket implementation is incompatible with Playwright's connectOverCDP.
 * This script runs under Node.js to connect to Chrome via CDP, generate images on z.ai,
 * and output results as JSON to stdout.
 *
 * Usage: node cdp-image-bridge.cjs --cdp-endpoint URL --output-dir DIR --images JSON
 */
const { chromium } = require("/Users/huangziyu/proj/bun_remotion/node_modules/playwright");
const { mkdirSync, existsSync, writeFileSync } = require("node:fs");
const { resolve, dirname } = require("node:path");

const ZAI_URL = "https://image.z.ai/";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { cdpEndpoint: "http://localhost:9222", outputDir: "", images: [], skipExisting: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--cdp-endpoint") opts.cdpEndpoint = args[++i];
    else if (args[i] === "--output-dir") opts.outputDir = args[++i];
    else if (args[i] === "--images") opts.images = JSON.parse(args[++i]);
    else if (args[i] === "--skip-existing") opts.skipExisting = true;
  }
  return opts;
}

function sanitizeFilename(name) {
  // Preserve extension if already present, then sanitize the stem
  let ext = ".png";
  const extMatch = name.match(/\.(png|jpe?g|webp)$/i);
  if (extMatch) {
    ext = extMatch[0].toLowerCase();
    name = name.slice(0, -extMatch[0].length);
  }
  return name.replace(/[^a-zA-Z0-9_-]/g, "_") + ext;
}

function extractImageUrl(src) {
  const m = src.match(/url=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : src;
}

async function ensureLoggedIn(page) {
  // If redirected to OAuth authorize page, click authorize
  if (page.url().includes("oauth/authorize") || page.url().includes("auth/oauth")) {
    console.error("[auth] Detected OAuth authorize page, clicking authorize...");
    const btn = page.locator("button, a").filter({ hasText: /authorize|agree|同意|授权|允许/i }).first();
    await btn.click({ timeout: 10000 }).catch(() => {});
    await page.waitForURL("**/image.z.ai/**", { timeout: 15000 }).catch(() => {});
    console.error("[auth] Authorization completed, now at:", page.url());
  }
  // If still on login page (no textarea), throw with clear message
  const textarea = page.locator("textarea").first();
  if (!(await textarea.isVisible().catch(() => false))) {
    throw new Error("NOT_LOGGED_IN: image.z.ai requires login. Please log in via your Chrome browser at https://image.z.ai/ first, then retry.");
  }
}

async function generateSingle(page, item, timeout = 90000) {
  await page.goto(ZAI_URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(2000);

  // Auto-handle OAuth authorize page or detect login required
  await ensureLoggedIn(page);

  const textarea = page.locator("textarea").first();
  await textarea.waitFor({ state: "visible", timeout: 10000 });
  await textarea.fill(item.prompt);
  await page.waitForTimeout(500);

  if (item.aspectRatio) {
    const ratioCombo = page.locator('[role="combobox"]').first();
    await ratioCombo.click({ timeout: 5000 });
    await page.waitForTimeout(800);
    await page.locator('[role="option"]').filter({ hasText: item.aspectRatio }).first().click();
    await page.waitForTimeout(300);
  }

  if (item.resolution) {
    const resCombo = page.locator('[role="combobox"]').nth(1);
    await resCombo.click({ timeout: 5000 });
    await page.waitForTimeout(800);
    await page.locator('[role="option"]').filter({ hasText: item.resolution }).first().click();
    await page.waitForTimeout(300);
  }

  await page.locator("button").filter({ hasText: "开始生成" }).click();
  await page.waitForURL("**/create", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(8000);

  const genImg = page.getByRole("img", { name: "Generated" });
  await genImg.waitFor({ state: "visible", timeout });
  await page.waitForTimeout(2000);

  const src = await genImg.getAttribute("src");
  if (!src) throw new Error("Generated image has no src attribute");
  return extractImageUrl(src);
}

async function downloadImage(url, outputPath) {
  const https = require("https");
  const http = require("http");
  const mod = url.startsWith("https") ? https : http;
  return new Promise((resolve, reject) => {
    mod.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, outputPath).then(resolve, reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const { writeFileSync } = require("node:fs");
        writeFileSync(outputPath, Buffer.concat(chunks));
        resolve();
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

(async () => {
  const opts = parseArgs();
  const results = { generated: 0, skipped: 0, failed: 0, results: [] };

  if (!opts.images.length || !opts.outputDir) {
    console.log(JSON.stringify({ ...results, error: "Missing --images or --output-dir" }));
    process.exit(1);
  }

  let browser, page;
  try {
    browser = await chromium.connectOverCDP(opts.cdpEndpoint, { timeout: 15000 });
    const ctx = browser.contexts()[0];
    page = await ctx.newPage();
  } catch (e) {
    console.log(JSON.stringify({ ...results, error: `CDP connect failed: ${e.message}` }));
    process.exit(1);
  }

  for (let i = 0; i < opts.images.length; i++) {
    const item = opts.images[i];
    const filename = sanitizeFilename(item.filename);
    const outPath = resolve(opts.outputDir, filename);

    if (opts.skipExisting && existsSync(outPath)) {
      results.skipped++;
      continue;
    }

    try {
      mkdirSync(dirname(outPath), { recursive: true });
      const downloadUrl = await generateSingle(page, item);
      await downloadImage(downloadUrl, outPath);

      results.results.push({ downloadUrl, localPath: outPath, prompt: item.prompt, filename });
      results.generated++;
    } catch (e) {
      results.failed++;
      results.results.push({ filename, error: e.message });
    }
  }

  if (page) await page.close().catch(() => {});
  // Don't close browser — it's the user's Chrome

  console.log(JSON.stringify(results));
  process.exit(0);
})();
