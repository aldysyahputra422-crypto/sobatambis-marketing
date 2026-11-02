// @ts-nocheck
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { artaFull, defs, highlight, mbis, P, paper, ratnaBust, vignette } from "./sistem/gambar";

export type PropsCover = { episode: string; judul1: string; judul2: string; tokoh: "arta" | "mbis" | "ratna"; ekspresi: string; pose: string; sub: string };

export const Cover: React.FC<PropsCover> = ({ episode, judul1, judul2, tokoh, ekspresi, pose, sub }) => {
  const label = episode.startsWith("MBIS") ? episode : `EP.${episode}`;
  const lebarBadge = label.length * 15 + 46;
  const panjang = Math.max(judul1.length, judul2.length);
  const ukuran = panjang > 14 ? 64 : 78;
  const art = tokoh === "arta"
    ? `<g transform="translate(360 745) scale(.8)">${artaFull(ekspresi, pose)}</g>`
    : tokoh === "mbis" ? `<g transform="translate(360 760) scale(2)">${mbis(ekspresi === "intip" ? "intip" : "senang")}</g>`
    : `<g transform="translate(360 760)">${ratnaBust(ekspresi)}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280">${defs()}${paper()}
    <text x="360" y="250" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="26" fill="${P.red}" letter-spacing="3">${sub.toUpperCase()}</text>
    <g filter="url(#soft)"><rect x="${360 - lebarBadge / 2}" y="276" width="${lebarBadge}" height="56" rx="28" fill="${P.ink}"/></g>
    <text x="360" y="314" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="26" fill="${P.yel}">${label}</text>
    ${highlight(360 - judul2.length * ukuran * 0.28, 470, judul2.length * ukuran * 0.56, 34, 0.85)}
    <text x="360" y="418" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="${ukuran}" fill="${P.ink}">${judul1}</text>
    <text x="360" y="500" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="${ukuran}" fill="${P.ink}">${judul2}</text>
    ${art}${vignette()}</svg>`;
  return (
    <AbsoluteFill style={{ backgroundColor: P.paper }}>
      <AbsoluteFill dangerouslySetInnerHTML={{ __html: svg }} />
      <Img src={staticFile("logo-sobat-ambis.png")} style={{ position: "absolute", left: 290, top: 1140, width: 140, height: 50, objectFit: "cover" }} />
    </AbsoluteFill>
  );
};
