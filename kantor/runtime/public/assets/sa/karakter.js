// Karakter chibi prosedural dari data `watak.js` (desain lembar karakter teman pemilik): kepala besar, kaki dan lengan
// tipis, outline gelap, warna pastel. Setiap agent punya rambut, baju, dan ekspresi sendiri.
import * as THREE from 'three';
import { badan, toon } from './bahan.js';
import { gabungKarakter } from './gabung.js';

const S = (r, w = 18, h = 12) => new THREE.SphereGeometry(r, w, h);
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const C = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg);
const lerp = (a, b, k) => a + (b - a) * k;
const HITAM = '#1b1717';
const dasar = () => new THREE.MeshBasicMaterial({ color: HITAM });

const PINGGUL = 0.42;
const KEPALA_Y = 1.26;
const RX = 0.5; // jari-jari kepala (lebar)
const RY = 0.44;
const RZ = 0.44;

function pasang(g, o, x = 0, y = 0, z = 0, rot) {
  o.position.set(x, y, z);
  if (rot) o.rotation.set(...rot);
  g.add(o);
  return o;
}

// ------------------------------------------------------------------ rambut
function rambut(spec) {
  const w = spec.warna;
  const g = new THREE.Group();
  const m = (geo, x = 0, y = 0, z = 0, sk = [1, 1, 1], rot = [0, 0, 0], warna = w, bergaris = true) => {
    const o = badan(geo, warna, { t: 0.026, tanpaGaris: !bergaris });
    o.scale.set(...sk);
    return pasang(g, o, x, y, z, rot);
  };
  const topi = (liputan = 0.54, naik = 0.03) => m(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * liputan), 0, naik, -0.02, [RX + 0.03, RY + 0.03, RZ + 0.03], [-0.1, 0, 0]);
  const poni = (lebar, y, z, tinggi = 0.15, rotX = 0.35, miring = 0) => m(new THREE.CapsuleGeometry(tinggi * 0.62, Math.max(0.02, lebar - tinggi * 1.24), 4, 10), 0, y, z, [1, 1, 1], [rotX, 0, Math.PI / 2 + miring], w, false);
  const pan = (x, y, z, w, h, d, rot = [0, 0, 0]) => m(S(1, 18, 12), x, y, z, [w / 2, h / 2, d / 2], rot);
  switch (spec.gaya) {
    case 'jambul': // pompadour tinggi, rapi
      topi(0.42, 0.0);
      m(S(0.3), 0, 0.56, 0.12, [1.55, 1.25, 1.35], [-0.5, 0, 0]);
      m(S(0.15), 0, 0.62, 0.4, [1.5, 1, 0.9], [-0.6, 0, 0]);
      for (const s of [-1, 1]) pan(s * 0.46, -0.08, 0.1, 0.1, 0.24, 0.12);
      break;
    case 'rapi':
      topi();
      poni(0.72, 0.27, 0.36);
      pan(-0.3, 0.28, 0.37, 0.18, 0.12, 0.12, [0.3, 0, -0.4]);
      break;
    case 'keriting-pigtail': // gelombang besar di sisi, poni rata
      topi();
      poni(0.84, 0.28, 0.37, 0.17);
      m(S(0.3), 0, 0.4, -0.04, [1.3, 0.65, 1.1]);
      for (const s of [-1, 1]) {
        m(S(0.26), s * 0.52, -0.08, -0.02, [1, 1.15, 1]);
        m(S(0.21), s * 0.5, -0.34, 0);
        m(S(0.17), s * 0.4, -0.52, 0.02);
      }
      break;
    case 'jabrik': { // duri tegak, ada petir
      topi(0.46);
      for (let i = 0; i < 9; i++) {
        const a = (i / 8 - 0.5) * 2.7;
        m(new THREE.ConeGeometry(0.12, 0.42, 8), Math.sin(a) * 0.38, 0.42 + Math.cos(a) * 0.1, -0.03 - Math.abs(a) * 0.05, [1, 1, 1], [0, 0, -a * 0.75]);
      }
      if (spec.petir) {
        const bolt = new THREE.Shape();
        bolt.moveTo(0, 0.2); bolt.lineTo(-0.07, 0.02); bolt.lineTo(0.0, 0.02); bolt.lineTo(-0.05, -0.18); bolt.lineTo(0.09, 0.05); bolt.lineTo(0.01, 0.05); bolt.closePath();
        const p = new THREE.Mesh(new THREE.ShapeGeometry(bolt), new THREE.MeshBasicMaterial({ color: spec.petir, side: THREE.DoubleSide }));
        p.position.set(-0.08, 0.5, 0.33);
        g.add(p);
      }
      break;
    }
    case 'panjang-pita': {
      topi();
      poni(0.9, 0.27, 0.36, 0.16, 0.3, 0.12);
      pan(0, -0.3, -0.3, 1.02, 0.95, 0.22);
      for (const s of [-1, 1]) pan(s * 0.49, -0.2, 0.08, 0.15, 0.62, 0.3);
      if (spec.pita) {
        const pita = new THREE.Group();
        for (const s of [-1, 1]) {
          const c = badan(new THREE.ConeGeometry(0.11, 0.22, 4), spec.pita, { t: 0.02 });
          c.rotation.z = s * Math.PI / 2;
          c.position.x = s * 0.11;
          pita.add(c);
        }
        pita.add(badan(S(0.06), spec.pita, { t: 0.018 }));
        pasang(g, pita, 0.3, 0.42, 0.25);
      }
      break;
    }
    case 'acak-tunas': // acak, ada tunas di atas
      topi();
      pan(-0.27, 0.26, 0.37, 0.34, 0.14, 0.12, [0.3, 0, 0.3]);
      pan(0.02, 0.3, 0.39, 0.34, 0.14, 0.12, [0.4, 0, -0.05]);
      pan(0.3, 0.25, 0.36, 0.3, 0.14, 0.12, [0.3, 0, -0.4]);
      for (const s of [-1, 1]) m(S(0.17), s * 0.47, 0.08, -0.04);
      m(C(0.02, 0.02, 0.3, 6), 0.02, 0.62, 0, [1, 1, 1], [0, 0, 0.35]);
      m(S(0.06), 0.1, 0.78, 0, [1.5, 0.8, 1], [0, 0, 0.4], '#6BAF4F');
      break;
    case 'kepang-x': { // dua kepang dan jepit X
      topi();
      poni(0.74, 0.27, 0.36);
      for (const s of [-1, 1]) {
        for (let k = 0; k < 3; k++) m(S(0.12 - k * 0.012), s * 0.54, -0.2 - k * 0.19, -0.02, [1, 1.15, 1]);
        m(S(0.06), s * 0.54, -0.8, -0.02, [1, 1, 1], [0, 0, 0], '#7A3A2A');
      }
      for (const r of [0.78, -0.78]) m(B(0.17, 0.035, 0.02), 0.27, 0.2, 0.42, [1, 1, 1], [0, 0, r], spec.jepit);
      break;
    }
    case 'jambul-pirang': // jambul melengkung di atas
      topi();
      m(new THREE.ConeGeometry(0.12, 0.34, 8), -0.2, 0.5, 0.1, [1, 1, 1], [0, 0, 0.5]);
      m(new THREE.ConeGeometry(0.12, 0.38, 8), 0.0, 0.56, 0.14, [1, 1, 1], [0.1, 0, 0.1]);
      m(new THREE.ConeGeometry(0.12, 0.34, 8), 0.22, 0.5, 0.08, [1, 1, 1], [0, 0, -0.5]);
      m(new THREE.ConeGeometry(0.1, 0.3, 8), -0.05, 0.4, 0.34, [1, 1, 1], [1.1, 0, 0]);
      for (const s of [-1, 1]) m(new THREE.ConeGeometry(0.1, 0.26, 8), s * 0.48, 0.2, -0.04, [1, 1, 1], [0, 0, -s * 1.1]);
      break;
    case 'bob-poni': // bob lurus dengan poni rata
      topi(0.56);
      poni(0.94, 0.2, 0.37, 0.22, 0.2);
      for (const s of [-1, 1]) pan(s * 0.51, -0.14, 0, 0.15, 0.72, 0.56);
      pan(0, -0.14, -0.33, 1.02, 0.72, 0.2);
      break;
    case 'afro-besar': { // awan rambut besar
      m(S(0.52), 0, 0.2, -0.1, [1.15, 1.05, 1]);
      const bola = [[0, 0.62, 0.02], [-0.4, 0.5, 0.02], [0.4, 0.5, 0.02], [-0.6, 0.2, -0.02], [0.6, 0.2, -0.02], [-0.58, -0.12, -0.1], [0.58, -0.12, -0.1], [-0.2, 0.62, -0.22], [0.2, 0.62, -0.22], [0, 0.3, -0.5], [-0.3, 0.52, 0.22], [0.3, 0.52, 0.22]];
      for (const [x, y, z] of bola) m(S(0.25), x, y, z);
      break;
    }
    case 'bergelombang-bahu': // gelombang sebahu
      topi();
      poni(0.7, 0.27, 0.36, 0.14, 0.3);
      for (const s of [-1, 1]) {
        m(S(0.22), s * 0.52, -0.02, 0);
        m(S(0.2), s * 0.52, -0.26, -0.02);
        m(S(0.17), s * 0.46, -0.48, -0.02);
      }
      m(S(0.42), 0, -0.1, -0.32, [1.2, 1.2, 0.8]);
      break;
    case 'keriting-topi': // keriting di atas kepala
      for (const [x, y, z] of [[0, 0.5, 0.02], [-0.3, 0.44, 0.02], [0.3, 0.44, 0.02], [-0.16, 0.48, 0.2], [0.16, 0.48, 0.2], [-0.46, 0.22, -0.04], [0.46, 0.22, -0.04], [-0.2, 0.5, -0.18], [0.2, 0.5, -0.18], [0, 0.3, -0.38]]) m(S(0.2), x, y, z);
      m(S(0.44), 0, 0.12, -0.12, [1.05, 0.9, 1]);
      m(S(0.09), -0.38, 0.4, 0.28, [1, 1.2, 1]);
      break;
    case 'acak-antena': // acak dengan satu helai tegak
      topi();
      poni(0.7, 0.27, 0.36, 0.14, 0.3);
      m(C(0.02, 0.02, 0.3, 6), 0.05, 0.62, 0, [1, 1, 1], [0, 0, 0.5]);
      m(C(0.02, 0.02, 0.2, 6), 0.19, 0.76, 0, [1, 1, 1], [0, 0, 1.2]);
      for (const s of [-1, 1]) m(S(0.15), s * 0.47, 0.06, -0.04);
      break;
    case 'panjang-jamur': { // rambut panjang, topi jamur bercorak
      topi();
      poni(0.72, 0.27, 0.36, 0.14, 0.3);
      pan(0, -0.34, -0.3, 1.0, 1.0, 0.22);
      for (const s of [-1, 1]) pan(s * 0.49, -0.22, 0.04, 0.15, 0.78, 0.3);
      const jamur = new THREE.Group();
      jamur.add(badan(new THREE.SphereGeometry(0.28, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), spec.jamur, { t: 0.024 }));
      for (const [x, y, z] of [[-0.1, 0.22, 0.1], [0.1, 0.2, -0.08], [0.02, 0.26, 0.0]]) {
        const d = new THREE.Mesh(S(0.045, 8, 6), toon('#FFFFFF'));
        d.position.set(x, y, z);
        jamur.add(d);
      }
      pasang(g, jamur, 0.14, 0.46, 0.08, [0.15, 0, -0.35]);
      break;
    }
    case 'panjang-tengah': // panjang, belah tengah
      topi();
      pan(0, -0.3, -0.3, 1.02, 1.0, 0.22);
      for (const s of [-1, 1]) {
        pan(s * 0.47, -0.3, 0.14, 0.2, 0.92, 0.24);
        pan(s * 0.2, 0.26, 0.37, 0.42, 0.14, 0.12, [0.35, 0, s * 0.35]);
      }
      break;
    case 'acak-jambul': // acak dengan jambul runcing
      topi();
      poni(0.7, 0.27, 0.36, 0.14, 0.3);
      m(new THREE.ConeGeometry(0.1, 0.32, 8), -0.16, 0.52, 0.05, [1, 1, 1], [0, 0, 0.3]);
      m(new THREE.ConeGeometry(0.1, 0.34, 8), 0.1, 0.55, 0, [1, 1, 1], [0, 0, -0.15]);
      m(new THREE.ConeGeometry(0.1, 0.3, 8), 0.26, 0.48, 0.1, [1, 1, 1], [0, 0, -0.55]);
      for (const s of [-1, 1]) m(S(0.15), s * 0.47, 0.08, -0.05);
      break;
    case 'poni-panjang': // poni panjang menutup dahi
      topi(0.56);
      pan(0, 0.27, 0.36, 1.0, 0.27, 0.16, [0.15, 0, 0]);
      for (const s of [-1, 1]) pan(s * 0.51, -0.08, 0, 0.15, 0.58, 0.52);
      pan(0, -0.04, -0.33, 1.02, 0.62, 0.2);
      break;
    case 'kupluk': // kupluk rajut dengan pom-pom
      m(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), 0, 0.1, -0.01, [RX + 0.05, RY + 0.12, RZ + 0.05]);
      m(C(RX + 0.05, RX + 0.05, 0.14, 28), 0, 0.12, 0, [1, 1, RZ / RX + 0.1], [0, 0, 0], '#1E3A66');
      m(S(0.13), 0, 0.64, 0, [1, 1, 1], [0, 0, 0], spec.bobble);
      break;
    default:
      topi();
  }
  return g;
}

