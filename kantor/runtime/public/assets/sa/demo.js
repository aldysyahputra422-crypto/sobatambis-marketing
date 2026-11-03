// Mode demo (?demo): keadaan CONTOH untuk melihat tampilan tanpa menunggu produksi.
// Data ini bukan aktivitas nyata; halaman selalu menampilkan spanduk "data contoh" saat demo aktif.

const TAHAP = ['naskah', 'suara', 'dialog_ok', 'adegan', 'mix', 'render_draf', 'qa_gerak', 'render', 'qa_final', 'kemasan', 'video_ok', 'gerbang'];

export const SKENARIO = [
  {
    nama: 'Naskah menunggu persetujuan',
    kerja: { 'periset-tren': 'Cari sumber tren belajar', 'penulis-naskah': 'Tulis beat Ep.2', 'pembasmi-slop': 'Bersihkan dialog Mbis' },
    selesai: ['perencana-konten'],
    sekarang: 'naskah', pemilik: { status: 'butuh persetujuan', butuh: 'Setujui naskah.json (Approval 1).' },
    freelancer: [],
  },
  {
    nama: 'Render dan QA gerak',
    kerja: { animator: 'Perbaiki gerak adegan 6', 'inspektur-frame': 'Cek skor gerak draf', 'sutradara-suara': 'Mix dialog dan musik' },
    selesai: ['storyboarder'],
    sekarang: 'qa_gerak', pemilik: { status: 'berjalan', butuh: '' },
    freelancer: ['Tono'],
  },
  {
    nama: 'Kemasan dan gerbang',
    kerja: { 'desainer-cover': 'Buat cover Ep.1', 'penulis-caption': 'Tulis caption', 'penjaga-gerbang-qa': 'Periksa checklist', 'akuntan-token': 'Hitung token episode' },
    selesai: ['pembasmi-slop'],
    sekarang: 'kemasan', pemilik: { status: 'berjalan', butuh: '' },
    freelancer: ['Wati', 'Yoga'],
  },
];

export function keadaanDemo(roster, now, indeks = 0) {
  const s = SKENARIO[((indeks % SKENARIO.length) + SKENARIO.length) % SKENARIO.length];
  const iso = (ms) => new Date(ms).toISOString();
  const lagi = Object.keys(s.kerja);
  const rosterOut = roster.agents.map((a) => {
    const state = lagi.includes(a.agent) ? 'bekerja' : s.selesai.includes(a.agent) ? 'selesai' : 'santai';
    const run = state === 'santai' ? null : {
      id: `demo-${a.agent}`, task: s.kerja[a.agent] ?? 'Selesai', status: state === 'bekerja' ? 'bekerja' : 'selesai',
      started: iso(now - 60000), ended: state === 'bekerja' ? null : iso(now - 5000),
      last: state === 'bekerja' ? [{ t: iso(now - 2000), kind: 'tool', text: s.kerja[a.agent], tool: 'Edit' }] : [], files: [], tools: 3, tokens: 0,
    };
    return { ...a, state, run };
  });
  const menunggu = s.pemilik.status === 'butuh persetujuan';
  const idx = TAHAP.indexOf(s.sekarang);
  return {
    demo: true,
    skenario: s.nama,
    app: 'kantor-agent',
    now: iso(now),
    project: 'Departemen Marketing · Sobat Ambis (contoh)',
    ketua: { key: 'ketua', label: 'Direktur Marketing', state: 'bekerja', activity: 'aktif', last: [], tools: 0, tokens: 0, waiting_on: lagi.length, todos: null },
    roster_ketua: roster.ketua,
    roster: rosterOut,
    pemilik: {
      ...roster.pemilik, state: menunggu ? 'menunggu' : 'santai', status: s.pemilik.status, tahap: s.sekarang,
      butuh: s.pemilik.butuh, folder: 'videos/contoh/ep00', episode: 'ep00 · Contoh',
    },
    pipeline: { folder: 'videos/contoh/ep00', episode: 'ep00 · Contoh', tahap: TAHAP, lulus: TAHAP.slice(0, idx), sekarang: s.sekarang, status: s.pemilik.status },
    team: [], freelancers: s.freelancer.map((n, i) => ({ key: `fl-${n}`, name: n, label: `Freelancer · ${n}`, color: '#ffffff', kind: 'freelancer', slot: i, desk: i, state: 'bekerja', run: { task: 'Tugas contoh', last: [] } })),
    feed: lagi.map((k, i) => ({ t: iso(now - 4000 * (i + 1)), who: k, name: roster.agents.find((a) => a.agent === k)?.label ?? k, color: '#294D82', kind: 'tool', text: s.kerja[k], tool: 'Edit' })),
    runs: [], stats: { active: lagi.length, freelancers: s.freelancer.length, total: lagi.length, recent_starts: [], sessions_active: 1 },
    spare_desks: 4, public_url: null, transcripts: true,
  };
}
