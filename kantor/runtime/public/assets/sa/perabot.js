// Perabot kantor (prosedural, bahan toon + outline). Semua posisi lokal terhadap titik lantai di tengah perabot.
import * as THREE from 'three';
import { badan, bulatTeks, canvasTekstur, toon } from './bahan.js';

const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const C = (r, h, seg = 16) => new THREE.CylinderGeometry(r, r, h, seg);
const tambah = (g, o, x = 0, y = 0, z = 0) => {
  o.position.set(x, y, z);
  g.add(o);
  return o;
};

export const TINGGI_MEJA = 0.64;
export const TINGGI_DUDUK = 0.26;

export function kursi(warna = '#3A4A6B') {
  const g = new THREE.Group();
  tambah(g, badan(B(0.52, 0.08, 0.5), warna, { t: 0.022 }), 0, TINGGI_DUDUK, 0);
  tambah(g, badan(B(0.5, 0.42, 0.07), warna, { t: 0.022 }), 0, TINGGI_DUDUK + 0.25, -0.25);
  tambah(g, badan(C(0.035, 0.18, 8), '#555b6b', { t: 0.015 }), 0, 0.14, 0);
  const dasar = badan(C(0.26, 0.04, 5), '#444a59', { t: 0.015 });
  tambah(g, dasar, 0, 0.03, 0);
  return g;
}

// Meja kerja: lokal (0,0,0) = titik lantai tengah meja; sisi utara (-z) tempat duduk. Monitor di sisi kanan agar wajah terlihat.
export function meja({ warna = '#C99A6A', layar = '#294D82' } = {}) {
  const g = new THREE.Group();
  tambah(g, badan(B(1.5, 0.06, 0.76), warna), 0, TINGGI_MEJA, 0);
  tambah(g, badan(B(1.46, 0.46, 0.05), '#B38557', { t: 0.02 }), 0, TINGGI_MEJA - 0.26, 0.32);
  for (const sx of [-1, 1]) tambah(g, badan(B(0.06, TINGGI_MEJA - 0.03, 0.7), '#B38557', { t: 0.02 }), sx * 0.7, (TINGGI_MEJA - 0.03) / 2, 0);
  tambah(g, badan(B(0.5, 0.025, 0.2), '#E8ECF2', { t: 0.014 }), -0.15, TINGGI_MEJA + 0.04, 0.12);
  // layar: bingkai + kanvas isi
  const mon = new THREE.Group();
  tambah(mon, badan(B(0.62, 0.42, 0.04), '#23232d', { t: 0.018 }), 0, 0.3, 0);
  tambah(mon, badan(B(0.06, 0.2, 0.05), '#555b6b', { t: 0.012 }), 0, 0.1, -0.02);
  const { tekstur, canvas, ctx } = canvasTekstur(128, 80, (c, w, h) => {
    c.fillStyle = '#10182b';
    c.fillRect(0, 0, w, h);
  });
  const lay = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.36), new THREE.MeshBasicMaterial({ map: tekstur, toneMapped: false }));
  lay.position.set(0, 0.3, 0.022);
  mon.add(lay);
  mon.position.set(0.42, TINGGI_MEJA + 0.03, 0.05);
  mon.rotation.y = -0.35;
  g.add(mon);
  const gambarLayar = (aktif, warnaAksen, t = 0) => {
    ctx.fillStyle = aktif ? '#0F1E3F' : '#10182b';
    ctx.fillRect(0, 0, 128, 80);
    if (aktif) {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 3 === 0 ? warnaAksen : '#9FB4D9';
        const w = 30 + ((i * 37 + Math.floor(t * 3)) % 60);
        ctx.fillRect(10 + (i % 2) * 8, 8 + i * 8.5, w, 4);
      }
    } else {
      ctx.fillStyle = warnaAksen;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(64, 40, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    tekstur.needsUpdate = true;
  };
  gambarLayar(false, layar);
  const cangkir = badan(C(0.05, 0.09, 12), '#FFFFFF', { t: 0.014 });
  tambah(g, cangkir, -0.62, TINGGI_MEJA + 0.075, 0.2);
  return { group: g, gambarLayar, propSlot: new THREE.Vector3(-0.38, TINGGI_MEJA + 0.03, -0.12) };
}

