// Perabot kantor bergaya render bersih (bahan standar halus, tanpa outline), meniru poster "Italian Smart Office":
// meja putih dan kayu, kursi oranye, kursi tamu teal, loker warna-warni, dapur dan pulau, rak teal, meja baobab.
// Semua dibuat prosedural; posisi lokal terhadap titik lantai di tengah perabot (menghadap +z).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { bulatTeks, canvasTekstur, perabotBadan, std } from './bahan.js';

export const TINGGI_MEJA = 0.66;
export const TINGGI_DUDUK = 0.27;

// warna (dipakai juga oleh kantor3d)
export const W = {
  putih: '#F3F4F6', terang: '#E3E6EA', abu: '#9AA3AE', gelap: '#3A4048', kayu: '#BC8E60', kayuGelap: '#6F4B33',
  teal: '#4DB6C4', oranye: '#F08A4B', hijau: '#8CC152', biru: '#294D82', kuning: '#FFC400', merah: '#D94662',
};

const rb = (w, h, d, r = 0.05) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), std('#fff'));
const badan = (geo, warna, opsi = {}) => perabotBadan(geo, warna, opsi);
const bundar = (r, h, warna, seg = 28, opsi) => badan(new THREE.CylinderGeometry(r, r, h, seg), warna, opsi);
const kotak = (w, h, d, warna, opsi) => badan(new THREE.BoxGeometry(w, h, d), warna, opsi);
const lembut = (w, h, d, warna, r = 0.06, opsi = {}) => badan(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), warna, opsi);
const tambah = (g, o, x = 0, y = 0, z = 0, rot) => {
  o.position.set(x, y, z);
  if (rot) o.rotation.set(...rot);
  g.add(o);
  return o;
};
void rb;

// ------------------------------------------------------------------ meja dan kursi kerja
export function kursi(warna = W.oranye) {
  const g = new THREE.Group();
  tambah(g, lembut(0.5, 0.07, 0.48, warna, 0.03), 0, TINGGI_DUDUK, 0);
  tambah(g, lembut(0.46, 0.4, 0.06, warna, 0.03), 0, TINGGI_DUDUK + 0.24, -0.24, [-0.08, 0, 0]);
  tambah(g, bundar(0.03, 0.2, W.abu, 8), 0, 0.14, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    tambah(g, kotak(0.28, 0.025, 0.04, W.gelap), Math.cos(a) * 0.13, 0.04, Math.sin(a) * 0.13, [0, -a, 0]);
  }
  return g;
}

// Meja kerja: lokal (0,0,0) = titik lantai tengah meja; pekerja duduk di sisi utara (-z). Monitor di kanan agar wajah terlihat.
export function meja({ atas = W.putih, kaki = W.abu, layar = W.biru } = {}) {
  const g = new THREE.Group();
  tambah(g, lembut(1.5, 0.05, 0.78, atas, 0.02), 0, TINGGI_MEJA, 0);
  for (const sx of [-1, 1]) tambah(g, kotak(0.05, TINGGI_MEJA - 0.03, 0.7, kaki), sx * 0.7, (TINGGI_MEJA - 0.03) / 2, 0);
  tambah(g, kotak(1.4, 0.4, 0.03, kaki), 0, TINGGI_MEJA - 0.24, 0.33);
  tambah(g, lembut(0.46, 0.022, 0.18, W.terang, 0.01), -0.15, TINGGI_MEJA + 0.035, 0.12);
  const mon = new THREE.Group();
  tambah(mon, lembut(0.6, 0.4, 0.035, '#23272E', 0.012), 0, 0.3, 0);
  tambah(mon, kotak(0.05, 0.2, 0.04, W.abu), 0, 0.1, -0.02);
  const { tekstur, ctx } = canvasTekstur(128, 80, (c, w, h) => { c.fillStyle = '#10182b'; c.fillRect(0, 0, w, h); });
  const lay = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.35), new THREE.MeshBasicMaterial({ map: tekstur, toneMapped: false }));
  lay.position.set(0, 0.3, 0.02);
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
        ctx.fillRect(10 + (i % 2) * 8, 8 + i * 8.5, 30 + ((i * 37 + Math.floor(t * 3)) % 60), 4);
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
  tambah(g, bundar(0.045, 0.09, '#FFFFFF', 12), -0.62, TINGGI_MEJA + 0.07, 0.2);
  return { group: g, gambarLayar, propSlot: new THREE.Vector3(-0.38, TINGGI_MEJA + 0.03, -0.12) };
}

