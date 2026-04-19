/**
 * Template functions for scaffolding Remotion episode files.
 * Each function returns the file content as a string.
 */

import type { SeriesConfig } from "./series-config";
import type { NamingContext } from "./naming";

export interface ScaffoldContext {
  naming: NamingContext;
  config: SeriesConfig;
}

// ─── package.json ────────────────────────────────────────────────────────────────

export function genPackageJson(ctx: ScaffoldContext): string {
  const { naming, config } = ctx;
  const pkg = {
    name: naming.packageName,
    version: "1.0.0",
    private: true,
    scripts: {
      start: "remotion studio",
      build: `remotion render ${naming.compositionId} ${naming.outputPath}`,
      upgrade: "remotion upgrade",
      "generate-tts": `bun run ${config.ttsScriptPath}`,
    },
    dependencies: {
      "@bun-remotion/shared": "workspace:*",
      "@remotion/cli": "4.0.290",
      "@remotion/google-fonts": "4.0.290",
      "@remotion/transitions": "4.0.290",
      react: "^18.3.1",
      "react-dom": "^18.3.1",
    },
  };
  return JSON.stringify(pkg, null, 2) + "\n";
}

// ─── tsconfig.json ────────────────────────────────────────────────────────────────

export function genTsconfig(_ctx: ScaffoldContext): string {
  const tsconfig = {
    extends: "../../../tsconfig.json",
    compilerOptions: {
      outDir: "./dist",
      rootDir: "./src",
    },
    include: ["src/**/*.ts", "src/**/*.tsx"],
  };
  return JSON.stringify(tsconfig, null, 2) + "\n";
}

// ─── src/index.ts ─────────────────────────────────────────────────────────────────

export function genIndexTs(_ctx: ScaffoldContext): string {
  return `import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
`;
}

// ─── src/Root.tsx ─────────────────────────────────────────────────────────────────

export function genRootTsx(ctx: ScaffoldContext): string {
  const { naming } = ctx;
  const numTransitions = naming.numTransitions;

  return `import React from "react";
import { Composition, CalculateMetadataFunction } from "remotion";
import { ${naming.compositionId} } from "./${naming.compositionId}";

// Written by scripts/generate-tts.ts — falls back to 210f per scene
const sceneDurationsData: number[] = (() => {
  try { return require("../public/audio/durations.json"); }
  catch { return Array(${naming.numScenes}).fill(210); }
})();

export type Props = { sceneDurations: number[] };

const TRANSITION_FRAMES = 15;
const NUM_TRANSITIONS = ${numTransitions}; // ${naming.numScenes} scenes → ${numTransitions} transitions

const calculateMetadata: CalculateMetadataFunction<Props> = async () => {
  const totalDuration =
    sceneDurationsData.reduce((sum: number, d: number) => sum + d, 0) -
    NUM_TRANSITIONS * TRANSITION_FRAMES;
  return {
    durationInFrames: totalDuration,
    props: { sceneDurations: sceneDurationsData },
  };
};

export const RemotionRoot: React.FC = () => {
  const totalDuration =
    sceneDurationsData.reduce((sum: number, d: number) => sum + d, 0) -
    NUM_TRANSITIONS * TRANSITION_FRAMES;

  return (
    <Composition
      id="${naming.compositionId}"
      component={${naming.compositionId}}
      durationInFrames={totalDuration}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ sceneDurations: sceneDurationsData }}
      calculateMetadata={calculateMetadata}
    />
  );
};
`;
}

// ─── Main Component (src/{PascalCase}.tsx) ─────────────────────────────────────────