export function sofa(lebar = 2.4, warna = '#E98A4B') {
  const g = new THREE.Group();
  tambah(g, badan(B(lebar, 0.24, 0.8), warna, { t: 0.026 }), 0, 0.12, 0);
  tambah(g, badan(B(lebar, 0.5, 0.2), warna, { t: 0.026 }), 0, 0.4, -0.32);
  for (const sx of [-1, 1]) tambah(g, badan(B(0.18, 0.4, 0.8), warna, { t: 0.026 }), sx * (lebar / 2 - 0.09), 0.2, 0);
  return g;
}

export function kursiTamu(warna = '#4FB8C4') {
  const g = new THREE.Group();
  tambah(g, badan(B(0.95, 0.26, 0.85), warna, { t: 0.026 }), 0, 0.13, 0);
  tambah(g, badan(B(0.95, 0.62, 0.2), warna, { t: 0.026 }), 0, 0.48, -0.33);
  for (const sx of [-1, 1]) tambah(g, badan(B(0.16, 0.45, 0.85), warna, { t: 0.026 }), sx * 0.4, 0.22, 0);
  return g;
}

export function meja_bundar(r = 0.8, warna = '#C99A6A') {
  const g = new THREE.Group();
  tambah(g, badan(C(r, 0.06, 28), warna), 0, 0.5, 0);
  tambah(g, badan(C(0.07, 0.48, 10), '#555b6b', { t: 0.018 }), 0, 0.24, 0);
  tambah(g, badan(C(0.3, 0.04, 16), '#555b6b', { t: 0.018 }), 0, 0.02, 0);
  return g;
}

export function bangku(warna = '#8CCB6B') {
  const g = new THREE.Group();
  tambah(g, badan(C(0.2, 0.06, 14), warna, { t: 0.02 }), 0, 0.24, 0);
  tambah(g, badan(C(0.03, 0.22, 8), '#555b6b', { t: 0.012 }), 0, 0.11, 0);
  return g;
}

export function pulauKopi(panjang = 2.6) {
  const g = new THREE.Group();
  tambah(g, badan(B(panjang, 0.95, 0.7), '#EDEFF2'), 0, 0.475, 0);
  tambah(g, badan(B(panjang + 0.1, 0.05, 0.8), '#37404F'), 0, 0.97, 0);
  tambah(g, badan(B(0.5, 0.34, 0.34), '#C9CED6', { t: 0.02 }), -0.6, 1.17, 0);
  tambah(g, badan(B(0.18, 0.06, 0.18), '#D94662', { t: 0.014 }), -0.6, 1.37, 0.0);
  for (const x of [0.2, 0.55, 0.9]) tambah(g, badan(C(0.05, 0.09, 12), ['#FFC400', '#4FB8C4', '#E98A4B'][Math.round((x - 0.2) / 0.35)], { t: 0.014 }), x, 1.04, 0.05);
  return g;
}

export function foosball() {
  const g = new THREE.Group();
  tambah(g, badan(B(1.8, 0.14, 1.0), '#2F8F55', { t: 0.022 }), 0, 0.72, 0);
  tambah(g, badan(B(1.9, 0.1, 1.1), '#294D82', { t: 0.022 }), 0, 0.62, 0);
  for (const sx of [-0.8, 0.8]) for (const sz of [-0.45, 0.45]) tambah(g, badan(B(0.08, 0.6, 0.08), '#37404F', { t: 0.016 }), sx, 0.3, sz);
  for (const x of [-0.55, -0.18, 0.18, 0.55]) {
    const batang = badan(C(0.014, 1.2, 6), '#C9CED6', { t: 0.01, tanpaGaris: true });
    batang.rotation.x = Math.PI / 2;
    tambah(g, batang, x, 0.84, 0);
    for (const z of [-0.2, 0.2]) tambah(g, badan(B(0.07, 0.13, 0.05), x < 0 ? '#D94662' : '#FFC400', { t: 0.012 }), x, 0.78, z);
  }
  return g;
}

