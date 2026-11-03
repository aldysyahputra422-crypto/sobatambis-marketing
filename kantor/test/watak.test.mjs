import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { BAWAHAN, GAYA_RAMBUT, MATA, MULUT, WATAK, WATAK_FREELANCER } from '../runtime/public/assets/sa/watak.js';

const RUNTIME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime');
const roster = JSON.parse(fs.readFileSync(path.join(RUNTIME, 'roster.json'), 'utf8'));
const hex = /^#[0-9A-Fa-f]{6}$/;

test('setiap agent, ketua, dan pemilik punya desain karakter', () => {
  const butuh = [...roster.agents.map((a) => a.agent), 'ketua', 'pemilik'].sort();
  assert.deepEqual(Object.keys(WATAK).sort(), butuh);
});

test('16 desain berasal dari lembar teman, 2 desain baru ditandai jelas', () => {
  const dariLembar = Object.entries(WATAK).filter(([, w]) => w.sumber.startsWith('lembar'));
  const baru = Object.entries(WATAK).filter(([, w]) => w.sumber.startsWith('desain baru'));
  assert.equal(dariLembar.length, 16);
  assert.deepEqual(baru.map(([k]) => k).sort(), ['pemilik', 'pencari-skill']);
  const posisi = dariLembar.map(([, w]) => w.sumber);
  assert.equal(new Set(posisi).size, 16, 'setiap posisi lembar dipakai sekali');
});

test('setiap karakter tampil berbeda: gaya rambut tidak ada yang sama', () => {
  const gaya = Object.values(WATAK).map((w) => w.rambut.gaya);
  assert.equal(new Set(gaya).size, gaya.length);
  for (const g of gaya) assert.ok(GAYA_RAMBUT.includes(g), g);
});

test('nilai ekspresi, bawahan, dan warna sah', () => {
  for (const [id, w] of Object.entries([...Object.entries(WATAK), ...WATAK_FREELANCER.map((f, i) => [`freelancer${i}`, f])].reduce((o, [k, v]) => ({ ...o, [k]: v }), {}))) {
    assert.ok(MATA.includes(w.mata), `${id}: mata ${w.mata}`);
    assert.ok(MULUT.includes(w.mulut), `${id}: mulut ${w.mulut}`);
    assert.ok(BAWAHAN.includes(w.bawah.jenis), `${id}: bawahan ${w.bawah.jenis}`);
    for (const k of [w.kulit, w.rambut.warna, w.baju.atas, w.bawah.warna, w.sepatu]) assert.match(k, hex, `${id}: ${k}`);
  }
});

test('ekspresi khas dari lembar dipertahankan', () => {
  assert.equal(WATAK['pembasmi-slop'].mulut, 'ternganga');
  assert.equal(WATAK['sutradara-suara'].mulut, 'gigi');
  assert.equal(WATAK['akuntan-token'].mata, 'x');
  assert.equal(WATAK['penulis-caption'].mata, 'x');
  assert.equal(WATAK['inspektur-frame'].mata, 'kosong');
  assert.equal(WATAK['perencana-konten'].mata, 'senyum');
  assert.ok(WATAK['pemeriksa-fakta'].kacamata && WATAK['penulis-naskah'].kacamata);
  assert.equal(WATAK.ketua.baju.dasi, '#F29B2E');
});