// Meja direktur: kayu gelap, lebih besar, dengan laci samping.
export function mejaEksekutif() {
  const m = meja({ atas: W.kayuGelap, kaki: '#4A3426' });
  tambah(m.group, kotak(0.4, 0.58, 0.7, '#5B3F2E'), 0.95, 0.31, 0);
  tambah(m.group, lembut(2.1, 0.05, 0.9, W.kayuGelap, 0.02), 0.2, TINGGI_MEJA + 0.001, 0);
  return m;
}

// ------------------------------------------------------------------ ruang kaca dan dinding
export function kaca(panjang, tinggi = 2.5, arah = 'x') {
  const g = new THREE.Group();
  const kacaMat = new THREE.MeshStandardMaterial({ color: '#C7E1F0', transparent: true, opacity: 0.2, roughness: 0.08, metalness: 0.1, depthWrite: false });
  tambah(g, new THREE.Mesh(new THREE.BoxGeometry(panjang, tinggi, 0.04), kacaMat), 0, tinggi / 2, 0);
  tambah(g, kotak(panjang, 0.06, 0.07, W.gelap), 0, tinggi, 0);
  tambah(g, kotak(panjang, 0.08, 0.07, W.gelap), 0, 0.04, 0);
  const n = Math.max(1, Math.round(panjang / 1.2));
  for (let i = 0; i <= n; i++) tambah(g, kotak(0.045, tinggi, 0.07, W.gelap), -panjang / 2 + (panjang * i) / n, tinggi / 2, 0);
  if (arah === 'z') g.rotation.y = Math.PI / 2;
  return g;
}

export function pintuKantor() {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) tambah(g, kotak(0.12, 2.5, 0.22, W.gelap), sx * 0.75, 1.25, 0);
  tambah(g, kotak(1.62, 0.12, 0.22, W.gelap), 0, 2.5, 0);
  tambah(g, new THREE.Mesh(new THREE.BoxGeometry(1.38, 2.4, 0.04), new THREE.MeshStandardMaterial({ color: '#C7E1F0', transparent: true, opacity: 0.22, depthWrite: false })), 0, 1.2, 0);
  return g;
}

// Dinding jendela besar (lantai-ke-langit-langit) dengan tiang hitam; kaca berlangit biru muda.
export function jendelaBesar(panjang, tinggi = 3.2) {
  const g = new THREE.Group();
  const langit = new THREE.Mesh(new THREE.PlaneGeometry(panjang, tinggi - 0.4), new THREE.MeshBasicMaterial({ color: '#DCEBF5' }));
  tambah(g, langit, 0, tinggi / 2, -0.05);
  const n = Math.max(2, Math.round(panjang / 1.3));
  for (let i = 0; i <= n; i++) tambah(g, kotak(0.07, tinggi, 0.14, '#23272E'), -panjang / 2 + (panjang * i) / n, tinggi / 2, 0);
  tambah(g, kotak(panjang, 0.1, 0.14, '#23272E'), 0, tinggi - 0.05, 0);
  tambah(g, kotak(panjang, 0.1, 0.14, '#23272E'), 0, 0.05, 0);
  tambah(g, kotak(panjang, 0.07, 0.14, '#23272E'), 0, tinggi * 0.45, 0);
  return g;
}

// ------------------------------------------------------------------ area kerja
export function kapsul() { // kapsul telepon putih (phone booth)
  const g = new THREE.Group();
  tambah(g, lembut(1.5, 2.3, 1.4, W.putih, 0.3), 0, 1.15, 0);
  tambah(g, lembut(1.1, 1.5, 0.05, '#BFD9E8', 0.1), 0, 1.4, 0.7, [0, 0, 0]);
  tambah(g, bundar(0.2, 0.05, W.hijau, 20), 0, 0.5, 0.2);
  tambah(g, kotak(1.6, 0.06, 1.5, W.terang), 0, 0.03, 0);
  return g;
}