export function loker(jumlah = 6, tinggi = 2.2) {
  const g = new THREE.Group();
  const warna = ['#4FB8C4', '#E98A4B', '#8CCB6B', '#FFC400', '#B39DDB', '#D94662'];
  tambah(g, badan(B(0.5, tinggi, jumlah * 0.62), '#DCE0E6', { t: 0.02 }), 0, tinggi / 2, 0);
  for (let i = 0; i < jumlah; i++) {
    for (let r = 0; r < 3; r++) {
      const p = badan(B(0.04, tinggi / 3 - 0.1, 0.54), warna[(i + r * 2) % warna.length], { t: 0.012 });
      tambah(g, p, 0.27, tinggi / 6 + r * (tinggi / 3), (i - (jumlah - 1) / 2) * 0.62);
    }
  }
  return g;
}

export function tanaman(skala = 1) {
  const g = new THREE.Group();
  tambah(g, badan(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 12), '#E98A4B', { t: 0.02 }), 0, 0.15, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    tambah(g, badan(new THREE.SphereGeometry(0.2 + (i % 2) * 0.05, 10, 8), '#5DAF63', { t: 0.02 }), Math.cos(a) * 0.14, 0.5 + (i % 3) * 0.12, Math.sin(a) * 0.14);
  }
  g.scale.setScalar(skala);
  return g;
}

export function rakBuku(lebar = 1.6) {
  const g = new THREE.Group();
  tambah(g, badan(B(lebar, 1.9, 0.38), '#B38557'), 0, 0.95, 0);
  const warna = ['#294D82', '#FFC400', '#D94662', '#4FB8C4', '#8CCB6B', '#E98A4B'];
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i < 7; i++) {
      tambah(g, badan(B(0.12, 0.3 + (i % 3) * 0.04, 0.26), warna[(i + r) % warna.length], { t: 0.01, tanpaGaris: true }), -lebar / 2 + 0.2 + i * (lebar - 0.3) / 7, 0.28 + r * 0.42, 0.06);
    }
  }
  return g;
}

export function resepsionis() {
  const g = new THREE.Group();
  tambah(g, badan(B(2.6, 1.0, 0.7), '#F2EFE8'), 0, 0.5, 0);
  tambah(g, badan(B(2.7, 0.06, 0.85), '#294D82'), 0, 1.03, 0);
  tambah(g, badan(B(0.7, 1.0, 1.6), '#F2EFE8'), 1.65, 0.5, 0.45);
  tambah(g, badan(B(0.8, 0.06, 1.7), '#294D82'), 1.65, 1.03, 0.45);
  return g;
}

