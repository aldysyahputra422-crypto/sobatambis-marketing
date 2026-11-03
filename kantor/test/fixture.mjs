// Pembantu test: proyek palsu + transkrip Claude Code palsu di folder sementara (tanpa menyentuh ~/.claude asli).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const iso = (ms) => new Date(ms).toISOString();

export function buatProyek({ config = null } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'kantor-uji-')));
  const proyek = path.join(dir, 'proyek');
  fs.mkdirSync(path.join(proyek, '.claude'), { recursive: true });
  if (config) fs.writeFileSync(path.join(proyek, '.claude/kantor-agent.json'), JSON.stringify(config));
  const claude = path.join(dir, 'claude');
  process.env.CLAUDE_CONFIG_DIR = claude;
  const akar = path.join(claude, 'projects', proyek.replace(/[^a-zA-Z0-9]/g, '-'));
  fs.mkdirSync(akar, { recursive: true });
  const baris = (rows) => `${rows.map((r) => JSON.stringify(r)).join('\n')}\n`;
  return {
    proyek, dir,
    sesiUtama(now, sesi = 'sesi1') {
      fs.writeFileSync(path.join(akar, `${sesi}.jsonl`), baris([
        { type: 'user', timestamp: iso(now - 5000), message: { role: 'user', content: 'jalankan produksi' } },
        { type: 'assistant', timestamp: iso(now - 2000), message: { id: 'm1', content: [{ type: 'tool_use', name: 'Bash', input: { command: 'ls', description: 'cek' } }] } },
      ]));
    },
    // selesai=true → ditutup jawaban akhir (end_turn) pada waktu `akhir`; selesai=false → masih memanggil alat
    subagent({ id, tipe, mulai, akhir, selesai = false, sesi = 'sesi1', deskripsi = 'tugas uji' }) {
      const d = path.join(akar, sesi, 'subagents');
      fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, `agent-${id}.meta.json`), JSON.stringify({ agentType: tipe, description: deskripsi }));
      const rows = [
        { type: 'user', timestamp: iso(mulai), message: { role: 'user', content: deskripsi } },
        { type: 'assistant', timestamp: iso(akhir - 500), message: { id: `a${id}`, content: [{ type: 'tool_use', name: 'Read', input: { file_path: '/x/y.md' } }] } },
      ];
      if (selesai) rows.push({ type: 'assistant', timestamp: iso(akhir), message: { id: `b${id}`, stop_reason: 'end_turn', content: [{ type: 'text', text: 'selesai' }] } });
      fs.writeFileSync(path.join(d, `agent-${id}.jsonl`), baris(rows));
    },
    produksi(rel, naskah, status) {
      const f = path.join(proyek, rel);
      fs.mkdirSync(f, { recursive: true });
      if (naskah) fs.writeFileSync(path.join(f, 'naskah.json'), JSON.stringify(naskah));
      if (status) fs.writeFileSync(path.join(f, 'status.json'), JSON.stringify(status));
      return f;
    },
    penanda(folder) {
      fs.mkdirSync(path.join(proyek, '.sa'), { recursive: true });
      fs.writeFileSync(path.join(proyek, '.sa/aktif.json'), JSON.stringify({ folder }));
    },
    bersihkan() { fs.rmSync(dir, { recursive: true, force: true }); },
  };
}
