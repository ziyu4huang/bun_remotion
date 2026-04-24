import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { extractImageUrl } from "./url-utils";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

export interface BrowserSessionConfig {
  headed?: boolean;
  /**
   * Connection mode:
   * - "cdp" (default): Connect to already-running Chrome via CDP. No Google login issues.
   * - "persistent": Launch persistent Chrome profile. May trigger Google security warning.
   */
  mode?: "cdp" | "persistent";
  /** CDP WebSocket URL or port. Defaults to http://localhost:9222 */
  cdpEndpoint?: string;
  /** Persistent profile directory (mode=persistent). Defaults to ~/.bun-remotion/image-browser/ */
  profileDir?: string;
  /** Browser channel (mode=persistent): "chrome" | "msedge" */
  channel?: "chrome" | "msedge" | "";
  maxImagesBeforeRestart?: number;
  cooldownAfterRestartMs?: number;
}

export interface SingleImageOptions {
  prompt: string;
  aspectRatio?: string;
  resolution?: string;
  removeWatermark?: boolean;
  timeout?: number;
}

const DEFAULT_TIMEOUT = 90_000;
const DEFAULT_MAX_IMAGES = 3;
const DEFAULT_COOLDOWN = 5_000;
const ZAI_URL = "https://image.z.ai/";
const DEFAULT_PROFILE_DIR = resolve(homedir(), ".bun-remotion", "image-browser");
const DEFAULT_CDP = "http://localhost:9222";

export class ZaiImageEngine {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private imagesSinceStart = 0;
  private readonly config: Required<BrowserSessionConfig>;

  constructor(config?: BrowserSessionConfig) {
    const profileDir = config?.profileDir ?? DEFAULT_PROFILE_DIR;
    if (!existsSync(profileDir)) mkdirSync(profileDir, { recursive: true });

    this.config = {
      headed: config?.headed ?? true,
      mode: config?.mode ?? "cdp",
      cdpEndpoint: config?.cdpEndpoint ?? DEFAULT_CDP,
      profileDir,
      channel: config?.channel ?? "chrome",
      maxImagesBeforeRestart: config?.maxImagesBeforeRestart ?? DEFAULT_MAX_IMAGES,
      cooldownAfterRestartMs: config?.cooldownAfterRestartMs ?? DEFAULT_COOLDOWN,
    };
  }

  async ensureBrowser(): Promise<void> {
    if (this.context && this.page && !this.page.isClosed()) return;

    if (this.config.mode === "cdp") {
      // Connect to user's real Chrome via CDP — uses their existing login session
      this.browser = await chromium.connectOverCDP(this.config.cdpEndpoint);
      this.context = this.browser.contexts()[0] ?? await this.browser.newContext();
    } else {
      // Launch persistent profile Chrome
      this.context = await chromium.launchPersistentContext(this.config.profileDir, {
        headless: !this.config.headed,
        viewport: { width: 1280, height: 900 },
        channel: this.config.channel || undefined,
      });
    }

    this.page = await this.context.newPage();
    this.imagesSinceStart = 0;
  }

  async generateSingle(opts: SingleImageOptions): Promise<{ downloadUrl: string; prompt: string }> {
    if (this.imagesSinceStart >= this.config.maxImagesBeforeRestart) {
      await this.restartBrowser();
    }

    await this.ensureBrowser();
    const page = this.page!;

    await page.goto(ZAI_URL, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.waitForTimeout(2000);

    // Fill prompt
    const textarea = page.locator("textarea").first();
    await textarea.waitFor({ state: "visible", timeout: 10_000 });
    await textarea.fill(opts.prompt);
    await page.waitForTimeout(500);

    // Set aspect ratio if specified
    if (opts.aspectRatio) {
      const ratioCombo = page.locator('[role="combobox"]').first();
      await ratioCombo.click({ timeout: 5_000 });
      await page.waitForTimeout(800);
      await page.locator('[role="option"]').filter({ hasText: opts.aspectRatio }).first().click();
      await page.waitForTimeout(300);
    }

    // Set resolution if specified
    if (opts.resolution) {
      const resCombo = page.locator('[role="combobox"]').nth(1);
      await resCombo.click({ timeout: 5_000 });
      await page.waitForTimeout(800);
      await page.locator('[role="option"]').filter({ hasText: opts.resolution }).first().click();
      await page.waitForTimeout(300);
    }

    // Remove watermark if requested
    if (opts.removeWatermark !== false) {
      const watermarkCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: "去水印" });
      if (await watermarkCheckbox.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const label = page.getByText("去水印");
        if (await label.isVisible({ timeout: 1_000 }).catch(() => false)) {
          await label.click();
        }
      }
    }

    // Click generate
    await page.locator("button").filter({ hasText: "开始生成" }).click();
    await page.waitForURL("**/create", { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(8_000);

    // Wait for generated image
    const genImg = page.getByRole("img", { name: "Generated" });
    const timeout = opts.timeout ?? DEFAULT_TIMEOUT;
    await genImg.waitFor({ state: "visible", timeout });
    await page.waitForTimeout(2000);

    // Extract download URL
    const src = await genImg.getAttribute("src");
    if (!src) throw new Error("Generated image has no src attribute");
    const downloadUrl = extractImageUrl(src);

    this.imagesSinceStart++;
    return { downloadUrl, prompt: opts.prompt };
  }

  async downloadImage(url: string, outputPath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    const buffer = await response.arrayBuffer();
    await Bun.write(outputPath, Buffer.from(buffer));
  }

  async restartBrowser(): Promise<void> {
    await this.close();
    await new Promise((r) => setTimeout(r, this.config.cooldownAfterRestartMs));
  }

  async close(): Promise<void> {
    // CDP mode: only close our page, don't kill the user's Chrome
    if (this.config.mode === "cdp") {
      if (this.page && !this.page.isClosed()) await this.page.close().catch(() => {});
      // Don't close browser/context — it's the user's real Chrome
    } else {
      if (this.page && !this.page.isClosed()) await this.page.close().catch(() => {});
      if (this.context) await this.context.close().catch(() => {});
    }
    this.page = null;
    this.context = null;
    this.browser = null;
    this.imagesSinceStart = 0;
  }
}
