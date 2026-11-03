// Karakter chibi prosedural: kepala besar, badan kecil, outline hitam tebal, warna pastel.
// Dibuat baru mengikuti gaya acuan (lihat aset/karakter/katalog.yaml); seragam berwarna menurut fungsi.
import * as THREE from 'three';
import { badan, garis, toon } from './bahan.js';
import { gabungKarakter } from './gabung.js';

const KULIT = ['#F6D3B8', '#EBBE98', '#D79F78', '#BC8460'];
const RAMBUT = ['#3A2A22', '#1F1F29', '#6B3F25', '#B5651D', '#8E3B46', '#4A5B8A', '#C9A25B', '#D8D2C4'];
const celana = '#2E3445';
const sepatu = '#23232d';

const S = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
const lerp = (a, b, k) => a + (b - a) * k;

function bagianKaki(sx) {
  const pinggul = new THREE.Group();
  pinggul.position.set(sx * 0.12, 0.34, 0);
  const atas = badan(new THREE.CylinderGeometry(0.075, 0.07, 0.17, 10), celana, { t: 0.02 });
  atas.position.y = -0.085;
  pinggul.add(atas);
  const lutut = new THREE.Group();
  lutut.position.y = -0.17;
  const bawah = badan(new THREE.CylinderGeometry(0.07, 0.065, 0.15, 10), celana, { t: 0.02 });
  bawah.position.y = -0.075;
  const alas = badan(new THREE.BoxGeometry(0.17, 0.08, 0.25), sepatu, { t: 0.018 });
  alas.position.set(0, -0.15, 0.045);
  lutut.add(bawah, alas);
  pinggul.add(lutut);
  return { pinggul, lutut };
}

function bagianLengan(sx, warna, kulit) {
  const bahu = new THREE.Group();
  bahu.position.set(sx * 0.27, 0.74, 0);
  const atas = badan(new THREE.CapsuleGeometry(0.07, 0.1, 4, 8), warna, { t: 0.02 });
  atas.position.y = -0.1;
  bahu.add(atas);
  const siku = new THREE.Group();
  siku.position.y = -0.18;
  const bawah = badan(new THREE.CapsuleGeometry(0.062, 0.08, 4, 8), warna, { t: 0.02 });
  bawah.position.y = -0.09;
  const tangan = badan(S(0.07, 12, 8), kulit, { t: 0.02 });
  tangan.position.y = -0.2;
  siku.add(bawah, tangan);
  bahu.add(siku);
  return { bahu, siku, tangan };
}

function rambut(gaya, warna) {
  const g = new THREE.Group();
  const m = (geo, x = 0, y = 0, z = 0) => {
    const o = badan(geo, warna, { t: 0.026 });
    o.position.set(x, y, z);
    g.add(o);
    return o;
  };
  const topi = () => {
    const o = m(new THREE.SphereGeometry(0.455, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), 0, 0.03, -0.02);
    o.rotation.x = -0.12;
    return o;
  };
  const poni = (lebar = 0.62) => m(new THREE.BoxGeometry(lebar, 0.13, 0.12), 0, 0.27, 0.34).rotateX?.(0.35);
  switch (gaya) {
    case 1: // jabrik
      topi();
      for (let i = 0; i < 7; i++) {
        const a = (i / 6 - 0.5) * 2.2;
        const c = m(new THREE.ConeGeometry(0.11, 0.34, 8), Math.sin(a) * 0.3, 0.46 + Math.cos(a) * 0.04, 0.02 - Math.abs(a) * 0.05);
        c.rotation.z = -a * 0.55;
      }
      break;
    case 2: // panjang
      topi();
      poni();
      m(new THREE.BoxGeometry(0.86, 0.72, 0.18), 0, -0.2, -0.3);
      m(new THREE.BoxGeometry(0.14, 0.5, 0.16), -0.4, -0.08, 0.05);
      m(new THREE.BoxGeometry(0.14, 0.5, 0.16), 0.4, -0.08, 0.05);
      break;
    case 3: // cepol
      topi();
      poni(0.5);
      m(S(0.18, 14, 10), 0, 0.52, -0.06);
      break;
    case 4: // keriting
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        m(S(0.17, 12, 8), Math.cos(a) * 0.33, 0.2 + Math.sin(a * 2) * 0.05 + (i % 2) * 0.12, Math.sin(a) * 0.3 - 0.08);
      }
      m(S(0.2, 12, 8), 0, 0.42, 0);
      break;
    case 5: { // panjang + pita
      topi();
      poni();
      m(new THREE.BoxGeometry(0.86, 0.66, 0.18), 0, -0.17, -0.3);
      const pita = new THREE.Group();
      for (const s of [-1, 1]) {
        const c = badan(new THREE.ConeGeometry(0.1, 0.18, 4), '#D94662', { t: 0.02 });
        c.rotation.z = s * Math.PI / 2;
        c.position.x = s * 0.09;
        pita.add(c);
      }
      pita.position.set(0.28, 0.34, 0.25);
      g.add(pita);
      break;
    }
    case 6: // jambul
      topi();
      m(S(0.22, 14, 10), 0, 0.4, 0.2).scale.set(1.5, 0.75, 1.1);
      break;
    default: // rapi
      topi();
      poni(0.7);
  }
  return g;
}

