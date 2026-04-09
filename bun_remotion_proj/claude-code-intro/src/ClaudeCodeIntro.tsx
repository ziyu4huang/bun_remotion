import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { TerminalScene } from "./scenes/TerminalScene";
import { OutroScene } from "./scenes/OutroScene";

export const ClaudeCodeIntro: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d0d" }}>
      <Sequence from={0} durationInFrames={150}>
        <TitleScene />
      </Sequence>
      <Sequence from={150} durationInFrames={180}>
        <FeaturesScene />
      </Sequence>
      <Sequence from={330} durationInFrames={210}>
        <TerminalScene />
      </Sequence>
      <Sequence from={540} durationInFrames={120}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
