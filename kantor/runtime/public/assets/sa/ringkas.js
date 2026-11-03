// Logika murni untuk tampilan (tanpa three.js/DOM, diuji di Node): urutan sorotan kamera, isi layar dinding,
// dan keadaan hologram. Semua angka dan teks berasal dari data /kerja/api/state; tidak ada yang dikarang.

const NAMA_TAHAP = { dialog_ok: 'Dialog OK', qa_gerak: 'QA Gerak', qa_final: 'QA Final', video_ok: 'Video OK', render_draf: 'Render Draf' };
export const namaTahap = (t) => NAMA_TAHAP[t] ?? String(t).charAt(0).toUpperCase() + String(t).slice(1);
const potong = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s ?? '');

// Siapa yang disorot kamera di mode Fokus: direktur (bila mengatur), lalu agent yang bekerja menurut urutan roster.
// Bila tak ada yang bekerja tetapi Aldy ditunggu, sorot Aldy.
export function urutanFokus(d) {
  if (!d) return [];
  const hasil = [];
  if (d.ketua?.state === 'bekerja') hasil.push('ketua');
  for (const r of d.roster ?? []) if (r.state === 'bekerja') hasil.push(r.agent);
  if (!hasil.length && d.pemilik?.state === 'menunggu') hasil.push('pemilik');
  return hasil;
}

// Isi layar besar di dinding Lantai Produksi.
export function isiDinding(d) {
  const p = d?.pipeline ?? null;
  const lulus = new Set(p?.lulus ?? []);
  const tahap = (p?.tahap ?? []).map((t) => ({ nama: namaTahap(t), status: lulus.has(t) ? 'lulus' : p.sekarang === t ? 'sekarang' : 'nanti' }));
  const kerja = (d?.roster ?? []).filter((r) => r.state === 'bekerja');
  const aktif = kerja.slice(0, 5).map((r) => ({ label: r.label, tugas: potong(r.run?.task ?? '', 38) }));
  return {
    judul: p ? potong(p.episode || p.folder || 'Produksi', 40) : 'Belum ada produksi berjalan',
    tahap,
    sekarang: p ? namaTahap(p.sekarang) : '',
    aktif,
    sisa: Math.max(0, kerja.length - aktif.length),
    butuh: d?.pemilik?.state === 'menunggu' ? potong(d.pemilik.butuh ?? '', 80) : '',
  };
}

// Hologram di tengah kantor: merah saat Aldy ditunggu, kuning saat ada yang bekerja, teal redup saat sepi.
export function statusHolo(d) {
  if (d?.pemilik?.state === 'menunggu') return { mode: 'menunggu', warna: '#FF5C7A', kecepatan: 1.6, teks: 'Menunggu Aldy' };
  const ada = (d?.roster ?? []).some((r) => r.state === 'bekerja') || d?.ketua?.state === 'bekerja';
  if (ada) return { mode: 'bekerja', warna: '#FFC400', kecepatan: 1.1, teks: d?.pipeline ? `Tahap: ${namaTahap(d.pipeline.sekarang)}` : 'Agent bekerja' };
  return { mode: 'diam', warna: '#4FD1C5', kecepatan: 0.3, teks: 'Kantor sepi' };
}
