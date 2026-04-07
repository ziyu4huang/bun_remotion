import { Composition } from "remotion";
import { TaiwanStockMarket } from "./TaiwanStockMarket";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TaiwanStockMarket"
        component={TaiwanStockMarket}
        durationInFrames={1680}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
