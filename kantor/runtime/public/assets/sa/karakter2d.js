// Karakter digambar utuh sebagai ilustrasi datar di canvas, mengikuti lembar karakter teman pemilik.
// Dipakai sebagai potongan datar yang menghadap kamera di ruangan 3D (lihat docs/desain/kantor-marketing-brief.md).
// Wajahnya memakai wajah.js supaya satu sumber kebenaran untuk mata, hidung, mulut, dan blush.
import { gambarWajah, GARIS_WAJAH } from './wajah.js';

export const LEBAR = 512;
export const TINGGI = 720;

// Tata letak dasar, diukur dari lembar: kepala kira-kira separuh tinggi tubuh, badan dan kaki mungil.
export const TUBUH = {
  cx: 256,
  kepala: { cy: 238, rx: 152, ry: 142 },
  badan: { atas: 366, lebar: 196, tinggi: 152, bahu: 30 },
  lengan: { lebar: 36, panjang: 140 },
  kaki: { x: 46, atas: 500, panjang: 76, lebar: 36 },
  sepatu: { lebar: 60, tinggi: 36 },
  bayang: { cy: 622, rx: 132, ry: 24 },
};

const PANGKAT_2D = 3.0;
const TEBAL = 8;

// Jalur superelips (kotak membulat) — bentuk kepala dan badan di lembar.
export function jalurSquircle(ctx, cx, cy, rx, ry, p = PANGKAT_2D, titik = 72) {
  ctx.beginPath();
  for (let i = 0; i <= titik; i++) {
    const t = (i / titik) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = cx + rx * Math.sign(c) * Math.abs(c) ** (2 / p);
    const y = cy + ry * Math.sign(s) * Math.abs(s) ** (2 / p);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function isi(ctx, warna, garis = true, tebal = TEBAL) {
  ctx.fillStyle = warna;
  ctx.fill();
  if (garis) {
    ctx.strokeStyle = GARIS_WAJAH;
    ctx.lineWidth = tebal;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

function kapsul(ctx, x, y, w, h) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x - r, y + r);
  ctx.lineTo(x - r, y + h - r);
  ctx.arcTo(x - r, y + h, x, y + h, r);
  ctx.arcTo(x + r, y + h, x + r, y + h - r, r);
  ctx.lineTo(x + r, y + r);
  ctx.arcTo(x + r, y, x, y, r);
  ctx.arcTo(x - r, y, x - r, y + r, r);
  ctx.closePath();
}

// ------------------------------------------------------------------ rambut
// Tiap gaya punya bagian `belakang` (digambar sebelum kepala) dan `depan` (sesudah wajah).
const K = TUBUH.kepala;
const atasKepala = K.cy - K.ry;

function goresKilau(ctx, warna, garis) {
  ctx.strokeStyle = warna;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (const [x1, y1, x2, y2] of garis) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

// Tudung rambut: satu bentuk utuh (mengikuti lengkung kepala di atas, tepi bawah digambar `tepi`),
// bukan hasil potongan, supaya tidak muncul garis lurus melintang di dahi.
function tudung(ctx, warna, turun, tepi, lebih = 7) {
  const rx = K.rx + lebih;
  const ry = K.ry + lebih;
  const batas = K.cy - ry + ry * 2 * turun;
  const titik = [];
  const n = 80;
  for (let i = 0; i <= n; i++) {
    const t = Math.PI + (i / n) * Math.PI; // kiri, lewat atas, ke kanan
    const c = Math.cos(t);
    const sn = Math.sin(t);
    const x = TUBUH.cx + rx * Math.sign(c) * Math.abs(c) ** (2 / PANGKAT_2D);
    const y = K.cy + ry * Math.sign(sn) * Math.abs(sn) ** (2 / PANGKAT_2D);
    if (y <= batas) titik.push([x, y]);
  }
  ctx.beginPath();
  titik.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  const kiri = titik[0];
  const kanan = titik[titik.length - 1];
  if (tepi) tepi(ctx, kanan, kiri, batas);
  else ctx.lineTo(kiri[0], kiri[1]);
  ctx.closePath();
  isi(ctx, warna);
  return batas;
}

export const RAMBUT2D = {
  jabrik: {
    belakang(ctx, s) {
      // duri tegak tinggi menyebar dari puncak kepala
      ctx.beginPath();
      const n = 9;
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1) - 0.5;
        const bx = TUBUH.cx + k * K.rx * 1.75;
        const by = K.cy - K.ry * 0.58 + Math.abs(k) * K.ry * 0.9;
        const tinggi = 176 - Math.abs(k) * 104;
        ctx.moveTo(bx - 36, by + 16);
        ctx.lineTo(bx + k * 120, by - tinggi);
        ctx.lineTo(bx + 36, by + 16);
      }
      isi(ctx, s.warna);
    },
    depan(ctx, s) {
      // tepi bawah bergerigi, berhenti di atas mata
      const batas = tudung(ctx, s.warna, 0.3, (c, kanan, kiri, b) => {
        for (let i = 8; i >= 0; i--) {
          const x = TUBUH.cx - K.rx + (i / 8) * K.rx * 2;
          c.lineTo(x, b + (i % 2 ? 34 : 2));
        }
        c.lineTo(kiri[0], kiri[1]);
      });
      goresKilau(ctx, '#FFFFFF55', [[TUBUH.cx - 58, batas - 54, TUBUH.cx - 22, batas - 78]]);
      if (s.petir) { // kilat kuning di pelipis
        ctx.beginPath();
        const px = TUBUH.cx - K.rx * 0.74;
        const py = K.cy - K.ry * 0.12;
        ctx.moveTo(px + 16, py - 46);
        ctx.lineTo(px - 14, py + 4);
        ctx.lineTo(px + 4, py + 4);
        ctx.lineTo(px - 10, py + 48);
        ctx.lineTo(px + 22, py - 6);
        ctx.lineTo(px + 2, py - 6);
        ctx.closePath();
        isi(ctx, s.petir, true, 6);
      }
    },
  },
  'panjang-pita': {
    belakang(ctx, s) {
      // dua untai panjang di kiri dan kanan, melewati bahu
      for (const sisi of [-1, 1]) {
        ctx.beginPath();
        const x = TUBUH.cx + sisi * (K.rx - 28);
        ctx.moveTo(x, K.cy - K.ry * 0.6);
        ctx.quadraticCurveTo(x + sisi * 116, K.cy + 70, x + sisi * 86, K.cy + 236);
        ctx.quadraticCurveTo(x + sisi * 40, K.cy + 286, x - sisi * 6, K.cy + 232);
        ctx.quadraticCurveTo(x + sisi * 20, K.cy + 80, x - sisi * 26, K.cy - K.ry * 0.5);
        ctx.closePath();
        isi(ctx, s.warna);
      }
      // massa rambut di belakang kepala
      jalurSquircle(ctx, TUBUH.cx, K.cy - 6, K.rx + 12, K.ry + 12);
      isi(ctx, s.warna);
    },
    depan(ctx, s) {
      // poni: tepi bawah melengkung turun di tengah, tetap di atas mata
      const batas = tudung(ctx, s.warna, 0.28, (c, kanan, kiri, b) => {
        c.quadraticCurveTo(TUBUH.cx + K.rx * 0.5, b + 42, TUBUH.cx, b + 24);
        c.quadraticCurveTo(TUBUH.cx - K.rx * 0.5, b + 42, kiri[0], kiri[1]);
      }, 10);
      goresKilau(ctx, '#FFFFFF4D', [
        [TUBUH.cx - 76, batas - 40, TUBUH.cx - 34, batas - 66],
        [TUBUH.cx + 52, batas - 58, TUBUH.cx + 84, batas - 30],
      ]);
      if (s.pita) { // pita di sisi kanan atas
        const bx = TUBUH.cx + K.rx * 0.7;
        const by = batas - 54;
        for (const sisi of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx + sisi * 62, by - 44, bx + sisi * 54, by + 6);
          ctx.quadraticCurveTo(bx + sisi * 50, by + 44, bx, by + 10);
          ctx.closePath();
          isi(ctx, s.pita, true, 7);
        }
        ctx.beginPath();
        ctx.ellipse(bx, by + 5, 16, 15, 0, 0, Math.PI * 2);
        isi(ctx, s.pita, true, 7);
      }
    },
  },
};

