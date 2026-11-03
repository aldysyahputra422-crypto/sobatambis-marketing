// Komposisi uji: beberapa pose satu tokoh berdampingan, untuk memeriksa sambungan sendi.
import React from "react";
import { AbsoluteFill } from "remotion";
import { defs, paper } from "../sistem/gambar";
import { TOKOH, type IdTokoh } from "../rig/tokoh";
import { POSE_DASAR, type Pose } from "../rig/pose";

export type PropsRigTokoh = { tokoh: IdTokoh; variasi: "dasar" | "ekstrem" };

const SKALA: Record<IdTokoh, number> = { arta: 0.62, ratna: 0.72, mbis: 1.4 };
const EKS: Record<IdTokoh, [string, string, string]> = {
  arta: ["tawa", "panik", "marah"], ratna: ["senyum", "kaget", "lirik"], mbis: ["senang", "tutup", "datar"],
};

const pose = (t: IdTokoh, x: number, y: number, ubah: Partial<Pose["sendi"]>, lain: Partial<Pose> = {}): Pose => ({
  ...POSE_DASAR, x, y, skala: SKALA[t], ...lain, sendi: { ...POSE_DASAR.sendi, ...ubah },
});

const VARIASI = (t: IdTokoh): Record<PropsRigTokoh["variasi"], Pose[]> => ({
  dasar: [pose(t, 190, 600, {}), pose(t, 530, 600, {}, { ekspresi: EKS[t][0] }), pose(t, 360, 1220, {}, { ekspresi: EKS[t][2] })],
  ekstrem: [
    pose(t, 190, 600, { lenganAtasKi: 160, lenganAtasKa: 160, lenganBawahKi: -20, lenganBawahKa: -20, betisKa: 40 }, { ekspresi: EKS[t][0] }),
    pose(t, 530, 600, { lenganAtasKi: 40, lenganBawahKi: 120, lenganAtasKa: 40, lenganBawahKa: 120, pahaKi: 20, betisKi: 40, pahaKa: 20, betisKa: 40 }, { ekspresi: EKS[t][1], sy: 0.88, sx: 1.1 }),
    pose(t, 360, 1220, { badan: -18, kepala: 14, lenganAtasKa: 120, lenganBawahKa: -40, pahaKi: 30, pahaKa: -10, betisKi: -30 }, { ekspresi: EKS[t][2] }),
  ],
});

export const RigTokoh: React.FC<PropsRigTokoh> = ({ tokoh, variasi }) => {
  const isi = VARIASI(tokoh)[variasi].map((p) => TOKOH[tokoh].gambar(p, { mulut: 2, kedip: 0, ikutan: 0 })).join("");
  return <AbsoluteFill dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280">${defs()}${paper({})}${isi}</svg>` }} />;
};
