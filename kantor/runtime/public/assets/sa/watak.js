// Desain karakter tiap agent, diambil dari lembar karakter chibi buatan teman pemilik (izin: aset/karakter/katalog.yaml).
// Satu desain = satu agent (personal branding): rambut, baju, dan ekspresi dipertahankan dari gambar.
// Posisi di lembar (baris, kolom) ditulis di `sumber`. Dua desain tambahan dibuat baru dengan gaya yang sama:
// Pemilik (Aldy) dan Pencari Skill (lembar hanya punya 16 desain untuk 18 kursi).
// Data murni (tanpa three.js) supaya bisa diuji di Node.

export const GAYA_RAMBUT = [
  'jambul', 'rapi', 'keriting-pigtail', 'jabrik', 'panjang-pita', 'acak-tunas', 'kepang-x', 'jambul-pirang', 'bob-poni',
  'afro-besar', 'bergelombang-bahu', 'keriting-topi', 'acak-antena', 'panjang-jamur', 'panjang-tengah', 'acak-jambul', 'poni-panjang', 'kupluk',
];
export const MATA = ['titik', 'bulat', 'senyum', 'x', 'sipit', 'kosong'];
export const MULUT = ['datar', 'senyum', 'gigi', 'ternganga', 'o', 'gigit', 'kecil'];
export const BAWAHAN = ['celana', 'celana-pendek', 'rok', 'rok-panjang', 'stoking'];

const KULIT = '#F7D6BD';
const HITAM = '#23232D';