export function buatKarakter(o = {}) {
  const warna = o.warna ?? '#294D82';
  const kulit = o.kulit ?? KULIT[0];
  const g = new THREE.Group();
  const akar = new THREE.Group();
  g.add(akar);

  const kakiK = bagianKaki(-1);
  const kakiR = bagianKaki(1);
  akar.add(kakiK.pinggul, kakiR.pinggul);

  const raga = badan(new THREE.CapsuleGeometry(0.2, 0.2, 4, 12), warna);
  raga.scale.set(1.06, 1, 0.8);
  raga.position.y = 0.58;
  akar.add(raga);

  // dasi (direktur, pemilik) atau lencana kuning kecil (yang lain)
  if (o.dasi) {
    const d = badan(new THREE.BoxGeometry(0.075, 0.24, 0.03), o.aksen ?? '#FFC400', { t: 0.014 });
    d.position.set(0, 0.6, 0.17);
    akar.add(d);
  } else {
    const l = badan(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 14), o.aksen ?? '#FFC400', { t: 0.012 });
    l.rotation.x = Math.PI / 2;
    l.position.set(-0.1, 0.67, 0.165);
    akar.add(l);
  }

  const lenganK = bagianLengan(-1, warna, kulit);
  const lenganR = bagianLengan(1, warna, kulit);
  akar.add(lenganK.bahu, lenganR.bahu);

  const kepala = new THREE.Group();
  kepala.position.y = 1.22;
  akar.add(kepala);
  const tengkorak = badan(S(0.42, 28, 18), kulit);
  tengkorak.scale.set(1, 0.94, 0.96);
  kepala.add(tengkorak);
  for (const s of [-1, 1]) {
    const t = badan(S(0.07, 10, 8), kulit, { t: 0.02 });
    t.position.set(s * 0.41, -0.02, 0);
    kepala.add(t);
    const pipi = new THREE.Mesh(S(0.065, 10, 8), toon('#F2A0A0'));
    pipi.scale.set(1.25, 0.75, 0.3);
    pipi.position.set(s * 0.25, -0.1, 0.355);
    kepala.add(pipi);
  }
  const mata = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(S(0.058, 10, 8), new THREE.MeshBasicMaterial({ color: '#1b1b24' }));
    e.scale.set(1, 1.35, 0.45);
    e.position.set(s * 0.15, 0.0, 0.385);
    kepala.add(e);
    mata.push(e);
  }
  const mulutDatar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.01), new THREE.MeshBasicMaterial({ color: '#1b1b24' }));
  mulutDatar.position.set(0, -0.15, 0.4);
  const mulutSenyum = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.014, 6, 14, Math.PI), new THREE.MeshBasicMaterial({ color: '#1b1b24' }));
  mulutSenyum.rotation.z = Math.PI;
  mulutSenyum.position.set(0, -0.12, 0.4);
  mulutSenyum.visible = false;
  kepala.add(mulutDatar, mulutSenyum);

  const hair = rambut(o.rambutGaya ?? 0, o.rambutWarna ?? RAMBUT[0]);
  kepala.add(hair);

  if (o.kacamata) {
    const bingkai = new THREE.MeshBasicMaterial({ color: '#1b1b24' });
    for (const s of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.014, 8, 18), bingkai);
      r.position.set(s * 0.15, 0, 0.4);
      kepala.add(r);
    }
    const j = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.014, 0.014), bingkai);
    j.position.set(0, 0.01, 0.4);
    kepala.add(j);
  }
  if (o.headphone) {
    const band = badan(new THREE.TorusGeometry(0.44, 0.03, 8, 24, Math.PI), '#2A2F3C', { t: 0.014 });
    band.rotation.z = 0;
    band.position.y = 0.02;
    kepala.add(band);
    for (const s of [-1, 1]) {
      const c = badan(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 14), o.aksen ?? '#FFC400', { t: 0.016 });
      c.rotation.z = Math.PI / 2;
      c.position.set(s * 0.44, -0.02, 0);
      kepala.add(c);
    }
  }
  if (o.tandaFreelancer) {
    const kartu = badan(new THREE.BoxGeometry(0.15, 0.2, 0.015), '#ffffff', { t: 0.012 });
    kartu.position.set(0.05, 0.5, 0.2);
    const tali = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.012), toon('#FFC400'));
    tali.position.set(0.05, 0.69, 0.18);
    tali.rotation.z = 0.25;
    akar.add(kartu, tali);
  }

  const sendi = {
    ul: [kakiK.pinggul, kakiR.pinggul], ll: [kakiK.lutut, kakiR.lutut],
    ua: [lenganK.bahu, lenganR.bahu], la: [lenganK.siku, lenganR.siku],
  };
  const kar = {
    group: g, akar, kepala, raga, sendi, mata, mulutDatar, mulutSenyum,
    tanganR: lenganR.tangan, tanganK: lenganK.tangan,
    seed: o.seed ?? Math.random() * 10,
    pose: { ul: [0, 0], ll: [0, 0], ua: [0, 0], la: [0, 0], y: 0, kx: 0, kz: 0 },
    mode: 'berdiri',
    senyum: false,
  };
  kar.set = (mode) => { kar.mode = mode; };
  gabungKarakter(kar);
  return kar;
}