// ------------------------------------------------------------------ wajah
function mataBuat(jenis, s) {
  const g = new THREE.Group();
  g.position.set(s * 0.18, 0.0, 0.405);
  switch (jenis) {
    case 'bulat':
    case 'kosong': {
      const putih = badan(S(0.11), '#FFFFFF', { t: 0.014 });
      putih.scale.set(1, 1, 0.42);
      g.add(putih);
      if (jenis === 'bulat') {
        const p = new THREE.Mesh(S(0.05, 10, 8), dasar());
        p.position.set(-s * 0.015, 0, 0.05);
        g.add(p);
      }
      break;
    }
    case 'senyum': {
      const a = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.017, 6, 14, Math.PI), dasar());
      a.position.y = -0.02;
      g.add(a);
      break;
    }
    case 'x':
      for (const r of [Math.PI / 4, -Math.PI / 4]) {
        const b = new THREE.Mesh(B(0.17, 0.03, 0.012), dasar());
        b.rotation.z = r;
        g.add(b);
      }
      break;
    case 'sipit': {
      const b = new THREE.Mesh(B(0.15, 0.032, 0.012), dasar());
      b.rotation.z = s * 0.1;
      g.add(b);
      break;
    }
    default: {
      const e = new THREE.Mesh(S(0.06, 10, 8), dasar());
      e.scale.set(1, 1.4, 0.5);
      g.add(e);
    }
  }
  return g;
}

