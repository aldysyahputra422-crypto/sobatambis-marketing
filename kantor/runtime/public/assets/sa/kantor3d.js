// Kantor 3D Departemen Marketing Sobat Ambis. Membaca /kerja/api/state (roster, pemilik, pipeline, freelancers).
// Tanpa data nyata semua karakter santai di lounge; mode demo (?demo) memakai data contoh dengan spanduk jelas.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { badan, toon } from './bahan.js';
import { gabungKelompok } from './gabung.js';
import { buatKarakter, gayaKarakter, perbarui } from './karakter.js';
import { keadaanDemo, SKENARIO } from './demo.js';
import * as P from './perabot.js';
import {
  ALUR, jalur, LOUNGE, MEJA, MEJA_CADANGAN, MEJA_KETUA, PEMILIK_KURSI, PINTU, PINTU_MASUK, TAHAP_ZONA, ZONA, zonaDariNama,
} from './tata.js';
import { bangunUi } from './ui.js';

const API = '/kerja/api/state';
const POLL_MS = 3000;
const params = new URLSearchParams(location.search);
const DEMO = params.has('demo');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = document.getElementById('scene');

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
const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 400);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = 0.45;
controls.maxPolarAngle = 1.25;
controls.minDistance = 4;
controls.maxDistance = 230;
controls.screenSpacePanning = true;
const ARAH_LEBAR = new THREE.Vector3(0.45, 0.8, 1.0).normalize();
const ARAH_TEGAK = new THREE.Vector3(1.0, 0.85, 0.3).normalize(); // layar tegak: sumbu panjang kantor dibuat vertikal
let ARAH = ARAH_LEBAR.clone();
const potret = () => innerWidth / innerHeight < 0.8;
function aturArah() {
  ARAH = (potret() ? ARAH_TEGAK : ARAH_LEBAR).clone();
  const az = Math.atan2(ARAH.x, ARAH.z);
  controls.minAzimuthAngle = az - 0.9;
  controls.maxAzimuthAngle = az + 0.9;
}
const PUSAT = new THREE.Vector3(0, 0, 0.6);

const hemi = new THREE.HemisphereLight('#ffffff', '#b8c2d0', 1.0);
const matahari = new THREE.DirectionalLight('#fff6e8', 1.15);
matahari.position.set(-12, 24, 16);
matahari.castShadow = true;
matahari.shadow.mapSize.set(2048, 2048);
matahari.shadow.camera.left = -26;
matahari.shadow.camera.right = 26;
matahari.shadow.camera.top = 20;
matahari.shadow.camera.bottom = -20;
matahari.shadow.bias = -0.0006;
matahari.shadow.radius = 3;
scene.add(hemi, matahari);
const gelap = matchMedia('(prefers-color-scheme: dark)');
const tema = () => {
  hemi.intensity = gelap.matches ? 0.62 : 1.0;
  matahari.intensity = gelap.matches ? 0.8 : 1.15;
};
tema();
gelap.addEventListener?.('change', tema);

// ---------------------------------------------------------------- denah
const dunia = new THREE.Group();
scene.add(dunia);
const add = (o, x = 0, y = 0, z = 0, ry = 0) => {
  o.position.set(x, y, z);
  o.rotation.y = ry;
  dunia.add(o);
  return o;
};

// lantai dasar (potongan tebal ala diorama) dan lantai tiap zona
add(badan(new THREE.BoxGeometry(31, 0.5, 19), '#F5F7FA', { t: 0.03 }), 0, -0.25, 0);
const lantaiZona = {};
for (const [id, z] of Object.entries(ZONA)) {
  const [x0, z0, x1, z1] = z.rect;
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 - 0.12, 0.03, z1 - z0 - 0.12), toon(z.lantai));
  m.receiveShadow = true;
  add(m, (x0 + x1) / 2, 0.015, (z0 + z1) / 2);
  lantaiZona[id] = m;
}
// dinding belakang dan kiri (potongan; sisi depan dan kanan terbuka)
add(badan(new THREE.BoxGeometry(31, 3.6, 0.35), '#E6EBF2', { t: 0.03 }), 0, 1.8, -9.17);
add(badan(new THREE.BoxGeometry(0.35, 3.6, 19), '#E6EBF2', { t: 0.03 }), -15.17, 1.8, 0);
const jendelaMat = new THREE.MeshBasicMaterial({ color: '#CFE8F8' });
for (const x of [-12, -6, 0, 6, 12]) {
  const j = badan(new THREE.BoxGeometry(2.6, 1.4, 0.1), '#3A4252', { t: 0.015 });
  add(j, x, 2.1, -8.95);
  const kaca = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), jendelaMat);
  add(kaca, x, 2.1, -8.89);
}
add(P.pintuKantor(), -15.0, 0, PINTU_MASUK.z, Math.PI / 2);

