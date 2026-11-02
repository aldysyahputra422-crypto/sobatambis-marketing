// Kartu penutup 3 detik sebagai komposisi tersendiri (disambung ke adegan oleh scripts/render.py).
import React from "react";
import { useCurrentFrame } from "remotion";
import { KartuPenutup } from "./KartuPenutup";

export type PropsPenutup = { judulBerikut: string };

export const Penutup: React.FC<PropsPenutup> = ({ judulBerikut }) => {
  const frame = useCurrentFrame();
  return <KartuPenutup judulBerikut={judulBerikut} frameLokal={frame} />;
};
