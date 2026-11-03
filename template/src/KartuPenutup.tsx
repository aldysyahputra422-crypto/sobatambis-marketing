// @ts-nocheck
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { defs, hand, highlight, mbis, P, paper, vignette } from "./sistem/gambar";

export const KartuPenutup: React.FC<{ judulBerikut: string; frameLokal: number }> = ({ judulBerikut, frameLokal }) => {
  const muncul = interpolate(frameLokal, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const kata = judulBerikut.split(" ");
  const tengah = Math.ceil(kata.length / 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280">${defs()}${paper({ lamp: [360, 640, 520] })}
    ${hand(360, 330, "Bersambung...", { size: 84, anchor: "middle" })}${highlight(170, 350, 380, 20, 0.75)}
    ${hand(360, 450, kata.slice(0, tengah).join(" "), { size: 36, anchor: "middle", color: P.red })}
    ${hand(360, 494, kata.slice(tengah).join(" "), { size: 36, anchor: "middle", color: P.red })}
    <g transform="translate(360 ${690 + Math.sin(frameLokal / 5) * 6}) scale(1.25)">${mbis("senang")}</g>
    <g filter="url(#soft)"><rect x="110" y="900" width="500" height="170" rx="24" fill="#FFFCF5"/></g>
    <text x="360" y="958" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="36" fill="${P.ink}">Anakmu juga begini?</text>
    <text x="360" y="1010" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="27" fill="${P.ink}">Komen <tspan fill="${P.red}">INFO</tspan> untuk konsultasi gratis</text>
    <text x="360" y="1046" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="700" font-size="20" fill="#6b5a45">Les privat 1-on-1 · mentor mahasiswa PTN · Surabaya</text>
    ${vignette()}</svg>`;
  return (
    <AbsoluteFill style={{ opacity: muncul, backgroundColor: P.paper }}>
      <AbsoluteFill dangerouslySetInnerHTML={{ __html: svg }} />
      <Img src={staticFile("logo-sobat-ambis.png")} style={{ position: "absolute", left: 270, top: 1090, width: 180, height: 64, objectFit: "cover" }} />
    </AbsoluteFill>
  );
};
