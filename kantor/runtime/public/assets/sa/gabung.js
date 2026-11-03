// Penggabung geometri: mengurangi draw call. Mesh ber-bahan toon (dan outline GARIS) dalam satu kelompok dilebur
// menjadi satu mesh per bahan. Mesh animasi tidak boleh digabung lintas sendi, jadi karakter digabung per sendi.
import * as THREE from 'three';
import { GARIS } from './bahan.js';

const bisaGabung = (m) => m.isMesh && !Array.isArray(m.material) && m.geometry?.index && (m.material === GARIS || m.material.isMeshToonMaterial || m.material.userData.gabung) && !m.userData.dinamis;

function kumpul(simpul, sendi, hasil) {
  for (const c of simpul.children) {
    if (sendi.has(c)) continue;
    if (bisaGabung(c)) hasil.push(c);
    if (c.children.length) kumpul(c, sendi, hasil);
  }
}

export function gabungGeometri(daftar) {
  let nv = 0;
  let ni = 0;
  for (const g of daftar) {
    nv += g.attributes.position.count;
    ni += g.index.count;
  }
  const pos = new Float32Array(nv * 3);
  const nor = new Float32Array(nv * 3);
  const uv = new Float32Array(nv * 2);
  const idx = new Uint32Array(ni);
  let ov = 0;
  let oi = 0;
  for (const g of daftar) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, ov * 3);
    nor.set(g.attributes.normal.array, ov * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, ov * 2);
    for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.array[i] + ov;
    ov += n;
    oi += g.index.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}

// Gabungkan semua mesh yang bisa digabung di bawah `akar`, kecuali yang berada di bawah simpul dalam `sendi`.
export function gabungKelompok(akar, sendi = new Set()) {
  akar.updateWorldMatrix(true, true);
  const balik = new THREE.Matrix4().copy(akar.matrixWorld).invert();
  const daftar = [];
  kumpul(akar, sendi, daftar);
  const perBahan = new Map();
  for (const m of daftar) {
    if (!perBahan.has(m.material)) perBahan.set(m.material, []);
    perBahan.get(m.material).push(m);
  }
  for (const [bahan, meshes] of perBahan) {
    const geos = meshes.map((m) => {
      const g = m.geometry.clone();
      g.applyMatrix4(balik.clone().multiply(m.matrixWorld));
      return g;
    });
    const hasil = new THREE.Mesh(gabungGeometri(geos), bahan);
    hasil.userData.gabungan = true;
    if (bahan === GARIS) {
      hasil.renderOrder = -1;
      hasil.userData.garis = true;
    } else {
      hasil.castShadow = meshes.some((m) => m.castShadow);
      hasil.receiveShadow = true;
    }
    for (const g of geos) g.dispose();
    akar.add(hasil);
  }
  for (const m of daftar) m.removeFromParent();
  return daftar.length;
}

// Karakter: gabung per sendi supaya animasi tetap jalan.
export function gabungKarakter(kar) {
  const sendi = new Set([...kar.sendi.ul, ...kar.sendi.ll, ...kar.sendi.ua, ...kar.sendi.la, kar.kepala]);
  gabungKelompok(kar.akar, sendi);
  for (const j of sendi) gabungKelompok(j, sendi);
}
