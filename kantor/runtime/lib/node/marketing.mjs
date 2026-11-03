// Lapisan Sobat Ambis di atas Kantor Agent: kursi tetap per agent (roster), kursi pemilik (menunggu persetujuan),
// dan papan tahap produksi. Hanya MEMBACA: transkrip (lewat office.mjs) dan videos/*/*/status.json + naskah.json.
// Logika `pemilik` mengikuti scripts/notion_catatan.py (dijaga tests/test_kantor_parity.py).
import fs from 'node:fs';
import path from 'node:path';
import { isFile, isPlainObj, readText, safeLine } from './util.mjs';

export const TAHAP = ['naskah', 'suara', 'dialog_ok', 'adegan', 'mix', 'render_draf', 'qa_gerak', 'render', 'qa_final', 'kemasan', 'video_ok', 'gerbang'];
const PERSETUJUAN = {
  naskah: 'Setujui naskah.json (Approval 1).',
  dialog_ok: 'Dengarkan dialog.wav lalu setujui trek dialog (Approval 2).',
  video_ok: 'Tonton video.mp4, cover.png, caption.txt lalu setujui (Approval 3).',
};
const MENUNGGU = new Set(['butuh persetujuan', 'butuh rekam ulang', 'gagal']);
const ROSTER_FILE = new URL('../../roster.json', import.meta.url);

let rosterMemo = null;
export function loadRoster() {
  if (rosterMemo === null) rosterMemo = JSON.parse(fs.readFileSync(ROSTER_FILE, 'utf8'));
  return rosterMemo;
}

function bacaJson(f) {
  if (!isFile(f)) return {};
  try {
    const j = JSON.parse(readText(f) ?? '');
    return isPlainObj(j) ? j : {};
  } catch {
    return {};
  }
}

// agentType plugin berbentuk "<plugin>:<agent>": ambil bagian agent
const jenisDasar = (t) => String(t).split(':').pop();

function infoRun(r, job) {
  return {
    id: r.id,
    task: r.description !== '' ? r.description : r.agentType,
    status: r.status,
    started: job.startIso,
    ended: job.end === null ? null : job.endIso,
    last: [...r.events].reverse().slice(0, 8),
    files: r.files.slice(-6),
    tools: r.tools,
    tokens: r.tokens,
  };
}

export function buildRoster({ runs, now, cooldownSec, roster = loadRoster() }) {
  const CD = cooldownSec * 1000;
  return roster.agents.map((a) => {
    let kerja = null;
    let terakhir = null;
    for (const r of runs) {
      if (jenisDasar(r.agentType) !== a.agent) continue;
      const job = r.effSegs[r.effSegs.length - 1];
      if (job.end === null) {
        if (kerja === null || job.start > kerja[1].start) kerja = [r, job];
      } else if (terakhir === null || job.end > terakhir[1].end) terakhir = [r, job];
    }
    const pilih = kerja ?? terakhir;
    let state = 'santai';
    if (kerja) state = 'bekerja';
    else if (terakhir && now - terakhir[1].end < CD) state = 'selesai';
    return { ...a, state, run: pilih && state !== 'santai' ? infoRun(pilih[0], pilih[1]) : null };
  });
}

// ---- produksi aktif: penanda .sa/aktif.json bila ada, selain itu status.json terbaru di videos/
function cariProduksi(projectDir) {
  const proyek = path.resolve(projectDir);
  const dalam = (p) => p === proyek || p.startsWith(proyek + path.sep);
  const aktif = bacaJson(path.join(proyek, '.sa/aktif.json')).folder;
  if (typeof aktif === 'string' && aktif !== '') {
    const f = path.resolve(proyek, aktif);
    if (dalam(f) && isFile(path.join(f, 'status.json'))) return f;
  }
  let terbaik = null;
  const videos = path.join(proyek, 'videos');
  const anak = (d) => {
    try {
      return fs.readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => path.join(d, e.name));
    } catch {
      return [];
    }
  };
  for (const minggu of anak(videos)) {
    for (const ep of anak(minggu)) {
      const sf = path.join(ep, 'status.json');
      try {
        const mt = fs.statSync(sf).mtimeMs;
        if (terbaik === null || mt > terbaik[0]) terbaik = [mt, ep];
      } catch {
        /* bukan folder produksi */
      }
    }
  }
  return terbaik === null ? null : terbaik[1];
}

export function ringkasProduksi(folder) {
  const n = bacaJson(path.join(folder, 'naskah.json'));
  const tahap = isPlainObj(bacaJson(path.join(folder, 'status.json')).tahap) ? bacaJson(path.join(folder, 'status.json')).tahap : {};
  const berikut = TAHAP.find((t) => (tahap[t] ?? {}).keadaan !== 'lulus') ?? null;
  const info = berikut ? (isPlainObj(tahap[berikut]) ? tahap[berikut] : {}) : {};
  let status = 'berjalan';
  let butuh = '';
  if (berikut === null) status = 'siap posting';
  else if (info.keadaan === 'butuh_rekam_ulang') {
    status = 'butuh rekam ulang';
    butuh = `Rekam ulang baris: ${(Array.isArray(info.baris_tersisa) ? info.baris_tersisa : []).join(', ')} (lihat lembar-rekaman.md).`;
  } else if (info.keadaan === 'butuh_persetujuan') {
    status = 'butuh persetujuan';
    butuh = info.alasan || 'Butuh persetujuan pemilik.';
  } else if (info.keadaan === 'gagal') {
    status = 'gagal';
    butuh = `Tahap ${berikut} gagal: ${info.alasan || 'lihat status.json'}`;
  } else if (berikut === 'naskah' && !n.disetujui) {
    status = 'butuh persetujuan';
    butuh = PERSETUJUAN.naskah;
  } else if (berikut === 'suara' && !n.sumber_suara) {
    status = 'butuh persetujuan';
    butuh = 'Pilih sumber suara: rekaman sendiri (manusia) atau ElevenLabs.';
  } else if (berikut === 'dialog_ok' || berikut === 'video_ok') {
    status = 'butuh persetujuan';
    butuh = PERSETUJUAN[berikut];
  }
  const nama = `${n.episode ?? path.basename(folder)} · ${n.judul ?? ''}`.replace(/^[ ·]+|[ ·]+$/g, '');
  return {
    status, tahap: berikut ?? 'selesai', butuh: safeLine(butuh, 200), episode: safeLine(nama, 80),
    lulus: TAHAP.filter((t) => (tahap[t] ?? {}).keadaan === 'lulus'),
  };
}

export function buildPemilikPipeline({ projectDir, roster = loadRoster() }) {
  const base = { label: roster.pemilik.label, zona: roster.pemilik.zona, warna: roster.pemilik.warna, aksen: roster.pemilik.aksen, benda: roster.pemilik.benda };
  const folder = cariProduksi(projectDir);
  if (folder === null) return { pemilik: { ...base, state: 'santai', status: null, tahap: null, butuh: '', folder: null, episode: null }, pipeline: null };
  const rel = path.relative(path.resolve(projectDir), folder).split(path.sep).join('/');
  const r = ringkasProduksi(folder);
  return {
    pemilik: { ...base, state: MENUNGGU.has(r.status) ? 'menunggu' : 'santai', status: r.status, tahap: r.tahap, butuh: r.butuh, folder: rel, episode: r.episode },
    pipeline: { folder: rel, episode: r.episode, tahap: TAHAP, lulus: r.lulus, sekarang: r.tahap, status: r.status },
  };
}
