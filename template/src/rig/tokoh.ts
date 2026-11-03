// Registry tokoh ber-rig: satu antarmuka untuk menggambar, memegang benda, dan ukuran.
import type { Pose } from "./pose";
import type { OpsiGambar } from "./anggota";
import { gambarArta, posisiTangan } from "./arta";
import { gambarRatna, posisiTanganRatna } from "./ratna";
import { gambarMbis } from "./mbis";

export type IdTokoh = "arta" | "ratna" | "mbis";
export type Rig = {
  gambar: (pose: Pose, opsi: OpsiGambar) => string;
  tangan?: (pose: Pose, sisi: "Ki" | "Ka") => { x: number; y: number; sudut: number };
  tinggi: number; // telapak sampai puncak kepala (px, skala 1)
};

export const TOKOH: Record<IdTokoh, Rig> = {
  arta: { gambar: gambarArta, tangan: posisiTangan, tinggi: 718 },
  ratna: { gambar: gambarRatna, tangan: posisiTanganRatna, tinggi: 560 },
  mbis: { gambar: gambarMbis, tinggi: 210 },
};