// ------------------------------------------------------------------ badan
function telinga2d(ctx, w) {
  for (const sisi of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(TUBUH.cx + sisi * (K.rx - 4), K.cy + 10, 22, 32, 0, 0, Math.PI * 2);
    isi(ctx, w.kulit);
    ctx.beginPath();
    ctx.arc(TUBUH.cx + sisi * (K.rx + 2), K.cy + 10, 11, Math.PI * 0.6 * sisi, Math.PI * 1.5 * sisi, sisi < 0);
    ctx.strokeStyle = GARIS_WAJAH;
    ctx.lineWidth = 5;
    ctx.stroke();
  }
}

function kaki2d(ctx, w) {
  const { kaki, sepatu } = TUBUH;
  const warnaKaki = ['rok', 'rok-panjang', 'celana-pendek'].includes(w.bawah.jenis) ? (w.kaki ?? w.kulit) : w.bawah.warna;
  for (const sisi of [-1, 1]) {
    const x = TUBUH.cx + sisi * kaki.x;
    kapsul(ctx, x, kaki.atas, kaki.lebar, kaki.panjang);
    isi(ctx, warnaKaki);
    ctx.beginPath();
    ctx.roundRect(x - sepatu.lebar / 2, kaki.atas + kaki.panjang - 10, sepatu.lebar, sepatu.tinggi, [8, 12, 10, 10]);
    isi(ctx, w.sepatu);
  }
}

function lengan2d(ctx, w) {
  const { badan, lengan } = TUBUH;
  const warna = w.baju.lengan === 'kulit' ? w.kulit : w.baju.lengan;
  for (const sisi of [-1, 1]) {
    const x = TUBUH.cx + sisi * (badan.lebar / 2 + 4);
    kapsul(ctx, x, badan.atas + 18, lengan.lebar, lengan.panjang);
    isi(ctx, warna);
    ctx.beginPath();
    ctx.ellipse(x, badan.atas + 18 + lengan.panjang - 6, 21, 21, 0, 0, Math.PI * 2);
    isi(ctx, w.kulit);
  }
}