// partisi kaca: depan ruang belakang (dengan celah pintu) dan sekat antarruang
const sekat = (x0, x1, doorX) => {
  const lebarPintu = 1.5;
  const a = [x0, doorX - lebarPintu / 2];
  const b = [doorX + lebarPintu / 2, x1];
  for (const [s, e] of [a, b]) if (e - s > 0.2) add(P.kaca(e - s), (s + e) / 2, 0, -2.0);
};
sekat(-15, -8, PINTU.riset[0]);
sekat(-8, -1, PINTU.naskah[0]);
sekat(-1, 4, PINTU.suara[0]);
sekat(4, 9.5, PINTU.direktur[0]);
sekat(9.5, 15, PINTU.gerbang[0]);
for (const x of [-8, -1, 4, 9.5]) add(P.kaca(7, 2.3, 'z'), x, 0, -5.5);

// meja kerja per agent
const meja = {};
const warnaFungsi = Object.fromEntries(roster.agents.map((a) => [a.agent, a.warna]));
function pasangMeja(id, pos, { warnaMeja = '#C99A6A', kursiWarna = '#3A4A6B', benda } = {}) {
  const k = P.kursi(kursiWarna);
  add(k, pos.x, 0, pos.z - 0.04);
  const m = P.meja({ warna: warnaMeja, layar: warnaFungsi[id] ?? '#294D82' });
  add(m.group, pos.x, 0, pos.z + 0.78);
  if (benda) {
    const b = P.benda(benda);
    b.position.copy(m.propSlot);
    m.group.add(b);
  }
  meja[id] = m;
  return m;
}
for (const a of roster.agents) pasangMeja(a.agent, MEJA[a.agent], { benda: a.benda, kursiWarna: a.warna });
pasangMeja('ketua', MEJA_KETUA, { warnaMeja: '#5B4636', kursiWarna: '#294D82', benda: roster.ketua.benda });
MEJA_CADANGAN.forEach((c, i) => pasangMeja(`cadangan${i}`, c, { warnaMeja: '#D8C3A5', kursiWarna: '#8A93A3' }));

// ruang direktur dan riset: rak, tanaman, papan
add(P.rakBuku(2.2), 7.6, 0, -8.7);
add(P.tanaman(1.2), 4.7, 0, -8.3);
add(P.tanaman(1.0), -14.3, 0, -8.3);
add(P.tanaman(1.0), 14.3, 0, -8.3);
// gudang katalog: loker
add(P.loker(6, 2.2), -14.55, 0, 0.9);
// busa akustik studio suara
['#2A9D8F', '#4FB8C4', '#2A9D8F', '#4FB8C4'].forEach((c, i) => add(badan(new THREE.BoxGeometry(0.9, 0.9, 0.12), c, { t: 0.014 }), -0.1 + i * 1.3, 2.2, -8.9));
// ruang kreatif: panel warna dan sofa
['#FFC400', '#4FB8C4', '#E98A4B', '#B39DDB'].forEach((c, i) => add(P.panelWarna(c, 0.12, 1.5, 1.2), 5.3 + i * 3.1, 0.75, -1.1));
add(P.sofa(2.2, '#4FB8C4'), 13.7, 0, 2.9, Math.PI);
add(P.tanaman(1.1), 14.5, 0, 0.6);
// lobi
add(P.resepsionis(), -12.6, 0, 4.75);
add(P.kursiTamu('#4FB8C4'), PEMILIK_KURSI.x, 0, PEMILIK_KURSI.z - 0.1);
add(P.kursiTamu('#E98A4B'), -10.8, 0, 7.9, -0.4);
add(P.meja_bundar(0.45, '#F2EFE8'), -12.0, 0, 8.3);
add(P.tanaman(1.2), -14.4, 0, 5.2);
const papan = P.papanStatus();
add(papan.group, -9.0, 0, 5.4);
const karpet = (x, z, r, warna) => add(badan(new THREE.CylinderGeometry(r, r, 0.025, 40), warna, { tanpaGaris: true, cast: false }), x, 0.04, z);
karpet(-12.5, 7.4, 2.2, '#FFD9A8');
// lounge
karpet(-2.0, 5.7, 2.3, '#FCD6B0');
add(P.sofa(2.8, '#E98A4B'), -2.0, 0, 4.55);
add(P.meja_bundar(0.5, '#F2EFE8'), -2.0, 0, 6.3);
karpet(4.5, 7.0, 2.1, '#D5EBD8');
add(P.meja_bundar(0.85), 4.5, 0, 7.0);
for (const s of LOUNGE.slice(3, 7)) add(P.bangku('#8CCB6B'), s.x, 0, s.z);
add(P.foosball(), 9.5, 0, 7.4);
add(P.pulauKopi(2.8), 13.2, 0, 6.7);
add(P.tanaman(1.3), -6.3, 0, 4.7);
add(P.tanaman(1.1), 14.5, 0, 8.4);
add(P.tanaman(1.0), 0.8, 0, 8.5);