export function genMainComponent(ctx: ScaffoldContext): string {
  const { naming, config } = ctx;
  const { compositionId, numContentScenes } = naming;

  // Build scene list: Title, Content1..N, Outro
  const scenes: { name: string; audio: string }[] = [
    { name: "TitleScene", audio: "audio/01-title.wav" },
  ];
  for (let i = 1; i <= numContentScenes; i++) {
    const audioNum = String(i + 1).padStart(2, "0");
    const lowerPrefix = config.contentScenePrefix.toLowerCase();
    scenes.push({
      name: `${config.contentScenePrefix}Scene${i}`,
      audio: `audio/${audioNum}-${lowerPrefix}${i}.wav`,
    });
  }
  scenes.push({
    name: "OutroScene",
    audio: `audio/${String(numContentScenes + 2).padStart(2, "0")}-outro.wav`,
  });

  // Build transition imports (deduplicated)
  const transitionImports = new Map<string, string>();
  for (const t of config.transitions) {
    transitionImports.set(t.from, t.importName);
  }

  // Collect unique import lines
  const transitionImportLines: string[] = [];
  for (const [from, name] of transitionImports) {
    transitionImportLines.push(`import { ${name} } from "${from}";`);
  }

  // Build scene names array
  const sceneNamesStr = scenes.map((s, i) => {
    if (i === 0) return `"Title"`;
    if (i === scenes.length - 1) return `"Outro"`;
    return `"${config.contentScenePrefix} ${i}"`;
  }).join(", ");

  // Build scenes array entries
  const sceneEntries = scenes.map((s) => {
    return `  { Scene: ${s.name}, audio: "${s.audio}" },`;
  }).join("\n");

  // Build transitions array (cycle through config.transitions)
  const transitionEntries = config.transitions
    .map((t) => `  ${t.usage},`)
    .join("\n");

  // Scene imports
  const sceneImports = scenes.map((s) => `import { ${s.name} } from "./scenes/${s.name}";`).join("\n");

  return `import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
${transitionImportLines.join("\n")}
import type { Props } from "./Root";
${sceneImports}

const TRANSITION_FRAMES = 15;

const sceneNames = [${sceneNamesStr}] as const;

const scenes = [
${sceneEntries}
];

const transitions = [
${transitionEntries}
];

export const ${compositionId}: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? 210;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a2e" }}>
      <TransitionSeries>
        {scenes.map(({ Scene, audio }, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={d(i)} name={sceneNames[i]}>
              <Scene />
              <Audio src={staticFile(audio)} volume={1} />
            </TransitionSeries.Sequence>

            {i < transitions.length && (
              <TransitionSeries.Transition
                presentation={transitions[i % transitions.length]}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
`;
}

// ─── TitleScene.tsx ────────────────────────────────────────────────────────────────

export function genTitleScene(ctx: ScaffoldContext): string {
  const { config } = ctx;
  const chapterLabel = ctx.naming.chapter !== null
    ? `第${ctx.naming.chapter}章`
    : "";
  const episodeLabel = `第${ctx.naming.episode}集`;

  return `import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { maShanZheng, notoSansTC } from "${config.charactersImportPath}";
import { SystemNotification } from "${config.componentsImportPath}/SystemOverlay";

// TODO: Customize title text, gradient colors, and series subtitle
const SERIES_TITLE = "${config.displayName}";
const SERIES_SUBTITLE = ""; // e.g. "系統誤會流喜劇"
const EPISODE_LABEL = "${chapterLabel ? chapterLabel + " " : ""}${episodeLabel}";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Flash at the start
  const flashOpacity = interpolate(frame, [5, 12, 22], [0, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title scale-in with spring overshoot
  const titleScale = interpolate(frame, [10, 40], [2.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.3)),
  });

  const titleOpacity = interpolate(frame, [10, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle slides in after title
  const subtitleY = interpolate(frame, [30, 50], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const subtitleOpacity = interpolate(frame, [30, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chapter/episode info
  const chapterOpacity = interpolate(frame, [50, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out at the end
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Decorative line
  const lineWidth = interpolate(frame, [15, 45], [0, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Ambient pulse glow
  const glowPulse = interpolate(frame % 120, [0, 60, 120], [0.12, 0.2, 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0a2e 0%, #0a1a3e 50%, #1a0a2e 100%)",
        opacity: fadeOut,
      }}
    >
      {/* Background glow with pulse */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 800,
        height: 800,
        borderRadius: "50%",
        background: \`radial-gradient(circle, rgba(239, 68, 68, \${glowPulse}) 0%, transparent 70%)\`,
        filter: "blur(40px)",
      }} />

      {/* Flash effect */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9), transparent 70%)",
        opacity: flashOpacity,
      }} />

      {/* System stinger notification */}
      {frame >= 35 && frame <= 95 && (
        <SystemNotification
          text={\`新集數已解鎖：${chapterLabel ? chapterLabel : ""}${episodeLabel}\`}
          type="info"
          delay={35}
        />
      )}

      {/* Main title */}
      <div style={{
        position: "absolute",
        top: "25%",
        left: "50%",
        transform: \`translateX(-50%) scale(\${titleScale})\`,
        opacity: titleOpacity,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: maShanZheng,
          fontSize: 120,
          fontWeight: 900,
          color: "#fff",
          textShadow: "0 0 40px rgba(239, 68, 68, 0.6), 0 4px 20px rgba(0,0,0,0.5)",
          letterSpacing: "0.15em",
        }}>
          {SERIES_TITLE}
        </div>

        {/* Decorative line */}
        <div style={{
          width: lineWidth,
          height: 3,
          background: "linear-gradient(90deg, transparent, #EF4444, #A78BFA, transparent)",
          margin: "20px auto 0",
          borderRadius: 2,
        }} />
      </div>

      {/* Subtitle */}
      {SERIES_SUBTITLE && (
        <div style={{
          position: "absolute",
          top: "52%",
          left: "50%",
          transform: \`translateX(-50%) translateY(\${subtitleY}px)\`,
          opacity: subtitleOpacity,
          textAlign: "center",
          fontFamily: notoSansTC,
        }}>
          <div style={{
            fontSize: 48,
            color: "#94A3B8",
            fontWeight: 500,
            letterSpacing: "0.2em",
          }}>
            {SERIES_SUBTITLE}
          </div>
        </div>
      )}

      {/* Episode info */}
      <div style={{
        position: "absolute",
        bottom: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        opacity: chapterOpacity,
        textAlign: "center",
        fontFamily: notoSansTC,
      }}>
        <div style={{
          fontSize: 32,
          color: "#EF4444",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textShadow: "0 0 20px rgba(239, 68, 68, 0.4)",
        }}>
          {/* TODO: Update episode label */}
          {EPISODE_LABEL}
        </div>
      </div>
    </AbsoluteFill>
  );
};
`;
}

