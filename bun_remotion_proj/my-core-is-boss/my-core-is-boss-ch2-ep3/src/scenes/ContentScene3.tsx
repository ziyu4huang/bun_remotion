import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { DialogBox } from "../../../assets/components/DialogBox";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import { normalizeEffects, CHARACTERS, type ComicEffect } from "../../../assets/characters";
import { SceneIndicator } from "../../../assets/components/SceneIndicator";
import { SystemNotification } from "../../../assets/components/SystemOverlay";
import { getLineIndex } from "../../../assets/components/dialogTiming";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const segmentDurations: Record<string, number[]> = (() => {
  try { return require("../../audio/segment-durations.json"); }
  catch { return {}; }
})();

const SCENE_NAME = "ContentScene3";

const dialogLines = [
  { character: "narrator" as const, text: "蕭長老聞訊趕到宗門廣場，看見林逸正蹲在地上，對著一塊普通石頭研究。", emotion: "default" as const },
  { character: "linyi" as const, text: "辨識結果：普通青石，但系統提示裡面蘊含微量靈脈。採集——「靈石碎片 ×3。品質：完美。」", emotion: "smile" as const },
  { character: "xiaoelder" as const, text: "林、林逸！你在做什麼？！你從石頭裡……採出了靈石碎片？！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "對啊。哦，蕭長老，你的鞋帶鬆了——等等，辨識自動觸發了：「天道宗制式法靴，靈力損耗率百分之三，建議三日內更換鞋帶，否則法靴報廢」。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "你、你光看一眼就知道老夫的法靴會在三日後報廢？！", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "linyi" as const, text: "辨識技能自動的。不用特意看，範圍內的東西它全會顯示。對了，這廣場太大了，走路好麻煩，我試試跳躍MAX——", emotion: "default" as const },
  { character: "narrator" as const, text: "林逸輕輕一蹬，整個人像箭一樣射向天空，三秒後穩穩落在三十丈外的宗門屋頂上。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "這、這是縮地成寸？！不……比縮地成寸還誇張！他飛上去了！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "蕭長老！師兄的隱藏職業是全能採集者！採集天地萬物、辨識萬物本源、跳躍超越空間——三項皆至巔峰！古籍上說「三項圓滿者，可踏上古之道」！", emotion: "gloating" as const, effect: "sparkle" as ComicEffect },
  { character: "linyi" as const, text: "什麼上古之道？我就是不想走路而已。你們要我下來嗎？還是我直接跳回修煉場？", emotion: "confused" as const },
  { character: "xiaoelder" as const, text: "老夫……老夫也想要這個採集技能……", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "蕭長老！您又悟了！", emotion: "shock" as const },
  { character: "xiaoelder" as const, text: "不不不！老夫絕對沒有想要……老夫只是……只是路過……", emotion: "cry" as const },
  { character: "narrator" as const, text: "蕭長老的手，已經不由自主地撿起了腳邊的一根靈草。他低頭看了看手中的靈草，又看了看屋頂上若無其事的林逸，陷入了長久的沉默。", emotion: "default" as const },
  { character: "narrator" as const, text: "蕭長老的三觀，正在經歷第二次大規模崩塌。第一次是燒功法，第二次是——偷偷學林逸撿東西。", emotion: "default" as const },
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

  const showIdentify = frame >= durationInFrames * 0.2 && frame <= durationInFrames * 0.4;
  const showJump = frame >= durationInFrames * 0.5 && frame <= durationInFrames * 0.65;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="sect-plaza.png" />

      <div style={{
        position: "absolute", bottom: -100, left: "20%",
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <SceneIndicator text="天道宗·廣場" color="#A78BFA" />

      {showIdentify && (
        <SystemNotification
          text="辨識結果：天道宗制式法靴 — 靈力損耗率 3% — 建議三日內更換鞋帶"
          type="info"
          delay={0}
        />
      )}

      {showJump && (
        <SystemNotification
          text="跳躍 MAX — 縱身一躍：三十丈"
          type="success"
          delay={0}
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

      {currentLineIndex >= 1 && (
        <CharacterSprite
          character="zhaoxiaoqi"
          emotion={currentLine.character === "zhaoxiaoqi" ? currentLine.emotion : "default"}
          speaking={currentLine.character === "zhaoxiaoqi"}
          side="right"
          background={currentLine.character !== "zhaoxiaoqi"}
          effects={currentLine.character === "zhaoxiaoqi" ? normalizeEffects(currentLine.effect) : []}
        />
      )}

      {currentLineIndex >= 2 && (
        <CharacterSprite
          character="xiaoelder"
          emotion={currentLine.character === "xiaoelder" ? currentLine.emotion : "default"}
          speaking={currentLine.character === "xiaoelder"}
          side="center"
          background={currentLine.character !== "xiaoelder"}
          effects={currentLine.character === "xiaoelder" ? normalizeEffects(currentLine.effect) : []}
        />
      )}

      <ComicEffects
        effects={normalizeEffects(currentLine.effect)}
        side={CHARACTERS[currentLine.character].position}
      />

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
