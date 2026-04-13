import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import { normalizeEffects, type ComicEffect } from "../../../fixture/characters";
import { SystemNotification } from "../../../fixture/components/SystemOverlay";
import { LoadingText } from "../../../fixture/components/GameUI";
import { notoSansTC } from "../../../fixture/characters";

const dialogLines = [
  { character: "narrator" as const, text: "天道宗廣場，晨曦初照。弟子們正在晨練。", emotion: "default" as const },
  { character: "linyi" as const, text: "載入中……為什麼這麼慢啊？", emotion: "confused" as const, effect: "dots" as ComicEffect },
  { character: "linyi" as const, text: "這NPC的建模也太粗糙了吧……", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "linyi" as const, text: "等等，這個任務面板……新手教程在哪？", emotion: "confused" as const },
  { character: "linyi" as const, text: "跳過對話，跳過對話……能不能全部跳過？", emotion: "smile" as const, effect: "laugh" as ComicEffect },
  { character: "narrator" as const, text: "周圍的弟子們聽到了林逸的嘀咕，紛紛停下了動作。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "「載入中」……這位師兄說的，莫非是在感悟天道？！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "「不屑與凡人交流」……一定是看破紅塵了！", emotion: "think" as const, effect: "sparkle" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "「跳過對話」……天哪，他是在說跳過修行的俗世煩惱！", emotion: "gloating" as const, effect: "gloating" as ComicEffect },
];

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return Array.isArray(effect) ? effect : [effect];
}

export const ContentScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lineDuration = durationInFrames / dialogLines.length;
  const currentLineIndex = Math.min(
    Math.floor(frame / lineDuration),
    dialogLines.length - 1,
  );
  const currentLine = dialogLines[currentLineIndex];

  // Loading text appears in the first few lines
  const loadingFrame = (1 / dialogLines.length) * durationInFrames;
  const loadingEndFrame = (4 / dialogLines.length) * durationInFrames;
  const showLoading = frame >= loadingFrame && frame < loadingEndFrame;

  // System notification when zhaoxiaoqi appears (line 6)
  const zhaoxiaoqiFrame = (6 / dialogLines.length) * durationInFrames;
  const showNotification = currentLineIndex >= 6 && currentLineIndex <= 7;

  // Scene indicator
  const indicatorOpacity = frame < 60
    ? interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="sect-plaza.png" />

      {/* Scene indicator */}
      {indicatorOpacity > 0 && (
        <div style={{
          position: "absolute",
          top: 40,
          left: 60,
          opacity: indicatorOpacity,
          zIndex: 50,
          fontFamily: notoSansTC,
        }}>
          <div style={{ color: "#F59E0B", fontSize: 24, fontWeight: 700 }}>
            天道宗廣場
          </div>
          <div style={{
            width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            height: 2,
            background: "linear-gradient(90deg, #F59E0B, transparent)",
            marginTop: 4,
          }} />
        </div>
      )}

      {/* Characters */}
      {currentLineIndex >= 5 && (
        <CharacterSprite
          character="zhaoxiaoqi"
          emotion={currentLine.character === "zhaoxiaoqi" ? currentLine.emotion : "default"}
          speaking={currentLine.character === "zhaoxiaoqi"}
          side="right"
          background={currentLine.character !== "zhaoxiaoqi" && currentLineIndex >= 5}
          effects={currentLine.character === "zhaoxiaoqi" ? normalizeEffects(currentLine.effect) : []}
        />
      )}

      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      {/* Comic effects */}
      <ComicEffects
        effects={normalizeEffects(currentLine.effect)}
        side={currentLine.character === "linyi" ? "left" : currentLine.character === "zhaoxiaoqi" ? "right" : "center"}
      />

      {/* Game UI elements */}
      {showLoading && (
        <LoadingText text="系統載入中" color="#34D399" delay={Math.floor(loadingFrame)} />
      )}

      {showNotification && (
        <SystemNotification
          text="新任務：探索天道宗"
          type="mission"
          delay={Math.floor(zhaoxiaoqiFrame)}
        />
      )}

      {/* Dialog box */}
      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