// ─── ContentScene.tsx ──────────────────────────────────────────────────────────────

export function genContentScene(ctx: ScaffoldContext, sceneIndex: number): string {
  const { naming, config } = ctx;
  const sceneName = `${config.contentScenePrefix}Scene${sceneIndex}`;
  const lowerPrefix = config.contentScenePrefix.toLowerCase();

  return `import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundLayer } from "${config.componentsImportPath}/BackgroundLayer";
import { CharacterSprite } from "${config.componentsImportPath}/CharacterSprite";
import { DialogBox } from "${config.componentsImportPath}/DialogBox";
import { ComicEffects } from "${config.componentsImportPath}/ComicEffects";
import { normalizeEffects, CHARACTERS, type ComicEffect } from "${config.charactersImportPath}";
import { SceneIndicator } from "${config.componentsImportPath}/SceneIndicator";
import { getLineIndex } from "${config.componentsImportPath}/dialogTiming";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const segmentDurations: Record<string, number[]> = (() => {
  try { return require("../../public/audio/segment-durations.json"); }
  catch { return {}; }
})();

const SCENE_NAME = "${sceneName}";

// TODO: Fill in dialog lines for ${sceneName} (${lowerPrefix} scene ${sceneIndex})
// TODO: Choose background from assets/backgrounds/
const dialogLines = [
  { character: "narrator" as const, text: "TODO: 場景 ${sceneIndex} 的旁白或對話", emotion: "default" as const },
];

export const ${sceneName}: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = getLineIndex(
    frame,
    durationInFrames,
    dialogLines.length,
    segmentDurations[SCENE_NAME],
  );
  const currentLine = dialogLines[currentLineIndex];

  // Derive side from CHARACTERS config
  const side = CHARACTERS[currentLine.character]?.position === "right" ? "right" : "left";

  return (
    <AbsoluteFill>
      {/* TODO: Change background image */}
      <BackgroundLayer image="sect-plaza.png" />

      {/* Scene indicator */}
      <SceneIndicator text="場景 ${sceneIndex}" color="#EF4444" />

      {/* Characters — adjust based on who appears in this scene */}
      <CharacterSprite
        character={currentLine.character}
        emotion={currentLine.emotion ?? "default"}
        speaking={true}
        side={side}
        background={false}
        effects={normalizeEffects(currentLine.effect)}
      />

      {/* Dialog box */}
      <DialogBox
        character={currentLine.character}
        text={currentLine.text}
        lineIndex={currentLineIndex}
        totalLines={dialogLines.length}
        durationInFrames={durationInFrames}
      />

      {/* Comic effects — add effect field to dialogLines for reactions */}
      {currentLine.effect && (
        <ComicEffects effect={currentLine.effect as ComicEffect} side={side} />
      )}
    </AbsoluteFill>
  );
};
`;
}

