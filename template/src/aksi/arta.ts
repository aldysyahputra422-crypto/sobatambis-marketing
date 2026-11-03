// Pustaka aksi Arta (tampak depan). Prinsip: antisipasi sebelum aksi besar, overshoot, squash saat mendarat.
// Konvensi sudut: lihat rig/pose.ts.
import type { Aksi } from "./tipe";

export const NETRAL = {
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
  nama: "jalan", tokoh: "arta", durasi: 0.6, penuh: true, ulang: true, laju: 150,
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

const lari: Aksi = {
  nama: "lari", tokoh: "arta", durasi: 0.4, penuh: true, ulang: true, laju: 320,
  kunci: [
    { t: 0, dy: 0, sy: 0.96, sx: 1.03, sendi: { ...NETRAL, pahaKi: 26, betisKi: 30, pahaKa: -8, lenganAtasKi: 4, lenganBawahKi: 60, lenganAtasKa: 48, lenganBawahKa: 70, badan: -5, kepala: 3 } },
    { t: 0.1, dy: -22, sy: 1.05, sx: 0.97, easing: "keluar", sendi: { pahaKi: 6, betisKi: 10, pahaKa: 6, lenganAtasKi: 24, lenganAtasKa: 24, badan: 0, kepala: 0 } },
    { t: 0.2, dy: 0, sy: 0.96, sx: 1.03, easing: "masuk", sendi: { pahaKa: 26, betisKa: 30, pahaKi: -8, betisKi: 0, lenganAtasKa: 4, lenganBawahKa: 60, lenganAtasKi: 48, lenganBawahKi: 70, badan: 5, kepala: -3 } },
    { t: 0.3, dy: -22, sy: 1.05, sx: 0.97, easing: "keluar", sendi: { pahaKi: 6, pahaKa: 6, betisKa: 10, lenganAtasKi: 24, lenganAtasKa: 24, badan: 0, kepala: 0 } },
    { t: 0.4, dy: 0, sy: 0.96, sx: 1.03, easing: "masuk", sendi: { pahaKi: 26, betisKi: 30, pahaKa: -8, betisKa: 0, lenganAtasKi: 4, lenganBawahKi: 60, lenganAtasKa: 48, lenganBawahKa: 70, badan: -5, kepala: 3 } },
  ],
};

// Menunjuk ke kanan atas dengan tangan kanan layar (antisipasi menekuk dulu).
const tunjuk: Aksi = {
  nama: "tunjuk", tokoh: "arta", durasi: 0.8, penuh: false,
  kunci: [
    { t: 0, sendi: NETRAL, dx: 0, dy: 0, sx: 1, sy: 1 },
    { t: 0.14, easing: "sinus", sendi: { lenganAtasKa: 60, lenganBawahKa: 70, badan: -3 } },
    { t: 0.3, easing: "pantul", sendi: { lenganAtasKa: 112, lenganBawahKa: -12, badan: 4, kepala: 5 } },
    { t: 0.8, easing: "keluar", sendi: { lenganAtasKa: 106, lenganBawahKa: -6, badan: 3, kepala: 3 } },
  ],
};

// Lemas: bahu turun, kepala terkulai, lutut sedikit menekuk.
const lemas: Aksi = {
  nama: "lemas", tokoh: "arta", durasi: 1.0, penuh: true,
  kunci: [
    { t: 0, sendi: NETRAL, dx: 0, dy: 0, sx: 1, sy: 1 },
    { t: 0.6, dy: 12, sy: 0.94, sx: 1.03, easing: "keluar",
      sendi: { kepala: 18, badan: 3, lenganAtasKi: 4, lenganBawahKi: 0, lenganAtasKa: 4, lenganBawahKa: 0, pahaKi: 6, betisKi: 12, pahaKa: 6, betisKa: 12 } },
    { t: 1.0, dy: 10, sy: 0.95, easing: "masukKeluar", sendi: { kepala: 16, badan: 2 } },
  ],
};

// Kaget: tersentak ke atas, tangan terangkat, lalu turun waspada.
const kaget: Aksi = {
  nama: "kaget", tokoh: "arta", durasi: 0.7, penuh: true, kontak: 0.1,
  kunci: [
    { t: 0, sendi: NETRAL, dx: 0, dy: 0, sx: 1, sy: 1 },
    { t: 0.1, dy: -34, sy: 1.12, sx: 0.92, easing: "keluar",
      sendi: { lenganAtasKi: 70, lenganBawahKi: 80, lenganAtasKa: 70, lenganBawahKa: 80, kepala: -6, pahaKi: 8, pahaKa: 8 } },
    { t: 0.32, dy: 0, sy: 0.93, sx: 1.05, easing: "masuk", sendi: { pahaKi: 10, betisKi: 14, pahaKa: 10, betisKa: 14 } },
    { t: 0.7, sy: 1, sx: 1, easing: "keluar", sendi: { lenganAtasKi: 40, lenganBawahKi: 95, lenganAtasKa: 40, lenganBawahKa: 95, pahaKi: 4, betisKi: 4, pahaKa: 4, betisKa: 4, kepala: 0 } },
  ],
};

// Tidur berdiri: berayun pelan, kepala terkulai lalu tersentak sedikit (siklus).
const tidur_berdiri: Aksi = {
  nama: "tidur_berdiri", tokoh: "arta", durasi: 2.0, penuh: true, ulang: true,
  kunci: [
    { t: 0, dx: 0, dy: 6, sx: 1.01, sy: 0.97, sendi: { ...NETRAL, kepala: 14, badan: -5, lenganAtasKi: 4, lenganBawahKi: 0, lenganAtasKa: 4, lenganBawahKa: 0, pahaKi: 4, betisKi: 6, pahaKa: 4, betisKa: 6 } },
    { t: 1.4, dy: 10, easing: "masukKeluar", sendi: { kepala: 28, badan: 6 } },
    { t: 1.6, dy: 4, easing: "keluar", sendi: { kepala: 8, badan: 1 } },
    { t: 2.0, dy: 6, easing: "masukKeluar", sendi: { kepala: 14, badan: -5 } },
  ],
};

// Terduduk ke lantai: lutut lemas, jatuh, memantul kecil.
const terduduk: Aksi = {
  nama: "terduduk", tokoh: "arta", durasi: 0.9, penuh: true, kontak: 0.45,
  kunci: [
    { t: 0, sendi: NETRAL, dx: 0, dy: 0, sx: 1, sy: 1 },
    { t: 0.18, dy: -8, sy: 1.03, easing: "sinus", sendi: { kepala: 6, lenganAtasKi: 30, lenganAtasKa: 30 } },
    { t: 0.45, dy: 112, sy: 0.86, sx: 1.1, easing: "masuk",
      sendi: { pahaKi: 62, betisKi: -48, pahaKa: 62, betisKa: -48, lenganAtasKi: 26, lenganBawahKi: 10, lenganAtasKa: 26, lenganBawahKa: 10, kepala: 10 } },
    { t: 0.6, dy: 104, sy: 1.02, sx: 0.99, easing: "keluar" },
    { t: 0.9, dy: 110, sy: 0.98, sx: 1.01, easing: "masukKeluar", sendi: { kepala: 14 } },
  ],
};

// Menoleh ke samping dengan sedikit overshoot.
const menoleh: Aksi = {
  nama: "menoleh", tokoh: "arta", durasi: 0.5, penuh: false,
  kunci: [
    { t: 0, sendi: NETRAL, dx: 0, dy: 0, sx: 1, sy: 1 },
    { t: 0.25, easing: "pantul", sendi: { kepala: 24, badan: 4 } },
    { t: 0.5, easing: "keluar", sendi: { kepala: 22, badan: 3 } },
  ],
};

// Menyerahkan benda dengan tangan kanan layar.
const serahkan: Aksi = {
  nama: "serahkan", tokoh: "arta", durasi: 1.0, penuh: false, kontak: 0.4,
  kunci: [
    { t: 0, sendi: NETRAL, dx: 0, dy: 0, sx: 1, sy: 1 },
    { t: 0.4, easing: "pantul", sendi: { lenganAtasKa: 76, lenganBawahKa: -6, badan: 6, kepala: 6 } },
    { t: 0.8, easing: "linear", sendi: { lenganAtasKa: 74, lenganBawahKa: -4 } },
    { t: 1.0, easing: "masukKeluar", sendi: { lenganAtasKa: 34, lenganBawahKa: 40, badan: 2, kepala: 2 } },
  ],
};

// Menabrak (pintu) lalu jatuh terduduk.
const tabrak: Aksi = {
  nama: "tabrak", tokoh: "arta", durasi: 1.2, penuh: true, kontak: 0.15,
  kunci: [
    { t: 0, sendi: NETRAL, dx: 0, dy: 0, sx: 1, sy: 1 },
    { t: 0.15, dx: 10, sx: 0.84, sy: 1.06, easing: "masuk", sendi: { kepala: -10, badan: -4 } },
    { t: 0.36, dx: -34, dy: -22, sx: 1.02, sy: 1.0, easing: "keluar",
      sendi: { lenganAtasKi: 80, lenganBawahKi: 60, lenganAtasKa: 86, lenganBawahKa: 50, kepala: 8, pahaKi: 16, pahaKa: 10 } },
    { t: 0.7, dx: -40, dy: 112, sx: 1.12, sy: 0.86, easing: "masuk",
      sendi: { pahaKi: 62, betisKi: -48, pahaKa: 62, betisKa: -48, lenganAtasKi: 30, lenganBawahKi: 10, lenganAtasKa: 30, lenganBawahKa: 10, kepala: 12 } },
    { t: 0.85, dy: 104, sx: 0.99, sy: 1.02, easing: "keluar" },
    { t: 1.2, dy: 110, sx: 1, sy: 1, easing: "masukKeluar", sendi: { kepala: -8 } },
  ],
};

export const AKSI_ARTA: Record<string, Aksi> = { diam_hidup, jalan, hentak, banting, lompat, lari, tunjuk, lemas, kaget, tidur_berdiri, terduduk, menoleh, serahkan, tabrak };
