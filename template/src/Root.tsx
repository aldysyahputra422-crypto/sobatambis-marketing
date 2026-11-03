import "./fonts";
import React from "react";
import { Composition, staticFile, Still } from "remotion";
import { Episode, type PropsEpisode } from "./Episode";
import { Cover, type PropsCover } from "./Cover";
import type { DataAdegan } from "./data/adegan";
import { RigTokoh, type PropsRigTokoh } from "./uji/RigTokoh";
import { Penutup, type PropsPenutup } from "./Penutup";
import { AdeganV2, type PropsAdeganV2 } from "./AdeganV2";
import type { DataAdegan2 } from "./data/adegan2";

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
    <Composition
      id="AdeganV2"
      component={AdeganV2}
      width={720}
      height={1280}
      fps={FPS}
      durationInFrames={FPS * 10}
      defaultProps={{ adeganFile: "uji/adegan2.json", dialogFile: "contoh/suara.mp3", mixFile: "contoh/suara.mp3" } as PropsAdeganV2}
      calculateMetadata={async ({ props }) => {
        const data: DataAdegan2 = await fetch(staticFile(props.adeganFile)).then((r) => r.json());
        return { durationInFrames: Math.ceil(data.durasi * FPS), props: { ...props, data } };
      }}
    />
    <Composition id="Penutup" component={Penutup} width={720} height={1280} fps={FPS} durationInFrames={FPS * 3}
      defaultProps={{ judulBerikut: "Ep.2: Kenapa rencana yang sempurna justru bikin nilai turun?" } as PropsPenutup} />
    <Still id="RigTokoh" component={RigTokoh} width={720} height={1280} defaultProps={{ tokoh: "arta", variasi: "dasar" } as PropsRigTokoh} />
    <Still
      id="Cover"
      component={Cover}
      width={720}
      height={1280}
      defaultProps={{ episode: "1", judul1: "Rencana", judul2: "Sempurna", tokoh: "arta", ekspresi: "ambis", pose: "pinggang", sub: "Musim 1 · Menuju ITS" } as PropsCover}
    />
  </>
);
