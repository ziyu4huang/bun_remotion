/**
 * File writer — creates episode directory structure and writes template files.
 * Supports --dry-run mode.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ScaffoldContext } from "./templates";
import {
  genPackageJson,
  genTsconfig,
  genIndexTs,
  genRootTsx,
  genMainComponent,
  genTitleScene,
  genContentScene,
  genOutroScene,
  genNarration,
  genTodoMd,
} from "./templates";

interface FileToWrite {
  path: string;
  content: string;
  description: string;
}

export function collectFiles(ctx: ScaffoldContext): FileToWrite[] {
  const { naming, config } = ctx;
  const files: FileToWrite[] = [];
  const epDir = naming.episodeDir;
  const srcDir = resolve(epDir, "src");
  const scenesDir = resolve(srcDir, "scenes");
  const scriptsDir = resolve(epDir, "scripts");

  // Config files
  files.push({
    path: resolve(epDir, "package.json"),
    content: genPackageJson(ctx),
    description: "package.json",
  });

  files.push({
    path: resolve(epDir, "tsconfig.json"),
    content: genTsconfig(ctx),
    description: "tsconfig.json",
  });

  // src/ files
  files.push({
    path: resolve(srcDir, "index.ts"),
    content: genIndexTs(ctx),
    description: "src/index.ts",
  });

  files.push({
    path: resolve(srcDir, "Root.tsx"),
    content: genRootTsx(ctx),
    description: "src/Root.tsx",
  });

  files.push({
    path: resolve(srcDir, `${naming.compositionId}.tsx`),
    content: genMainComponent(ctx),
    description: `src/${naming.compositionId}.tsx`,
  });

  // Scene files
  files.push({
    path: resolve(scenesDir, "TitleScene.tsx"),
    content: genTitleScene(ctx),
    description: "src/scenes/TitleScene.tsx",
  });

  for (let i = 1; i <= naming.numContentScenes; i++) {
    files.push({
      path: resolve(scenesDir, `${config.contentScenePrefix}Scene${i}.tsx`),
      content: genContentScene(ctx, i),
      description: `src/scenes/${config.contentScenePrefix}Scene${i}.tsx`,
    });
  }

  files.push({
    path: resolve(scenesDir, "OutroScene.tsx"),
    content: genOutroScene(ctx),
    description: "src/scenes/OutroScene.tsx",
  });

  // Scripts
  files.push({
    path: resolve(scriptsDir, "narration.ts"),
    content: genNarration(ctx),
    description: "scripts/narration.ts",
  });

  // Documentation
  files.push({
    path: resolve(epDir, "TODO.md"),
    content: genTodoMd(ctx),
    description: "TODO.md",
  });

  return files;
}

export function writeFiles(files: FileToWrite[], dryRun: boolean): void {
  for (const file of files) {
    if (dryRun) {
      console.log(`\n--- ${file.description} (${file.path}) ---`);
      console.log(file.content);
    } else {
      // Ensure parent directory exists
      const dir = resolve(file.path, "..");
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      if (existsSync(file.path)) {
        console.log(`  [SKIP] ${file.description} (already exists)`);
        continue;
      }

      writeFileSync(file.path, file.content, "utf-8");
      console.log(`  [NEW] ${file.description}`);
    }
  }
}

export function verify(ctx: ScaffoldContext): void {
  const { naming, config } = ctx;

  console.log(`\n=== Scaffold ${ctx === null ? "" : ""}Summary ===\n`);
  console.log(`Series:      ${config.id} (${config.displayName})`);
  console.log(`Episode:     ${naming.chapter !== null ? `ch${naming.chapter}-` : ""}ep${naming.episode}`);
  console.log(`Directory:   bun_remotion_proj/${config.id}/${naming.dirName}`);
  console.log(`Composition: ${naming.compositionId}`);
  console.log(`Script alias: ${naming.scriptAlias}`);
  console.log(`Scenes:      ${naming.numScenes} (Title + ${naming.numContentScenes} ${config.contentScenePrefix} + Outro)`);
  console.log(`Transitions: ${naming.numTransitions}`);
  console.log();
  console.log("Next steps:");
  console.log(`  1. Write narration.ts (scripts/narration.ts)`);
  console.log(`  2. Write scene content (src/scenes/*.tsx)`);
  console.log(`  3. Run sync-images.sh from ${config.id}/assets/scripts/`);
  console.log(`  4. Run: bun install`);
  console.log(`  5. Run: bun run generate-tts:${naming.scriptAlias}`);
  console.log(`  6. Open: bun run start:${naming.scriptAlias}`);
}