function baju2d(ctx, w) {
  const b = w.baju;
  const { badan } = TUBUH;
  const x0 = TUBUH.cx - badan.lebar / 2;
  ctx.beginPath();
  ctx.roundRect(x0, badan.atas, badan.lebar, badan.tinggi, [badan.bahu, badan.bahu, 16, 16]);
  isi(ctx, b.atas);
  if (b.garis) { // kaus bergaris
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x0, badan.atas, badan.lebar, badan.tinggi, [badan.bahu, badan.bahu, 16, 16]);
    ctx.clip();
    ctx.fillStyle = b.garis;
    for (let y = badan.atas + 18; y < badan.atas + badan.tinggi; y += 32) ctx.fillRect(x0, y, badan.lebar, 15);
    ctx.restore();
  }
  if (b.ruffle) { // kerutan di bawah baju
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(x0 + 16 + i * ((badan.lebar - 32) / 5), badan.atas + badan.tinggi - 4, 22, 20, 0, 0, Math.PI * 2);
      isi(ctx, b.ruffle, true, 6);
    }
  }
  if (b.rompi) for (const sisi of [-1, 1]) { // kelepak jas
    ctx.beginPath();
    ctx.moveTo(TUBUH.cx + sisi * 10, badan.atas);
    ctx.lineTo(TUBUH.cx + sisi * (badan.lebar / 2), badan.atas);
    ctx.lineTo(TUBUH.cx + sisi * (badan.lebar / 2), badan.atas + badan.tinggi);
    ctx.lineTo(TUBUH.cx + sisi * 26, badan.atas + badan.tinggi);
    ctx.closePath();
    isi(ctx, b.rompi);
  }
  if (b.kerah) {
    ctx.beginPath();
    ctx.moveTo(TUBUH.cx - 42, badan.atas + 2);
    ctx.lineTo(TUBUH.cx, badan.atas + 44);
    ctx.lineTo(TUBUH.cx + 42, badan.atas + 2);
    ctx.closePath();
    isi(ctx, b.kerah, true, 6);
  }
  if (b.dasi) {
    ctx.beginPath();
    ctx.moveTo(TUBUH.cx, badan.atas + 20);
    ctx.lineTo(TUBUH.cx + 17, badan.atas + 44);
    ctx.lineTo(TUBUH.cx + 12, badan.atas + 112);
    ctx.lineTo(TUBUH.cx - 12, badan.atas + 112);
    ctx.lineTo(TUBUH.cx - 17, badan.atas + 44);
    ctx.closePath();
    isi(ctx, b.dasi, true, 6);
  }
}

// ------------------------------------------------------------------ karakter utuh
// `wajahCanvas` = canvas 512x512 hasil gambarWajah (dibuat pemanggil supaya bisa dipakai ulang saat kedip).
export function gambarKarakter2d(ctx, w, wajahCanvas, { bayangan = true } = {}) {
  const s = w.rambut;
  const gaya = RAMBUT2D[s.gaya] ?? RAMBUT2D['panjang-pita'];
  ctx.clearRect(0, 0, LEBAR, TINGGI);
  ctx.lineJoin = 'round';

  // Bayangan ikut digambar hanya untuk lembar datar. Di ruangan 3D bayangannya dibuat di lantai,
  // kalau ikut tergambar di sini hasilnya jadi noda tegak di papan karakter.
  if (bayangan) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#2B2238';
    ctx.beginPath();
    ctx.ellipse(TUBUH.cx, TUBUH.bayang.cy, TUBUH.bayang.rx, TUBUH.bayang.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  gaya.belakang?.(ctx, s);
  kaki2d(ctx, w);
  lengan2d(ctx, w);
  baju2d(ctx, w);
  telinga2d(ctx, w);
  jalurSquircle(ctx, TUBUH.cx, K.cy, K.rx, K.ry);
  isi(ctx, w.kulit);
  ctx.drawImage(wajahCanvas, TUBUH.cx - K.rx, K.cy - K.ry, K.rx * 2, K.ry * 2);
  gaya.depan?.(ctx, s);
}

// Pembantu untuk pemakaian langsung: buat canvas wajah lalu gambar seluruh karakter.
export function gambarLengkap(ctx, w, buatCanvas, opsi = {}) {
  const c = buatCanvas(512, 512);
  gambarWajah(c.getContext('2d'), w, opsi);
  gambarKarakter2d(ctx, w, c, opsi);
}

// Tinggi tokoh di dalam gambar (dari ujung rambut sampai alas sepatu), dipakai untuk menskalakan
// papan karakter di ruangan 3D supaya tingginya sama dengan karakter 3D sebelumnya.
export const BAGIAN_TOKOH = {
  atas: TUBUH.kepala.cy - TUBUH.kepala.ry - 60, // sisakan ruang untuk rambut tinggi
  alas: TUBUH.kaki.atas + TUBUH.kaki.panjang + TUBUH.sepatu.tinggi - 10,
};
