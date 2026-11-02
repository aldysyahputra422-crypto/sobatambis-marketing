// Pustaka aksi Bu Ratna: gerak lembut seorang ibu (kerangka sama dengan Arta).
import type { Aksi } from "./tipe";
import { AKSI_ARTA, NETRAL } from "./arta";

const salin = (a: Aksi, ubah: Partial<Aksi>): Aksi => ({ ...a, ...ubah, tokoh: "ratna" });

const lirik_hp: Aksi = {
  nama: "lirik_hp", tokoh: "ratna", durasi: 1.2, penuh: false,
  kunci: [
    { t: 0, sendi: NETRAL, dx: 0, dy: 0, sx: 1, sy: 1 },
    { t: 0.5, easing: "masukKeluar", sendi: { lenganAtasKa: 54, lenganBawahKa: 118, kepala: 9, badan: 2 } },
    { t: 1.2, easing: "masukKeluar", sendi: { lenganAtasKa: 52, lenganBawahKa: 120, kepala: 12, badan: 3 } },
  ],
};

const menghela: Aksi = {
  nama: "menghela", tokoh: "ratna", durasi: 1.4, penuh: false,
  kunci: [
    { t: 0, sendi: NETRAL, dx: 0, dy: 0, sx: 1, sy: 1 },
    { t: 0.5, dy: -6, sy: 1.03, easing: "sinus", sendi: { kepala: -8, lenganAtasKi: 18, lenganAtasKa: 18 } },
    { t: 1.1, dy: 6, sy: 0.97, easing: "keluar", sendi: { kepala: 10, badan: 2, lenganAtasKi: 6, lenganAtasKa: 6 } },
    { t: 1.4, dy: 0, sy: 1, easing: "masukKeluar", sendi: { kepala: 4, badan: 0 } },
  ],
};

const jalan = salin(AKSI_ARTA.jalan, { laju: 120, kunci: AKSI_ARTA.jalan.kunci.map((k) => ({ ...k, dy: k.dy === undefined ? undefined : k.dy * 0.6 })) });

export const AKSI_RATNA: Record<string, Aksi> = {
  diam_hidup: salin(AKSI_ARTA.diam_hidup, {}),
  lirik_hp, menghela, jalan,
  serahkan: salin(AKSI_ARTA.serahkan, {}),
};
