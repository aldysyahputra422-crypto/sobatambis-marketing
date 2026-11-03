// Pustaka aksi Mbis (lihat pemetaan Sendi di rig/mbis.ts). Mbis jarang bicara; ia berakting lewat badan dan ekor.
import type { Aksi } from "./tipe";

const N = { badan: 0, kepala: 0, lenganAtasKi: 0, lenganBawahKi: 0, lenganAtasKa: 0, lenganBawahKa: 0, pahaKi: 0, betisKi: 0, pahaKa: 0, betisKa: 0 };

const diam_hidup: Aksi = {
  nama: "diam_hidup", tokoh: "mbis", durasi: 2.0, penuh: false, ulang: true,
  kunci: [
    { t: 0, dx: 0, dy: 0, sx: 1, sy: 1, sendi: N },
    { t: 1.0, sy: 1.025, sx: 0.99, easing: "sinus", sendi: { badan: 3, betisKa: 18, kepala: -3 } },
    { t: 2.0, sy: 1, sx: 1, easing: "sinus", sendi: { badan: 0, betisKa: 0, kepala: 0 } },
  ],
};

// Mengintip: naik dari balik benda (dy positif = tersembunyi di bawah), miring penasaran.
const ngintip: Aksi = {
  nama: "ngintip", tokoh: "mbis", durasi: 0.8, penuh: false,
  kunci: [
    { t: 0, dx: 0, dy: 130, sx: 1, sy: 1, sendi: N },
    { t: 0.45, dy: 0, easing: "pantul", sendi: { kepala: 12, betisKa: 10 } },
    { t: 0.8, dy: 0, easing: "keluar", sendi: { kepala: 10, betisKa: 20 } },
  ],
};

const geleng: Aksi = {
  nama: "geleng", tokoh: "mbis", durasi: 1.0, penuh: false,
  kunci: [
    { t: 0, dx: 0, dy: 0, sx: 1, sy: 1, sendi: N },
    { t: 0.2, easing: "sinus", sendi: { kepala: -14, betisKa: -10 } },
    { t: 0.4, easing: "sinus", sendi: { kepala: 14, betisKa: 10 } },
    { t: 0.6, easing: "sinus", sendi: { kepala: -14, betisKa: -10 } },
    { t: 0.8, easing: "sinus", sendi: { kepala: 12, betisKa: 8 } },
    { t: 1.0, easing: "keluar", sendi: { kepala: 0, betisKa: 0 } },
  ],
};

// Muncul tiba-tiba: memantul dari kecil (pop).
const muncul: Aksi = {
  nama: "muncul", tokoh: "mbis", durasi: 0.6, penuh: false, kontak: 0.2,
  kunci: [
    { t: 0, dx: 0, dy: 0, sx: 0.15, sy: 0.15, sendi: N },
    { t: 0.2, sx: 1.18, sy: 0.88, easing: "keluar", sendi: { betisKa: 24 } },
    { t: 0.36, sx: 0.94, sy: 1.08, easing: "keluar" },
    { t: 0.6, sx: 1, sy: 1, easing: "keluar", sendi: { betisKa: 10 } },
  ],
};

// Menutup mata dengan dua kaki depan (malu / tidak mau lihat).
const tutup_mata: Aksi = {
  nama: "tutup_mata", tokoh: "mbis", durasi: 0.8, penuh: false,
  kunci: [
    { t: 0, dx: 0, dy: 0, sx: 1, sy: 1, sendi: N },
    { t: 0.42, easing: "sinus", sendi: { lenganAtasKi: -150, lenganAtasKa: -150, kepala: -4 } },
    { t: 0.56, easing: "keluar", sendi: { lenganAtasKi: -144, lenganAtasKa: -144 } },
    { t: 0.8, easing: "keluar", sendi: { lenganAtasKi: -140, lenganAtasKa: -140, kepala: 4, betisKa: -12 } },
  ],
};

export const AKSI_MBIS: Record<string, Aksi> = { diam_hidup, ngintip, geleng, muncul, tutup_mata };
