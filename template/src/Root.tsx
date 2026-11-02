import "./fonts";
import React from "react";
import { Composition, staticFile, Still } from "remotion";
import { Episode, type PropsEpisode } from "./Episode";
import { Cover, type PropsCover } from "./Cover";
import type { DataAdegan } from "./data/adegan";
import { RigArta, type PropsRigArta } from "./uji/RigArta";

const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Episode"
      component={Episode}
      width={720}
      height={1280}
      fps={FPS}
      durationInFrames={FPS * 10}
      defaultProps={{ adeganFile: "contoh/adegan.json", suaraFile: "contoh/suara.mp3" } as PropsEpisode}
      calculateMetadata={async ({ props }) => {
        const data: DataAdegan = await fetch(staticFile(props.adeganFile)).then((r) => r.json());
        return { durationInFrames: Math.ceil((data.durasi + 3) * FPS), props: { ...props, data } };
      }}
    />
    <Still id="RigArta" component={RigArta} width={720} height={1280} defaultProps={{ variasi: "dasar" } as PropsRigArta} />
    <Still
      id="Cover"
      component={Cover}
      width={720}
      height={1280}
      defaultProps={{ episode: "1", judul1: "Rencana", judul2: "Sempurna", tokoh: "arta", ekspresi: "ambis", pose: "pinggang", sub: "Musim 1 · Menuju ITS" } as PropsCover}
    />
  </>
);
