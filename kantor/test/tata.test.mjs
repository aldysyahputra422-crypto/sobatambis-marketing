import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  ALUR, jalur, jalurKeluar, jalurMasuk, LANTAI, LOUNGE, MEJA, MEJA_CADANGAN, MEJA_KETUA, PEMILIK_KURSI, PINTU, RINTANGAN, TAHAP_ZONA, ZONA, zonaDariNama,
} from '../runtime/public/assets/sa/tata.js';
import { keadaanDemo, SKENARIO } from '../runtime/public/assets/sa/demo.js';

const RUNTIME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime');
const roster = JSON.parse(fs.readFileSync(path.join(RUNTIME, 'roster.json'), 'utf8'));
const dalam = ([x0, z0, x1, z1], [x, z]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const TAHAP = ['naskah', 'suara', 'dialog_ok', 'adegan', 'mix', 'render_draf', 'qa_gerak', 'render', 'qa_final', 'kemasan', 'video_ok', 'gerbang'];

test('setiap agent di roster punya meja di zonanya, di dalam kotak zona', () => {
  for (const a of roster.agents) {
    const m = MEJA[a.agent];
    assert.ok(m, `meja ${a.agent}`);
    assert.equal(zonaDariNama(a.zona), m.zona, `zona ${a.agent}`);
    assert.ok(dalam(ZONA[m.zona].rect, [m.x, m.z]), `${a.agent} di luar zona ${m.zona}`);
  }
  assert.equal(Object.keys(MEJA).length, roster.agents.length, 'tidak ada meja yatim');
});

test('zona tidak saling tumpang dan seluruhnya di dalam lantai', () => {
  const z = Object.entries(ZONA);
  for (const [id, { rect }] of z) {
    assert.ok(rect[0] >= LANTAI[0] && rect[1] >= LANTAI[1] && rect[2] <= LANTAI[2] && rect[3] <= LANTAI[3], `${id} keluar lantai`);
  }
  for (let i = 0; i < z.length; i++) {
    for (let j = i + 1; j < z.length; j++) {
      const [a, b] = [z[i][1].rect, z[j][1].rect];
      const tumpang = a[0] < b[2] - 1e-9 && a[2] > b[0] + 1e-9 && a[1] < b[3] - 1e-9 && a[3] > b[1] + 1e-9;
      assert.ok(!tumpang, `${z[i][0]} tumpang ${z[j][0]}`);
    }
  }
});

test('ketua, pemilik, dan meja cadangan berada di zona yang benar', () => {
  assert.equal(zonaDariNama(roster.ketua.zona), 'direktur');
  assert.ok(dalam(ZONA.direktur.rect, [MEJA_KETUA.x, MEJA_KETUA.z]));
  assert.equal(zonaDariNama(roster.pemilik.zona), 'lobi');
  assert.ok(dalam(ZONA.lobi.rect, [PEMILIK_KURSI.x, PEMILIK_KURSI.z]));
  assert.equal(MEJA_CADANGAN.length, 4);
  for (const m of MEJA_CADANGAN) assert.ok(dalam(ZONA.produksi.rect, [m.x, m.z]));
});

test('tidak ada dua meja bertabrakan', () => {
  const semua = [...Object.entries(MEJA), ...MEJA_CADANGAN.map((m, i) => [`cadangan${i}`, m]), ['ketua', MEJA_KETUA]];
  for (let i = 0; i < semua.length; i++) {
    for (let j = i + 1; j < semua.length; j++) {
      const [a, b] = [semua[i][1], semua[j][1]];
      assert.ok(Math.abs(a.x - b.x) >= 1.6 || Math.abs(a.z - b.z) >= 1.6, `${semua[i][0]} bertabrakan dengan ${semua[j][0]}`);
    }
  }
});

test('tempat santai cukup untuk semua agent dan berada di dalam lantai', () => {
  assert.ok(LOUNGE.length >= roster.agents.length);
  for (const s of LOUNGE) {
    assert.ok(dalam(LANTAI, [s.x, s.z]), `spot ${s.x},${s.z} di luar lantai`);
    assert.ok(['duduk', 'berdiri'].includes(s.modus));
    assert.equal(typeof s.via, 'number');
  }
});

test('semua tahap pipeline punya zona dan zonanya ada', () => {
  for (const t of TAHAP) assert.ok(ZONA[TAHAP_ZONA[t]], t);
});

test('garis alur lurus sumbu x atau z', () => {
  assert.ok(ALUR.length >= 3);
  for (let i = 1; i < ALUR.length; i++) assert.ok(ALUR[i][0] === ALUR[i - 1][0] || ALUR[i][1] === ALUR[i - 1][1], `segmen ${i} miring`);
});

test('skenario demo memakai agent yang ada dan tahap yang sah', () => {
  const ids = new Set(roster.agents.map((a) => a.agent));
  assert.ok(SKENARIO.length >= 3);
  for (let i = 0; i < SKENARIO.length; i++) {
    const d = keadaanDemo(roster, Date.now(), i);
    assert.equal(d.demo, true);
    assert.equal(d.roster.length, 16);
    for (const r of d.roster) assert.ok(ids.has(r.agent));
    assert.ok(TAHAP.includes(d.pipeline.sekarang));
    assert.ok(['menunggu', 'santai'].includes(d.pemilik.state));
    assert.ok(d.roster.some((r) => r.state === 'bekerja'), `skenario ${i} tanpa yang bekerja`);
  }
});

// ---- jalur jalan: lurus, tidak menembus meja atau benda besar, dan menembus kaca hanya lewat pintu
const kotakMeja = (m) => [m.x - 0.75, m.z + 0.38, m.x + 0.75, m.z + 1.18];
const semuaMeja = () => [...Object.values(MEJA), MEJA_KETUA, ...MEJA_CADANGAN].map(kotakMeja);
function menabrak(a, b, [x0, z0, x1, z1]) {
  const [sx0, sx1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [sz0, sz1] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  return sx1 > x0 && sx0 < x1 && sz1 > z0 && sz0 < z1;
}
function periksaRute(nama, mulai, titik) {
  const pts = [mulai, ...titik];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    assert.ok(a[0] === b[0] || a[1] === b[1], `${nama}: segmen ${i} miring ${a} → ${b}`);
    for (const k of semuaMeja()) assert.ok(!menabrak(a, b, k), `${nama}: segmen ${i} (${a} → ${b}) menembus meja ${k}`);
    for (const [r, k] of Object.entries(RINTANGAN)) assert.ok(!menabrak(a, b, k), `${nama}: segmen ${i} (${a} → ${b}) menembus ${r}`);
    // dinding kaca ruang belakang (z = -3.5): hanya boleh dilewati di pintu
    if (a[0] === b[0] && Math.min(a[1], b[1]) < -3.5 && Math.max(a[1], b[1]) > -3.5) {
      const ruang = Object.entries(PINTU).find(([id]) => a[0] >= ZONA[id].rect[0] && a[0] <= ZONA[id].rect[2]);
      if (ruang) assert.ok(Math.abs(a[0] - ruang[1][0]) <= 0.7, `${nama}: menembus kaca ${ruang[0]} di x=${a[0]} (pintu ${ruang[1][0]})`);
    }
  }
}

test('setiap agent berjalan dari mejanya ke lounge dan kembali dengan rute yang sah', () => {
  roster.agents.forEach((a, i) => {
    const m = { ...MEJA[a.agent] };
    const l = LOUNGE[i];
    periksaRute(`${a.agent} → lounge`, [m.x, m.z], jalur(m, l));
    periksaRute(`lounge → ${a.agent}`, [l.x, l.z], jalur(l, m));
  });
});

test('freelancer masuk dan keluar lewat pintu kantor ke meja cadangan dengan rute yang sah', () => {
  MEJA_CADANGAN.forEach((m, i) => {
    periksaRute(`masuk cadangan${i}`, [-18.6, 7.2], jalurMasuk(m));
    periksaRute(`keluar cadangan${i}`, [m.x, m.z], jalurKeluar(m));
  });
});

test('pintu kaca berada di dalam ruangnya dan tidak menempel dinding', () => {
  for (const [zona, p] of Object.entries(PINTU)) {
    const [x0, , x1] = ZONA[zona].rect;
    assert.ok(p[0] > x0 + 0.8 && p[0] < x1 - 0.8, `${zona}: pintu terlalu dekat dinding`);
  }
});