function mulutBuat(spec) {
  const g = new THREE.Group();
  g.position.set(0, -0.15, 0.41);
  const hitam = dasar();
  const kotak = (w, h, d, mat, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(B(w, h, d), mat);
    o.position.set(x, y, z);
    g.add(o);
    return o;
  };
  switch (spec.mulut) {
    case 'senyum': {
      const a = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 14, Math.PI), hitam);
      a.rotation.z = Math.PI;
      a.position.y = 0.03;
      g.add(a);
      break;
    }
    case 'gigi': // senyum lebar bergigi
      kotak(0.34, 0.16, 0.012, hitam, 0, 0.0, 0);
      kotak(0.29, 0.11, 0.014, toon('#FFFFFF'), 0, 0.0, 0.006);
      kotak(0.012, 0.11, 0.015, hitam, 0, 0, 0.008);
      break;
    case 'ternganga': { // mulut terbuka lebar, lidah dan tetesan oranye
      const lubang = new THREE.Mesh(S(0.11, 14, 10), hitam);
      lubang.scale.set(1.15, 1.35, 0.4);
      g.add(lubang);
      const lidah = new THREE.Mesh(S(0.07, 10, 8), toon(spec.lidah ?? '#F5A623'));
      lidah.scale.set(1.1, 0.75, 0.35);
      lidah.position.set(0, -0.08, 0.02);
      g.add(lidah);
      const tetes = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.18, 4, 8), toon(spec.lidah ?? '#F5A623'));
      tetes.position.set(0.04, -0.28, 0.0);
      g.add(tetes);
      break;
    }
    case 'o': {
      const o = new THREE.Mesh(S(0.05, 10, 8), hitam);
      o.scale.set(1, 1.2, 0.4);
      g.add(o);
      break;
    }
    case 'gigit': // gigi dirapatkan
      kotak(0.28, 0.12, 0.012, hitam);
      kotak(0.24, 0.085, 0.014, toon('#FFFFFF'), 0, 0, 0.006);
      for (const x of [-0.06, 0, 0.06]) kotak(0.01, 0.085, 0.016, hitam, x, 0, 0.008);
      break;
    case 'kecil':
      kotak(0.055, 0.03, 0.012, hitam);
      break;
    default:
      kotak(0.11, 0.024, 0.012, hitam);
  }
  return g;
}

