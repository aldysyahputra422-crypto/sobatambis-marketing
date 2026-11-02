// Komposisi uji: beberapa pose Arta berdampingan, untuk memeriksa sambungan sendi.
import React from "react";
import { AbsoluteFill } from "remotion";
import { defs, paper } from "../sistem/gambar";
import { gambarArta } from "../rig/arta";
import { POSE_DASAR, type Pose } from "../rig/pose";

export type PropsRigArta = { variasi: "dasar" | "ekstrem" };

const pose = (x: number, y: number, ubah: Partial<Pose["sendi"]>, lain: Partial<Pose> = {}): Pose => ({
  ...POSE_DASAR, x, y, skala: 0.62, ...lain, sendi: { ...POSE_DASAR.sendi, ...ubah },
});

const VARIASI: Record<PropsRigArta["variasi"], Pose[]> = {
  dasar: [pose(190, 600, {}), pose(530, 600, {}, { ekspresi: "senyum" }), pose(360, 1220, {}, { ekspresi: "marah" })],
  ekstrem: [
    pose(190, 600, { lenganAtasKi: 160, lenganAtasKa: 160, lenganBawahKi: -20, lenganBawahKa: -20 }, { ekspresi: "tawa" }),
    pose(530, 600, { lenganAtasKi: 40, lenganBawahKi: 120, lenganAtasKa: 40, lenganBawahKa: 120, pahaKi: 20, betisKi: 40, pahaKa: 20, betisKa: 40 }, { ekspresi: "panik", sy: 0.88, sx: 1.1 }),
    pose(360, 1220, { badan: -18, kepala: 14, lenganAtasKa: 120, lenganBawahKa: -40, pahaKi: 30, pahaKa: -10, betisKi: -30 }, { ekspresi: "marah" }),
  ],
};

export const RigArta: React.FC<PropsRigArta> = ({ variasi }) => {
  const isi = VARIASI[variasi].map((p) => gambarArta(p, { mulut: 2, kedip: 0, ikutan: 0 })).join("");
  return <AbsoluteFill dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280">${defs()}${paper({})}${isi}</svg>` }} />;
};
