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
  { character: "narrator" as const, text: "消息傳回宗門後，蕭長老第一時間趕到秘境。他帶著一隊長老，準備見證林逸如何破解隱藏關卡。結果他看到的場景是——林逸站在守護者面前，正在逐條列舉迷宮的設計缺陷。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "你們在做什麼？你不是在闖關嗎？為什麼在跟守護者討論陣法邏輯？！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "蕭長老，我在做代碼審查。你不知道嗎？這迷宮寫得很爛，至少有十七個 bug。", emotion: "smile" as const },
  { character: "xiaoelder" as const, text: "代碼審查？！這是上古大能設計的絕世迷宮！哪裡來的代碼？！", emotion: "shock" as const },
  { character: "narrator" as const, text: "守護者的殘魂飄到蕭長老面前，用一種近乎崩潰的語氣說：「他說得對。第三十七個岔路確實是個 bug，我當年沒有測試就上線了。三千年了，終於有人發現了。」", emotion: "default" as const, effect: "sweat" as ComicEffect },
  { character: "xiaoelder" as const, text: "守護者大人！您不要被這小子帶偏了！您是上古大能的殘魂！", emotion: "shock" as const },
  { character: "narrator" as const, text: "守護者搖了搖頭：「不，他真的看到了本源。三千年前我設計這個迷宮的時候，確實在最後一步偷懶了，直接用了一面實牆擋路，沒想到有人能穿牆。」", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "所以這個三千年無人通過的迷宮，最後一關的防禦措施就是……一堵牆？", emotion: "confused" as const },
  { character: "linyi" as const, text: "對，一堵牆。而且還沒有碰撞體積。我 noclip 都不需要開就能穿過去。這個迷宮的設計師需要好好學學遊戲設計。", emotion: "smile" as const, effect: "gloating" as ComicEffect },
  { character: "narrator" as const, text: "蕭長老看著崩潰的守護者，又看著一臉無辜的林逸，手中的拂塵掉在了地上。他的崩潰進度條，從百分之四十五跳到了百分之五十。", emotion: "default" as const, effect: "sweat" as ComicEffect },
  { character: "xiaoelder" as const, text: "老夫的修仙世界觀……正在被一個外門弟子和一個三千年前的 bug 重構……", emotion: "shock" as const },
  { character: "narrator" as const, text: "守護者的殘魂漸漸消散，臨走前留下最後一句話：「下次設計迷宮，我一定會寫單元測試的。」", emotion: "default" as const },
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

  const showBreakdownNotification = frame >= durationInFrames * 0.75 && frame <= durationInFrames * 0.88;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="ancient-realm-inside.png" />

      <div style={{
        position: "absolute", top: -50, left: "30%",
        width: 800, height: 800,
        background: "radial-gradient(circle, rgba(192,132,252,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <SceneIndicator text="迷宮盡頭·守護者崩潰中" color="#C084FC" />

      {showBreakdownNotification && (
        <SystemNotification
          text="蕭長老崩潰進度：45% → 50% — 世界觀重構中"
          type="warning"
          delay={0}
        />
      )}

      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi" && currentLine.character !== "xiaoelder"}
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