// ------------------------------------------------------------------ anggota badan
function kaki(sx, w) {
  const jenis = w.bawah.jenis;
  const warna = w.bawah.warna;
  const pendek = jenis === 'celana-pendek';
  const telanjang = jenis === 'rok' || jenis === 'rok-panjang';
  const atasW = telanjang ? (w.kaki ?? w.kulit) : warna;
  const bawahW = pendek ? (w.kaki ?? w.kulit) : telanjang ? (w.kaki ?? w.kulit) : warna;
  const pinggul = new THREE.Group();
  pinggul.position.set(sx * 0.12, PINGGUL, 0);
  const atas = badan(C(0.052, 0.048, 0.2), atasW, { t: 0.02 });
  atas.position.y = -0.1;
  pinggul.add(atas);
  const lutut = new THREE.Group();
  lutut.position.y = -0.2;
  const bawah = badan(C(0.048, 0.044, 0.2), bawahW, { t: 0.02 });
  bawah.position.y = -0.1;
  const sepatu = badan(B(0.13, 0.075, 0.22), w.sepatu, { t: 0.02 });
  sepatu.position.set(0, -0.2, 0.045);
  lutut.add(bawah, sepatu);
  pinggul.add(lutut);
  return { pinggul, lutut };
}

function lengan(sx, w) {
  const bahu = new THREE.Group();
  bahu.position.set(sx * 0.29, 0.77, 0);
  const warnaLengan = w.baju.lengan === 'kulit' ? w.kulit : w.baju.lengan;
  const atas = badan(new THREE.CapsuleGeometry(0.052, 0.1, 4, 8), warnaLengan, { t: 0.02 });
  atas.position.y = -0.1;
  bahu.add(atas);
  const siku = new THREE.Group();
  siku.position.y = -0.19;
  const bawah = badan(new THREE.CapsuleGeometry(0.048, 0.1, 4, 8), warnaLengan, { t: 0.02 });
  bawah.position.y = -0.1;
  const tangan = badan(S(0.06, 12, 8), w.kulit, { t: 0.02 });
  tangan.position.y = -0.22;
  siku.add(bawah, tangan);
  bahu.add(siku);
  return { bahu, siku, tangan };
}

