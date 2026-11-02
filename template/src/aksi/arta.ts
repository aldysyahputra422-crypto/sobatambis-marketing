// Pustaka aksi Arta (tampak depan). Prinsip: antisipasi sebelum aksi besar, overshoot, squash saat mendarat.
// Konvensi sudut: lihat rig/pose.ts.
import type { Aksi } from "./tipe";

const NETRAL = {
  badan: 0, kepala: 0, lenganAtasKi: 14, lenganBawahKi: 6, lenganAtasKa: 14, lenganBawahKa: 6,
  pahaKi: 2, betisKi: 0, pahaKa: 2, betisKa: 0,
};

const diam_hidup: Aksi = {
  nama: "diam_hidup", tokoh: "arta", durasi: 2.4, penuh: false, ulang: true,
  kunci: [
    { t: 0, dx: 0, dy: 0, sx: 1, sy: 1, sendi: NETRAL },
    { t: 1.2, sy: 1.014, sx: 0.994, easing: "masukKeluar",
      sendi: { badan: 2.5, kepala: -4, lenganAtasKi: 18, lenganAtasKa: 11, lenganBawahKa: 10, pahaKi: 3, pahaKa: 1 } },
    { t: 2.4, sy: 1, sx: 1, easing: "masukKeluar", sendi: NETRAL },
  ],
};

// Siklus jalan tampak depan: badan naik-turun, kaki dan lengan berayun berlawanan.
const jalan: Aksi = {
  nama: "jalan", tokoh: "arta", durasi: 0.6, penuh: true, ulang: true,
  kunci: [
    { t: 0, dy: 0, sy: 0.98, sx: 1.01, sendi: { ...NETRAL, pahaKi: 16, betisKi: 12, pahaKa: -5, lenganAtasKi: 4, lenganAtasKa: 30, lenganBawahKa: 20, badan: -3, kepala: 2 } },
    { t: 0.15, dy: -12, sy: 1.03, sx: 0.99, easing: "keluar", sendi: { pahaKi: 3, betisKi: 4, pahaKa: 3, lenganAtasKi: 16, lenganAtasKa: 16, badan: 0, kepala: 0 } },
    { t: 0.3, dy: 0, sy: 0.98, sx: 1.01, easing: "masuk", sendi: { pahaKa: 16, betisKa: 12, pahaKi: -5, betisKi: 0, lenganAtasKa: 4, lenganBawahKa: 6, lenganAtasKi: 30, lenganBawahKi: 20, badan: 3, kepala: -2 } },
    { t: 0.45, dy: -12, sy: 1.03, sx: 0.99, easing: "keluar", sendi: { pahaKi: 3, pahaKa: 3, betisKa: 4, lenganAtasKi: 16, lenganAtasKa: 16, badan: 0, kepala: 0 } },
    { t: 0.6, dy: 0, sy: 0.98, sx: 1.01, easing: "masuk", sendi: { pahaKi: 16, betisKi: 12, pahaKa: -5, betisKa: 0, lenganAtasKi: 4, lenganBawahKi: 6, lenganAtasKa: 30, lenganBawahKa: 20, badan: -3, kepala: 2 } },
  ],
};

// Hentak kaki kanan layar sambil mengepal: angkat (antisipasi) → hentak (squash) → tegak.
const hentak: Aksi = {
  nama: "hentak", tokoh: "arta", durasi: 0.75, penuh: true, kontak: 0.34,
  kunci: [
    { t: 0, dx: 0, dy: 0, sx: 1, sy: 1, sendi: NETRAL },
    { t: 0.2, dy: -16, sy: 1.04, sx: 0.98, easing: "sinus",
      sendi: { pahaKa: 26, betisKa: 34, badan: -5, kepala: -5, lenganAtasKi: 34, lenganBawahKi: 70, lenganAtasKa: 34, lenganBawahKa: 70 } },
    { t: 0.34, dy: 0, sy: 0.88, sx: 1.09, easing: "masuk",
      sendi: { pahaKa: 4, betisKa: 0, badan: 4, kepala: 7, lenganAtasKi: 24, lenganBawahKi: 95, lenganAtasKa: 24, lenganBawahKa: 95 } },
    { t: 0.46, sy: 1.04, sx: 0.98, easing: "keluar", sendi: { badan: 1, kepala: 2 } },
    { t: 0.75, sy: 1, sx: 1, easing: "keluar", sendi: { pahaKa: 3, badan: 0, kepala: 0, lenganAtasKi: 22, lenganBawahKi: 85, lenganAtasKa: 22, lenganBawahKa: 85 } },
  ],
};

