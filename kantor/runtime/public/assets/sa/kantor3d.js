// Kantor 3D Departemen Marketing Sobat Ambis. Membaca /kerja/api/state (roster, pemilik, pipeline, freelancers).
// Denah dan gaya meniru poster "Italian Smart Office" (isometrik, lantai beton abu-abu, ruang kaca, lounge teal dan oranye);
// karakter dari lembar karakter teman pemilik (watak.js). Tanpa data nyata semua karakter santai di lounge;
// mode demo (?demo) memakai data contoh dengan spanduk jelas.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { canvasTekstur, perabotBadan } from './bahan.js';
import { keadaanDemo, SKENARIO } from './demo.js';
import { gabungKelompok } from './gabung.js';
import { buatKarakter, perbarui } from './karakter.js';
import * as P from './perabot.js';
import {
  ALUR, jalur, jalurKeluar, jalurMasuk, LOUNGE, MEJA, MEJA_CADANGAN, MEJA_KETUA, PEMILIK_KURSI, PINTU, PINTU_MASUK, TAHAP_ZONA, ZONA,
} from './tata.js';
import { bangunUi } from './ui.js';
import { WATAK, WATAK_FREELANCER } from './watak.js';

const API = '/kerja/api/state';
const POLL_MS = 3000;
const params = new URLSearchParams(location.search);
const DEMO = params.has('demo');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = document.getElementById('scene');
const W = P.W;

// ---------------------------------------------------------------- latar peta kota (seperti poster acuan)
function latarPeta(gelapMode) {
  const c = document.createElement('canvas');
  c.width = 1400;
  c.height = 1000;
  const g = c.getContext('2d');
  g.fillStyle = gelapMode ? '#161F33' : '#E6EAEE';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = gelapMode ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.85)';
  g.lineCap = 'round';
  let seed = 7;
  const acak = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 70; i++) {
    g.lineWidth = 2 + acak() * 12;
    g.beginPath();
    let x = acak() * c.width;
    let y = acak() * c.height;
    g.moveTo(x, y);
    const arah = acak() * Math.PI;
    for (let k = 0; k < 5; k++) {
      x += Math.cos(arah + (acak() - 0.5) * 0.9) * (80 + acak() * 160);
      y += Math.sin(arah + (acak() - 0.5) * 0.9) * (80 + acak() * 160);
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const url = `url(${c.toDataURL('image/png')})`;
  for (const e of [document.documentElement, document.body]) {
    e.style.backgroundImage = url;
    e.style.backgroundSize = 'cover';
    e.style.backgroundPosition = 'center';
  }
}
const gelap = matchMedia('(prefers-color-scheme: dark)');
latarPeta(gelap.matches);

// ---------------------------------------------------------------- renderer
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch {
  document.body.classList.add('no-webgl');
}
const roster = window.KANTOR?.roster ?? null;
if (!renderer || !roster) {
  document.getElementById('loading')?.remove();
  throw new Error('WebGL atau roster tidak tersedia');
}
const RINGAN = matchMedia('(pointer: coarse)').matches || innerWidth < 700; // HP: tanpa bayangan, piksel lebih hemat
renderer.setPixelRatio(Math.min(devicePixelRatio, RINGAN ? 1.5 : 2));
renderer.shadowMap.enabled = !RINGAN;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);
el.appendChild(renderer.domElement);
const labelsEl = document.getElementById('labels');
const label2d = new CSS2DRenderer({ element: labelsEl });

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(20, 1, 1, 700); // sudut sempit: mendekati proyeksi isometrik
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = 0.45;
controls.maxPolarAngle = 1.25;
controls.minDistance = 5;
controls.maxDistance = 330;
controls.screenSpacePanning = true;
const ARAH_LEBAR = new THREE.Vector3(0.62, 0.62, 0.62).normalize(); // isometrik dari sisi depan-kanan, elevasi sekitar 35 derajat
const ARAH_TEGAK = new THREE.Vector3(1.0, 0.85, 0.3).normalize(); // layar tegak: sumbu panjang kantor dibuat vertikal
let ARAH = ARAH_LEBAR.clone();
const potret = () => innerWidth / innerHeight < 0.8;
function aturArah() {
  ARAH = (potret() ? ARAH_TEGAK : ARAH_LEBAR).clone();
  const az = Math.atan2(ARAH.x, ARAH.z);
  controls.minAzimuthAngle = az - 0.9;
  controls.maxAzimuthAngle = az + 0.9;
}
const PUSAT = new THREE.Vector3(0, 0, 0);