// Papan status 12 tahap (kanvas): tahap lulus bercentang, tahap berjalan menyala kuning.
export function papanStatus() {
  const g = new THREE.Group();
  tambah(g, badan(B(2.5, 1.6, 0.09), '#23232d', { t: 0.02 }), 0, 1.4, 0);
  for (const sx of [-1, 1]) tambah(g, badan(B(0.07, 0.6, 0.07), '#555b6b', { t: 0.015 }), sx * 1.0, 0.3, -0.05);
  const { tekstur, ctx } = canvasTekstur(512, 320, () => {});
  const layar = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 1.48), new THREE.MeshBasicMaterial({ map: tekstur, toneMapped: false }));
  layar.position.set(0, 1.4, 0.05);
  g.add(layar);
  const gambar = (pipeline, pemilik) => {
    ctx.fillStyle = '#0F1E3F';
    ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = '#FFC400';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText(pipeline ? 'PRODUKSI: ' + String(pipeline.episode || '').slice(0, 24) : 'PRODUKSI: tidak ada', 16, 32);
    const nama = pipeline ? pipeline.tahap : [];
    const lulus = new Set(pipeline ? pipeline.lulus : []);
    nama.forEach((t, i) => {
      const kol = i % 2;
      const bar = Math.floor(i / 2);
      const x = 16 + kol * 250;
      const y = 56 + bar * 38;
      const aktif = pipeline && pipeline.sekarang === t;
      ctx.fillStyle = aktif ? '#FFC400' : lulus.has(t) ? '#2A9D8F' : '#26324f';
      bulatTeks(ctx, x, y, 236, 30, 8);
      ctx.fill();
      ctx.fillStyle = aktif ? '#10182b' : '#ffffff';
      ctx.font = '600 17px system-ui, sans-serif';
      ctx.fillText((lulus.has(t) ? '✓ ' : '') + t.replace('_', ' '), x + 12, y + 21);
    });
    if (pemilik && pemilik.state === 'menunggu') {
      ctx.fillStyle = '#D94662';
      bulatTeks(ctx, 16, 288, 480, 26, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 15px system-ui, sans-serif';
      ctx.fillText('MENUNGGU ALDY: ' + String(pemilik.status || ''), 28, 306);
    }
    tekstur.needsUpdate = true;
  };
  gambar(null, null);
  return { group: g, gambar };
}

// Partisi kaca: bingkai gelap tipis + kaca bening. Mengembalikan Group.
export function kaca(panjang, tinggi = 2.3, arah = 'x') {
  const g = new THREE.Group();
  const kacaMat = new THREE.MeshStandardMaterial({ color: '#BFD9EA', transparent: true, opacity: 0.2, roughness: 0.1, metalness: 0.1, depthWrite: false });
  const p = new THREE.Mesh(B(panjang, tinggi, 0.05), kacaMat);
  p.position.y = tinggi / 2;
  g.add(p);
  const bingkai = toon('#3A4252');
  const atas = new THREE.Mesh(B(panjang, 0.06, 0.08), bingkai);
  atas.position.y = tinggi;
  const bawah = new THREE.Mesh(B(panjang, 0.1, 0.08), bingkai);
  bawah.position.y = 0.05;
  g.add(atas, bawah);
  for (const sx of [-1, 1]) {
    const t = new THREE.Mesh(B(0.06, tinggi, 0.08), bingkai);
    t.position.set((sx * panjang) / 2, tinggi / 2, 0);
    g.add(t);
  }
  if (arah === 'z') g.rotation.y = Math.PI / 2;
  return g;
}

export function panelWarna(warna, lebar = 0.1, tinggi = 1.4, panjang = 1.4) {
  return badan(B(lebar, tinggi, panjang), warna, { t: 0.02 });
}

