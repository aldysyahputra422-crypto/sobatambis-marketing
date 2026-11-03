// Denah kantor Departemen Marketing Sobat Ambis (data murni, tanpa three.js supaya bisa diuji di Node).
// Satuan meter. x: kiri → kanan, z: belakang (-) → depan (+, arah kamera). Gaya denah mengikuti
// docs/desain/kantor-marketing-brief.md (Opsi A: per fungsi).

// rect = [x0, z0, x1, z1]
export const ZONA = {
  lobi: { nama: 'Lobi', rect: [-15, 4, -7, 9], lantai: '#EFE4CC' },
  riset: { nama: 'Ruang Riset', rect: [-15, -9, -8, -2], lantai: '#DDF0E1' },
  naskah: { nama: 'Ruang Naskah', rect: [-8, -9, -1, -2], lantai: '#E9E2F5' },
  suara: { nama: 'Studio Suara', rect: [-1, -9, 4, -2], lantai: '#D7EEEB' },
  direktur: { nama: 'Ruang Direktur', rect: [4, -9, 9.5, -2], lantai: '#DDE5F3' },
  gerbang: { nama: 'Ruang Gerbang', rect: [9.5, -9, 15, -2], lantai: '#FFF2C4' },
  katalog: { nama: 'Gudang Katalog', rect: [-15, -2, -11, 4], lantai: '#EDE0CE' },
  produksi: { nama: 'Lantai Produksi', rect: [-11, -2, 4, 4], lantai: '#DFE7F2' },
  kreatif: { nama: 'Ruang Kreatif', rect: [4, -2, 15, 4], lantai: '#FCE5CF' },
  lounge: { nama: 'Lounge', rect: [-7, 4, 15, 9], lantai: '#E8ECF0' },
};

// nama zona di roster.json → id zona di sini ("Kursi Persetujuan" = lobi)
export function zonaDariNama(nama) {
  if (nama === 'Kursi Persetujuan') return 'lobi';
  return Object.keys(ZONA).find((k) => ZONA[k].nama === nama) ?? null;
}

// Kursi tetap: posisi meja (pekerja duduk di sisi utara meja, menghadap kamera).
export const MEJA = {
  'periset-tren': { zona: 'riset', x: -13.2, z: -6.0 },
  'perencana-konten': { zona: 'riset', x: -9.6, z: -6.0 },
  'penulis-naskah': { zona: 'naskah', x: -7.0, z: -6.0 },
  'pembasmi-slop': { zona: 'naskah', x: -5.2, z: -6.0 },
  'pemeriksa-fakta': { zona: 'naskah', x: -2.6, z: -6.0 },
  'sutradara-suara': { zona: 'suara', x: 0.4, z: -6.0 },
  'qa-suara': { zona: 'suara', x: 2.8, z: -6.0 },
  'penjaga-gerbang-qa': { zona: 'gerbang', x: 10.4, z: -6.0 },
  'akuntan-token': { zona: 'gerbang', x: 12.6, z: -6.0 },
  'penjadwal-notion': { zona: 'gerbang', x: 14.3, z: -6.0 },
  'pencari-skill': { zona: 'katalog', x: -12.6, z: 1.2 },
  animator: { zona: 'produksi', x: -8.6, z: 0.0 },
  storyboarder: { zona: 'produksi', x: -5.6, z: 0.0 },
  'inspektur-frame': { zona: 'produksi', x: -2.6, z: 0.0 },
  'desainer-cover': { zona: 'kreatif', x: 6.8, z: 0.0 },
  'penulis-caption': { zona: 'kreatif', x: 9.8, z: 0.0 },
};
export const MEJA_KETUA = { zona: 'direktur', x: 6.75, z: -6.2 };
export const PEMILIK_KURSI = { zona: 'lobi', x: -13.2, z: 7.0 };
// Meja cadangan untuk freelancer (empat meja; sisanya jadi kartu "+N").
export const MEJA_CADANGAN = [
  { zona: 'produksi', x: -8.6, z: 1.9 },
  { zona: 'produksi', x: -5.6, z: 1.9 },
  { zona: 'produksi', x: -2.6, z: 1.9 },
  { zona: 'produksi', x: -0.2, z: 1.9 },
];

