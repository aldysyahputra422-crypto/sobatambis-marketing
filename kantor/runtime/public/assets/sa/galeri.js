// Galeri karakter (?galeri): semua desain berjajar untuk dibandingkan dengan lembar karakter. Tanpa data produksi.
import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { buatKarakter, perbarui } from './karakter.js';
import { WATAK } from './watak.js';

document.getElementById('loading')?.remove();
for (const s of ['.atas', '.panel', '.zonaNav']) document.querySelector(s)?.setAttribute('hidden', '');
const el = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
el.appendChild(renderer.domElement);
const label2d = new CSS2DRenderer({ element: document.getElementById('labels') });
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight('#ffffff', '#b8c2d0', 1.4));
const sun = new THREE.DirectionalLight('#ffffff', 1.0);
sun.position.set(2, 6, 8);
scene.add(sun);

// urutan seperti lembar: baris 1 kolom 1 ... baris 4 kolom 4, lalu desain baru
const urut = Object.entries(WATAK).sort(([, a], [, b]) => {
  const k = (w) => { const m = /baris (\d) kolom (\d)/.exec(w.sumber); return m ? Number(m[1]) * 10 + Number(m[2]) : 99; };
  return k(a) - k(b);
});
const KOLOM = 6;
const aktor = urut.map(([id, w], i) => {
  const kar = buatKarakter(w, { seed: i });
  kar.group.position.set((i % KOLOM - (KOLOM - 1) / 2) * 1.8, -Math.floor(i / KOLOM) * 2.4, 0);
  scene.add(kar.group);
  const d = document.createElement('div');
  d.className = 'zona-label';
  const t = document.createElement('span');
  t.textContent = id;
  d.append(t, document.createElement('i'));
  const l = new CSS2DObject(d);
  l.position.set(0, -0.15, 0);
  kar.group.add(l);
  return kar;
});
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
function ukuran() {
  const w = el.clientWidth;
  const h = el.clientHeight;
  renderer.setSize(w, h);
  label2d.setSize(w, h);
  camera.aspect = w / h;
  camera.position.set(0, -2.1, 19);
  camera.lookAt(0, -2.0, 0);
  camera.updateProjectionMatrix();
}
addEventListener('resize', ukuran);
ukuran();
const jam = new THREE.Clock();
(function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, jam.getDelta());
  for (const k of aktor) perbarui(k, jam.elapsedTime, dt);
  renderer.render(scene, camera);
  label2d.render(scene, camera);
})();
window.__siap = true;
