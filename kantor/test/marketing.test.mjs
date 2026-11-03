import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../runtime/lib/node/config.mjs';
import { buildState } from '../runtime/lib/node/office.mjs';
import { buatProyek } from './fixture.mjs';

const RUNTIME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime');
const ROOT = path.resolve(RUNTIME, '../..');
const state = (p, now) => buildState({ projectDir: p.proyek, storageDir: null, cfg: loadConfig(RUNTIME, p.proyek), now });
const TAHAP = ['naskah', 'suara', 'dialog_ok', 'adegan', 'mix', 'render_draf', 'qa_gerak', 'render', 'qa_final', 'kemasan', 'video_ok', 'gerbang'];
const lulus = (n) => ({ tahap: Object.fromEntries(TAHAP.slice(0, n).map((t) => [t, { keadaan: 'lulus', waktu: '2026-11-03T01:00:00+00:00' }])) });

test('roster memuat semua agent repo, semuanya santai tanpa transkrip', () => {
  const p = buatProyek();
  try {
    const s = state(p, Date.now());
    const dariRepo = fs.readdirSync(path.join(ROOT, 'agents')).map((f) => f.replace(/\.md$/, '')).filter((n) => n !== 'direktur-marketing').sort();
    assert.deepEqual(s.roster.map((r) => r.agent).sort(), dariRepo);
    assert.ok(s.roster.every((r) => r.state === 'santai' && r.run === null));
    const naskah = s.roster.find((r) => r.agent === 'penulis-naskah');
    assert.equal(naskah.label, 'Penulis Naskah');
    assert.equal(naskah.zona, 'Ruang Naskah');
    assert.match(naskah.warna, /^#[0-9A-Fa-f]{6}$/);
  } finally { p.bersihkan(); }
});

test('agent yang sedang memanggil alat berstatus bekerja, yang lain santai', () => {
  const p = buatProyek();
  try {
    const now = Date.now();
    p.sesiUtama(now);
    p.subagent({ id: 'aaa111', tipe: 'penulis-naskah', mulai: now - 30000, akhir: now - 3000 });
    const s = state(p, now);
    const r = s.roster.find((x) => x.agent === 'penulis-naskah');
    assert.equal(r.state, 'bekerja');
    assert.equal(r.run.task, 'tugas uji');
    assert.equal(s.roster.filter((x) => x.state === 'bekerja').length, 1);
  } finally { p.bersihkan(); }
});

test('selesai dalam masa jeda berstatus selesai, lama sesudahnya santai', () => {
  const p = buatProyek();
  try {
    const now = Date.now();
    p.sesiUtama(now);
    p.subagent({ id: 'bbb222', tipe: 'animator', mulai: now - 40000, akhir: now - 10000, selesai: true });
    p.subagent({ id: 'ccc333', tipe: 'storyboarder', mulai: now - 600000, akhir: now - 500000, selesai: true });
    const s = state(p, now);
    assert.equal(s.roster.find((x) => x.agent === 'animator').state, 'selesai');
    assert.equal(s.roster.find((x) => x.agent === 'storyboarder').state, 'santai');
  } finally { p.bersihkan(); }
});

test('agentType berawalan plugin tetap dikenali; jenis asing tidak masuk roster', () => {
  const p = buatProyek();
  try {
    const now = Date.now();
    p.sesiUtama(now);
    p.subagent({ id: 'ddd444', tipe: 'sobatambis-marketing:periset-tren', mulai: now - 20000, akhir: now - 1000 });
    p.subagent({ id: 'eee555', tipe: 'general-purpose', mulai: now - 20000, akhir: now - 1000 });
    const s = state(p, now);
    assert.equal(s.roster.find((x) => x.agent === 'periset-tren').state, 'bekerja');
    assert.equal(s.roster.length, 16);
    assert.ok(s.freelancers.length + s.team.filter((t) => t.state === 'bekerja').length >= 2, 'tampilan lama tetap memuat semua subagent');
  } finally { p.bersihkan(); }
});

test('ketua berlabel Direktur Marketing dan field lama tetap ada', () => {
  const p = buatProyek({ config: { names: { ketua: 'Direktur Marketing' } } });
  try {
    const s = state(p, Date.now());
    assert.equal(s.ketua.label, 'Direktur Marketing');
    for (const k of ['team', 'freelancers', 'feed', 'runs', 'stats']) assert.ok(k in s, k);
    assert.equal(s.roster_ketua.agent, 'direktur-marketing');
    assert.equal(s.roster_ketua.zona, 'Ruang Direktur');
  } finally { p.bersihkan(); }
});

test('kursi pemilik: tanpa produksi santai', () => {
  const p = buatProyek();
  try {
    const s = state(p, Date.now());
    assert.equal(s.pemilik.state, 'santai');
    assert.equal(s.pemilik.label, 'Pemilik (Aldy)');
    assert.equal(s.pipeline, null);
  } finally { p.bersihkan(); }
});

test('kursi pemilik menyala menunggu Approval 1 dan papan tahap terisi', () => {
  const p = buatProyek();
  try {
    p.produksi('videos/2026-W46/ep01-v2', { episode: 'ep01', judul: 'Rencana Sempurna', disetujui: false, sumber_suara: null, beat: [] }, { tahap: {} });
    p.penanda('videos/2026-W46/ep01-v2');
    const s = state(p, Date.now());
    assert.equal(s.pemilik.state, 'menunggu');
    assert.equal(s.pemilik.tahap, 'naskah');
    assert.match(s.pemilik.butuh, /Approval 1/);
    assert.deepEqual(s.pipeline.tahap, TAHAP);
    assert.equal(s.pipeline.sekarang, 'naskah');
    assert.equal(s.pipeline.episode, 'ep01 · Rencana Sempurna');
  } finally { p.bersihkan(); }
});

test('pemilik diminta memilih sumber suara, lalu menyetujui dialog', () => {
  const p = buatProyek();
  try {
    p.produksi('videos/2026-W46/ep01-v2', { episode: 'ep01', judul: 'x', disetujui: true, sumber_suara: null, beat: [] }, lulus(1));
    p.penanda('videos/2026-W46/ep01-v2');
    let s = state(p, Date.now());
    assert.equal(s.pemilik.state, 'menunggu');
    assert.match(s.pemilik.butuh, /sumber suara/i);
    p.produksi('videos/2026-W46/ep01-v2', { episode: 'ep01', judul: 'x', disetujui: true, sumber_suara: 'manusia', beat: [] }, lulus(2));
    s = state(p, Date.now());
    assert.equal(s.pemilik.tahap, 'dialog_ok');
    assert.match(s.pemilik.butuh, /Approval 2/);
  } finally { p.bersihkan(); }
});

test('produksi berjalan atau siap posting membuat kursi pemilik santai', () => {
  const p = buatProyek();
  try {
    p.produksi('videos/2026-W46/ep01-v2', { episode: 'ep01', judul: 'x', disetujui: true, sumber_suara: 'manusia', beat: [] }, lulus(4));
    p.penanda('videos/2026-W46/ep01-v2');
    let s = state(p, Date.now());
    assert.equal(s.pemilik.state, 'santai');
    assert.equal(s.pipeline.sekarang, 'mix');
    p.produksi('videos/2026-W46/ep01-v2', { episode: 'ep01', judul: 'x', disetujui: true, sumber_suara: 'manusia', beat: [] }, lulus(12));
    s = state(p, Date.now());
    assert.equal(s.pemilik.status, 'siap posting');
    assert.equal(s.pipeline.sekarang, 'selesai');
  } finally { p.bersihkan(); }
});

test('tanpa penanda aktif, produksi dengan status.json terbaru dipakai', () => {
  const p = buatProyek();
  try {
    p.produksi('videos/2026-W45/ep00', { episode: 'ep00', judul: 'lama', disetujui: true, beat: [] }, lulus(12));
    const lama = new Date(Date.now() - 86400000);
    fs.utimesSync(path.join(p.proyek, 'videos/2026-W45/ep00/status.json'), lama, lama);
    p.produksi('videos/2026-W46/ep01-v2', { episode: 'ep01', judul: 'baru', disetujui: false, beat: [] }, { tahap: {} });
    const s = state(p, Date.now());
    assert.equal(s.pipeline.folder, 'videos/2026-W46/ep01-v2');
  } finally { p.bersihkan(); }
});

test('status gagal dan rekam ulang membuat pemilik menunggu dengan alasan', () => {
  const p = buatProyek();
  try {
    const st = lulus(1);
    st.tahap.suara = { keadaan: 'butuh_rekam_ulang', baris_tersisa: ['t04.1', 't09.2'] };
    p.produksi('videos/2026-W46/ep01-v2', { episode: 'ep01', judul: 'x', disetujui: true, sumber_suara: 'manusia', beat: [] }, st);
    p.penanda('videos/2026-W46/ep01-v2');
    let s = state(p, Date.now());
    assert.equal(s.pemilik.status, 'butuh rekam ulang');
    assert.match(s.pemilik.butuh, /t04\.1, t09\.2/);
    st.tahap.suara = { keadaan: 'gagal', alasan: 'emosi belum terdengar' };
    p.produksi('videos/2026-W46/ep01-v2', { episode: 'ep01', judul: 'x', disetujui: true, sumber_suara: 'manusia', beat: [] }, st);
    s = state(p, Date.now());
    assert.equal(s.pemilik.state, 'menunggu');
    assert.match(s.pemilik.butuh, /Tahap suara gagal: emosi belum terdengar/);
  } finally { p.bersihkan(); }
});
