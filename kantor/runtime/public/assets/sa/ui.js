// Panel antarmuka: kursi pemilik, tim per zona, aktivitas langsung, papan tahap. Hanya textContent (tanpa innerHTML).
import { ZONA, zonaDariNama } from './tata.js';

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
const NAMA_TAHAP = { dialog_ok: 'Dialog OK', qa_gerak: 'QA Gerak', qa_final: 'QA Final', video_ok: 'Video OK', render_draf: 'Render Draf' };
const namaTahap = (t) => NAMA_TAHAP[t] ?? t.charAt(0).toUpperCase() + t.slice(1);
const LABEL_STATE = { bekerja: 'Bekerja', selesai: 'Beres', santai: 'Santai' };

export function bangunUi({ roster, fokus, demo, skenario }) {
  // navigasi zona
  const nav = $('zonaNav');
  const tombol = (teks, id) => {
    const b = h('button', 'zn', teks);
    b.type = 'button';
    b.addEventListener('click', () => fokus(id));
    nav.appendChild(b);
  };
  tombol('Semua', null);
  for (const id of ['lobi', ...URUT_ZONA.filter((z) => z !== 'katalog'), 'lounge']) tombol(ZONA[id].nama, id);

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
    b.addEventListener('click', () => fokus(zona));
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