const hemi = new THREE.HemisphereLight('#ffffff', '#aeb8c6', 1.05);
const matahari = new THREE.DirectionalLight('#fff4e4', 1.35);
matahari.position.set(-16, 34, 22);
matahari.castShadow = true;
matahari.shadow.mapSize.set(2048, 2048);
Object.assign(matahari.shadow.camera, { left: -32, right: 32, top: 26, bottom: -26, near: 1, far: 90 });
matahari.shadow.bias = -0.0005;
matahari.shadow.radius = 3;
scene.add(hemi, matahari);
const tema = () => {
  hemi.intensity = gelap.matches ? 0.65 : 1.05;
  matahari.intensity = gelap.matches ? 0.85 : 1.35;
  latarPeta(gelap.matches);
};
gelap.addEventListener?.('change', tema);

// ---------------------------------------------------------------- bangunan
const dunia = new THREE.Group();
scene.add(dunia);
const add = (o, x = 0, y = 0, z = 0, ry = 0) => {
  o.position.set(x, y, z);
  o.rotation.y = ry;
  dunia.add(o);
  return o;
};
const kotak = (w, h, d, warna, opsi) => perabotBadan(new THREE.BoxGeometry(w, h, d), warna, opsi);

// lantai: potongan tebal ala diorama, permukaan beton abu-abu terang bergaris panel
add(kotak(36.8, 0.5, 19.8, '#EEF0F3'), 0, -0.25, 0);
{
  const { tekstur } = canvasTekstur(2048, 1088, (g, w, h) => {
    g.fillStyle = '#D5DAE0';
    g.fillRect(0, 0, w, h);
    let seed = 11;
    const acak = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(${acak() > 0.5 ? '255,255,255' : '120,130,145'},${0.03 + acak() * 0.04})`;
      g.fillRect(acak() * w, acak() * h, 2 + acak() * 5, 2 + acak() * 5);
    }
    g.strokeStyle = 'rgba(110,120,135,.22)';
    g.lineWidth = 2;
    for (let x = 0; x <= 36; x += 3) { g.beginPath(); g.moveTo((x / 36) * w, 0); g.lineTo((x / 36) * w, h); g.stroke(); }
    for (let z = 0; z <= 19; z += 3) { g.beginPath(); g.moveTo(0, (z / 19) * h); g.lineTo(w, (z / 19) * h); g.stroke(); }
  });
  tekstur.anisotropy = 8;
  const lantai = new THREE.Mesh(new THREE.PlaneGeometry(36, 19), new THREE.MeshStandardMaterial({ map: tekstur, roughness: 0.88 }));
  lantai.rotation.x = -Math.PI / 2;
  lantai.position.y = 0.002;
  lantai.receiveShadow = true;
  dunia.add(lantai);
}

// dinding belakang: padat di atas ruang kaca, jendela besar di atas lantai produksi dan di sisi kanan
const TEMBOK = '#C3C9D1';
const TUTUP = '#ECEEF1';
function tembok(x0, x1, z, tinggi = 3.6, y0 = 0) {
  add(kotak(x1 - x0, tinggi, 0.5, TEMBOK), (x0 + x1) / 2, y0 + tinggi / 2, z);
  add(kotak(x1 - x0, 0.08, 0.56, TUTUP), (x0 + x1) / 2, y0 + tinggi + 0.04, z);
}
function temboksamping(z0, z1, x, tinggi = 3.6, y0 = 0) {
  add(kotak(0.5, tinggi, z1 - z0, TEMBOK), x, y0 + tinggi / 2, (z0 + z1) / 2);
  add(kotak(0.56, 0.08, z1 - z0, TUTUP), x, y0 + tinggi + 0.04, (z0 + z1) / 2);
}
const ZB = -9.75;
tembok(-18.25, -8, ZB);
tembok(-8, 1, ZB, 0.9);
add(P.jendelaBesar(9, 2.7), -3.5, 0.9, ZB + 0.2);
tembok(1, 14.8, ZB);
tembok(14.8, 18.25, ZB, 0.9);
add(P.jendelaBesar(3.45, 2.7), 16.5, 0.9, ZB + 0.2);
add(kotak(36.5, 0.08, 0.56, TUTUP), 0, 3.64, ZB); // pita atas tembok tidak menyisakan celah di atas jendela
temboksamping(-9.75, 5.9, -18.25);
temboksamping(8.5, 9.75, -18.25);
add(kotak(0.5, 1.1, 2.6, TEMBOK), -18.25, 3.05, 7.2);
add(P.pintuKantor(), -18.0, 0, PINTU_MASUK.z, Math.PI / 2);

// ruang kaca (depan dengan celah pintu, sekat antarruang)
const sekat = (zona) => {
  const [x0, , x1] = ZONA[zona].rect;
  const px = PINTU[zona][0];
  for (const [s, e] of [[x0, px - 0.75], [px + 0.75, x1]]) if (e - s > 0.2) add(P.kaca(e - s), (s + e) / 2, 0, -3.5);
};
['riset', 'naskah', 'suara', 'direktur', 'gerbang'].forEach(sekat);
for (const x of [-13, -8, 1, 5.6, 10.2, 14.8]) add(P.kaca(6, 2.5, 'z'), x, 0, -6.5);

// ---------------------------------------------------------------- meja kerja per agent
const meja = {};
const warnaFungsi = Object.fromEntries(roster.agents.map((a) => [a.agent, a.warna]));
function pasangMeja(id, pos, { atas = W.putih, kursiWarna = W.oranye, benda, eksekutif = false } = {}) {
  add(P.kursi(kursiWarna), pos.x, 0, pos.z - 0.04);
  const m = eksekutif ? P.mejaEksekutif() : P.meja({ atas, layar: warnaFungsi[id] ?? W.biru });
  add(m.group, pos.x, 0, pos.z + 0.78);
  if (benda) {
    const b = P.benda(benda);
    b.position.copy(m.propSlot);
    m.group.add(b);
  }
  meja[id] = m;
}
const warnaKursiZona = { riset: W.oranye, naskah: W.teal, produksi: W.oranye, suara: '#5B8DEF', gerbang: W.teal, kreatif: W.oranye, katalog: W.hijau };
const atasZona = { riset: W.kayu, naskah: W.putih, produksi: W.putih, suara: W.putih, gerbang: W.putih, kreatif: W.putih, katalog: W.kayu };
for (const a of roster.agents) {
  const m = MEJA[a.agent];
  pasangMeja(a.agent, m, { atas: atasZona[m.zona], kursiWarna: warnaKursiZona[m.zona], benda: a.benda });
}
pasangMeja('ketua', MEJA_KETUA, { eksekutif: true, kursiWarna: W.biru, benda: roster.ketua.benda });
MEJA_CADANGAN.forEach((c, i) => pasangMeja(`cadangan${i}`, c, { atas: W.putih, kursiWarna: '#8A93A3' }));

// ---------------------------------------------------------------- isi ruangan (posisi mengikuti poster acuan)
// ruang riset ("training"): papan tulis dan meja oval
add(P.papanTulis(), -15.65, 0, -9.4);
add(P.mejaOval(2.4, 1.1), -15.6, 0, -5.4);
[-1, 1].forEach((s) => add(P.kursi(W.oranye), -15.6 + s * 1.5, 0, -5.4, s * Math.PI / 2));
add(P.tanaman(1.1), -17.5, 0, -4.2);
// ruang naskah ("acoustic partition")
add(P.tanaman(1.0), -8.6, 0, -4.3);
add(P.rakBuku(2.0, 1.4), -10.7, 0, -9.45);
// lantai produksi: kapsul telepon ada di studio suara; deretan jendela di dinding belakang
add(P.tanaman(1.2), -0.2, 0, -9.0);
// studio suara
add(P.kapsul(), 4.9, 0, -5.1);
add(P.tanaman(1.0), 1.5, 0, -4.4);
// ruang direktur: rak buku dan kursi tamu
add(P.rakBuku(3.0, 2.2), 8.9, 0, -9.45);
add(P.kursiTamu(W.teal, false), 8.9, 0, -4.9, Math.PI);
add(P.tanaman(1.2), 6.1, 0, -9.0);
// ruang gerbang ("hybrid meeting")
add(P.mejaOval(1.6, 1.0, W.kayu), 11.4, 0, -5.4);
add(P.tanaman(1.0), 14.2, 0, -4.4);
// ruang kreatif ("coffice")
['#FFC400', W.teal, W.oranye].forEach((c, i) => add(kotak(1.3, 1.4, 0.08, c), 15.3 + i * 1.2, 0.7, -9.4));
add(P.kiosOranye(), 17.0, 0, -2.9);
// gudang katalog: dinding loker warna-warni
add(P.loker(4.4, 2.5), -8.0, 0, -0.85);
// lobi (resepsionis): karpet gelap, kursi oranye, meja bundar putih, sofa abu
add(P.karpet(6.6, 4.4, '#454B54'), -14.8, 0.012, 6.8);
add(P.resepsionis(), -11.3, 0, 4.75);
add(P.kursiOranye(), PEMILIK_KURSI.x, 0, PEMILIK_KURSI.z - 0.05);
add(P.kursiOranye(), -16.9, 0, 5.4, 0.6);
add(P.kursiOranye(), -12.7, 0, 8.3, -0.5);
add(P.mejaBundar(0.45, W.putih, 0.4), -15.4, 0, 8.2);
add(P.sofaL(2.0, 0.1, '#8F98A3'), -16.6, 0, 8.9, 0.2);
add(P.tanaman(1.2), -17.4, 0, 4.2);
const papan = P.papanStatus();
add(papan.group, -9.9, 0, 8.3, 0.7);
// lounge percakapan: kursi tamu teal bersandaran tinggi, kursi dan pouf oranye di atas karpet bundar gelap
add(P.karpet(4.6, 4.6, '#454B54', true), -1.2, 0.012, 6.2);
add(P.kursiTamu(W.teal, true), -5.4, 0, 6.4, 0.5);
add(P.kursiTamu(W.teal, true), -1.1, 0, 7.5, -0.5);
add(P.kursiOranye(), -1.9, 0, 5.0, 0.2);
add(P.kursiOranye(), -0.3, 0, 5.9, -0.3);
add(P.pouf(W.oranye), -2.6, 0, 6.6);
add(P.mejaBundar(0.4, W.putih, 0.7), -4.2, 0, 8.3);
add(P.tanaman(1.3), -6.6, 0, 4.7);
// dapur dan pulau
add(P.dapur(3.5), 2.75, 0, -0.9);
add(P.pulau(2.8), 3.0, 0, 3.4);
add(P.tanaman(1.1), 0.5, 0, -0.6);
// rak buku teal dan meja kolaborasi (kursi hijau)
add(P.rakBuku(3.4, 2.3), 7.4, 0, 2.8, Math.PI / 2);
add(P.mejaPanjang(4.0, 1.0, W.kayu, 3), 7.5, 0, 8.3);
// area santai: karpet gelap, sofa L teal, meja bundar putih, pouf hijau, foosball
add(P.karpet(7.4, 4.4, '#454B54'), 13.4, 0.012, 4.0);
add(P.sofaL(4.4, 2.4, W.teal), 12.2, 0, 1.9);
add(P.mejaBundar(0.55, W.putih, 0.75), 10.6, 0, 5.8);
add(P.bangku(W.hijau), 9.8, 0, 5.8);
add(P.bangku(W.hijau), 11.4, 0, 5.8);
add(P.mejaBundar(0.55, W.putih, 0.75), 15.7, 0, 5.9);
add(P.bangku(W.hijau), 15.7, 0, 6.8);
[[15.9, 3.9], [16.8, 4.7], [9.7, 3.6]].forEach(([x, z]) => add(P.pouf(W.hijau), x, 0, z));
add(P.foosball(), 15.2, 0, 8.4);
add(P.tanaman(1.2), 17.2, 0, 9.0);
add(P.tanaman(1.0), 0.8, 0, 8.7);
// meja baobab
add(P.baobab(), 14.8, 0, -0.3);

// alur produksi di lantai (panah kuning) dan bingkai zona aktif
const panah = [];
{
  const geo = new THREE.ConeGeometry(0.24, 0.45, 3);
  geo.rotateX(-Math.PI / 2); // runcing ke +z
  let urut = 0;
  for (let i = 1; i < ALUR.length; i++) {
    const [ax, az] = ALUR[i - 1];
    const [bx, bz] = ALUR[i];
    const len = Math.hypot(bx - ax, bz - az);
    const ang = Math.atan2(bx - ax, bz - az);
    for (let d = 0.6; d < len; d += 1.0) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#FFC400', transparent: true, opacity: 0.55 }));
      m.scale.set(1, 0.2, 1);
      m.position.set(ax + Math.sin(ang) * d, 0.06, az + Math.cos(ang) * d);
      m.rotation.y = ang;
      m.userData.n = urut++;
      dunia.add(m);
      panah.push(m);
    }
  }
}
const bingkaiZona = {};
for (const [id, z] of Object.entries(ZONA)) {
  const [x0, z0, x1, z1] = z.rect;
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: '#FFC400', transparent: true, opacity: 0.9 });
  const sisi = (w, d, x, zz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), mat);
    m.position.set(x, 0.05, zz);
    g.add(m);
  };
  sisi(x1 - x0 - 0.12, 0.1, (x0 + x1) / 2, z0 + 0.06);
  sisi(x1 - x0 - 0.12, 0.1, (x0 + x1) / 2, z1 - 0.06);
  sisi(0.1, z1 - z0 - 0.12, x0 + 0.06, (z0 + z1) / 2);
  sisi(0.1, z1 - z0 - 0.12, x1 - 0.06, (z0 + z1) / 2);
  g.visible = false;
  g.userData.mat = mat;
  dunia.add(g);
  bingkaiZona[id] = g;
}

// label zona bergaya callout poster: kotak bergaris tipis dengan garis penunjuk ke lantai
const JANGKAR = {
  riset: [-15.6, -3.6], naskah: [-10.5, -3.6], produksi: [-3.5, -3.6], suara: [3.3, -3.6], direktur: [7.9, -3.6], gerbang: [12.5, -3.6],
  kreatif: [16.4, -1.8], katalog: [-8.0, 3.0], lobi: [-14.8, 4.2], lounge: [6.0, 5.2],
};
for (const [id, z] of Object.entries(ZONA)) {
  const d = document.createElement('div');
  d.className = 'zona-label';
  const t = document.createElement('span');
  t.textContent = z.nama;
  d.append(t, document.createElement('i'));
  const o = new CSS2DObject(d);
  o.position.set(JANGKAR[id][0], 0.05, JANGKAR[id][1]);
  o.center.set(0.5, 1);
  dunia.add(o);
}

// perabot statis digabung per bahan (ribuan mesh menjadi puluhan draw call); yang berlayar/animasi tidak ikut
gabungKelompok(dunia);

// ---------------------------------------------------------------- aktor
const aktor = new Map();
const SKALA_KARAKTER = 1.3; // chibi dibesarkan agar terbaca; tinggi duduk disesuaikan di karakter.js
let indeks = 0;

function labelEl(teks, warna) {
  const d = document.createElement('div');
  d.className = 'nama';
  d.style.setProperty('--w', warna);
  d.textContent = teks;
  return d;
}

function buatAktor(id, watak, info, opsi = {}) {
  const kar = buatKarakter(watak, { seed: indeks++ * 1.7, tandaFreelancer: opsi.freelancer });
  kar.group.traverse((o) => { if (o.isMesh && !o.userData.garis) o.castShadow = true; });
  kar.group.scale.setScalar(SKALA_KARAKTER);
  dunia.add(kar.group);
  const lab = new CSS2DObject(labelEl(info.label, info.warna));
  lab.position.set(0, 1.95, 0);
  kar.group.add(lab);
  lab.element.addEventListener('click', () => fokus(opsi.zona));
  const gel = document.createElement('div');
  gel.className = 'gelembung';
  gel.hidden = true;
  const gl = new CSS2DObject(gel);
  gl.position.set(0.3, 1.95, 0);
  gl.center.set(0, 1.25);
  kar.group.add(gl);
  const a = { id, kar, info, opsi, pos: [0, 0], jalur: [], sasaran: null, tempat: null, antri: null, state: null, gel, lab, sampai: true };
  aktor.set(id, a);
  return a;
}

function taruh(a, x, z, hadap = 0) {
  a.pos = [x, z];
  a.kar.group.position.set(x, 0, z);
  a.kar.group.rotation.y = hadap;
}

function tujuMeja(a, instan) {
  mulaiJalan(a, { ...a.opsi.meja, hadap: 0, mode: a.opsi.modeKerja ?? 'duduk-kerja', tipe: 'meja' }, instan);
}
function tujuLounge(a, instan) {
  const s = a.opsi.lounge;
  mulaiJalan(a, { ...s, mode: s.modus === 'duduk' ? 'duduk-santai' : 'berdiri', tipe: 'lounge' }, instan);
}
function mulaiJalan(a, s, instan) {
  if (instan) {
    taruh(a, s.x, s.z, s.hadap);
    a.jalur = [];
    a.kar.mode = s.mode;
    a.sampai = true;
    a.tempat = s;
    a.sasaran = s;
    a.antri = null;
    return;
  }
  if (!a.sampai) { // sedang berjalan: selesaikan dulu, lalu menuju tujuan baru
    a.antri = s;
    return;
  }
  a.jalur = jalur(a.tempat, s.tipe === 'lounge' ? { ...s, zona: 'lounge' } : s);
  a.sasaran = s;
  a.sampai = false;
  a.kar.mode = 'jalan';
}

function gerak(a, dt) {
  if (a.sampai || !a.jalur.length) return;
  const [tx, tz] = a.jalur[0];
  const dx = tx - a.pos[0];
  const dz = tz - a.pos[1];
  const jarak = Math.hypot(dx, dz);
  const langkah = 2.6 * dt;
  if (jarak <= langkah) {
    taruh(a, tx, tz, a.kar.group.rotation.y);
    a.jalur.shift();
    if (!a.jalur.length) {
      a.sampai = true;
      a.tempat = a.sasaran;
      a.kar.group.rotation.y = a.sasaran.hadap ?? 0;
      a.kar.mode = a.sasaran.mode;
      if (a.antri) {
        const s = a.antri;
        a.antri = null;
        mulaiJalan(a, s, false);
      }
    }
    return;
  }
  a.pos = [a.pos[0] + (dx / jarak) * langkah, a.pos[1] + (dz / jarak) * langkah];
  a.kar.group.position.set(a.pos[0], 0, a.pos[1]);
  let d = Math.atan2(dx, dz) - a.kar.group.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  a.kar.group.rotation.y += d * Math.min(1, dt * 12);
}

// aktor tetap: Direktur, Pemilik, 16 agent (masing-masing dengan desain dari lembar karakter)
const direktur = buatAktor('ketua', WATAK.ketua, { label: roster.ketua.label, warna: roster.ketua.warna }, { meja: MEJA_KETUA, zona: 'direktur' });
tujuMeja(direktur, true);
const pemilik = buatAktor('pemilik', WATAK.pemilik, { label: roster.pemilik.label, warna: '#FFC400' }, { zona: 'lobi' });
taruh(pemilik, PEMILIK_KURSI.x, PEMILIK_KURSI.z, 0);
pemilik.kar.mode = 'duduk-santai';
roster.agents.forEach((a, i) => {
  const ak = buatAktor(a.agent, WATAK[a.agent], a, { meja: MEJA[a.agent], lounge: LOUNGE[i % LOUNGE.length], zona: MEJA[a.agent].zona });
  tujuLounge(ak, true);
});

// freelancer (dari data lama): masuk lewat pintu ke meja cadangan, pulang lewat pintu
const flAktor = new Map();
function sinkronFreelancer(daftar) {
  const ada = new Set();
  for (const f of daftar) {
    if (f.desk === null || f.desk === undefined || f.desk >= MEJA_CADANGAN.length) continue;
    ada.add(f.key);
    if (!flAktor.has(f.key)) {
      const md = MEJA_CADANGAN[f.desk];
      const a = buatAktor(`fl:${f.key}`, WATAK_FREELANCER[flAktor.size % WATAK_FREELANCER.length], { label: f.label, warna: '#FFFFFF' }, { freelancer: true, meja: md, zona: 'produksi' });
      taruh(a, PINTU_MASUK.x + 0.3, PINTU_MASUK.z, Math.PI / 2);
      a.jalur = jalurMasuk(md);
      a.sasaran = { ...md, hadap: 0, mode: 'duduk-kerja', tipe: 'meja' };
      a.sampai = false;
      a.kar.mode = 'jalan';
      flAktor.set(f.key, a);
    }
  }
  for (const [k, a] of flAktor) {
    if (ada.has(k)) continue;
    if (!a.pulang) {
      a.pulang = true;
      a.jalur = jalurKeluar(a.opsi.meja);
      a.sasaran = { x: PINTU_MASUK.x, z: PINTU_MASUK.z, hadap: -Math.PI / 2, mode: 'berdiri' };
      a.sampai = false;
      a.kar.mode = 'jalan';
    } else if (a.sampai) {
      dunia.remove(a.kar.group);
      aktor.delete(a.id);
      flAktor.delete(k);
    }
  }
}

// ---------------------------------------------------------------- penerapan data
let terakhir = null;
let pertama = true;
const potong = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s ?? '');

function terapkan(d) {
  terakhir = d;
  const menunggu = d.pemilik?.state === 'menunggu';
  pemilik.kar.mode = menunggu ? 'angkat-tangan' : 'duduk-santai';
  pemilik.gel.hidden = !menunggu;
  pemilik.gel.textContent = menunggu ? `Aldy ditunggu: ${potong(d.pemilik.butuh, 90)}` : '';
  pemilik.gel.classList.toggle('penting', menunggu);
  const kerjaKetua = d.ketua?.state === 'bekerja';
  direktur.opsi.modeKerja = kerjaKetua ? 'duduk-kerja' : 'duduk-santai';
  if (direktur.sampai) direktur.kar.mode = direktur.opsi.modeKerja;
  direktur.sasaran.mode = direktur.opsi.modeKerja;
  direktur.gel.hidden = !kerjaKetua;
  direktur.gel.textContent = kerjaKetua ? (d.ketua.waiting_on > 0 ? `Menunggu ${d.ketua.waiting_on} agent` : 'Mengatur produksi') : '';
  meja.ketua.gambarLayar(kerjaKetua, roster.ketua.warna);
  for (const r of d.roster ?? []) {
    const a = aktor.get(r.agent);
    if (!a) continue;
    const dulu = a.state;
    a.state = r.state;
    const kerja = r.state === 'bekerja';
    const selesai = r.state === 'selesai';
    a.lab.element.classList.toggle('diam', !kerja);
    a.gel.hidden = !(kerja || selesai);
    a.gel.textContent = kerja ? potong(r.run?.last?.[0]?.text || r.run?.task || '', 46) : selesai ? 'Beres!' : '';
    meja[r.agent]?.gambarLayar(kerja, r.warna);
    if (dulu === r.state && !pertama) continue;
    if (kerja) tujuMeja(a, pertama);
    else if (selesai) {
      if (pertama) tujuMeja(a, true);
      if (a.sampai && a.sasaran && a.sasaran.tipe === 'meja') a.kar.mode = 'rayakan';
    } else tujuLounge(a, pertama);
  }
  sinkronFreelancer(d.freelancers ?? []);
  papan.gambar(d.pipeline, d.pemilik);
  const aktif = menunggu ? 'lobi' : d.pipeline && d.pipeline.status !== 'siap posting' ? TAHAP_ZONA[d.pipeline.sekarang] : null;
  for (const [id, g] of Object.entries(bingkaiZona)) g.visible = id === aktif;
  pertama = false;
  ui.perbarui(d, fokus);
}

// ---------------------------------------------------------------- kamera
let anim = null;
function rumah() {
  const a = Math.max(0.3, (innerWidth - (innerWidth > 860 ? 364 : 0)) / innerHeight);
  const lebarPerlu = potret() ? 33 : 47;
  const jarak = Math.min(300, Math.max(42, lebarPerlu / (2 * Math.tan(THREE.MathUtils.degToRad(10)) * a)));
  return { target: PUSAT.clone(), jarak };
}
function setKamera(target, jarak, durasi = 0.9) {
  const dari = { t: controls.target.clone(), p: camera.position.clone() };
  const ke = { t: target.clone(), p: target.clone().add(ARAH.clone().multiplyScalar(jarak)) };
  if (REDUCED || durasi === 0) {
    controls.target.copy(ke.t);
    camera.position.copy(ke.p);
    return;
  }
  anim = { dari, ke, t: 0, durasi };
}
function fokus(zonaId, durasi = 0.9) {
  if (!zonaId || !ZONA[zonaId]) {
    const h = rumah();
    setKamera(h.target, h.jarak, durasi);
    return;
  }
  const [x0, z0, x1, z1] = ZONA[zonaId].rect;
  setKamera(new THREE.Vector3((x0 + x1) / 2, 0.6, (z0 + z1) / 2), Math.max(26, Math.max(x1 - x0, z1 - z0) * 2.6), durasi);
}
function dekat(id, jarak = 12, durasi = 0.9) {
  const a = aktor.get(id);
  if (a) setKamera(new THREE.Vector3(a.pos[0], 1.1, a.pos[1]), jarak, durasi);
}

const ui = bangunUi({ roster, fokus, demo: DEMO, skenario: SKENARIO });

function ukuran() {
  const w = el.clientWidth;
  const h = el.clientHeight;
  renderer.setSize(w, h);
  label2d.setSize(w, h);
  const panel = w > 860 ? 364 : 0; // desktop: pusatkan kantor di area kiri panel
  camera.aspect = (w - panel) / h;
  if (panel) camera.setViewOffset(w - panel, h, 0, 0, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
let sebelumPotret = potret();
addEventListener('resize', () => {
  ukuran();
  if (potret() !== sebelumPotret) {
    sebelumPotret = potret();
    aturArah();
    fokus(null, 0);
  }
});
ukuran();
aturArah();
{
  const h = rumah();
  setKamera(h.target, h.jarak, 0);
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Home' || e.key === '0') fokus(null);
});
tema();

// ---------------------------------------------------------------- loop
const jam = new THREE.Clock();
let tLayar = 0;
const cincin = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.05, 32), new THREE.MeshBasicMaterial({ color: '#D94662', transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
cincin.rotation.x = -Math.PI / 2;
cincin.position.set(PEMILIK_KURSI.x, 0.07, PEMILIK_KURSI.z);
cincin.visible = false;
dunia.add(cincin);

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, jam.getDelta());
  const t = jam.elapsedTime;
  for (const a of aktor.values()) {
    gerak(a, dt);
    perbarui(a.kar, t, dt);
  }
  cincin.visible = terakhir?.pemilik?.state === 'menunggu';
  cincin.material.opacity = 0.5 + Math.sin(t * 5) * 0.3;
  cincin.scale.setScalar(1 + Math.sin(t * 5) * 0.06);
  const maju = t * 6;
  for (const m of panah) {
    const k = ((m.userData.n - maju) % 12 + 12) % 12;
    m.material.opacity = 0.25 + Math.max(0, 1 - k / 6) * 0.65;
  }
  for (const g of Object.values(bingkaiZona)) if (g.visible) g.userData.mat.opacity = 0.55 + Math.sin(t * 4) * 0.35;
  tLayar += dt;
  if (tLayar > 0.35 && terakhir) {
    tLayar = 0;
    for (const r of terakhir.roster ?? []) if (r.state === 'bekerja') meja[r.agent]?.gambarLayar(true, r.warna, t);
  }
  if (anim) {
    anim.t += dt / anim.durasi;
    const k = Math.min(1, anim.t);
    const e = k * k * (3 - 2 * k);
    controls.target.lerpVectors(anim.dari.t, anim.ke.t, e);
    camera.position.lerpVectors(anim.dari.p, anim.ke.p, e);
    if (k >= 1) anim = null;
  }
  controls.update();
  labelsEl.classList.toggle('jauh', camera.position.distanceTo(controls.target) > 52);
  renderer.render(scene, camera);
  label2d.render(scene, camera);
}

// ---------------------------------------------------------------- data
let skenarioIdx = Number(params.get('skenario')) || 0;
async function ambil() {
  try {
    let d;
    if (DEMO) d = keadaanDemo(roster, Date.now(), skenarioIdx);
    else d = await (await fetch(API, { cache: 'no-store' })).json();
    ui.status(true);
    terapkan(d);
  } catch {
    ui.status(false);
  }
}
if (DEMO && !params.has('skenario')) {
  setInterval(() => {
    skenarioIdx++;
    ambil();
  }, 14000);
}
setInterval(() => { if (!document.hidden && !DEMO) ambil(); }, POLL_MS);
await ambil();
document.getElementById('loading')?.remove();
window.__kantor = { terapkan, aktor, scene, camera, controls, renderer, fokus, dekat, ambil };
window.__siap = true;
frame();