export function papanTulis() {
  const g = new THREE.Group();
  tambah(g, lembut(1.6, 1.0, 0.04, '#FFFFFF', 0.01), 0, 1.4, 0);
  tambah(g, kotak(1.64, 0.04, 0.06, W.abu), 0, 0.88, 0.02);
  for (const sx of [-1, 1]) tambah(g, kotak(0.04, 1.0, 0.04, W.abu), sx * 0.7, 0.5, -0.05);
  return g;
}

export function mejaOval(panjang = 2.2, lebar = 1.0, warna = W.kayu) {
  const g = new THREE.Group();
  const top = bundar(0.5, 0.05, warna, 32);
  top.scale.set(panjang / 1.0, 1, lebar / 1.0);
  tambah(g, top, 0, 0.72, 0);
  tambah(g, bundar(0.06, 0.7, W.abu, 10), 0, 0.35, 0);
  return g;
}

export function mejaPanjang(panjang = 4.0, lebar = 1.0, warna = W.kayu, jumlahKursi = 3) {
  const g = new THREE.Group();
  tambah(g, lembut(panjang, 0.06, lebar, warna, 0.02), 0, 0.74, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tambah(g, kotak(0.05, 0.72, 0.05, W.gelap), sx * (panjang / 2 - 0.15), 0.36, sz * (lebar / 2 - 0.1));
  for (let i = 0; i < jumlahKursi; i++) {
    for (const sz of [-1, 1]) {
      const k = kursiHijau();
      tambah(g, k, -panjang / 2 + 0.7 + i * ((panjang - 1.4) / Math.max(1, jumlahKursi - 1)), 0, sz * (lebar / 2 + 0.38), [0, sz > 0 ? Math.PI : 0, 0]);
    }
  }
  return g;
}

export function kursiHijau() {
  const g = new THREE.Group();
  tambah(g, lembut(0.42, 0.05, 0.4, W.hijau, 0.03), 0, 0.46, 0);
  tambah(g, lembut(0.4, 0.3, 0.04, W.hijau, 0.02), 0, 0.64, -0.2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tambah(g, kotak(0.03, 0.44, 0.03, W.gelap), sx * 0.17, 0.22, sz * 0.15);
  return g;
}

// ------------------------------------------------------------------ resepsionis dan lobi
export function resepsionis() {
  const g = new THREE.Group();
  tambah(g, lembut(2.6, 1.0, 0.7, W.putih, 0.06), 0, 0.5, 0);
  tambah(g, lembut(2.7, 0.06, 0.85, W.terang, 0.02), 0, 1.03, 0);
  tambah(g, lembut(0.7, 1.0, 1.6, W.putih, 0.06), 1.65, 0.5, 0.45);
  tambah(g, lembut(0.8, 0.06, 1.7, W.terang, 0.02), 1.65, 1.03, 0.45);
  tambah(g, lembut(0.35, 0.02, 0.5, W.abu, 0.01), -0.4, 1.07, 0.0);
  return g;
}

// Papan status 12 tahap (kanvas): tahap lulus bercentang, tahap berjalan menyala kuning.
export function papanStatus() {
  const g = new THREE.Group();
  tambah(g, lembut(2.5, 1.6, 0.09, '#23272E', 0.03), 0, 1.4, 0);
  for (const sx of [-1, 1]) tambah(g, kotak(0.07, 0.62, 0.07, W.abu), sx * 1.0, 0.3, -0.05);
  const { tekstur, ctx } = canvasTekstur(512, 320, () => {});
  const layar = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 1.48), new THREE.MeshBasicMaterial({ map: tekstur, toneMapped: false }));
  layar.position.set(0, 1.4, 0.05);
  g.add(layar);
  const gambar = (pipeline, pemilik) => {
    ctx.fillStyle = '#0F1E3F';
    ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = '#FFC400';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText(pipeline ? `PRODUKSI: ${String(pipeline.episode || '').slice(0, 24)}` : 'PRODUKSI: tidak ada', 16, 32);
    const nama = pipeline ? pipeline.tahap : [];
    const lulus = new Set(pipeline ? pipeline.lulus : []);
    nama.forEach((t, i) => {
      const x = 16 + (i % 2) * 250;
      const y = 56 + Math.floor(i / 2) * 38;
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
      ctx.fillText(`MENUNGGU ALDY: ${String(pemilik.status || '')}`, 28, 306);
    }
    tekstur.needsUpdate = true;
  };
  gambar(null, null);
  return { group: g, gambar };
}

// ------------------------------------------------------------------ loker, dapur, rak
export function loker(panjang = 4.4, tinggi = 2.5) {
  const g = new THREE.Group();
  tambah(g, kotak(panjang, tinggi, 0.5, '#9CA4AE'), 0, tinggi / 2, 0); // blok dinding abu
  const warna = [W.teal, W.oranye, W.hijau, W.kuning, '#5B8DEF', '#B39DDB', W.teal];
  const kolom = 7;
  const lebar = (panjang - 0.3) / kolom;
  for (let c = 0; c < kolom; c++) {
    for (let r = 0; r < 3; r++) {
      const p = lembut(lebar - 0.05, (tinggi - 0.4) / 3 - 0.05, 0.05, warna[(c * 2 + r * 3) % warna.length], 0.015);
      tambah(g, p, -panjang / 2 + 0.15 + lebar * (c + 0.5), 0.2 + ((tinggi - 0.4) / 3) * (r + 0.5), 0.27);
      tambah(g, kotak(0.02, 0.1, 0.03, '#E8ECF0'), -panjang / 2 + 0.15 + lebar * (c + 0.5) + lebar * 0.28, 0.2 + ((tinggi - 0.4) / 3) * (r + 0.5), 0.31);
    }
  }
  return g;
}

export function dapur(panjang = 3.5) {
  const g = new THREE.Group();
  tambah(g, kotak(panjang, 2.5, 0.9, '#A7AEB7'), 0, 1.25, 0); // blok tinggi abu
  tambah(g, kotak(panjang - 0.3, 0.9, 0.3, '#EDEFF2'), 0, 0.45, 0.58); // kabinet bawah
  tambah(g, kotak(panjang - 0.2, 0.05, 0.4, '#2F353D'), 0, 0.92, 0.58);
  tambah(g, lembut(1.0, 1.0, 0.1, '#1E2227', 0.03), -0.7, 1.6, 0.47); // oven hitam
  tambah(g, lembut(0.9, 0.5, 0.1, '#B8BEC6', 0.03), 0.7, 1.5, 0.47); // lemari
  tambah(g, kotak(panjang - 0.4, 0.05, 0.25, W.putih), 0.2, 2.1, 0.5);
  return g;
}

export function pulau(panjang = 2.8) {
  const g = new THREE.Group();
  tambah(g, kotak(panjang, 0.9, 0.9, '#E9ECEF'), 0, 0.45, 0);
  tambah(g, lembut(panjang + 0.1, 0.06, 1.0, '#2F353D', 0.02), 0, 0.93, 0);
  tambah(g, bundar(0.15, 0.03, W.abu, 16), -0.5, 0.97, 0.1);
  for (let i = 0; i < 3; i++) {
    const s = bangku(i % 2 ? W.putih : W.oranye);
    tambah(g, s, -panjang / 2 + 0.6 + i * 0.8, 0, -0.85);
  }
  return g;
}

export function bangku(warna = W.hijau) {
  const g = new THREE.Group();
  tambah(g, bundar(0.2, 0.05, warna, 16), 0, 0.72, 0);
  tambah(g, bundar(0.025, 0.7, W.abu, 8), 0, 0.36, 0);
  tambah(g, bundar(0.16, 0.03, W.gelap, 14), 0, 0.02, 0);
  return g;
}

export function rakBuku(panjang = 3.4, tinggi = 2.3) {
  const g = new THREE.Group();
  tambah(g, kotak(panjang, tinggi, 0.38, W.putih), 0, tinggi / 2, 0);
  const warna = [W.teal, '#BFE3EA', W.putih, W.teal, '#8ED0DA'];
  const kolom = 6;
  const baris = 4;
  for (let c = 0; c < kolom; c++) {
    for (let r = 0; r < baris; r++) {
      if ((c * 3 + r * 2) % 5 === 0) continue;
      tambah(g, kotak((panjang - 0.2) / kolom - 0.08, (tinggi - 0.2) / baris - 0.1, 0.05, warna[(c + r) % warna.length]), -panjang / 2 + 0.1 + ((panjang - 0.2) / kolom) * (c + 0.5), 0.15 + ((tinggi - 0.2) / baris) * (r + 0.5), 0.2);
    }
  }
  return g;
}

// ------------------------------------------------------------------ lounge
export function kursiTamu(warna = W.teal, tinggi = true) { // kursi tamu bersandaran tinggi (booth)
  const g = new THREE.Group();
  tambah(g, lembut(1.0, 0.32, 0.9, warna, 0.12), 0, 0.2, 0);
  tambah(g, lembut(1.0, tinggi ? 1.25 : 0.65, 0.22, warna, 0.12), 0, tinggi ? 0.7 : 0.5, -0.38);
  for (const sx of [-1, 1]) tambah(g, lembut(0.2, tinggi ? 0.75 : 0.5, 0.9, warna, 0.1), sx * 0.45, tinggi ? 0.45 : 0.36, 0);
  if (tinggi) for (const sx of [-1, 1]) tambah(g, lembut(0.16, 0.9, 0.5, warna, 0.08), sx * 0.46, 0.8, -0.2);
  return g;
}

export function kursiOranye() {
  const g = new THREE.Group();
  tambah(g, lembut(0.8, 0.26, 0.75, W.oranye, 0.1), 0, 0.22, 0);
  tambah(g, lembut(0.8, 0.5, 0.18, W.oranye, 0.09), 0, 0.5, -0.3);
  for (const sx of [-1, 1]) tambah(g, lembut(0.14, 0.4, 0.75, W.oranye, 0.07), sx * 0.34, 0.34, 0);
  return g;
}

export function pouf(warna = W.hijau, r = 0.32, h = 0.4) {
  const g = new THREE.Group();
  tambah(g, bundar(r, h, warna, 24), 0, h / 2, 0);
  return g;
}

export function sofaL(panjang = 4.4, sayap = 2.4, warna = W.teal) {
  const g = new THREE.Group();
  tambah(g, lembut(panjang, 0.34, 0.9, warna, 0.1), 0, 0.2, 0);
  tambah(g, lembut(panjang, 0.7, 0.22, warna, 0.1), 0, 0.55, -0.34);
  tambah(g, lembut(0.9, 0.34, sayap, warna, 0.1), panjang / 2 - 0.45, 0.2, sayap / 2 + 0.45);
  tambah(g, lembut(0.22, 0.7, sayap, warna, 0.1), panjang / 2 - 0.02, 0.55, sayap / 2 + 0.45);
  for (const sx of [-1, 1]) tambah(g, lembut(0.18, 0.55, 0.9, warna, 0.08), sx * (panjang / 2 - 0.09), 0.35, 0);
  return g;
}

export function mejaBundar(r = 0.5, warna = W.putih, tinggi = 0.5) {
  const g = new THREE.Group();
  tambah(g, bundar(r, 0.04, warna, 28), 0, tinggi, 0);
  tambah(g, bundar(0.04, tinggi, W.abu, 8), 0, tinggi / 2, 0);
  tambah(g, bundar(0.22, 0.03, W.abu, 16), 0, 0.015, 0);
  return g;
}

export function foosball() {
  const g = new THREE.Group();
  tambah(g, lembut(1.8, 0.14, 1.0, '#2F8F55', 0.03), 0, 0.72, 0);
  tambah(g, lembut(1.9, 0.12, 1.1, W.putih, 0.03), 0, 0.62, 0);
  for (const sx of [-0.8, 0.8]) for (const sz of [-0.45, 0.45]) tambah(g, kotak(0.08, 0.6, 0.08, W.gelap), sx, 0.3, sz);
  for (const x of [-0.55, -0.18, 0.18, 0.55]) {
    tambah(g, badan(new THREE.CylinderGeometry(0.014, 0.014, 1.2, 6), W.abu), x, 0.84, 0, [Math.PI / 2, 0, 0]);
    for (const z of [-0.2, 0.2]) tambah(g, kotak(0.07, 0.13, 0.05, x < 0 ? W.merah : W.kuning), x, 0.78, z);
  }
  return g;
}

// Meja baobab: meja kayu bundar dengan hiasan tengah hijau berbentuk daun, dikelilingi 8 kursi gelap.
export function baobab() {
  const g = new THREE.Group();
  tambah(g, bundar(1.3, 0.06, W.kayu, 40), 0, 0.74, 0);
  tambah(g, bundar(0.18, 0.7, W.kayuGelap, 12), 0, 0.37, 0);
  tambah(g, bundar(0.6, 0.04, W.kayuGelap, 24), 0, 0.02, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const d = badan(new THREE.SphereGeometry(0.34, 16, 10), W.hijau);
    d.scale.set(1, 0.35, 1);
    tambah(g, d, Math.cos(a) * 0.42, 1.0, Math.sin(a) * 0.42);
  }
  tambah(g, bundar(0.12, 0.3, W.kayuGelap, 10), 0, 0.92, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const k = new THREE.Group();
    tambah(k, lembut(0.42, 0.05, 0.4, '#2B3038', 0.03), 0, 0.46, 0);
    tambah(k, lembut(0.4, 0.34, 0.04, '#2B3038', 0.02), 0, 0.68, -0.2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tambah(k, kotak(0.03, 0.44, 0.03, W.gelap), sx * 0.17, 0.22, sz * 0.15);
    tambah(g, k, Math.cos(a) * 1.75, 0, Math.sin(a) * 1.75, [0, -a + Math.PI / 2, 0]);
  }
  return g;
}

export function kiosOranye() { // "coffice": kios oranye dengan layar dan bangku tinggi
  const g = new THREE.Group();
  tambah(g, lembut(1.1, 2.0, 0.55, W.oranye, 0.08), 0, 1.0, 0);
  tambah(g, lembut(0.8, 0.9, 0.04, '#1E2227', 0.02), 0, 1.35, 0.29);
  tambah(g, lembut(0.9, 0.05, 0.4, W.putih, 0.02), 0, 0.95, 0.4);
  for (const sx of [-1, 1]) tambah(g, bangku(sx > 0 ? W.hijau : W.teal), sx * 0.45, 0, 0.9);
  return g;
}

// ------------------------------------------------------------------ dekorasi
// Layar datar di dinding (ruang rapat). Menghadap +z.
export function layarDinding(panjang = 2.2, tinggi = 1.3) {
  const g = new THREE.Group();
  tambah(g, lembut(panjang, tinggi, 0.07, '#23272E', 0.03), 0, 0, 0);
  const l = new THREE.Mesh(new THREE.PlaneGeometry(panjang - 0.12, tinggi - 0.12), new THREE.MeshBasicMaterial({ color: '#16305C', toneMapped: false }));
  l.position.z = 0.04;
  g.add(l);
  return g;
}

// Panel lampu tanam di langit-langit: bidang menyala sebagai bingkai cahaya hangat.
export function panelLampu(panjang = 2.4, lebar = 0.5, warna = '#FFF2DC') {
  const g = new THREE.Group();
  tambah(g, kotak(panjang + 0.12, 0.08, lebar + 0.12, '#D8DCE2', { cast: false }), 0, 0.04, 0);
  const l = new THREE.Mesh(new THREE.PlaneGeometry(panjang, lebar), new THREE.MeshBasicMaterial({ color: warna, toneMapped: false }));
  l.rotation.x = Math.PI / 2;
  l.position.y = -0.005;
  g.add(l);
  return g;
}

// Menara di kejauhan: dilihat dari dalam lewat fasad kaca, membuat kantor terasa di lantai atas gedung.
export function menara(lebar, tinggi, dalam, warna) {
  const g = new THREE.Group();
  const b = kotak(lebar, tinggi, dalam, warna, { cast: false });
  b.receiveShadow = false;
  tambah(g, b, 0, tinggi / 2, 0);
  const { tekstur } = canvasTekstur(64, 256, (c, w, h) => {
    c.fillStyle = 'rgba(0,0,0,0)';
    c.fillRect(0, 0, w, h);
    let seed = 5;
    const acak = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let y = 8; y < h - 8; y += 16) {
      for (let x = 6; x < w - 6; x += 14) {
        c.fillStyle = acak() > 0.45 ? 'rgba(255,230,180,0.85)' : 'rgba(120,140,170,0.45)';
        c.fillRect(x, y, 8, 9);
      }
    }
  });
  for (const [sx, sz, ry] of [[0, dalam / 2 + 0.01, 0], [0, -dalam / 2 - 0.01, Math.PI]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(lebar * 0.86, tinggi * 0.92), new THREE.MeshBasicMaterial({ map: tekstur, transparent: true, toneMapped: false }));
    m.position.set(sx, tinggi / 2, sz);
    m.rotation.y = ry;
    g.add(m);
  }
  return g;
}

export function tanaman(skala = 1) {
  const g = new THREE.Group();
  tambah(g, badan(new THREE.CylinderGeometry(0.22, 0.17, 0.34, 14), '#F2F2F2'), 0, 0.17, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const d = badan(new THREE.SphereGeometry(0.2 + (i % 2) * 0.05, 10, 8), i % 2 ? '#5DAF63' : '#4A9A58');
    tambah(g, d, Math.cos(a) * 0.14, 0.55 + (i % 3) * 0.13, Math.sin(a) * 0.14);
  }
  g.scale.setScalar(skala);
  return g;
}

// Karpet gelap (persegi atau bundar) setipis lembaran di lantai.
export function karpet(lebar, dalam, warna = '#454B54', bundarr = false) {
  const m = bundarr ? bundar(lebar / 2, 0.02, warna, 40, { cast: false }) : kotak(lebar, 0.02, dalam, warna, { cast: false });
  m.castShadow = false;
  return m;
}

// ------------------------------------------------------------------ benda khas per peran (di meja)
export function benda(nama) {
  const g = new THREE.Group();
  switch (nama) {
    case 'pulpen':
      tambah(g, bundar(0.05, 0.1, '#FFFFFF', 10), 0, 0.05, 0);
      for (const [x, c] of [[-0.02, W.biru], [0.02, W.merah]]) tambah(g, bundar(0.008, 0.16, c, 6), x, 0.15, 0, [0, 0, x * 6]);
      break;
    case 'buku catatan':
      tambah(g, lembut(0.22, 0.04, 0.3, W.kuning, 0.01), 0, 0.02, 0);
      tambah(g, lembut(0.2, 0.025, 0.28, '#FFFFFF', 0.01), 0.005, 0.05, 0);
      break;
    case 'kaca pembesar':
      tambah(g, badan(new THREE.TorusGeometry(0.09, 0.016, 8, 18), '#3A4252'), 0, 0.24, 0);
      tambah(g, new THREE.Mesh(new THREE.CircleGeometry(0.085, 18), new THREE.MeshBasicMaterial({ color: '#BFD9EA', transparent: true, opacity: 0.5 })), 0, 0.24, 0.002);
      tambah(g, bundar(0.014, 0.15, '#3A4252', 6), -0.12, 0.12, 0, [0, 0, -0.5]);
      break;
    case 'headphone':
      tambah(g, badan(new THREE.TorusGeometry(0.1, 0.02, 8, 18, Math.PI), '#2A2F3C'), 0, 0.1, 0);
      for (const s of [-1, 1]) tambah(g, bundar(0.055, 0.05, W.kuning, 12), s * 0.1, 0.05, 0, [0, 0, Math.PI / 2]);
      break;
    case 'mikrofon kecil':
      tambah(g, bundar(0.05, 0.02, '#37404F', 12), 0, 0.01, 0);
      tambah(g, bundar(0.012, 0.26, '#37404F', 6), 0, 0.14, 0);
      tambah(g, badan(new THREE.SphereGeometry(0.06, 12, 8), '#C9CED6'), 0, 0.3, 0);
      break;
    case 'tablet gambar':
      tambah(g, lembut(0.34, 0.025, 0.24, '#2A2F3C', 0.01), 0, 0.05, 0, [-0.25, 0, 0]);
      tambah(g, new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshBasicMaterial({ color: W.teal })), 0, 0.066, 0, [-Math.PI / 2 - 0.25, 0, 0]);
      break;
    case 'pensil':
      tambah(g, bundar(0.05, 0.1, W.oranye, 10), 0, 0.05, 0);
      for (const x of [-0.015, 0.02]) tambah(g, bundar(0.009, 0.18, W.kuning, 6), x, 0.16, 0, [0, 0, x * 5]);
      break;
    case 'layar kecil':
      tambah(g, lembut(0.3, 0.22, 0.03, '#23232d', 0.01), 0, 0.15, 0);
      tambah(g, kotak(0.05, 0.08, 0.04, W.abu), 0, 0.04, 0);
      tambah(g, new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.18), new THREE.MeshBasicMaterial({ color: W.kuning })), 0, 0.15, 0.017);
      break;
    case 'palet cat':
      tambah(g, bundar(0.14, 0.02, '#F2E2C4', 18), 0, 0.02, 0);
      [W.merah, W.teal, W.kuning, W.hijau].forEach((c, i) => tambah(g, bundar(0.028, 0.012, c, 8), Math.cos(i * 1.6) * 0.07, 0.035, Math.sin(i * 1.6) * 0.07));
      break;
    case 'kamera':
      tambah(g, lembut(0.22, 0.14, 0.12, '#2A2F3C', 0.02), 0, 0.08, 0);
      tambah(g, bundar(0.05, 0.08, '#C9CED6', 12), 0, 0.08, 0.1, [Math.PI / 2, 0, 0]);
      break;
    case 'teropong':
      for (const s of [-1, 1]) tambah(g, bundar(0.04, 0.2, '#2A2F3C', 10), s * 0.05, 0.06, 0, [Math.PI / 2, 0, 0]);
      break;
    case 'kalender': {
      const { tekstur } = canvasTekstur(128, 128, (c) => {
        c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 128);
        c.fillStyle = W.merah; c.fillRect(0, 0, 128, 30);
        c.fillStyle = '#3A4252';
        for (let i = 0; i < 20; i++) c.fillRect(10 + (i % 5) * 22, 44 + Math.floor(i / 5) * 20, 14, 10);
      });
      tambah(g, new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), new THREE.MeshBasicMaterial({ map: tekstur })), 0, 0.16, 0, [-0.2, 0, 0]);
      tambah(g, kotak(0.28, 0.28, 0.02, '#3A4252'), 0, 0.16, -0.015, [-0.2, 0, 0]);
      break;
    }
    case 'papan centang': {
      tambah(g, kotak(0.26, 0.34, 0.02, W.kayu), 0, 0.2, 0, [-0.15, 0, 0]);
      const { tekstur } = canvasTekstur(64, 80, (c) => {
        c.fillStyle = '#fff'; c.fillRect(0, 0, 64, 80);
        c.strokeStyle = '#2A9D8F'; c.lineWidth = 6; c.beginPath(); c.moveTo(12, 40); c.lineTo(26, 54); c.lineTo(52, 20); c.stroke();
      });
      tambah(g, new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), new THREE.MeshBasicMaterial({ map: tekstur })), 0, 0.2, 0.014, [-0.15, 0, 0]);
      break;
    }
    case 'kalkulator':
      tambah(g, lembut(0.2, 0.04, 0.28, '#3A4252', 0.01), 0, 0.02, 0);
      tambah(g, new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.06), new THREE.MeshBasicMaterial({ color: W.hijau })), 0, 0.042, -0.08, [-Math.PI / 2, 0, 0]);
      break;
    case 'buku jadwal':
      tambah(g, lembut(0.18, 0.035, 0.26, W.biru, 0.01), -0.1, 0.02, 0);
      tambah(g, lembut(0.18, 0.035, 0.26, W.kuning, 0.01), 0.1, 0.02, 0);
      break;
    case 'rak kartu skill':
      tambah(g, kotak(0.3, 0.08, 0.14, W.kayu), 0, 0.04, 0);
      [W.merah, W.teal, W.kuning, W.hijau, '#B39DDB'].forEach((c, i) => tambah(g, kotak(0.04, 0.16, 0.1, c), -0.12 + i * 0.06, 0.15, 0));
      break;
    case 'papan tulis kecil':
      tambah(g, lembut(0.4, 0.3, 0.03, '#FFFFFF', 0.01), 0, 0.2, 0, [-0.1, 0, 0]);
      tambah(g, kotak(0.04, 0.12, 0.04, W.abu), 0, 0.06, -0.02);
      break;
    default:
      tambah(g, bundar(0.05, 0.09, '#FFFFFF', 12), 0, 0.05, 0);
  }
  return g;
}
