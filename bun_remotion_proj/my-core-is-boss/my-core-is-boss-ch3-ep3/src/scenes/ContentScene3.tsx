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
  { character: "narrator" as const, text: "就在噬天蛟第二次卡住的時候，蕭長老終於趕到了秘境最底層。他帶著一隊長老，浩浩蕩蕩地衝進了競技場。然而他看到的畫面，讓他瞬間僵在原地。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "老夫來遲——這、這是什麼情況？！上古兇獸為什麼卡在柱子裡？！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "narrator" as const, text: "蕭長老看到的是：上古兇獸噬天蛟，三千年前令整個修仙界聞風喪膽的存在，此刻正卡在兩根石柱之間，像一條巨大的蟲子一樣扭動著，完全無法掙脫。而林逸，正在旁邊悠閒地喝水。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "以、以天地為柱……困萬古兇獸於方寸之間……這不是傳說中的太古困獸陣嗎？！", emotion: "shock" as const },
  { character: "zhaoxiaoqi" as const, text: "蕭長老您也看出來了！師兄的陣法造譣已經超越古今！他連一根手指都沒動，只是跑了一圈，上古兇獸就自己卡住了！", emotion: "default" as const },
  { character: "linyi" as const, text: "我真的只是繞著柱子跑了幾圈而已。", emotion: "smile" as const },
  { character: "narrator" as const, text: "蕭長老的拂塵再次掉在了地上。他的崩潰進度條，從百分之五十跳到了百分之五十五。", emotion: "default" as const, effect: "sweat" as ComicEffect },
  { character: "xiaoelder" as const, text: "老夫……老夫決定了。從今以後，老夫只研究……柱子。", emotion: "shock" as const },
  { character: "narrator" as const, text: "噬天蛟用盡全力終於掙脫了束縛，三千年的怒意在此刻爆發到極點。它猛地撞向林逸，但這一擊卻撞在了地面上。然後——", emotion: "default" as const },
  { character: "narrator" as const, text: "地板穿模了。噬天蛟巨大的身軀直接穿過了地面，像掉進了無底深淵一樣消失在了競技場的地板之下。整個過程不到兩秒。", emotion: "default" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "地板穿模，經典。", emotion: "smile" as const },
  { character: "narrator" as const, text: "三千年的上古兇獸，就這樣被一個地板 bug 送走了。競技場恢复了平靜，只留下一個巨大的地板漏洞和一群目瞪口呆的長老。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "柱子……老夫要研究柱子……還有地板……", emotion: "shock" as const },
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

  const showBreakdownNotification = frame >= durationInFrames * 0.45 && frame <= durationInFrames * 0.55;
  const showFloorClipWarning = frame >= durationInFrames * 0.75 && frame <= durationInFrames * 0.85;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="boss-arena.png" />

      <div style={{
        position: "absolute", top: -50, left: "30%",
        width: 800, height: 800,
        background: "radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <SceneIndicator text="Boss 競技場·地板穿模事件" color="#818CF8" />

      {showBreakdownNotification && (
        <SystemNotification
          text="蕭長老崩潰進度：50% → 55% — 決定研究柱子"
          type="warning"
          delay={0}
        />
      )}

      {showFloorClipWarning && (
        <SystemNotification
          text="穿透偵測警告：地板碰撞體缺失 — 實體已落入虛空"
          type="danger"
          delay={0}
        />
      )}

      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi" && currentLine.character !== "xiaoelder" && currentLine.character !== "zhaoxiaoqi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      {(currentLine.character === "xiaoelder" || currentLine.character === "zhaoxiaoqi") && (
        <CharacterSprite
          character={currentLine.character === "zhaoxiaoqi" ? "zhaoxiaoqi" : "xiaoelder"}
          emotion={currentLine.emotion}
          speaking={true}
          side="right"
          background={false}
          effects={normalizeEffects(currentLine.effect)}
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
