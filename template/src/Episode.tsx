// @ts-nocheck
import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { artaBust, artaFull, defs, epBadge, handle, hand, mbis, P, ratnaBust, vignette } from "./sistem/gambar";
import { kertas, LATAR, PROPERTI } from "./dunia/latar";
import { efekEmosi } from "./efek/emosi";
import { adeganAktif, type DataAdegan } from "./data/adegan";
import { Caption } from "./teks/Caption";
import { pecahCatatan, posisiCatatan } from "./teks/catatan";
import { KartuPenutup } from "./KartuPenutup";

export type PropsEpisode = { adeganFile: string; suaraFile: string; data?: DataAdegan };
const DEPAN = new Set(["kertas_58"]);
const MIRING: Record<string, number> = { lelah: 14, hancur: 42, tertekan: 8, kaget: -6 };

const kedipan = (frame: number, offset: number) => {
  const f = (frame + offset) % 120;
  return f < 4 ? [0.5, 1, 1, 0.5][f] : 0;
};

function gambarTokoh(sc, frame: number, buka: number) {
  const depan: string[] = [];
  const belakang: string[] = [];
  const napas = Math.sin(frame / 14) * 2;
  const miring = (MIRING[sc.emosi] ?? 0) + (sc.emosi === "marah" ? Math.sin(frame * 2.3) * 3 : 0);
  for (const t of sc.visual.tokoh) {
    const bicara = t.id === sc.penutur ? buka : 0;
    if (t.id === "arta") {
      const o = { kedip: kedipan(frame, 0), buka: bicara, miring };
      const bust = t.pose === "bust";
      const x = sc.visual.latar === "meja_malam" ? 320 : 360;
      belakang.push(
        bust
          ? `<g transform="translate(${x} ${650 + napas})">${artaBust(t.ekspresi, o)}</g>`
          : `<g transform="translate(250 ${690 + napas}) scale(.92)">${artaFull(t.ekspresi, t.pose, o)}</g>`,
      );
    } else if (t.id === "ratna") {
      belakang.push(`<g transform="translate(330 ${760 + napas})">${ratnaBust(t.ekspresi, { kedip: kedipan(frame, 37), buka: bicara })}</g>`);
    } else if (t.id === "mbis") {
      const muncul = Math.min(1, frame % 100000);
      belakang.push(`<g transform="translate(612 ${808 + napas}) rotate(-8)" opacity="${muncul}">${mbis(t.ekspresi === "intip" ? "intip" : "senang", 0.78, { kedip: kedipan(frame, 71) })}</g>`);
    }
  }
  return { belakang: belakang.join(""), depan: depan.join("") };
}

export const Episode: React.FC<PropsEpisode> = ({ suaraFile, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audio = useAudioData(staticFile(suaraFile));
  if (!data) return null;
  const detik = frame / fps;

  if (detik >= data.durasi) {
    return <KartuPenutup judulBerikut={data.penutup.judul_berikut} frameLokal={frame - Math.round(data.durasi * fps)} />;
  }

  const sc = data.adegan[adeganAktif(data, detik)];
  const lokal = frame - Math.round(sc.mulai * fps);
  const panjang = Math.max(1, Math.round((sc.akhir_jeda - sc.mulai) * fps));
  const efek = efekEmosi(sc.emosi, sc.intensitas, lokal);

  let buka = 0;
  if (audio && detik >= sc.mulai && detik <= sc.selesai) {
    const v = visualizeAudio({ fps, frame, audioData: audio, numberOfSamples: 16 });
    buka = Math.min(1, (v.reduce((a, b) => a + b, 0) / v.length) * 10);
  }

  const k = sc.visual.kamera;
  const skala = k === "zoom_masuk" ? interpolate(lokal, [0, panjang], [1, 1.08], { extrapolateRight: "clamp" })
    : k === "zoom_keluar" ? interpolate(lokal, [0, panjang], [1.08, 1], { extrapolateRight: "clamp" }) : 1;
  const pantul = k === "pantul" ? Math.abs(Math.sin(lokal / 6)) * -6 : 0;
  const gx = efek.goyang.x + (k === "goyang" && lokal < 8 ? (lokal % 2 ? 5 : -5) : 0);
  const gy = efek.goyang.y + pantul;

  const latar = LATAR[sc.visual.latar];
  const prop = sc.visual.properti ?? [];
  const tokoh = gambarTokoh(sc, frame, buka);
  const lebarCatatan = interpolate(lokal, [4, 20], [0, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pos = posisiCatatan(sc.visual.latar);
  const catatan = sc.visual.catatan_merah
    ? `<clipPath id="ungkap${sc.id}"><rect x="${pos.x - 10}" y="${pos.y - 60}" width="${lebarCatatan}" height="140"/></clipPath>
       <g clip-path="url(#ungkap${sc.id})" transform="rotate(-5 ${pos.x} ${pos.y})">${pecahCatatan(sc.visual.catatan_merah)
         .map((b, i) => hand(pos.x, pos.y + i * 36, b, { size: 36, color: P.red })).join("")}</g>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">${defs(5 + (Math.floor(frame / 4) % 6))}
    <g transform="translate(${360 + gx} ${640 + gy}) scale(${skala}) translate(-360 -640)">
      ${kertas(sc.visual.latar)}
      ${latar.gambar()}
      ${prop.filter((p) => !DEPAN.has(p) && PROPERTI[p]).map((p) => PROPERTI[p]()).join("")}
      ${tokoh.belakang}
      ${latar.depan ? latar.depan() : ""}
      ${prop.filter((p) => DEPAN.has(p) && PROPERTI[p]).map((p) => PROPERTI[p]()).join("")}
      ${catatan}
    </g>
    ${epBadge(data.episode.replace(/^ep0?/, ""), data.judul)}
    ${handle()}${vignette()}</svg>`;

  return (
    <AbsoluteFill style={{ backgroundColor: P.paper }}>
      <Audio src={staticFile(suaraFile)} />
      <AbsoluteFill dangerouslySetInnerHTML={{ __html: svg }} />
      {efek.rona === "merah" && (
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(194,65,45,0) 55%, rgba(194,65,45,.38) 100%)" }} />
      )}
      {efek.rona === "gelap" && (
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(13,20,48,0) 35%, rgba(13,20,48,.72) 100%)" }} />
      )}
      <Caption adegan={sc} detik={detik} efek={efek} frameLokal={lokal} />
    </AbsoluteFill>
  );
};