function pakaian(akar, w) {
  const b = w.baju;
  const cincin = (warna, y, skala = 1.0, tebal = 0.04, r = 0.215) => {
    const c = badan(C(r, r, tebal, 20), warna, { t: 0.012 });
    c.scale.set(1.14 * skala, 1, 0.86 * skala);
    return pasang(akar, c, 0, y, 0);
  };
  const raga = badan(new THREE.CapsuleGeometry(0.2, 0.17, 4, 14), b.atas);
  raga.scale.set(1.12, 1, 0.82);
  pasang(akar, raga, 0, 0.62, 0);
  // bawahan berupa rok
  if (w.bawah.jenis === 'rok') {
    const r = badan(C(0.25, 0.4, 0.3, 20), w.bawah.warna, { t: 0.022 });
    pasang(akar, r, 0, 0.45, 0);
  } else if (w.bawah.jenis === 'rok-panjang') {
    const r = badan(C(0.25, 0.46, 0.5, 20), w.bawah.warna, { t: 0.022 });
    pasang(akar, r, 0, 0.35, 0);
  }
  if (b.garis) for (const y of [0.5, 0.58, 0.66, 0.74]) cincin(b.garis, y);
  if (b.kerah) pasang(akar, badan(new THREE.TorusGeometry(0.17, 0.04, 8, 18), b.kerah, { t: 0.014 }), 0, 0.82, 0.0, [Math.PI / 2, 0, 0]);
  if (b.rompi && !b.pinafore) for (const s of [-1, 1]) pasang(akar, badan(B(0.14, 0.36, 0.07), b.rompi, { t: 0.014 }), s * 0.12, 0.62, 0.15, [0, s * 0.2, 0]);
  if (b.pinafore) {
    pasang(akar, badan(B(0.3, 0.3, 0.07), b.rompi, { t: 0.014 }), 0, 0.6, 0.16);
    for (const s of [-1, 1]) pasang(akar, badan(B(0.05, 0.28, 0.05), b.rompi, { t: 0.012 }), s * 0.1, 0.76, 0.12);
  }
  if (b.tali) for (const s of [-1, 1]) pasang(akar, badan(B(0.045, 0.34, 0.035), b.tali, { t: 0.012 }), s * 0.1, 0.62, 0.17);
  if (b.dasi) {
    pasang(akar, badan(B(0.07, 0.26, 0.035), b.dasi, { t: 0.014 }), 0, 0.58, 0.175);
    pasang(akar, badan(B(0.09, 0.07, 0.04), b.dasi, { t: 0.014 }), 0, 0.73, 0.175);
  }
  if (b.hati) {
    const h = new THREE.Shape();
    h.moveTo(0, -0.06); h.bezierCurveTo(-0.1, 0.02, -0.06, 0.09, 0, 0.04); h.bezierCurveTo(0.06, 0.09, 0.1, 0.02, 0, -0.06);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(h), new THREE.MeshBasicMaterial({ color: b.hati, side: THREE.DoubleSide }));
    m.position.set(0, 0.62, 0.172);
    akar.add(m);
  }
  if (b.ruffle) for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    pasang(akar, badan(S(0.07, 8, 6), b.ruffle, { t: 0.012 }), Math.cos(a) * 0.24, 0.46, Math.sin(a) * 0.19);
  }
  if (b.celemek) {
    pasang(akar, badan(B(0.3, 0.46, 0.04), b.celemek, { t: 0.012 }), 0, 0.42, 0.2);
    pasang(akar, badan(B(0.15, 0.11, 0.035), b.saku, { t: 0.012 }), 0, 0.36, 0.23);
  }
  if (b.lilit) pasang(akar, badan(B(0.52, 0.13, 0.32), b.lilit, { t: 0.014 }), 0, 0.64, 0.04, [0, 0, -0.2]);
  if (b.syal) {
    b.syal.forEach((c, i) => cincin(c, 0.8 + i * 0.045, 0.82, 0.05, 0.2));
    b.syal.forEach((c, i) => pasang(akar, badan(B(0.11, 0.1, 0.04), c, { t: 0.012 }), 0.1, 0.62 - i * 0.1, 0.19));
  }
}