// Banting benda ke dinding kanan atas dengan tangan kanan layar: tarik ke belakang kepala → dorong lurus → tahan.
const banting: Aksi = {
  nama: "banting", tokoh: "arta", durasi: 1.0, penuh: true, kontak: 0.5,
  kunci: [
    { t: 0, dx: 0, dy: 0, sx: 1, sy: 1, sendi: NETRAL },
    { t: 0.28, dy: 4, sy: 0.97, sx: 1.02, easing: "sinus",
      sendi: { lenganAtasKa: 105, lenganBawahKa: 115, badan: -8, kepala: -6, lenganAtasKi: 34, lenganBawahKi: 30, pahaKi: 8, pahaKa: -2 } },
    { t: 0.5, dx: 18, dy: -12, sy: 1.06, sx: 0.96, easing: "masuk",
      sendi: { lenganAtasKa: 148, lenganBawahKa: -8, badan: 9, kepala: 7, lenganAtasKi: 12, lenganBawahKi: 10, pahaKi: 4, pahaKa: 10 } },
    { t: 0.62, dy: 0, sy: 0.98, sx: 1.02, easing: "keluar", sendi: { lenganAtasKa: 140, lenganBawahKa: 4, badan: 6, kepala: 4 } },
    { t: 1.0, sy: 1, sx: 1, easing: "masukKeluar", sendi: { lenganAtasKa: 128, lenganBawahKa: 14, badan: 3, kepala: 2, pahaKa: 4 } },
  ],
};

// Lompat dengan kepalan ke atas: jongkok (antisipasi) → melesat (stretch) → puncak → mendarat (squash) → pantul.
const lompat: Aksi = {
  nama: "lompat", tokoh: "arta", durasi: 1.15, penuh: true, kontak: 0.78,
  kunci: [
    { t: 0, dx: 0, dy: 0, sx: 1, sy: 1, sendi: NETRAL },
    { t: 0.2, dy: 0, sy: 0.84, sx: 1.12, easing: "sinus",
      sendi: { pahaKi: 14, betisKi: 26, pahaKa: 14, betisKa: 26, lenganAtasKi: 22, lenganBawahKi: 50, lenganAtasKa: 22, lenganBawahKa: 50, badan: 0, kepala: 4 } },
    { t: 0.4, dy: -150, sy: 1.14, sx: 0.92, easing: "keluar",
      sendi: { pahaKi: 5, betisKi: 8, pahaKa: 5, betisKa: 8, lenganAtasKi: 160, lenganBawahKi: 4, lenganAtasKa: 160, lenganBawahKa: 4, kepala: -4 } },
    { t: 0.58, dy: -178, sy: 1.0, sx: 1.0, easing: "keluar",
      sendi: { pahaKi: 16, betisKi: 32, pahaKa: 16, betisKa: 32, lenganAtasKi: 170, lenganAtasKa: 170, kepala: 0 } },
    { t: 0.78, dy: 0, sy: 0.82, sx: 1.15, easing: "masuk",
      sendi: { pahaKi: 14, betisKi: 26, pahaKa: 14, betisKa: 26, lenganAtasKi: 150, lenganBawahKi: 14, lenganAtasKa: 150, lenganBawahKa: 14, kepala: 5 } },
    { t: 0.92, sy: 1.05, sx: 0.97, easing: "keluar", sendi: { pahaKi: 4, betisKi: 4, pahaKa: 4, betisKa: 4, lenganAtasKi: 160, lenganAtasKa: 160, kepala: -2 } },
    { t: 1.15, sy: 1, sx: 1, easing: "keluar", sendi: { pahaKi: 3, betisKi: 0, pahaKa: 3, betisKa: 0, lenganAtasKi: 150, lenganBawahKi: 18, lenganAtasKa: 150, lenganBawahKa: 18, kepala: 0 } },
  ],
};

export const AKSI_ARTA = { diam_hidup, jalan, hentak, banting, lompat };
