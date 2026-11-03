// Panel antarmuka: kursi pemilik, tim per zona, aktivitas langsung, papan tahap. Hanya textContent (tanpa innerHTML).
import { ZONA, zonaDariNama } from './tata.js';
import { namaTahap } from './ringkas.js';

const URUT_ZONA = ['direktur', 'riset', 'naskah', 'suara', 'produksi', 'kreatif', 'gerbang', 'katalog'];
const $ = (id) => document.getElementById(id);
const h = (tag, cls, teks) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (teks !== undefined) e.textContent = teks;
  return e;
};
const jam = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const waktu = (iso) => (iso ? jam.format(new Date(iso)).replace(/\./g, ':') : '');
const potong = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s ?? '');
const LABEL_STATE = { bekerja: 'Bekerja', selesai: 'Beres', santai: 'Santai' };

const MODE = [
  ['semua', 'Semua', 'gambaran'], ['meja', 'Meja', 'per agent'], ['jelajah', 'Jelajah', 'bebas'], ['fokus', 'Fokus', 'otomatis'], ['tim', 'Tim', 'per ruang'],
];

// Tema malam: gelap dengan aksen neon. Menandai <html data-malam>; kantor3d.js membaca atribut itu untuk adegan 3D.
export function aturMalam(on, simpan = true) {
  const r = document.documentElement;
  if (on) {
    if (r.dataset.malam === undefined) r.dataset.temaSebelum = r.dataset.theme ?? '';
    r.dataset.malam = '1';
    r.dataset.theme = 'dark';
  } else if (r.dataset.malam !== undefined) {
    delete r.dataset.malam;
    if (r.dataset.temaSebelum) r.dataset.theme = r.dataset.temaSebelum;
    else delete r.dataset.theme;
    delete r.dataset.temaSebelum;
  }
  $('btnMalam')?.setAttribute('aria-pressed', String(on));
  if (simpan) {
    try { localStorage.setItem('kantor.malam', on ? '1' : '0'); } catch { /* penyimpanan tidak tersedia: abaikan */ }
  }
}
export function malamAwal(params) {
  const q = params.get('malam');
  if (q === '1' || q === '0') return q === '1';
  try { return localStorage.getItem('kantor.malam') === '1'; } catch { return false; }
}