// ─── OutroScene.tsx ────────────────────────────────────────────────────────────────

export function genOutroScene(ctx: ScaffoldContext): string {
  const { naming, config } = ctx;
  const chapterLabel = naming.chapter !== null
    ? `第${naming.chapter}章`
    : "";
  const nextEpLabel = naming.chapter !== null
    ? `${chapterLabel}第${naming.episode + 1}集`
    : `第${naming.episode + 1}集`;

  return `import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { maShanZheng, notoSansTC } from "${config.charactersImportPath}";
import { QuestBadge, UnlockingTeaser } from "${config.componentsImportPath}/QuestBadge";

// TODO: Update title, subtitle, summary, and teaser text
const EPISODE_TITLE = "TODO";
const EPISODE_SUBTITLE = "TODO: 一句話摘要";
const ACCENT_COLOR = "#A78BFA";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Fade in
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Summary text
  const summaryOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Teaser section
  const teaserOpacity = interpolate(frame, [120, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const teaserY = interpolate(frame, [120, 145], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Decorative line
  const dividerWidth = interpolate(frame, [110, 140], [0, 400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0a2e 0%, #0a1a3e 50%, #1a0a2e 100%)",
        opacity: fadeIn * fadeOut,
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: \`radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)\`,
        filter: "blur(40px)",
      }} />

      {/* Quest Complete badge */}
      <QuestBadge
        title={EPISODE_TITLE}
        subtitle={EPISODE_SUBTITLE}
        color={ACCENT_COLOR}
        delay={10}
      />

      {/* Summary */}
      <div style={{
        position: "absolute",
        top: "38%",
        left: "50%",
        transform: "translateX(-50%)",
        opacity: summaryOpacity,
        textAlign: "center",
        fontFamily: notoSansTC,
      }}>
        <div style={{
          fontSize: 32,
          color: "#94A3B8",
          lineHeight: 2.2,
          maxWidth: 1100,
          letterSpacing: "0.05em",
        }}>
          {/* TODO: Summary text */}
        </div>
      </div>

      {/* Divider */}
      <div style={{
        position: "absolute",
        top: "58%",
        left: "50%",
        transform: "translateX(-50%)",
        width: dividerWidth,
        height: 2,
        background: \`linear-gradient(90deg, transparent, \${ACCENT_COLOR}, transparent)\`,
      }} />

      {/* Teaser */}
      <div style={{
        position: "absolute",
        top: "62%",
        left: "50%",
        transform: \`translateX(-50%) translateY(\${teaserY}px)\`,
        opacity: teaserOpacity,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: notoSansTC,
          fontSize: 24,
          color: ACCENT_COLOR,
          fontWeight: 700,
          letterSpacing: "0.2em",
          marginBottom: 16,
        }}>
          {/* TODO: 下集預告 or 下章預告 */}
        </div>
        <div style={{
          fontFamily: maShanZheng,
          fontSize: 56,
          color: "#fff",
          fontWeight: 700,
          textShadow: \`0 0 30px rgba(167, 139, 250, 0.4)\`,
          letterSpacing: "0.1em",
        }}>
          {/* TODO: ${nextEpLabel} title */}
        </div>
      </div>

      {/* System unlocking teaser */}
      <UnlockingTeaser
        text="${nextEpLabel} 解鎖進度：0%"
        color={ACCENT_COLOR}
        delay={130}
      />

      {/* Series title at bottom */}
      <div style={{
        position: "absolute",
        bottom: 60,
        left: "50%",
        transform: "translateX(-50%)",
        fontFamily: notoSansTC,
        fontSize: 20,
        color: "#475569",
        letterSpacing: "0.15em",
      }}>
        ${config.displayName}
      </div>
    </AbsoluteFill>
  );
};
`;
}

