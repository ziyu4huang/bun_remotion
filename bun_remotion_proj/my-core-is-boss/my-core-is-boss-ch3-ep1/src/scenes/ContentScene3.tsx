import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { DialogBox } from "../../../assets/components/DialogBox";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import { normalizeEffects, CHARACTERS, type ComicEffect } from "../../../assets/characters";
import { SceneIndicator } from "../../../assets/components/SceneIndicator";
import { getLineIndex } from "../../../assets/components/dialogTiming";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const segmentDurations: Record<string, number[]> = (() => {
  try { return require("../../audio/segment-durations.json"); }
  catch { return {}; }
})();

const SCENE_NAME = "ContentScene3";

const dialogLines = [
  { character: "narrator" as const, text: "蕭長老作為宗門代表，原本正在秘境入口主持入場儀式。他親眼目睹了林逸穿牆的全過程。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "不……不可能……那是上古禁制石壁！連渡劫期的老夫都無法撼動分毫！他……他就走過去了？！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "narrator" as const, text: "林逸從秘境裡走出來，手裡拿著通關獎勵——一塊系統隨機抽到的靈石碎片。", emotion: "default" as const },
  { character: "linyi" as const, text: "搞定。挺快的，就是裡面的路有點繞，幸好能穿牆，直接走直線。", emotion: "smile" as const },
  { character: "xiaoelder" as const, text: "走……直線？那秘境裡有七七四十九道陣法、九九八十一道迷障！你走直線？！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "對啊，穿牆就沒有迷路這個問題了。反正牆擋不住我。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "蕭長老！您看到了嗎！師兄的「虛空漫步」！這是空間法則的極致展現！連牆壁都不再是障礙！", emotion: "gloating" as const },
  { character: "narrator" as const, text: "蕭長老沉默了很久。他偷偷看了一眼秘境入口的石壁，又看了看自己修煉了三百年的手掌。然後，他慢慢走向石壁，伸出手，用力按了上去。", emotion: "default" as const },
  { character: "narrator" as const, text: "「嗡——」石壁震動了一下，紋絲不動。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "老夫只是……檢查一下石壁的品質。例行檢查。", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "蕭長老，您的手在抖。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "那是因為……因為老夫感受到了石壁中蘊含的空間法則！對，就是這樣！老夫在感悟！", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "narrator" as const, text: "蕭長老的崩潰進度條，從百分之四十悄悄跳到了百分之四十五。三千年古壁無損，但蕭長老的尊嚴，已經開始出現裂痕。", emotion: "default" as const },
];

export const ContentScene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = getLineIndex(
    frame,
    durationInFrames,
    dialogLines.length,
    segmentDurations[SCENE_NAME],
  );
  const currentLine = dialogLines[currentLineIndex];

  return (
    <AbsoluteFill>
      <BackgroundLayer image="ancient-realm-entrance.png" />

      <div style={{
        position: "absolute", top: -50, left: "50%",
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(192,132,252,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <SceneIndicator text="上古秘境·蕭長老的尊嚴裂痕" color="#C084FC" />

      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      <CharacterSprite
        character="zhaoxiaoqi"
        emotion={currentLine.character === "zhaoxiaoqi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "zhaoxiaoqi"}
        side="right"
        background={currentLine.character !== "zhaoxiaoqi"}
        effects={currentLine.character === "zhaoxiaoqi" ? normalizeEffects(currentLine.effect) : []}
      />

      <CharacterSprite
        character="xiaoelder"
        emotion={currentLine.character === "xiaoelder" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "xiaoelder"}
        side="center"
        background={currentLine.character !== "xiaoelder"}
        effects={currentLine.character === "xiaoelder" ? normalizeEffects(currentLine.effect) : []}
      />

      <ComicEffects
        effects={normalizeEffects(currentLine.effect)}
        side={CHARACTERS[currentLine.character].position}
      />

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