export function bangunUi({ roster, fokus, demo, skenario, kendali }) {
  // navigasi bawah: mode kamera, chip agent, dan (mode Tim) lompat ke ruang
  const nav = $('zonaNav');
  const tombol = (teks, aksi) => {
    const b = h('button', 'zn', teks);
    b.type = 'button';
    b.addEventListener('click', aksi);
    nav.appendChild(b);
  };
  for (const id of ['lobi', ...URUT_ZONA.filter((z) => z !== 'katalog'), 'lounge']) tombol(ZONA[id].nama, () => fokus(id));
  tombol('Layar produksi', () => kendali.lihatLayar());

  const navMode = $('modeNav');
  const tombolMode = new Map();
  for (const [id, nama, ket] of MODE) {
    const b = h('button', 'md');
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.append(h('span', '', nama), h('small', '', ket));
    b.addEventListener('click', () => kendali.setMode(id));
    navMode.appendChild(b);
    tombolMode.set(id, b);
  }
  const navAgen = $('agenNav');
  const chip = new Map();
  const buatChip = (kunci, label, warna) => {
    const b = h('button', 'ag');
    b.type = 'button';
    b.dataset.state = 'santai';
    b.setAttribute('aria-pressed', 'false');
    b.style.setProperty('--w', warna);
    b.append(h('i', 'dot'), h('span', '', label));
    b.addEventListener('click', () => kendali.pilihAgen(kunci));
    navAgen.appendChild(b);
    chip.set(kunci, b);
  };
  buatChip('pemilik', 'Aldy', '#FFC400');
  buatChip('ketua', roster.ketua.label, roster.ketua.warna);
  for (const a of roster.agents) buatChip(a.agent, a.label, a.warna);
  const ukurDock = () => document.documentElement.style.setProperty('--dock-h', `${$('dock').offsetHeight}px`);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(ukurDock).observe($('dock'));
  ukurDock();
  $('btnMalam').addEventListener('click', () => aturMalam(document.documentElement.dataset.malam === undefined));

  // tab
  const tabs = [...document.querySelectorAll('[data-tab]')];
  const pane = (n) => document.querySelector(`[data-pane="${n}"]`);
  const pilih = (n) => {
    for (const t of tabs) t.setAttribute('aria-selected', String(t.dataset.tab === n));
    for (const p of document.querySelectorAll('[data-pane]')) p.classList.toggle('on', p.dataset.pane === n);
  };
  for (const t of tabs) t.addEventListener('click', () => pilih(t.dataset.tab));
  $('lipat').addEventListener('click', () => {
    const a = document.body.classList.toggle('lipat');
    $('lipat').setAttribute('aria-expanded', String(!a));
  });

  if (matchMedia('(max-width: 860px)').matches) {
    document.body.classList.add('lipat'); // HP: kantor dulu, panel dibuka dengan ketukan
    $('lipat').setAttribute('aria-expanded', 'false');
  }
  const kartu = new Map();
  const grup = new Map();
  for (const id of URUT_ZONA) {
    const g = h('section', 'grup');
    g.appendChild(h('h3', '', ZONA[id].nama));
    $('tim').appendChild(g);
    grup.set(id, g);
  }
  const buatKartu = (kunci, label, zona, warna) => {
    const b = h('button', 'kartu');
    b.type = 'button';
    b.style.setProperty('--w', warna);
    b.append(h('i', 'dot'), h('b', '', label), h('span', 'st', ''), h('small', 'tugas', ''));
    b.addEventListener('click', () => kendali.pilihAgen(kunci));
    grup.get(zona)?.appendChild(b);
    kartu.set(kunci, b);
    return b;
  };
  buatKartu('ketua', roster.ketua.label, 'direktur', roster.ketua.warna);
  for (const a of roster.agents) buatKartu(a.agent, a.label, zonaDariNama(a.zona), a.warna);
  const set = (b, state, tugas) => {
    b.dataset.state = state;
    b.querySelector('.st').textContent = LABEL_STATE[state] ?? state;
    b.querySelector('.tugas').textContent = potong(tugas, 60);
  };

  // papan tahap
  const papan = $('tahapList');

  let spanduk = false;
  return {
    // dipanggil kantor3d.js tiap mode atau agent terpilih berubah
    tandai({ mode, terpilih }) {
      for (const [id, b] of tombolMode) b.setAttribute('aria-pressed', String(id === mode));
      nav.hidden = mode !== 'tim';
      for (const [k, b] of chip) b.setAttribute('aria-pressed', String(k === terpilih));
      const c = chip.get(terpilih);
      if (c) navAgen.scrollTo({ left: c.offsetLeft - navAgen.clientWidth / 2 + c.offsetWidth / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      ukurDock();
    },
    status(ok) {
      $('liveDot').dataset.ok = String(ok);
      $('liveTxt').textContent = ok ? 'Terhubung' : 'Terputus, mencoba lagi…';
    },
    perbarui(d, fokusFn) {
      $('judul').textContent = d.project ?? 'Departemen Marketing · Sobat Ambis';
      if (demo && !spanduk) {
        spanduk = true;
        $('banner').hidden = false;
      }
      $('banner').textContent = demo ? `Mode demo: data contoh, bukan aktivitas nyata${d.skenario ? ` (${d.skenario})` : ''}` : '';
      const aktif = (d.roster ?? []).filter((r) => r.state === 'bekerja').length + (d.ketua?.state === 'bekerja' ? 1 : 0);
      const fl = (d.freelancers ?? []).filter((f) => f.state === 'bekerja').length;
      $('chipAktif').textContent = `Bekerja: ${aktif + fl}`;
      $('chipTahap').textContent = d.pipeline ? `Tahap: ${namaTahap(d.pipeline.sekarang)}` : 'Tidak ada produksi';
      const menunggu = d.pemilik?.state === 'menunggu';
      const cp = $('chipPemilik');
      cp.textContent = menunggu ? 'Aldy ditunggu' : 'Aldy santai';
      cp.dataset.menunggu = String(menunggu);
      const pg = $('panggilan');
      pg.hidden = !menunggu;
      if (menunggu) {
        $('panggilanTeks').textContent = `${d.pemilik.episode ?? ''}: ${d.pemilik.butuh ?? ''}`;
        $('panggilanBtn').onclick = () => fokusFn('lobi');
      }
      // chip agent
      const ketuaKerja = d.ketua?.state === 'bekerja';
      chip.get('ketua').dataset.state = ketuaKerja ? 'bekerja' : 'santai';
      chip.get('pemilik').dataset.state = menunggu ? 'menunggu' : 'santai';
      for (const r of d.roster ?? []) {
        const c = chip.get(r.agent);
        if (!c) continue;
        c.dataset.state = r.state;
        c.title = r.run?.task ? `${r.label}: ${r.run.task}` : r.label;
      }
      // kartu
      set(kartu.get('ketua'), d.ketua?.state === 'bekerja' ? 'bekerja' : 'santai', d.ketua?.waiting_on > 0 ? `Menunggu ${d.ketua.waiting_on} agent` : '');
      for (const r of d.roster ?? []) {
        const b = kartu.get(r.agent);
        if (b) set(b, r.state, r.run?.task ?? '');
      }
      // freelancer
      const f = $('flInfo');
      const semuaFl = d.freelancers ?? [];
      f.textContent = semuaFl.length ? `Freelancer: ${semuaFl.map((x) => x.name).join(', ')}${semuaFl.length > (d.spare_desks ?? 4) ? ` (+${semuaFl.length - (d.spare_desks ?? 4)} lagi)` : ''}` : '';
      // feed
      const ul = $('feed');
      ul.replaceChildren(...(d.feed ?? []).slice(0, 40).map((e) => {
        const li = h('li', e.kind ?? '');
        li.style.setProperty('--w', e.color ?? '#294D82');
        li.append(h('time', '', waktu(e.t)), h('b', '', e.name ?? ''), h('span', '', potong(e.text ?? '', 90)));
        return li;
      }));
      if (!(d.feed ?? []).length) ul.replaceChildren(h('li', 'kosong', 'Belum ada aktivitas. Kantor terisi saat agent bekerja.'));
      // papan tahap
      papan.replaceChildren();
      if (d.pipeline) {
        papan.appendChild(h('p', 'ep', d.pipeline.episode ?? ''));
        const lulus = new Set(d.pipeline.lulus);
        const ul = h('ul', 'tahap');
        for (const t of d.pipeline.tahap) ul.appendChild(h('li', lulus.has(t) ? 'lulus' : d.pipeline.sekarang === t ? 'sekarang' : '', namaTahap(t)));
        papan.appendChild(ul);
        if (d.pemilik?.butuh) papan.appendChild(h('p', 'butuh', `Butuh dari Aldy: ${d.pemilik.butuh}`));
      } else {
        papan.appendChild(h('p', 'ep', 'Belum ada produksi berjalan.'));
      }
      $('nFeed').textContent = String((d.feed ?? []).length);
      $('nTim').textContent = String(aktif + fl);
    },
  };
}