// alur produksi di lantai (panah kuning) dan bingkai zona aktif
const panah = [];
{
  const geo = new THREE.ConeGeometry(0.22, 0.4, 3);
  geo.rotateX(-Math.PI / 2); // runcing ke +z
  let jarak = 0;
  for (let i = 1; i < ALUR.length; i++) {
    const [ax, az] = ALUR[i - 1];
    const [bx, bz] = ALUR[i];
    const len = Math.hypot(bx - ax, bz - az);
    const ang = Math.atan2(bx - ax, bz - az);
    for (let d = 0.5; d < len; d += 0.9) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#FFC400', transparent: true, opacity: 0.55 }));
      m.scale.set(1, 0.2, 1);
      m.position.set(ax + (Math.sin(ang) * d), 0.06, az + Math.cos(ang) * d);
      m.rotation.y = ang;
      m.userData.n = jarak++;
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

// label zona (callout seperti denah referensi)
for (const [id, z] of Object.entries(ZONA)) {
  const d = document.createElement('div');
  d.className = 'zona-label';
  d.textContent = z.nama;
  const o = new CSS2DObject(d);
  const [x0, , , z1] = z.rect;
  o.position.set(x0 + 0.5 + (id === 'lounge' ? 0 : 0), 0.05, z1 - 0.45);
  o.center.set(0, 1);
  dunia.add(o);
}

// perabot statis digabung per bahan (ratusan mesh → puluhan draw call); yang animasi ditandai dinamis atau bukan bahan toon
gabungKelompok(dunia);

// ---------------------------------------------------------------- aktor
const aktor = new Map();
const NAMA = {};
for (const a of roster.agents) NAMA[a.agent] = a;
let indeksGaya = 0;
const SKALA_KARAKTER = 1.3; // chibi dibesarkan agar terbaca di tampilan jauh; tinggi duduk disesuaikan di karakter.js

function labelEl(teks, warna) {
  const d = document.createElement('div');
  d.className = 'nama';
  d.style.setProperty('--w', warna);
  d.textContent = teks;
  return d;
}

function buatAktor(id, info, opsi = {}) {
  const kar = buatKarakter({ warna: info.warna, aksen: info.aksen ?? '#FFC400', dasi: opsi.dasi, headphone: info.agent && info.fungsi === 'suara', tandaFreelancer: opsi.freelancer, ...gayaKarakter(indeksGaya++), ...opsi.gaya });
  kar.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  kar.group.scale.setScalar(SKALA_KARAKTER);
  dunia.add(kar.group);
  const lab = new CSS2DObject(labelEl(info.label, info.warna));
  lab.position.set(0, 1.78, 0);
  kar.group.add(lab);
  lab.element.addEventListener('click', () => fokus(opsi.zona));
  const gel = document.createElement('div');
  gel.className = 'gelembung';
  gel.hidden = true;
  const gl = new CSS2DObject(gel);
  gl.position.set(0.25, 2.0, 0);
  gl.center.set(0, 1.25);
  kar.group.add(gl);
  const a = { id, kar, info, opsi, pos: [0, 0], jalur: [], tujuan: null, sasaran: null, state: null, gel, lab, ditempatkan: false, sampai: true, tSelesai: 0 };
  aktor.set(id, a);
  return a;
}

function taruh(a, x, z, hadap = 0) {
  a.pos = [x, z];
  a.kar.group.position.set(x, 0, z);
  a.kar.group.rotation.y = hadap;
}

function tujuMeja(a, instan) {
  const t = a.opsi.meja;
  a.sasaran = { ...t, hadap: 0, mode: a.opsi.modeKerja ?? 'duduk-kerja', modeLoncat: 'duduk-kerja' };
  mulaiJalan(a, a.sasaran, instan);
}
function tujuLounge(a, instan) {
  const s = a.opsi.lounge;
  a.sasaran = { x: s.x, z: s.z, zona: 'lounge', hadap: s.hadap, mode: s.modus === 'duduk' ? 'duduk-santai' : 'berdiri' };
  mulaiJalan(a, a.sasaran, instan);
}
function mulaiJalan(a, s, instan) {
  if (instan) {
    taruh(a, s.x, s.z, s.hadap);
    a.jalur = [];
    a.kar.mode = s.mode;
    a.sampai = true;
    return;
  }
  const dari = { x: a.pos[0], z: a.pos[1], zona: zonaTitik(a.pos[0], a.pos[1]) };
  a.jalur = jalur(dari, s);
  a.sampai = false;
  a.kar.mode = 'jalan';
}
function zonaTitik(x, z) {
  for (const [id, zz] of Object.entries(ZONA)) {
    const [x0, z0, x1, z1] = zz.rect;
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return id;
  }
  return null;
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
      a.kar.group.rotation.y = a.sasaran.hadap;
      a.kar.mode = a.sasaran.mode;
    }
    return;
  }
  a.pos = [a.pos[0] + (dx / jarak) * langkah, a.pos[1] + (dz / jarak) * langkah];
  a.kar.group.position.set(a.pos[0], 0, a.pos[1]);
  const sudut = Math.atan2(dx, dz);
  let d = sudut - a.kar.group.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  a.kar.group.rotation.y += d * Math.min(1, dt * 12);
}

