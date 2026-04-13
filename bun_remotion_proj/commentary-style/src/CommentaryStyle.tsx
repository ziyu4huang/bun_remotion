import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { Props } from "./Root";
import { TitleScene } from "./scenes/TitleScene";
import { PointScene } from "./scenes/PointScene";
import { OutroScene } from "./scenes/OutroScene";
import { RevealList } from "./components/RevealList";
import type { EmotionChange } from "./components/CharacterAvatar";

// --- Overlay content for each point ---

const DocsOverlay = () => (
  <div
    style={{
      backgroundColor: "rgba(15, 20, 35, 0.9)",
      borderRadius: 16,
      padding: 30,
      border: "1px solid rgba(0, 212, 255, 0.2)",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
    }}
  >
    <RevealList startDelay={30} items={[
      { content: (
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 10 }}>
          <div style={{ padding: "6px 16px", backgroundColor: "rgba(0, 212, 255, 0.15)", borderRadius: "8px 8px 0 0", color: "#00d4ff", fontSize: 16, fontFamily: "monospace" }}>
            docs.example.com
          </div>
          <div style={{ padding: "6px 16px", color: "rgba(255,255,255,0.4)", fontSize: 16, fontFamily: "monospace" }}>
            google.com/search?q=...
          </div>
        </div>
      ), delayFrames: 0 },
      { content: (
        <div style={{ fontFamily: "monospace", fontSize: 18, color: "rgba(255,255,255,0.8)" }}>
          <div style={{ color: "#00d4ff", marginBottom: 10, fontSize: 22, fontWeight: 700 }}>API Reference</div>
        </div>
      ), delayFrames: 8 },
      { content: (
        <div style={{ fontFamily: "monospace", color: "#7dd3fc", marginBottom: 6 }}>
          <span style={{ color: "#c084fc" }}>fn</span> connect(host: <span style={{ color: "#fbbf24" }}>str</span>)
        </div>
      ), delayFrames: 10 },
      { content: (
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.5 }}>
          Establishes a connection to the specified host.
          Returns a Connection handle or raises ConnectionError.
        </div>
      ), delayFrames: 10 },
      { content: (
        <div style={{ marginTop: 12, padding: "10px 14px", backgroundColor: "rgba(74, 222, 128, 0.1)", borderRadius: 8, borderLeft: "3px solid #4ade80", color: "#4ade80", fontSize: 15 }}>
          ✅ Answer found in 30 seconds
        </div>
      ), delayFrames: 14 },
    ]} />
  </div>
);

const VariablesOverlay = () => (
  <div
    style={{
      backgroundColor: "rgba(15, 20, 35, 0.9)",
      borderRadius: 16,
      padding: 30,
      border: "1px solid rgba(168, 85, 247, 0.2)",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
    }}
  >
    <RevealList startDelay={25} items={[
      { content: (
        <div style={{ fontFamily: "monospace", fontSize: 16 }}>
          <div style={{ padding: "10px 14px", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: 8, borderLeft: "3px solid #ef4444" }}>
            <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 6, fontWeight: 600 }}>😱 6 months later...</div>
            <div style={{ color: "rgba(255,255,255,0.5)" }}>
              <span style={{ color: "#fbbf24" }}>const</span> x = <span style={{ color: "#4ade80" }}>data</span>;<br />
              <span style={{ color: "#fbbf24" }}>const</span> temp = <span style={{ color: "#4ade80" }}>result</span>;<br />
              <span style={{ color: "#fbbf24" }}>const</span> stuff = <span style={{ color: "#4ade80" }}>response</span>;
            </div>
          </div>
        </div>
      ), delayFrames: 0 },
      { content: (
        <div style={{ fontFamily: "monospace", fontSize: 16, marginTop: 16 }}>
          <div style={{ padding: "10px 14px", backgroundColor: "rgba(74, 222, 128, 0.1)", borderRadius: 8, borderLeft: "3px solid #4ade80" }}>
            <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 6, fontWeight: 600 }}>✅ Readable code</div>
            <div style={{ color: "rgba(255,255,255,0.7)" }}>
              <span style={{ color: "#fbbf24" }}>const</span> userProfiles = <span style={{ color: "#4ade80" }}>fetchedData</span>;<br />
              <span style={{ color: "#fbbf24" }}>const</span> validatedResults = <span style={{ color: "#4ade80" }}>apiResults</span>;<br />
              <span style={{ color: "#fbbf24" }}>const</span> authResponse = <span style={{ color: "#4ade80" }}>serverReply</span>;
            </div>
          </div>
        </div>
      ), delayFrames: 18 },
    ]} />
  </div>
);

const TestsOverlay = () => (
  <div
    style={{
      backgroundColor: "rgba(15, 20, 35, 0.9)",
      borderRadius: 16,
      padding: 30,
      border: "1px solid rgba(74, 222, 128, 0.2)",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
    }}
  >
    <RevealList startDelay={25} items={[
      { content: (
        <div style={{ fontFamily: "monospace", color: "#4ade80", fontSize: 20, fontWeight: 700, marginBottom: 14 }}>
          ✅ All 42 tests passed
        </div>
      ), delayFrames: 0 },
      { content: (
        <div style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7 }}>
          <div><span style={{ color: "#4ade80" }}>PASS</span> auth/login.test.ts (8 tests)</div>
          <div><span style={{ color: "#4ade80" }}>PASS</span> api/users.test.ts (12 tests)</div>
          <div><span style={{ color: "#4ade80" }}>PASS</span> utils/validate.test.ts (6 tests)</div>
        </div>
      ), delayFrames: 8 },
      { content: (
        <div style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7 }}>
          <div><span style={{ color: "#4ade80" }}>PASS</span> db/queries.test.ts (10 tests)</div>
          <div><span style={{ color: "#4ade80" }}>PASS</span> middleware/auth.test.ts (6 tests)</div>
        </div>
      ), delayFrames: 6 },
      { content: (
        <div style={{ marginTop: 16, padding: "10px 14px", backgroundColor: "rgba(96, 165, 250, 0.1)", borderRadius: 8, color: "#93c5fd", fontSize: 14, fontStyle: "italic" }}>
          💤 "Deployed at 11 PM. Slept like a baby."
        </div>
      ), delayFrames: 14 },
    ]} />
  </div>
);

