import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { DialogBox } from "../../../assets/components/DialogBox";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import { MangaSfx } from "../../../assets/components/MangaSfx";
import { ScreenShake } from "../../../assets/components/ScreenShake";
import { SystemNotification, SystemMessage } from "../../../assets/components/SystemOverlay";
import { normalizeEffects, CHARACTERS, type ComicEffect } from "../../../assets/characters";
import { SceneIndicator } from "../../../assets/components/SceneIndicator";

const dialogLines = [
  { character: "narrator" as const, text: "消息傳到了蕭長老的耳中。煉器峰的資深長老，決定親自來看看這個「狂徒」。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "哪來的小子，竟敢在天道宗放肆！", emotion: "anger" as const, effect: "anger" as ComicEffect },
  { character: "xiaoelder" as const, text: "讓老夫看看……鍛體期？連修為都沒有，你憑什麼在此囂張？", emotion: "anger" as const },
  { character: "linyi" as const, text: "等一下……這個老頭頭上怎麼飄著 Lv.85？", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "而且……隱藏等級：問號？這字體也太大了，擋到我視線了。", emotion: "confused" as const, effect: "dots" as ComicEffect },
  { character: "xiaoelder" as const, text: "你……你剛才說什麼？隱藏等級？", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "narrator" as const, text: "蕭長老聞言，臉色驟變。隱藏等級——那只有大乘期以上的存在才有的標記！", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "這、這不可能……這小子明明沒有修為……", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "linyi" as const, text: "能不能把這個 UI 調小一點？真的很礙事。", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "narrator" as const, text: "蕭長老雙腿一軟，直接跪了下去。", emotion: "default" as const, sfx: [{ text: "咚！", x: 960, y: 500, color: "#A78BFA", rotation: 0, fontSize: 130, font: "brush" }] },
  { character: "zhaoxiaoqi" as const, text: "長老跪了！長老跪了！我就知道師兄不是普通人！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "xiaoelder" as const, text: "前輩……不，前輩在上！晚輩有眼不識泰山！", emotion: "cry" as const, effect: "cry" as ComicEffect },
  { character: "linyi" as const, text: "……啊？你在跪什麼啊？", emotion: "confused" as const, effect: "sweat" as ComicEffect },
];

export const ContentScene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lineDuration = durationInFrames / dialogLines.length;
  const currentLineIndex = Math.min(
    Math.floor(frame / lineDuration),
    dialogLines.length - 1,
  );
  const currentLine = dialogLines[currentLineIndex];

  // Elder enters at line 1 (index 1)
  const elderEnterFrame = (1 / dialogLines.length) * durationInFrames;
  const isElderPresent = currentLineIndex >= 1;

  // Dramatic reveal at line 5 (xiaoelder hears "隱藏等級")
  const revealFrame = (5 / dialogLines.length) * durationInFrames;
  const isReveal = currentLineIndex >= 5 && currentLineIndex <= 6;

  // Elder kneels at line 9
  const kneelFrame = (9 / dialogLines.length) * durationInFrames;
  const isKneeling = currentLineIndex >= 9;

  // Scene shake at reveal and kneel
  const shakeDelay = isReveal
    ? Math.floor(revealFrame)
    : isKneeling
    ? Math.floor(kneelFrame)
    : undefined;

  // System notification at line 3 (linyi sees level)
  const levelFrame = (3 / dialogLines.length) * durationInFrames;

  return (
    <AbsoluteFill>
      <ScreenShake delay={shakeDelay} intensity={isKneeling ? 20 : 12} duration={25}>
        <BackgroundLayer image="sect-training.png" />

        {/* Scene indicator */}
        <SceneIndicator text="長老駕到" color="#A78BFA" />

        {/* Characters */}
        <CharacterSprite
          character="linyi"
          emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
          speaking={currentLine.character === "linyi"}
          side="left"
          background={currentLine.character !== "linyi"}
          effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
        />

        {isElderPresent && (
          <CharacterSprite
            character="xiaoelder"
            emotion={currentLine.character === "xiaoelder" ? currentLine.emotion : (isKneeling ? "cry" : "default")}
            speaking={currentLine.character === "xiaoelder"}
            side="center"
            background={currentLine.character !== "xiaoelder"}
            effects={currentLine.character === "xiaoelder" ? normalizeEffects(currentLine.effect) : []}
          />
        )}

        {/* zhaoxiaoqi appears at line 10 */}
        {currentLineIndex >= 10 && (
          <CharacterSprite
            character="zhaoxiaoqi"
            emotion={currentLine.character === "zhaoxiaoqi" ? currentLine.emotion : "shock"}
            speaking={currentLine.character === "zhaoxiaoqi"}
            side="right"
            background={currentLine.character !== "zhaoxiaoqi"}
            effects={currentLine.character === "zhaoxiaoqi" ? normalizeEffects(currentLine.effect) : []}
          />
        )}

        {/* Comic effects */}
        <ComicEffects
          effects={normalizeEffects(currentLine.effect)}
          side={CHARACTERS[currentLine.character].position}
        />

        {/* Manga SFX from dialog line */}
        <MangaSfx events={currentLine.sfx ?? []} />

        {/* Dialog box */}
        <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
      </ScreenShake>

      {/* System notifications (outside ScreenShake) */}
      {currentLineIndex >= 3 && currentLineIndex <= 5 && (
        <SystemNotification
          text="偵測到高等級單位：Lv.85（隱藏等級：???）"
          type="warning"
          delay={Math.floor(levelFrame)}
        />
      )}

      {isKneeling && currentLineIndex <= 11 && (
        <SystemMessage
          text="蕭長老 評價已更新：敬畏"
          delay={Math.floor(kneelFrame) + 10}
          position="center"
          color="#A78BFA"
        />
      )}
    </AbsoluteFill>
  );
};