// aktor tetap: Direktur, Pemilik, 16 agent
const direktur = buatAktor('ketua', { label: roster.ketua.label, warna: roster.ketua.warna, aksen: roster.ketua.aksen }, { dasi: true, meja: MEJA_KETUA, zona: 'direktur', gaya: { rambutGaya: 0, rambutWarna: '#3A2A22', kacamata: true, kulit: '#EBBE98' } });
tujuMeja(direktur, true);
const pemilik = buatAktor('pemilik', { label: roster.pemilik.label, warna: '#F4F5F7', aksen: roster.pemilik.aksen }, { dasi: true, zona: 'lobi', gaya: { rambutGaya: 0, rambutWarna: '#1F1F29', kacamata: false, kulit: '#EBBE98' } });
taruh(pemilik, PEMILIK_KURSI.x, PEMILIK_KURSI.z, 0);
pemilik.kar.mode = 'duduk-santai';
roster.agents.forEach((a, i) => {
  const ak = buatAktor(a.agent, a, { meja: MEJA[a.agent], lounge: LOUNGE[i % LOUNGE.length], zona: MEJA[a.agent].zona });
  tujuLounge(ak, true);
});

// freelancer (dari data lama): masuk lewat pintu ke meja cadangan, pulang lewat pintu
const flAktor = new Map();
function sinkronFreelancer(daftar) {
  const adaKunci = new Set();
  for (const f of daftar) {
    if (f.desk === null || f.desk === undefined || f.desk >= MEJA_CADANGAN.length) continue;
    adaKunci.add(f.key);
    if (!flAktor.has(f.key)) {
      const a = buatAktor(`fl:${f.key}`, { label: f.label, warna: '#FFFFFF', aksen: '#FFC400' }, { freelancer: true, meja: MEJA_CADANGAN[f.desk], zona: 'produksi' });
      taruh(a, PINTU_MASUK.x, PINTU_MASUK.z, Math.PI / 2);
      a.pos = [PINTU_MASUK.x + 0.3, PINTU_MASUK.z];
      const md = MEJA_CADANGAN[f.desk];
      a.jalur = [[-13.9, PINTU_MASUK.z], [-11.4, PINTU_MASUK.z], [-11.4, 3.5], [md.x + 0.95, 3.5], [md.x + 0.95, md.z], [md.x, md.z]];
      a.sasaran = { ...MEJA_CADANGAN[f.desk], hadap: 0, mode: 'duduk-kerja' };
      a.sampai = false;
      a.kar.mode = 'jalan';
      flAktor.set(f.key, a);
    }
  }
  for (const [k, a] of flAktor) {
    if (adaKunci.has(k)) continue;
    if (!a.pulang) {
      a.pulang = true;
      a.jalur = [[a.pos[0] + 0.95, a.pos[1]], [a.pos[0] + 0.95, 3.5], [-11.4, 3.5], [-11.4, PINTU_MASUK.z], [PINTU_MASUK.x - 0.4, PINTU_MASUK.z]];
      a.sasaran = { x: PINTU_MASUK.x, z: PINTU_MASUK.z, hadap: -Math.PI / 2, mode: 'berdiri', hapus: true };
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
  // pemilik
  const menunggu = d.pemilik?.state === 'menunggu';
  pemilik.kar.mode = menunggu ? 'angkat-tangan' : 'duduk-santai';
  pemilik.gel.hidden = !menunggu;
  pemilik.gel.textContent = menunggu ? `Aldy ditunggu: ${potong(d.pemilik.butuh, 90)}` : '';
  pemilik.gel.classList.toggle('penting', menunggu);
  // direktur
  const kerjaKetua = d.ketua?.state === 'bekerja';
  direktur.opsi.modeKerja = kerjaKetua ? 'duduk-kerja' : 'duduk-santai';
  if (direktur.sampai) direktur.kar.mode = direktur.opsi.modeKerja;
  direktur.sasaran.mode = direktur.opsi.modeKerja;
  direktur.gel.hidden = !kerjaKetua;
  direktur.gel.textContent = kerjaKetua ? (d.ketua.waiting_on > 0 ? `Menunggu ${d.ketua.waiting_on} agent` : 'Mengatur produksi') : '';
  meja.ketua.gambarLayar(kerjaKetua, roster.ketua.warna);
  // agent
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
    if (kerja) {
      a.tSelesai = 0;
      tujuMeja(a, pertama);
    } else if (selesai) {
      if (pertama) tujuMeja(a, true);
      if (a.sampai && a.sasaran && a.sasaran.zona !== 'lounge') a.kar.mode = 'rayakan';
    } else {
      tujuLounge(a, pertama);
    }
  }
  sinkronFreelancer(d.freelancers ?? []);
  // papan status, alur, bingkai zona
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
  const lebarPerlu = potret() ? 27 : 46;
  const jarak = Math.min(200, Math.max(34, lebarPerlu / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * a)));
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
  setKamera(new THREE.Vector3((x0 + x1) / 2, 0.6, (z0 + z1) / 2), Math.max(16, Math.max(x1 - x0, z1 - z0) * 1.5), durasi);
}