// --- Scene definitions ---

const scenes = [
  {
    Scene: () => (
      <TitleScene
        title="3 Habits That Separate\nGood Programmers\nfrom Great Ones"
        subtitle="A commentary on the craft of code"
      />
    ),
    audio: "audio/01-title.mp3",
    name: "Title",
  },
  {
    Scene: () => (
      <PointScene
        number={1}
        title="Read The Documentation\nBefore Googling"
        overlayContent={<DocsOverlay />}
        subtitle="Great programmers read the documentation before Googling. I know, revolutionary concept. But seriously, the docs usually have the answer right there in the first paragraph."
        colorFrom="#0a1520"
        colorTo="#0d2030"
        accentColor="rgba(0, 180, 216, 0.2)"
        emotion="neutral"
        emotionTimeline={[
          { emotion: "smug", at: 0.35 },
          { emotion: "neutral", at: 0.65 },
        ]}
        emphasisMoments={[
          { text: "REVOLUTIONARY", at: 0.35, color: "#00b4d8" },
        ]}
        shakeAt={120}
        shakeIntensity={6}
        wordsPerSecond={3.2}
        overlayDirection="right"
      />
    ),
    audio: "audio/02-point1.mp3",
    name: "Point 1",
  },
  {
    Scene: () => (
      <PointScene
        number={2}
        title="Name Variables Like\nYou'll Read Them\nTomorrow"
        overlayContent={<VariablesOverlay />}
        subtitle="They name their variables like they'll have to read them tomorrow. Because they will. Future you will thank present you."
        colorFrom="#150a20"
        colorTo="#1f0d30"
        accentColor="rgba(168, 85, 247, 0.2)"
        emotion="angry"
        emotionTimeline={[
          { emotion: "shocked", at: 0.25 },
          { emotion: "happy", at: 0.65 },
        ]}
        emphasisMoments={[
          { text: "6 MONTHS LATER", at: 0.25, color: "#ef4444" },
          { text: "FUTURE YOU", at: 0.7, color: "#a855f7" },
        ]}
        shakeAt={90}
        shakeIntensity={8}
        wordsPerSecond={3.0}
        overlayDirection="left"
      />
    ),
    audio: "audio/03-point2.mp3",
    name: "Point 2",
  },
  {
    Scene: () => (
      <PointScene
        number={3}
        title="Write Tests To\nSleep At Night"
        overlayContent={<TestsOverlay />}
        subtitle="They write tests. Not because their boss told them to, but because they want to sleep at night without nightmares about production bugs."
        colorFrom="#0a1510"
        colorTo="#0d2518"
        accentColor="rgba(74, 222, 128, 0.2)"
        emotion="neutral"
        emotionTimeline={[
          { emotion: "shocked", at: 0.5 },
          { emotion: "happy", at: 0.75 },
        ]}
        emphasisMoments={[
          { text: "PRODUCTION BUGS", at: 0.55, color: "#ef4444" },
        ]}
        shakeAt={180}
        shakeIntensity={10}
        wordsPerSecond={3.0}
        overlayDirection="right"
      />
    ),
    audio: "audio/04-point3.mp3",
    name: "Point 3",
  },
  {
    Scene: () => (
      <OutroScene
        text="Which habit are\nyou working on?"
        subtitle="So which habit are you working on? Drop a comment below. And if you found this helpful, hit that subscribe button."
      />
    ),
    audio: "audio/05-outro.mp3",
    name: "Outro",
  },
];

/** Brief white flash between scenes for commentary-style transitions */
const SceneTransition: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - from;

  if (localFrame < 0 || localFrame > 12) return null;

  // Quick flash: ramp up then down
  const opacity = interpolate(localFrame, [0, 3, 9, 12], [0, 0.7, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "white",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

/** Thin progress bar at the top of the video */
const ProgressBar: React.FC<{ sceneDurations: number[] }> = ({ sceneDurations }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #00d4ff, #a855f7)",
          borderRadius: "0 2px 2px 0",
          boxShadow: "0 0 8px rgba(0, 212, 255, 0.5)",
        }}
      />
    </div>
  );
};

export const CommentaryStyle: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? 210;
  const starts = sceneDurations.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + d(i - 1));
    return acc;
  }, []);

  // Scene transition flash points (at each scene boundary)
  const transitionFrames = starts.slice(1).map((s) => s);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0e1a" }}>
      <ProgressBar sceneDurations={sceneDurations} />

      {scenes.map(({ Scene, audio, name }, i) => (
        <Sequence key={i} name={name} from={starts[i]} durationInFrames={d(i)}>
          <Scene />
          <Audio src={staticFile(audio)} volume={1} />
        </Sequence>
      ))}

      {/* Transition flashes between scenes */}
      {transitionFrames.map((f, i) => (
        <SceneTransition key={`trans-${i}`} from={f} />
      ))}
    </AbsoluteFill>
  );
};