// Titik masuk ruang (pintu kaca) untuk agent yang berjalan dari/ke mejanya. Zona terbuka memakai [x, z] lorong.
export const PINTU = {
  riset: [-11.4, -1.4], naskah: [-3.9, -1.4], suara: [1.5, -1.4], direktur: [5.0, -1.4], gerbang: [11.5, -1.4],
};
export const LORONG_Z = 3.5; // lorong utama yang memisahkan area kerja dan lounge/lobi
export const PINTU_MASUK = { x: -15.6, z: 7.6 }; // pintu kantor di dinding kiri (freelancer masuk)

// Tempat santai di lounge (satu per agent). hadap = sudut y (radian), 0 = menghadap kamera (+z).
export const LOUNGE = [
  { x: -3.1, z: 4.75, modus: 'duduk', hadap: 0 }, { x: -2.0, z: 4.75, modus: 'duduk', hadap: 0 }, { x: -0.9, z: 4.75, modus: 'duduk', hadap: 0 },
  { x: 3.4, z: 6.3, modus: 'duduk', hadap: 0.6 }, { x: 5.6, z: 6.3, modus: 'duduk', hadap: -0.6 },
  { x: 3.4, z: 7.7, modus: 'duduk', hadap: 2.5 }, { x: 5.6, z: 7.7, modus: 'duduk', hadap: -2.5 },
  { x: 8.8, z: 6.0, modus: 'berdiri', hadap: 0.3 }, { x: 10.2, z: 6.0, modus: 'berdiri', hadap: -0.3 },
  { x: 12.3, z: 5.7, modus: 'berdiri', hadap: 0 }, { x: 13.4, z: 5.7, modus: 'berdiri', hadap: -0.2 }, { x: 14.3, z: 5.7, modus: 'berdiri', hadap: 0.2 },
  { x: -5.0, z: 7.4, modus: 'berdiri', hadap: 0.5 }, { x: -3.9, z: 7.9, modus: 'berdiri', hadap: -0.5 },
  { x: -5.8, z: 8.2, modus: 'berdiri', hadap: 0.2 }, { x: -2.8, z: 8.4, modus: 'berdiri', hadap: -0.3 },
];

// Tahap pipeline → zona yang menyala di lantai.
export const TAHAP_ZONA = {
  naskah: 'naskah', suara: 'suara', dialog_ok: 'lobi', adegan: 'produksi', mix: 'suara', render_draf: 'produksi',
  qa_gerak: 'produksi', render: 'produksi', qa_final: 'produksi', kemasan: 'kreatif', video_ok: 'lobi', gerbang: 'gerbang',
};

// Garis alur produksi di lantai: lobi → riset → naskah → suara → produksi → kreatif → gerbang.
export const ALUR = [[-12, 5.6], [-11.4, 5.6], [-11.4, -1.4], [-3.9, -1.4], [1.5, -1.4], [1.5, 1.6], [11.5, 1.6], [11.5, -1.4]];

// Jalur jalan dari kursi/tempat `dari` ke `ke` lewat celah samping meja, pintu kaca, dan lorong utama.
// Hanya segmen lurus sumbu x atau z (murah dan rapi); tidak menembus meja (dijaga tests/tata.test.mjs).
const SISI = 0.95; // geser ke samping meja sebelum berjalan
const DALAM_Z = -3.2; // jalur di dalam ruang belakang, sebelum pintu
const sisiMeja = (t, p) => t.x + (p && p[0] < t.x ? -SISI : SISI);

function keluarMeja(t) {
  const p = PINTU[t.zona];
  const xs = sisiMeja(t, p);
  if (p) return [[xs, t.z], [xs, DALAM_Z], [p[0], DALAM_Z], [p[0], p[1]], [p[0], LORONG_Z]];
  return [[xs, t.z], [xs, LORONG_Z]];
}
function masukMeja(t) {
  const p = PINTU[t.zona];
  const xs = sisiMeja(t, p);
  if (p) return [[p[0], LORONG_Z], [p[0], p[1]], [p[0], DALAM_Z], [xs, DALAM_Z], [xs, t.z], [t.x, t.z]];
  return [[xs, LORONG_Z], [xs, t.z], [t.x, t.z]];
}
export function jalur(dari, ke) {
  const pts = dari.zona === 'lounge' ? [[dari.x, LORONG_Z]] : keluarMeja(dari);
  if (ke.zona === 'lounge') pts.push([ke.x, LORONG_Z], [ke.x, ke.z]);
  else pts.push(...masukMeja(ke));
  return pts;
}