const ui = bangunUi({ roster, fokus, demo: DEMO, skenario: SKENARIO });

function ukuran() {
  const w = el.clientWidth;
  const h = el.clientHeight;
  renderer.setSize(w, h);
  label2d.setSize(w, h);
  // desktop: pusatkan kantor di area kiri panel (panel 340px + celah)
  const panel = w > 860 ? 364 : 0;
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

// ---------------------------------------------------------------- loop
const jam = new THREE.Clock();
let tLayar = 0;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, jam.getDelta());
  const t = jam.elapsedTime;
  for (const a of aktor.values()) {
    gerak(a, dt);
    perbarui(a.kar, t, dt);
  }
  // pemilik tetap di kursi; kursi menyala lewat cincin
  cincin.visible = terakhir?.pemilik?.state === 'menunggu';
  cincin.material.opacity = 0.5 + Math.sin(t * 5) * 0.3;
  cincin.scale.setScalar(1 + Math.sin(t * 5) * 0.06);
  // panah alur berdenyut berurutan
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
  labelsEl.classList.toggle('jauh', camera.position.distanceTo(controls.target) > 42);
  renderer.render(scene, camera);
  label2d.render(scene, camera);
}
const cincin = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.05, 32), new THREE.MeshBasicMaterial({ color: '#D94662', transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
cincin.rotation.x = -Math.PI / 2;
cincin.position.set(PEMILIK_KURSI.x, 0.07, PEMILIK_KURSI.z);
cincin.visible = false;
dunia.add(cincin);

// ---------------------------------------------------------------- data
let skenarioIdx = Number(params.get('skenario')) || 0;
let tGanti = 0;
async function ambil() {
  try {
    let d;
    if (DEMO) {
      d = keadaanDemo(roster, Date.now(), skenarioIdx);
    } else {
      const r = await fetch(API, { cache: 'no-store' });
      d = await r.json();
    }
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
function dekat(id, jarak = 8, durasi = 0.9) {
  const a = aktor.get(id);
  if (a) setKamera(new THREE.Vector3(a.pos[0], 1.1, a.pos[1]), jarak, durasi);
}
window.__kantor = { terapkan, aktor, scene, camera, controls, renderer, fokus, dekat, ambil };
window.__siap = true;
frame();