// Benda khas per peran (di meja). Ukuran kecil, tiap benda berbeda siluet supaya terbaca dari jauh.
export function benda(nama) {
  const g = new THREE.Group();
  const w = (hex) => hex;
  switch (nama) {
    case 'pulpen':
      tambah(g, badan(C(0.05, 0.1, 10), '#FFFFFF', { t: 0.014 }), 0, 0.05, 0);
      for (const [x, c] of [[-0.02, '#294D82'], [0.02, '#D94662']]) { const p = badan(C(0.008, 0.16, 6), c, { t: 0.008, tanpaGaris: true }); p.rotation.z = x * 6; tambah(g, p, x, 0.15, 0); }
      break;
    case 'buku catatan':
      tambah(g, badan(B(0.22, 0.04, 0.3), '#FFC400', { t: 0.014 }), 0, 0.02, 0);
      tambah(g, badan(B(0.2, 0.025, 0.28), '#FFFFFF', { t: 0.01 }), 0.005, 0.05, 0);
      break;
    case 'kaca pembesar': {
      const r = badan(new THREE.TorusGeometry(0.09, 0.016, 8, 18), '#3A4252', { t: 0.012 });
      tambah(g, r, 0, 0.24, 0);
      const l = new THREE.Mesh(new THREE.CircleGeometry(0.085, 18), new THREE.MeshBasicMaterial({ color: '#BFD9EA', transparent: true, opacity: 0.5 }));
      tambah(g, l, 0, 0.24, 0.002);
      const h = badan(C(0.014, 0.15, 6), '#3A4252', { t: 0.01 });
      h.rotation.z = -0.5;
      tambah(g, h, -0.12, 0.12, 0);
      break;
    }
    case 'headphone':
      tambah(g, badan(new THREE.TorusGeometry(0.1, 0.02, 8, 18, Math.PI), '#2A2F3C', { t: 0.012 }), 0, 0.1, 0);
      for (const s of [-1, 1]) tambah(g, badan(C(0.055, 0.05, 12), '#FFC400', { t: 0.012 }), s * 0.1, 0.05, 0).rotation.z = Math.PI / 2;
      break;
    case 'mikrofon kecil':
      tambah(g, badan(C(0.05, 0.02, 12), '#37404F', { t: 0.012 }), 0, 0.01, 0);
      tambah(g, badan(C(0.012, 0.26, 6), '#37404F', { t: 0.01 }), 0, 0.14, 0);
      tambah(g, badan(new THREE.SphereGeometry(0.06, 12, 8), '#C9CED6', { t: 0.014 }), 0, 0.3, 0);
      break;
    case 'tablet gambar': {
      const t = badan(B(0.34, 0.025, 0.24), '#2A2F3C', { t: 0.014 });
      t.rotation.x = -0.25;
      tambah(g, t, 0, 0.05, 0);
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshBasicMaterial({ color: '#4FB8C4' }));
      s.rotation.x = -Math.PI / 2 - 0.25;
      tambah(g, s, 0, 0.066, 0);
      break;
    }
    case 'pensil':
      tambah(g, badan(C(0.05, 0.1, 10), '#E98A4B', { t: 0.014 }), 0, 0.05, 0);
      for (const x of [-0.015, 0.02]) { const p = badan(C(0.009, 0.18, 6), '#FFC400', { t: 0.008, tanpaGaris: true }); p.rotation.z = x * 5; tambah(g, p, x, 0.16, 0); }
      break;
    case 'layar kecil':
      tambah(g, badan(B(0.3, 0.22, 0.03), '#23232d', { t: 0.014 }), 0, 0.15, 0);
      tambah(g, badan(B(0.05, 0.08, 0.04), '#555b6b', { t: 0.01 }), 0, 0.04, 0);
      tambah(g, new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.18), new THREE.MeshBasicMaterial({ color: '#FFC400' })), 0, 0.15, 0.017);
      break;
    case 'palet cat': {
      tambah(g, badan(C(0.14, 0.02, 18), '#F2E2C4', { t: 0.014 }), 0, 0.02, 0);
      ['#D94662', '#4FB8C4', '#FFC400', '#8CCB6B'].forEach((c, i) => tambah(g, badan(C(0.028, 0.012, 8), c, { t: 0.006, tanpaGaris: true }), Math.cos(i * 1.6) * 0.07, 0.035, Math.sin(i * 1.6) * 0.07));
      break;
    }
    case 'kamera':
      tambah(g, badan(B(0.22, 0.14, 0.12), '#2A2F3C', { t: 0.014 }), 0, 0.08, 0);
      { const l = badan(C(0.05, 0.08, 12), '#C9CED6', { t: 0.012 }); l.rotation.x = Math.PI / 2; tambah(g, l, 0, 0.08, 0.1); }
      break;
    case 'teropong':
      for (const s of [-1, 1]) { const t = badan(C(0.04, 0.2, 10), '#2A2F3C', { t: 0.012 }); t.rotation.x = Math.PI / 2; tambah(g, t, s * 0.05, 0.06, 0); }
      break;
    case 'kalender': {
      const { tekstur } = canvasTekstur(128, 128, (c) => {
        c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 128);
        c.fillStyle = '#D94662'; c.fillRect(0, 0, 128, 30);
        c.fillStyle = '#3A4252';
        for (let i = 0; i < 20; i++) c.fillRect(10 + (i % 5) * 22, 44 + Math.floor(i / 5) * 20, 14, 10);
      });
      const k = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), new THREE.MeshBasicMaterial({ map: tekstur }));
      k.position.set(0, 0.16, 0);
      k.rotation.x = -0.2;
      g.add(k);
      tambah(g, badan(B(0.28, 0.28, 0.02), '#3A4252', { t: 0.012 }), 0, 0.16, -0.015).rotation.x = -0.2;
      break;
    }
    case 'papan centang': {
      tambah(g, badan(B(0.26, 0.34, 0.02), '#B38557', { t: 0.014 }), 0, 0.2, 0).rotation.x = -0.15;
      const { tekstur } = canvasTekstur(64, 80, (c) => {
        c.fillStyle = '#fff'; c.fillRect(0, 0, 64, 80);
        c.strokeStyle = '#2A9D8F'; c.lineWidth = 6; c.beginPath(); c.moveTo(12, 40); c.lineTo(26, 54); c.lineTo(52, 20); c.stroke();
      });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), new THREE.MeshBasicMaterial({ map: tekstur }));
      p.position.set(0, 0.2, 0.014);
      p.rotation.x = -0.15;
      g.add(p);
      break;
    }
    case 'kalkulator':
      tambah(g, badan(B(0.2, 0.04, 0.28), '#3A4252', { t: 0.014 }), 0, 0.02, 0);
      tambah(g, new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.06), new THREE.MeshBasicMaterial({ color: '#8CCB6B' })), 0, 0.042, -0.08).rotation.x = -Math.PI / 2;
      break;
    case 'buku jadwal':
      tambah(g, badan(B(0.18, 0.035, 0.26), '#294D82', { t: 0.014 }), -0.1, 0.02, 0);
      tambah(g, badan(B(0.18, 0.035, 0.26), '#FFC400', { t: 0.014 }), 0.1, 0.02, 0);
      break;
    case 'rak kartu skill':
      tambah(g, badan(B(0.3, 0.08, 0.14), '#B38557', { t: 0.014 }), 0, 0.04, 0);
      ['#D94662', '#4FB8C4', '#FFC400', '#8CCB6B', '#B39DDB'].forEach((c, i) => tambah(g, badan(B(0.04, 0.16, 0.1), c, { t: 0.008 }), -0.12 + i * 0.06, 0.15, 0));
      break;
    case 'papan tulis kecil':
      tambah(g, badan(B(0.4, 0.3, 0.03), '#FFFFFF', { t: 0.014 }), 0, 0.2, 0).rotation.x = -0.1;
      tambah(g, badan(B(0.04, 0.12, 0.04), '#555b6b', { t: 0.01 }), 0, 0.06, -0.02);
      break;
    default:
      tambah(g, badan(C(0.05, 0.09, 12), '#FFFFFF', { t: 0.014 }), 0, 0.05, 0);
  }
  return g;
}

export function pintuKantor() {
  const g = new THREE.Group();
  const bingkai = toon('#3A4252');
  for (const sx of [-1, 1]) {
    const t = new THREE.Mesh(B(0.12, 2.5, 0.2), bingkai);
    t.position.set(sx * 0.7, 1.25, 0);
    g.add(t);
  }
  const atas = new THREE.Mesh(B(1.5, 0.12, 0.2), bingkai);
  atas.position.y = 2.5;
  g.add(atas);
  const daun = new THREE.Mesh(B(1.28, 2.4, 0.04), new THREE.MeshStandardMaterial({ color: '#BFD9EA', transparent: true, opacity: 0.25, depthWrite: false }));
  daun.position.y = 1.2;
  g.add(daun);
  return g;
}