export const WATAK = {
  ketua: {
    sumber: 'lembar baris 4 kolom 2',
    kulit: '#F2CDB0', hidung: '#F2B48A', pipi: '#F29B6B',
    rambut: { gaya: 'jambul', warna: '#2B2F3F' },
    mata: 'titik', mulut: 'datar',
    baju: { atas: '#F4F4F8', lengan: '#F4F4F8', rompi: '#6C7185', dasi: '#F29B2E' },
    bawah: { jenis: 'celana', warna: HITAM }, sepatu: HITAM,
  },
  pemilik: {
    sumber: 'desain baru (Aldy), gaya lembar',
    kulit: '#EBBE98', hidung: '#E39B66', pipi: '#F29B8E',
    rambut: { gaya: 'rapi', warna: '#1F1F29' },
    mata: 'titik', mulut: 'senyum',
    baju: { atas: '#F4F5F8', lengan: '#F4F5F8', rompi: '#294D82', dasi: '#FFC400' },
    bawah: { jenis: 'celana', warna: '#1F2430' }, sepatu: '#1F2430',
  },
  'sutradara-suara': {
    sumber: 'lembar baris 1 kolom 1',
    kulit: KULIT, hidung: '#F2A25C', pipi: '#F59BB8',
    rambut: { gaya: 'keriting-pigtail', warna: '#8C2F5B' },
    mata: 'senyum', mulut: 'gigi',
    baju: { atas: '#F3E3C9', lengan: '#F3E3C9', rompi: '#E88B3C', pinafore: true },
    bawah: { jenis: 'rok', warna: '#E88B3C' }, kaki: HITAM, sepatu: HITAM,
  },
  animator: {
    sumber: 'lembar baris 1 kolom 2',
    kulit: KULIT, hidung: '#F2A25C', pipi: null, bayangMata: '#8C6BD0',
    rambut: { gaya: 'jabrik', warna: '#35B5C9', petir: '#FFE066' },
    mata: 'bulat', mulut: 'o',
    baju: { atas: '#8F7FC8', lengan: '#8F7FC8', rompi: '#2E2A3F' },
    bawah: { jenis: 'celana', warna: HITAM }, sepatu: HITAM,
  },
  storyboarder: {
    sumber: 'lembar baris 1 kolom 3',
    kulit: KULIT, hidung: '#F2A25C', pipi: '#F6B8B0',
    rambut: { gaya: 'panjang-pita', warna: '#C99486', pita: '#D94662' },
    mata: 'titik', mulut: 'o',
    baju: { atas: '#3FA7B5', lengan: '#3FA7B5', ruffle: '#2E9E8A' },
    bawah: { jenis: 'celana', warna: HITAM }, sepatu: HITAM,
  },
  'pembasmi-slop': {
    sumber: 'lembar baris 1 kolom 4',
    kulit: KULIT, hidung: null, pipi: '#F6B8B0',
    rambut: { gaya: 'acak-tunas', warna: '#4B4540' },
    mata: 'sipit', mulut: 'ternganga', lidah: '#F5A623',
    baju: { atas: '#F4F4F8', lengan: '#C9C3E8' },
    bawah: { jenis: 'celana', warna: HITAM }, sepatu: HITAM,
  },
  'perencana-konten': {
    sumber: 'lembar baris 2 kolom 1',
    kulit: KULIT, hidung: '#F2A25C', pipi: '#F28F8F',
    rambut: { gaya: 'kepang-x', warna: '#D2692F', jepit: '#FFFFFF' },
    mata: 'senyum', mulut: 'senyum',
    baju: { atas: '#2F7EA6', lengan: '#2F7EA6', kerah: '#BFD9EA' },
    bawah: { jenis: 'stoking', warna: HITAM }, sepatu: '#8B5A3C',
  },
  'penulis-caption': {
    sumber: 'lembar baris 2 kolom 2',
    kulit: KULIT, hidung: null, pipi: '#F6B8B0',
    rambut: { gaya: 'jambul-pirang', warna: '#F0A640' },
    mata: 'x', mulut: 'o',
    baju: { atas: '#6BAF4F', lengan: '#6BAF4F', garis: '#1F6B5A' },
    bawah: { jenis: 'celana-pendek', warna: '#8B5A3C' }, kaki: '#2E8B8B', sepatu: HITAM,
  },
  'qa-suara': {
    sumber: 'lembar baris 2 kolom 3',
    kulit: KULIT, hidung: '#F2A25C', pipi: '#F6C0B8',
    rambut: { gaya: 'bob-poni', warna: '#EDEAF5' },
    mata: 'titik', mulut: 'datar',
    baju: { atas: '#F5F3FA', lengan: '#F5F3FA', bahuTerbuka: true },
    bawah: { jenis: 'rok-panjang', warna: '#8E6FD6' }, sepatu: HITAM,
  },
  'penulis-naskah': {
    sumber: 'lembar baris 2 kolom 4',
    kulit: KULIT, hidung: null, pipi: '#F6B8B0',
    rambut: { gaya: 'bergelombang-bahu', warna: '#7B4A5C' },
    mata: 'titik', mulut: 'senyum', kacamata: '#3A3A44',
    baju: { atas: '#F1E6D2', lengan: '#F1E6D2', tali: '#3E4452' },
    bawah: { jenis: 'rok', warna: '#3E4452' }, kaki: HITAM, sepatu: HITAM,
  },
  'desainer-cover': {
    sumber: 'lembar baris 3 kolom 1',
    kulit: KULIT, hidung: null, pipi: '#F6B8B0', bintik: true,
    rambut: { gaya: 'keriting-topi', warna: '#F4A92E' },
    mata: 'titik', mulut: 'datar',
    baju: { atas: '#3D8FD0', lengan: 'kulit', kerah: '#2D6FA8' },
    bawah: { jenis: 'celana', warna: HITAM }, sepatu: HITAM,
  },
  'penjaga-gerbang-qa': {
    sumber: 'lembar baris 3 kolom 2',
    kulit: KULIT, hidung: '#F2A25C', pipi: '#F6C0B8',
    rambut: { gaya: 'acak-antena', warna: '#5A5B45' },
    mata: 'sipit', mulut: 'datar',
    baju: { atas: '#7BA3C9', lengan: '#C8587F', rompi: '#C8587F' },
    bawah: { jenis: 'celana', warna: HITAM }, sepatu: HITAM,
  },
  'periset-tren': {
    sumber: 'lembar baris 3 kolom 3',
    kulit: KULIT, hidung: '#F2A25C', pipi: '#F6B8B0', bintik: true,
    rambut: { gaya: 'panjang-jamur', warna: '#8A5A3B', jamur: '#E87070' },
    mata: 'titik', mulut: 'kecil',
    baju: { atas: '#D9A66F', lengan: '#D9A66F', celemek: '#6FA8DC', saku: '#F29B2E' },
    bawah: { jenis: 'rok-panjang', warna: '#6FA8DC' }, sepatu: '#6B4A3A',
  },
  'penjadwal-notion': {
    sumber: 'lembar baris 3 kolom 4',
    kulit: KULIT, hidung: null, pipi: '#F59BB8',
    rambut: { gaya: 'panjang-tengah', warna: '#D9D4C7' },
    mata: 'titik', mulut: 'datar',
    baju: { atas: '#B6B1E8', lengan: '#B6B1E8', kerah: '#F1EFFA' },
    bawah: { jenis: 'celana', warna: '#A9C7EE' }, sepatu: '#6E7FB0',
  },
  'pemeriksa-fakta': {
    sumber: 'lembar baris 4 kolom 1',
    kulit: KULIT, hidung: null, pipi: '#F28F8F',
    rambut: { gaya: 'afro-besar', warna: '#F28E3C' },
    mata: 'titik', mulut: 'gigit', kacamata: '#7B5BD6',
    baju: { atas: '#3E9AA8', lengan: '#3E9AA8', syal: ['#6BAF4F', '#3E9AA8'] },
    bawah: { jenis: 'celana', warna: HITAM }, sepatu: '#F2873C',
  },
  'inspektur-frame': {
    sumber: 'lembar baris 4 kolom 3',
    kulit: KULIT, hidung: null, pipi: '#F6C0B8',
    rambut: { gaya: 'acak-jambul', warna: '#9A6A45' },
    mata: 'kosong', mulut: 'kecil',
    baju: { atas: '#8CC152', lengan: '#8CC152', kerah: '#FFFFFF', hati: HITAM },
    bawah: { jenis: 'celana', warna: HITAM }, sepatu: HITAM,
  },
  'akuntan-token': {
    sumber: 'lembar baris 4 kolom 4',
    kulit: '#F5E0CE', hidung: null, pipi: null,
    rambut: { gaya: 'poni-panjang', warna: '#1F1F29' },
    mata: 'x', mulut: 'datar',
    baju: { atas: '#C7C9F2', lengan: '#C7C9F2', lilit: '#F5F5F5' },
    bawah: { jenis: 'celana-pendek', warna: HITAM }, kaki: '#EDEDF5', sepatu: HITAM,
  },
  'pencari-skill': {
    sumber: 'desain baru, gaya lembar',
    kulit: '#D79F78', hidung: '#C98757', pipi: '#E8907E',
    rambut: { gaya: 'kupluk', warna: '#294D82', bobble: '#FFC400' },
    mata: 'titik', mulut: 'senyum',
    baju: { atas: '#E98A4B', lengan: '#E98A4B', kerah: '#F8D8B8' },
    bawah: { jenis: 'celana', warna: '#3A4252' }, sepatu: '#2A2F3C',
  },
};

// Freelancer: tidak punya desain sendiri; variasi sederhana berkartu pengenal (diputar bergantian).
export const WATAK_FREELANCER = [
  { sumber: 'freelancer', kulit: KULIT, hidung: '#F2A25C', pipi: '#F6B8B0', rambut: { gaya: 'rapi', warna: '#6B3F25' }, mata: 'titik', mulut: 'senyum', baju: { atas: '#FFFFFF', lengan: '#FFFFFF', kerah: '#E3E7EE' }, bawah: { jenis: 'celana', warna: '#4A5163' }, sepatu: HITAM },
  { sumber: 'freelancer', kulit: '#EBBE98', hidung: '#E39B66', pipi: '#F29B8E', rambut: { gaya: 'bob-poni', warna: '#3A2A22' }, mata: 'titik', mulut: 'senyum', baju: { atas: '#FFFFFF', lengan: '#FFFFFF', kerah: '#E3E7EE' }, bawah: { jenis: 'rok', warna: '#4A5163' }, kaki: HITAM, sepatu: HITAM },
];

export const pasti = (id) => WATAK[id] ?? WATAK.pemilik;
