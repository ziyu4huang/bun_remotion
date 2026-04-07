import { Composition } from "remotion";
import { ClaudeCodeIntro } from "./ClaudeCodeIntro";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClaudeCodeIntro"
        component={ClaudeCodeIntro}
        durationInFrames={660}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