// ─── scripts/narration.ts ──────────────────────────────────────────────────────────

export function genNarration(ctx: ScaffoldContext): string {
  const { naming, config } = ctx;
  const voiceCharUnion = config.voiceCharacters.map((c) => `"${c}"`).join(" | ");

  // Build scene name list based on project type
  const sceneNames = getSceneNames(ctx);

  const sceneEntries: string[] = [];
  for (let i = 0; i < sceneNames.length; i++) {
    const audioNum = String(i + 1).padStart(2, "0");
    let audioName: string;
    if (i === 0) audioName = "title";
    else if (i === sceneNames.length - 1) audioName = "outro";
    else audioName = sceneNames[i].replace(/Scene$/, "").toLowerCase();

    sceneEntries.push(`  // ─── ${sceneNames[i]} ${"─".repeat(Math.max(1, 60 - sceneNames[i].length))}
  {
    scene: "${sceneNames[i]}",
    file: "${audioNum}-${audioName}.wav",
    segments: [
      // TODO: Add narration segments
    ],
    fullText: "",
  },`);
  }

  const subtitle = naming.isStandalone
    ? ""
    : ` ${naming.chapter !== null ? `第${naming.chapter}章` : ""} 第${naming.episode}集`;

  return `/**
 * Narration scripts for ${config.displayName}${subtitle}
 *
 * Voice mapping is centralized in assets/voice-config.json.
 * Characters: ${config.voiceCharacters.join(", ")}
 */

export type VoiceCharacter = ${voiceCharUnion};

export interface NarrationSegment {
  character: VoiceCharacter;
  text: string;
}

export interface NarrationScript {
  scene: string;
  file: string;
  segments: NarrationSegment[];
  fullText: string;
}

export const NARRATOR_LANG = "${config.language}";

export const narrations: NarrationScript[] = [
${sceneEntries.join("\n\n")}
];
`;
}

// ─── TODO.md ────────────────────────────────────────────────────────────────────────

export function genTodoMd(ctx: ScaffoldContext): string {
  const { naming, config } = ctx;

  const subtitle = naming.isStandalone
    ? ""
    : naming.chapter !== null
      ? `第${naming.chapter}章：——（第 ${naming.episode} 集）`
      : `第 ${naming.episode} 集`;

  const sceneNames = getSceneNames(ctx);
  const sceneListStr = sceneNames.map(s => s.replace("Scene", "")).join(", ");

  const sceneTasks = sceneNames.map((name) => {
    return `- [ ] Write src/scenes/${name}.tsx (TODO: scene description)`;
  }).join("\n");

  return `# TODO — ${config.displayName}${subtitle ? " " + subtitle : ""}

## Story

TODO: 2-3 句 zh_TW 故事摘要

Characters: ${config.voiceCharacters.join(", ")}
Language: ${config.language}
${naming.category ? `Category: ${naming.category}` : ""}

## Setup Tasks

- [x] Create TODO.md
- [ ] Write narration.ts (${naming.numScenes} scenes: ${sceneListStr})
- [ ] Create package.json
- [ ] Create tsconfig.json
- [ ] Create src/index.ts
- [ ] Create src/Root.tsx
- [ ] Create src/${naming.compositionId}.tsx
${sceneTasks}
- [ ] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [ ] Update root package.json with ${naming.scriptAlias} scripts
- [ ] Run \`bun install\` to link workspace
- [ ] Run \`bun run generate-tts:${naming.scriptAlias}\` to generate audio
- [ ] Verify in Remotion Studio
- [ ] Render final MP4
`;
}

// ─── Helper ────────────────────────────────────────────────────────────────────

/** Get ordered scene names based on project type */
export function getSceneNames(ctx: ScaffoldContext): string[] {
  const { naming, config } = ctx;

  if (config.category === "tech_explainer") {
    return [
      "TitleScene",
      "ProblemScene",
      "ArchitectureScene",
      "FeatureScene1",
      "FeatureScene2",
      "FeatureScene3",
      "DemoScene",
      "ComparisonScene",
      "OutroScene",
    ];
  }

  const names = ["TitleScene"];
  for (let i = 1; i <= naming.numContentScenes; i++) {
    names.push(`${config.contentScenePrefix}Scene${i}`);
  }
  names.push("OutroScene");
  return names;
}
