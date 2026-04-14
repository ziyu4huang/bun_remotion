import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { DialogBox } from "../../../assets/components/DialogBox";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import type { DialogLine } from "../../../assets/characters";

/**
 * test-image JokeScene1 — 測試共享圖片模組
 *
 * Uses ALL asset images via the shared import module (getImageUrl).
 * No images in public/images/ — everything is bundled by webpack.
 */
const dialog: DialogLine[] = [
  { character: "xiaoxue", text: "哇！這個背景圖居然不用複製到 public 資料夾！", effect: "surprise" },
  { character: "xiaoyue", text: "Webpack 直接打包... 終於不用 sync-images 了。", effect: "sparkle" },
  { character: "xiaoying", text: "可是... 如果圖片找不到怎麼辦？", effect: "sweat" },
  { character: "xiaoxue", text: "看！背景從教室換到咖啡廳了！全部正常！", effect: "laugh" },
];

export const JokeScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Background swap at midpoint
  const bgSwapFrame = Math.floor(durationInFrames / 2);
  const bgOpacity1 = interpolate(frame, [bgSwapFrame - 15, bgSwapFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgOpacity2 = interpolate(frame, [bgSwapFrame - 15, bgSwapFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Character entrance
  const charLeftX = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });
  const charRightX = spring({ frame, fps, config: { damping: 20, stiffness: 100, delay: 5 } });
  const charCenterX = spring({ frame, fps, config: { damping: 20, stiffness: 100, delay: 10 } });

  return (
    <AbsoluteFill>
      {/* Background layer 1: classroom (fades out) */}
      <div style={{ position: "absolute", inset: 0, opacity: bgOpacity1 }}>
        <BackgroundLayer image="classroom-morning.png" />
      </div>

      {/* Background layer 2: cafe (fades in) */}
      <div style={{ position: "absolute", inset: 0, opacity: bgOpacity2 }}>
        <BackgroundLayer image="cafe.png" />
      </div>

      {/* Characters — using shared image imports via CharacterSprite */}
      <div style={{ position: "absolute", inset: 0, opacity: charLeftX }}>
        <CharacterSprite
          character="xiaoxue"
          image="xiaoxue.png"
          speaking={true}
          side="left"
          effects={dialog[0].effect ? [dialog[0].effect] : []}
        />
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: charRightX }}>
        <CharacterSprite
          character="xiaoyue"
          image="xiaoyue.png"
          speaking={true}
          side="right"
          effects={dialog[1].effect ? [dialog[1].effect] : []}
        />
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: charCenterX }}>
        <CharacterSprite
          character="xiaoying"
          image="xiaoying.png"
          speaking={true}
          side="center"
          effects={dialog[2].effect ? [dialog[2].effect] : []}
        />
      </div>

      {/* Dialog */}
      <DialogBox
        lines={dialog}
        sceneFrame={frame}
        sceneDuration={durationInFrames}
      />

      {/* Comic effects overlay */}
      <ComicEffects effects={["surprise", "sparkle"]} side="left" />
    </AbsoluteFill>
  );
};
