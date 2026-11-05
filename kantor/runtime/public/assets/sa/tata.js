// Denah kantor Departemen Marketing Sobat Ambis (data murni, tanpa three.js supaya bisa diuji di Node).
// Susunan mengikuti poster "Italian Smart Office" (isometrik, kamera di sisi depan-kanan): ruang kaca dan jendela
// di belakang, area terbuka di tengah, resepsionis, lounge, dapur, dan area santai di depan. Satuan meter.
// x: kiri → kanan, z: belakang (-) → depan (+, mendekati kamera). Lihat docs/desain/kantor-marketing-brief.md.

// rect = [x0, z0, x1, z1]
export const LANTAI = [-18, -9.5, 18, 9.5];
export const ZONA = {
  riset: { nama: 'Ruang Riset', rect: [-18, -9.5, -13, -3.5] },
  naskah: { nama: 'Ruang Naskah', rect: [-13, -9.5, -8, -3.5] },
  produksi: { nama: 'Lantai Produksi', rect: [-8, -9.5, 1, -3.5] },
  suara: { nama: 'Studio Suara', rect: [1, -9.5, 5.6, -3.5] },
  direktur: { nama: 'Ruang Direktur', rect: [5.6, -9.5, 10.2, -3.5] },
  gerbang: { nama: 'Ruang Gerbang', rect: [10.2, -9.5, 14.8, -3.5] },
  kreatif: { nama: 'Ruang Kreatif', rect: [14.8, -9.5, 18, -1] },
  katalog: { nama: 'Gudang Katalog', rect: [-10.5, -1.5, -5.5, 3.5] },
  lobi: { nama: 'Lobi', rect: [-18, 3.5, -9, 9.5] },
  lounge: { nama: 'Lounge', rect: [-9, 3.5, 18, 9.5] },
};

// nama zona di roster.json → id zona di sini ("Kursi Persetujuan" = lobi)
export function zonaDariNama(nama) {
  if (nama === 'Kursi Persetujuan') return 'lobi';
  return Object.keys(ZONA).find((k) => ZONA[k].nama === nama) ?? null;
}

// Kursi tetap: pekerja duduk di sisi utara meja, menghadap +z. `lane` = kolom jalan keluar (celah antarmeja).
export const MEJA = {
  'periset-tren': { zona: 'riset', x: -16.9, z: -8.2, lane: -15.65 },
  'perencana-konten': { zona: 'riset', x: -14.4, z: -8.2, lane: -15.65 },
  'penulis-naskah': { zona: 'naskah', x: -11.9, z: -8.3, lane: -10.5 },
  'pembasmi-slop': { zona: 'naskah', x: -9.1, z: -8.3, lane: -10.5 },
  'pemeriksa-fakta': { zona: 'naskah', x: -12.0, z: -5.6, lane: -10.5 },
  animator: { zona: 'produksi', x: -7.0, z: -8.2, lane: -5.9 },
  storyboarder: { zona: 'produksi', x: -4.8, z: -8.2, lane: -3.7 },
  'inspektur-frame': { zona: 'produksi', x: -2.6, z: -8.2, lane: -1.5 },
  'sutradara-suara': { zona: 'suara', x: 1.9, z: -8.2, lane: 3.3 },
  'qa-suara': { zona: 'suara', x: 4.7, z: -8.2, lane: 3.3 },
  'penjaga-gerbang-qa': { zona: 'gerbang', x: 11.1, z: -8.2, lane: 12.4 },
  'akuntan-token': { zona: 'gerbang', x: 13.7, z: -8.2, lane: 12.4 },
  'penjadwal-notion': { zona: 'gerbang', x: 13.9, z: -5.6, lane: 12.4 },
  'desainer-cover': { zona: 'kreatif', x: 16.5, z: -8.2, lane: 15.2 },
  'penulis-caption': { zona: 'kreatif', x: 16.5, z: -5.4, lane: 15.2 },
  'pencari-skill': { zona: 'katalog', x: -8.0, z: 1.8, lane: -5.3 },
};
export const MEJA_KETUA = { zona: 'direktur', x: 7.9, z: -8.2, lane: 6.6 };
export const PEMILIK_KURSI = { zona: 'lobi', x: -14.6, z: 6.6 };
// Meja cadangan untuk freelancer (empat meja; sisanya jadi kartu "+N").
export const MEJA_CADANGAN = [
  { zona: 'produksi', x: -7.0, z: -5.6, lane: -5.9 },
  { zona: 'produksi', x: -4.8, z: -5.6, lane: -3.7 },
  { zona: 'produksi', x: -2.6, z: -5.6, lane: -1.5 },
  { zona: 'produksi', x: -0.4, z: -5.6, lane: 0.7 },
];

// Pintu kaca ruang belakang: [x pintu, z garis kaca]. Zona tanpa pintu (produksi, kreatif) terbuka ke lorong.
export const PINTU = {
  riset: [-15.65, -3.5], naskah: [-10.5, -3.5], suara: [3.3, -3.5], direktur: [6.6, -3.5], gerbang: [12.4, -3.5],
};
export const LORONG_Z = -2.4; // lorong utama tepat di depan ruang belakang
export const DALAM_Z = -4.0; // jalur di dalam ruang kaca sebelum pintu
export const PINTU_MASUK = { x: -18.6, z: 7.2 }; // pintu kantor di dinding kiri (freelancer masuk)
export const KORIDOR_MASUK = -16.6;

