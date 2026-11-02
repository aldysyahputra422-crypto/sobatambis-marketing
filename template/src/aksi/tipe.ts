import type { NamaEasing, Sendi } from "../rig/pose";

// Pose kunci: t dalam detik sejak aksi mulai. dx/dy = geseran akar relatif posisi awal aksi.
// Kanal yang tidak disebut membawa nilai dari pose kunci sebelumnya.
export type PoseKunci = {
  t: number;
  dx?: number; dy?: number; sx?: number; sy?: number;
  sendi?: Partial<Record<Sendi, number>>;
  easing?: NamaEasing; // easing segmen dari kunci sebelumnya ke kunci ini
};

export type Aksi = {
  nama: string;
  tokoh: "arta";
  durasi: number;
  penuh: boolean; // aksi seluruh badan (dihitung QA naskah)
  ulang?: boolean; // siklus (jalan, diam_hidup)
  kontak?: number; // detik relatif saat benda menempel / kaki menghentak / mendarat
  kunci: PoseKunci[];
};

export type EntriAksi = {
  mulai: number;
  aksi: string;
  ekspresi?: string;
  param?: { dx?: number; benda?: string; pindah?: { x: number; y: number } }; // pindah: taruh akar di posisi baru (potongan adegan)
};