// ------------------------------------------------------------------ karakter utuh
export function buatKarakter(w, { seed = 0, tandaFreelancer = false } = {}) {
  const g = new THREE.Group();
  const akar = new THREE.Group();
  g.add(akar);
  const kakiK = kaki(-1, w);
  const kakiR = kaki(1, w);
  akar.add(kakiK.pinggul, kakiR.pinggul);
  pakaian(akar, w);
  const lenganK = lengan(-1, w);
  const lenganR = lengan(1, w);
  akar.add(lenganK.bahu, lenganR.bahu);

  const kepala = new THREE.Group();
  kepala.position.y = KEPALA_Y;
  akar.add(kepala);
  const tengkorak = badan(S(1, 30, 20), w.kulit);
  tengkorak.scale.set(RX, RY, RZ);
  kepala.add(tengkorak);
  for (const s of [-1, 1]) {
    pasang(kepala, badan(S(0.075, 10, 8), w.kulit, { t: 0.02 }), s * (RX - 0.01), -0.03, 0);
    if (w.pipi) {
      const p = new THREE.Mesh(S(0.075, 10, 8), toon(w.pipi));
      p.scale.set(1.25, 0.8, 0.3);
      pasang(kepala, p, s * 0.28, -0.1, 0.375);
    }
    if (w.bayangMata) {
      const p = new THREE.Mesh(S(0.07, 10, 8), toon(w.bayangMata));
      p.scale.set(1.3, 0.55, 0.25);
      pasang(kepala, p, s * 0.19, -0.1, 0.385);
    }
    if (w.bintik) for (let i = 0; i < 3; i++) {
      const d = new THREE.Mesh(S(0.012, 6, 5), toon('#B9784B'));
      pasang(kepala, d, s * (0.24 + i * 0.045), -0.04 - (i % 2) * 0.03, 0.4);
    }
  }
  const mata = [];
  for (const s of [-1, 1]) {
    const e = mataBuat(w.mata, s);
    kepala.add(e);
    mata.push(e);
  }
  if (w.hidung) {
    const n = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 4), toon(w.hidung));
    n.rotation.x = Math.PI / 2;
    pasang(kepala, n, 0, -0.06, 0.435);
  }
  kepala.add(mulutBuat(w));
  kepala.add(rambut(w.rambut));
  if (w.kacamata) {
    const bingkai = new THREE.MeshBasicMaterial({ color: w.kacamata });
    for (const s of [-1, 1]) pasang(kepala, new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.016, 8, 20), bingkai), s * 0.19, 0, 0.41);
    pasang(kepala, new THREE.Mesh(B(0.09, 0.016, 0.016), bingkai), 0, 0.01, 0.41);
  }
  if (tandaFreelancer) {
    pasang(akar, badan(B(0.15, 0.2, 0.015), '#FFFFFF', { t: 0.012 }), 0.05, 0.5, 0.2);
    pasang(akar, new THREE.Mesh(B(0.03, 0.22, 0.012), toon('#FFC400')), 0.05, 0.69, 0.18, [0, 0, 0.25]);
  }

  const kar = {
    group: g, akar, kepala, mata,
    sendi: { ul: [kakiK.pinggul, kakiR.pinggul], ll: [kakiK.lutut, kakiR.lutut], ua: [lenganK.bahu, lenganR.bahu], la: [lenganK.siku, lenganR.siku] },
    seed, mode: 'berdiri', matiKedip: ['titik', 'bulat'].includes(w.mata),
    pose: { ul: [0, 0], ll: [0, 0], ua: [0, 0], la: [0, 0], y: 0, kx: 0, kz: 0 },
  };
  gabungKarakter(kar);
  return kar;
}

