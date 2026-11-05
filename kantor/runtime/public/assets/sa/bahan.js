// Bahan bersama: badan karakter memakai bahan lembut seperti mainan vinyl (bayangan halus, sedikit pantulan)
// dengan garis tepi tipis berwarna cokelat gelap, mengikuti lembar karakter teman pemilik.
import * as THREE from 'three';

let gradien = null;
function gradienToon() {
  if (gradien) return gradien;
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 1;
  const g = c.getContext('2d');
  ['#8d8d8d', '#bdbdbd', '#e6e6e6', '#ffffff'].forEach((col, i) => {
    g.fillStyle = col;
    g.fillRect(i, 0, 1, 1);
  });
  gradien = new THREE.CanvasTexture(c);
  gradien.minFilter = gradien.magFilter = THREE.NearestFilter;
  gradien.generateMipmaps = false;
  return gradien;
}

const cache = new Map();
export function toon(warna, extra = {}) {
  const kunci = warna + JSON.stringify(extra);
  if (!cache.has(kunci)) cache.set(kunci, new THREE.MeshToonMaterial({ color: warna, gradientMap: gradienToon(), ...extra }));
  return cache.get(kunci);
}

const stdCache = new Map();
// Bahan standar halus untuk perabot dan bangunan (tampilan render bersih seperti poster acuan); userData.gabung = boleh dilebur.
export function std(warna, { rough = 0.82, metal = 0, extra = {} } = {}) {
  const kunci = warna + rough + metal + JSON.stringify(extra);
  if (!stdCache.has(kunci)) {
    const m = new THREE.MeshStandardMaterial({ color: warna, roughness: rough, metalness: metal, ...extra });
    m.userData.gabung = true;
    stdCache.set(kunci, m);
  }
  return stdCache.get(kunci);
}

// Mesh perabot: bahan standar, tanpa outline tebal (outline hanya untuk karakter).
export function perabotBadan(geo, warna, opsi = {}) {
  const m = new THREE.Mesh(geo, std(warna, opsi));
  m.castShadow = opsi.cast !== false;
  m.receiveShadow = true;
  return m;
}

// Garis tepi: cokelat gelap dan tipis seperti di lembar, bukan hitam tebal.
export const GARIS = new THREE.MeshBasicMaterial({ color: '#4A3129', side: THREE.BackSide });
export const TEBAL_GARIS = 0.022;

// Gelapkan warna hex (dipakai untuk lekuk telinga dan lipatan).
export function gelapkan(hex, k = 0.85) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `#${((c(n >> 16) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).padStart(6, '0')}`;
}

const lembutCache = new Map();
// Badan karakter: halus, bayangan lembut, sedikit kilap (vinyl). userData.gabung = boleh dilebur per bahan.
export function lembut(warna, extra = {}) {
  const kunci = warna + JSON.stringify(extra);
  if (!lembutCache.has(kunci)) {
    const m = new THREE.MeshStandardMaterial({ color: warna, roughness: 0.62, metalness: 0.02, ...extra });
    m.userData.gabung = true;
    lembutCache.set(kunci, m);
  }
  return lembutCache.get(kunci);
}

// Outline: salinan geometri berhadapan-belakang, diperbesar sama tebal di semua sumbu (t meter).
export function garis(mesh, t = TEBAL_GARIS) {
  mesh.geometry.computeBoundingBox();
  const b = mesh.geometry.boundingBox;
  const sz = (a, c) => Math.max(c - a, 0.02);
  const sx = sz(b.min.x, b.max.x);
  const sy = sz(b.min.y, b.max.y);
  const sz2 = sz(b.min.z, b.max.z);
  const h = new THREE.Mesh(mesh.geometry, GARIS);
  h.scale.set(1 + (2 * t) / sx, 1 + (2 * t) / sy, 1 + (2 * t) / sz2);
  h.renderOrder = -1;
  h.userData.garis = true;
  mesh.add(h);
  return mesh;
}

export function badan(geo, warna, { t = TEBAL_GARIS, tanpaGaris = false, cast = true, extra = {} } = {}) {
  const m = new THREE.Mesh(geo, lembut(warna, extra));
  m.castShadow = cast;
  m.receiveShadow = true;
  if (!tanpaGaris) garis(m, t);
  return m;
}

export function canvasTekstur(w, h, gambar) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  gambar(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { tekstur: t, canvas: c, ctx };
}

export function bulatTeks(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
