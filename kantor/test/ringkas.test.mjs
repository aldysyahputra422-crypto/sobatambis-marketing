import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { keadaanDemo } from '../runtime/public/assets/sa/demo.js';
import { isiDinding, namaTahap, statusHolo, urutanFokus } from '../runtime/public/assets/sa/ringkas.js';

const RUNTIME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime');
const roster = JSON.parse(fs.readFileSync(path.join(RUNTIME, 'roster.json'), 'utf8'));

test('urutanFokus: hanya yang bekerja, mengikuti urutan roster, direktur di depan', () => {
  const d = keadaanDemo(roster, Date.now(), 1); // animator, inspektur-frame, sutradara-suara bekerja
  const u = urutanFokus(d);
  assert.equal(u[0], 'ketua');
  const urutRoster = roster.agents.map((a) => a.agent);
  const kerja = u.slice(1);
  assert.deepEqual(new Set(kerja), new Set(['animator', 'inspektur-frame', 'sutradara-suara']));
  assert.deepEqual(kerja, urutRoster.filter((x) => kerja.includes(x)));
});

test('urutanFokus: tanpa yang bekerja kembali ke pemilik yang ditunggu, atau kosong', () => {
  const d = keadaanDemo(roster, Date.now(), 0);
  const sepi = { ...d, ketua: { ...d.ketua, state: 'santai' }, roster: d.roster.map((r) => ({ ...r, state: 'santai' })) };
  assert.deepEqual(urutanFokus(sepi), ['pemilik']); // skenario 0: Aldy ditunggu
  const santai = { ...sepi, pemilik: { ...sepi.pemilik, state: 'santai' } };
  assert.deepEqual(urutanFokus(santai), []);
  assert.deepEqual(urutanFokus(null), []);
  assert.deepEqual(urutanFokus({}), []);
});

test('isiDinding: tahap, agent aktif (maks 5), dan permintaan untuk Aldy', () => {
  const d = keadaanDemo(roster, Date.now(), 2);
  const w = isiDinding(d);
  assert.match(w.judul, /ep00/);
  assert.equal(w.tahap.length, 12);
  assert.equal(w.tahap.filter((t) => t.status === 'sekarang').length, 1);
  assert.equal(w.tahap.find((t) => t.status === 'sekarang').nama, 'Kemasan');
  assert.ok(w.tahap.filter((t) => t.status === 'lulus').length > 0);
  assert.ok(w.aktif.length >= 1 && w.aktif.length <= 5);
  for (const a of w.aktif) assert.ok(a.label && typeof a.tugas === 'string');
  assert.equal(w.sisa, Math.max(0, d.roster.filter((r) => r.state === 'bekerja').length - 5));
  assert.equal(w.butuh, '');
  const m = isiDinding(keadaanDemo(roster, Date.now(), 0));
  assert.match(m.butuh, /naskah/i);
});

test('isiDinding: tanpa produksi tetap aman dan tidak memuat angka karangan', () => {
  const w = isiDinding({ roster: [], ketua: null, pipeline: null, pemilik: null });
  assert.equal(w.judul, 'Belum ada produksi berjalan');
  assert.deepEqual(w.tahap, []);
  assert.deepEqual(w.aktif, []);
  assert.deepEqual(Object.keys(w).sort(), ['aktif', 'butuh', 'judul', 'sekarang', 'sisa', 'tahap']);
  assert.doesNotThrow(() => isiDinding(null));
});

test('statusHolo: menunggu Aldy = merah, ada yang bekerja = kuning, sepi = teal redup', () => {
  const tunggu = statusHolo(keadaanDemo(roster, Date.now(), 0));
  assert.equal(tunggu.mode, 'menunggu');
  const kerja = statusHolo(keadaanDemo(roster, Date.now(), 1));
  assert.equal(kerja.mode, 'bekerja');
  assert.ok(kerja.kecepatan > statusHolo(null).kecepatan);
  const diam = statusHolo(null);
  assert.equal(diam.mode, 'diam');
  assert.match(kerja.teks, /Qa Gerak|QA Gerak/);
  assert.notEqual(tunggu.warna, kerja.warna);
  assert.notEqual(kerja.warna, diam.warna);
});

test('namaTahap konsisten dengan papan di panel', () => {
  assert.equal(namaTahap('dialog_ok'), 'Dialog OK');
  assert.equal(namaTahap('qa_gerak'), 'QA Gerak');
  assert.equal(namaTahap('mix'), 'Mix');
});