// Tempat santai (satu per agent). hadap = sudut y (rad), 0 = menghadap +z. via = kolom jalan dari lorong ke tempat itu.
export const LOUNGE = [
  // area percakapan: kursi tamu teal dan kursi oranye
  { x: -5.4, z: 6.4, modus: 'duduk', hadap: 0.5, via: -3.0 }, { x: -1.1, z: 7.5, modus: 'duduk', hadap: -0.5, via: -3.0 },
  { x: -1.9, z: 5.0, modus: 'duduk', hadap: 0.2, via: -3.0 }, { x: -0.3, z: 5.9, modus: 'duduk', hadap: -0.3, via: -3.0 },
  // pulau dapur (berdiri di sisi utara pulau)
  { x: 2.0, z: 2.2, modus: 'berdiri', hadap: 0.2, via: 5.8 }, { x: 3.1, z: 2.2, modus: 'berdiri', hadap: -0.1, via: 5.8 }, { x: 4.2, z: 2.2, modus: 'berdiri', hadap: 0.3, via: 5.8 },
  // meja kolaborasi (kursi hijau sisi utara)
  { x: 6.3, z: 7.2, modus: 'duduk', hadap: 0.1, via: 5.8 }, { x: 7.6, z: 7.2, modus: 'duduk', hadap: -0.1, via: 5.8 }, { x: 8.9, z: 7.2, modus: 'duduk', hadap: 0.2, via: 5.8 },
  // sofa area santai
  { x: 11.0, z: 1.9, modus: 'duduk', hadap: 0.1, via: 9.2 }, { x: 12.2, z: 1.9, modus: 'duduk', hadap: 0, via: 9.2 }, { x: 13.4, z: 1.9, modus: 'duduk', hadap: -0.1, via: 9.2 },
  // meja foosball dan meja bundar
  { x: 14.6, z: 7.1, modus: 'berdiri', hadap: 0.3, via: 9.2 }, { x: 15.8, z: 7.1, modus: 'berdiri', hadap: -0.3, via: 9.2 },
  { x: 11.2, z: 6.3, modus: 'berdiri', hadap: 0.4, via: 9.2 },
];

// Benda besar yang tidak boleh ditembus jalur jalan (tests/tata.test.mjs).
export const RINTANGAN = {
  loker: [-10.1, -1.2, -5.9, -0.5],
  dapur: [1.0, -1.6, 4.5, 0.7],
  pulau: [1.6, 2.85, 4.4, 3.95],
  rak: [7.1, 1.0, 7.7, 4.6],
  baobab: [13.0, -2.1, 16.6, 1.5],
  kolaborasi: [5.5, 7.8, 9.5, 8.8],
  resepsionis: [-12.8, 4.0, -9.2, 6.1],
  foosball: [14.2, 7.8, 16.2, 9.0],
  hologram: [-1.95, 0.05, -0.05, 1.95],
};

// Hologram di area terbuka tengah (menyala sesuai tahap pipeline) dan layar besar di dinding belakang Lantai Produksi.
export const HOLO = { x: -1.0, z: 1.0, r: 0.9 };
export const LAYAR = { x: -3.7, y: 2.5, z: -9.47, w: 6.2, h: 1.9 };

// Tahap pipeline → zona yang menyala di lantai.
export const TAHAP_ZONA = {
  naskah: 'naskah', suara: 'suara', dialog_ok: 'lobi', adegan: 'produksi', mix: 'suara', render_draf: 'produksi',
  qa_gerak: 'produksi', render: 'produksi', qa_final: 'produksi', kemasan: 'kreatif', video_ok: 'lobi', gerbang: 'gerbang',
};

// Garis alur produksi di lantai: dari lobi ke timur sepanjang lorong utama.
export const ALUR = [[-14.0, 5.0], [-14.0, LORONG_Z], [14.6, LORONG_Z]];

// ---- jalur jalan: hanya segmen lurus sumbu x atau z; keluar dari kursi lewat celah → pintu → lorong → kolom tujuan.
// Rute dari tempat t ke lorong (titik terakhir selalu di z = LORONG_Z).
function rute(t) {
  if (t.via !== undefined) return [[t.via, t.z], [t.via, LORONG_Z]];
  const p = PINTU[t.zona];
  const kolom = t.lane ?? t.x + 0.95;
  if (p) return [[kolom, t.z], [kolom, DALAM_Z], [p[0], DALAM_Z], [p[0], LORONG_Z]];
  return [[kolom, t.z], [kolom, LORONG_Z]];
}
export function jalur(dari, ke) {
  const keluar = rute(dari);
  const masuk = [[ke.x, ke.z], ...rute(ke)].reverse();
  return [...keluar, ...masuk];
}
// Freelancer: dari pintu kantor ke meja cadangan, dan sebaliknya.
export function jalurMasuk(meja) {
  return [[KORIDOR_MASUK, PINTU_MASUK.z], [KORIDOR_MASUK, LORONG_Z], ...[[meja.x, meja.z], ...rute(meja)].reverse()];
}
export function jalurKeluar(meja) {
  return [...rute(meja), [KORIDOR_MASUK, LORONG_Z], [KORIDOR_MASUK, PINTU_MASUK.z], [PINTU_MASUK.x, PINTU_MASUK.z]];
}