// Sudut sendi target menurut mode. Karakter menghadap +z: ayunan ke depan = rotasi x negatif.
function sasaran(mode, t, seed) {
  const sw = Math.sin(t * 9 + seed);
  const napas = Math.sin(t * 1.6 + seed) * 0.02;
  switch (mode) {
    case 'jalan':
      return { ul: [-sw * 0.7, sw * 0.7], ll: [Math.max(0, sw) * 0.8, Math.max(0, -sw) * 0.8], ua: [sw * 0.6, -sw * 0.6], la: [-0.3, -0.3], y: Math.abs(sw) * 0.06, kx: 0.04, kz: sw * 0.03 };
    case 'duduk-kerja': {
      const k = Math.sin(t * 13 + seed) * 0.12;
      return { ul: [-1.5, -1.5], ll: [1.5, 1.5], ua: [-0.85 + k, -0.85 - k], la: [-1.1, -1.1], y: -0.19, kx: 0.14 + Math.sin(t * 1.3 + seed) * 0.03, kz: 0 };
    }
    case 'duduk-santai': {
      const minum = Math.max(0, Math.sin(t * 0.5 + seed)) ** 6;
      return { ul: [-1.5, -1.5], ll: [1.5, 1.5], ua: [-0.15, -0.35 - minum * 1.1], la: [-0.2, -0.4 - minum * 1.4], y: -0.19, kx: -0.04 + napas * 2, kz: Math.sin(t * 0.7 + seed) * 0.04 };
    }
    case 'rayakan':
      return { ul: [0, 0], ll: [0, 0], ua: [-2.9, -2.9], la: [-0.2, -0.2], y: Math.abs(Math.sin(t * 7 + seed)) * 0.16, kx: -0.1, kz: Math.sin(t * 7 + seed) * 0.08 };
    case 'angkat-tangan':
      return { ul: [-1.5, -1.5], ll: [1.5, 1.5], ua: [-0.2, -2.9 + Math.sin(t * 7) * 0.12], la: [-0.2, -0.3 + Math.sin(t * 7) * 0.5], y: -0.19, kx: -0.05, kz: 0.05 };
    default: {
      const lambai = Math.max(0, Math.sin(t * 0.45 + seed * 3)) ** 10;
      return { ul: [0, 0], ll: [0, 0], ua: [napas * 4, -0.1 - lambai * 2.6], la: [-0.1, -0.2 - lambai * 0.3 * Math.sin(t * 9)], y: napas, kx: 0, kz: Math.sin(t * 0.8 + seed) * 0.03 };
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
  if (kar.matiKedip) {
    const kedip = (t * 0.7 + kar.seed) % 4 > 3.88;
    for (const e of kar.mata) e.scale.y = kedip ? 0.12 : 1;
  }
}