// Sudut sendi target menurut mode. Karakter menghadap +z: ayunan ke depan = rotasi x negatif.
function sasaran(mode, t, seed) {
  const sw = Math.sin(t * 9 + seed);
  const napas = Math.sin(t * 1.6 + seed) * 0.02;
  switch (mode) {
    case 'jalan':
      return { ul: [-sw * 0.7, sw * 0.7], ll: [Math.max(0, sw) * 0.8, Math.max(0, -sw) * 0.8], ua: [sw * 0.6, -sw * 0.6], la: [-0.3, -0.3], y: Math.abs(sw) * 0.06, kx: 0.04, kz: sw * 0.03, senyum: false };
    case 'duduk-kerja': {
      const k = Math.sin(t * 13 + seed) * 0.12;
      return { ul: [-1.5, -1.5], ll: [1.5, 1.5], ua: [-0.85 + k, -0.85 - k], la: [-1.1, -1.1], y: -0.11, kx: 0.14 + Math.sin(t * 1.3 + seed) * 0.03, kz: 0, senyum: false };
    }
    case 'duduk-santai': {
      const minum = Math.max(0, Math.sin(t * 0.5 + seed)) ** 6;
      return { ul: [-1.5, -1.5], ll: [1.5, 1.5], ua: [-0.15, -0.35 - minum * 1.1], la: [-0.2, -0.4 - minum * 1.4], y: -0.11, kx: -0.04 + napas * 2, kz: Math.sin(t * 0.7 + seed) * 0.04, senyum: true };
    }
    case 'rayakan':
      return { ul: [0, 0], ll: [0, 0], ua: [-2.9, -2.9], la: [-0.2, -0.2], y: Math.abs(Math.sin(t * 7 + seed)) * 0.16, kx: -0.1, kz: Math.sin(t * 7 + seed) * 0.08, senyum: true };
    case 'angkat-tangan':
      return { ul: [-1.5, -1.5], ll: [1.5, 1.5], ua: [-0.2, -2.9 + Math.sin(t * 7) * 0.12], la: [-0.2, -0.3 + Math.sin(t * 7) * 0.5], y: -0.11, kx: -0.05, kz: 0.05, senyum: false };
    default: { // berdiri santai
      const lambai = Math.max(0, Math.sin(t * 0.45 + seed * 3)) ** 10;
      return { ul: [0, 0], ll: [0, 0], ua: [napas * 4, -0.1 - lambai * 2.6], la: [-0.1, -0.2 - lambai * 0.3 * Math.sin(t * 9)], y: napas, kx: 0, kz: Math.sin(t * 0.8 + seed) * 0.03, senyum: true };
    }
  }
}

export function perbarui(kar, t, dt) {
  const s = sasaran(kar.mode, t, kar.seed);
  const k = 1 - Math.exp(-dt * 14);
  const p = kar.pose;
  for (let i = 0; i < 2; i++) {
    for (const j of ['ul', 'll', 'ua', 'la']) {
      p[j][i] = lerp(p[j][i], s[j][i], k);
      kar.sendi[j][i].rotation.x = p[j][i];
    }
  }
  p.y = lerp(p.y, s.y, k);
  p.kx = lerp(p.kx, s.kx, k);
  p.kz = lerp(p.kz, s.kz, k);
  kar.akar.position.y = p.y;
  kar.kepala.rotation.x = p.kx;
  kar.kepala.rotation.z = p.kz;
  // kedip dan senyum
  const kedip = (t * 0.7 + kar.seed) % 4 > 3.88;
  for (const e of kar.mata) e.scale.y = kedip ? 0.12 : 1.35;
  kar.mulutSenyum.visible = s.senyum;
  kar.mulutDatar.visible = !s.senyum;
}

export const gayaKarakter = (i) => ({
  kulit: KULIT[(i * 3 + 1) % KULIT.length],
  rambutGaya: i % 7,
  rambutWarna: RAMBUT[(i * 5 + 2) % RAMBUT.length],
  kacamata: i % 4 === 1,
  seed: i * 1.7,
});

export { garis };
