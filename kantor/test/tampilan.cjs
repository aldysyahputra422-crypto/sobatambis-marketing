// Uji asap tampilan 3D di Chromium (WebGL software). Pemakaian: node tampilan.cjs <url-dasar>
// Memeriksa: halaman siap tanpa error konsol, 16 agent + direktur + pemilik terbentuk, draw call masuk akal,
// dan karakter benar-benar berjalan saat status berubah (bekerja → santai).
const { chromium } = require('playwright');

(async () => {
  const dasar = process.argv[2];
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const galat = [];
  p.on('console', (m) => { if (m.type() === 'error') galat.push(m.text()); });
  p.on('pageerror', (e) => galat.push(e.message));
  await p.goto(`${dasar}/kerja?demo&skenario=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__siap === true, null, { timeout: 40000 });
  const hasil = { galat };
  hasil.info = await p.evaluate(() => {
    const k = window.__kantor;
    return { aktor: k.aktor.size, panggilan: k.renderer.info.render.calls, kartu: document.querySelectorAll('.kartu').length, spanduk: !document.getElementById('banner').hidden };
  });
  // bar bawah: 5 mode kamera, 18 chip agent (Aldy, direktur, 16 agent), mode berpindah benar, dan tema malam
  hasil.dock = await p.evaluate(() => ({ mode: document.querySelectorAll('.md').length, chip: document.querySelectorAll('.ag').length, zonaTersembunyi: document.getElementById('zonaNav').hidden, holo: document.querySelector('.holo-label')?.textContent }));
  hasil.mode = await p.evaluate(() => {
    const k = window.__kantor;
    const o = {};
    k.setMode('tim');
    o.timZona = !document.getElementById('zonaNav').hidden;
    k.pilihAgen('animator');
    o.meja = `${k.kam.mode}:${k.kam.terpilih}`;
    o.zonaMeja = document.getElementById('zonaNav').hidden;
    o.chipTerpilih = document.querySelector('.ag[aria-pressed="true"]')?.textContent;
    k.pilihAgen('animator');
    o.balik = k.kam.mode;
    k.setMode('fokus');
    o.fokus = k.kam.terpilih;
    k.setMode('jelajah');
    o.bebas = [k.controls.maxAzimuthAngle === Infinity, k.kam.terpilih];
    k.setMode('semua');
    o.batasKembali = Number.isFinite(k.controls.maxAzimuthAngle);
    return o;
  });
  hasil.malam = await p.evaluate(async () => {
    const b = document.getElementById('btnMalam');
    const r = document.documentElement;
    const tik = () => new Promise((x) => setTimeout(x, 80)); // MutationObserver berjalan asinkron
    const lampu = (nama) => window.__kantor.scene.children.filter((c) => c.isPointLight && c.name === nama).map((c) => c.intensity);
    const baca = () => ({
      malam: r.dataset.malam ?? null, tema: r.dataset.theme ?? null, tekan: b.getAttribute('aria-pressed'),
      atap: lampu('lampuAtap'), holo: lampu('lampuHolo')[0], layar: lampu('lampuLayar')[0],
    });
    b.click();
    await tik();
    const on = baca();
    b.click();
    await tik();
    return { on, off: baca() };
  });
  // skenario 1: animator bekerja. Terapkan skenario 2 (animator santai) lalu pastikan ia berjalan.
  hasil.gerak = await p.evaluate(async () => {
    const k = window.__kantor;
    const { keadaanDemo } = await import('/kerja/assets/sa/demo.js');
    const a = k.aktor.get('animator');
    const awal = [...a.pos];
    k.terapkan(keadaanDemo(window.KANTOR.roster, Date.now(), 2));
    const segera = { mode: a.kar.mode, titik: a.jalur.length };
    const t0 = performance.now();
    let jauh = 0;
    while (performance.now() - t0 < 25000 && jauh < 1.0) {
      await new Promise((r) => setTimeout(r, 400));
      jauh = Math.hypot(a.pos[0] - awal[0], a.pos[1] - awal[1]);
    }
    return { segera, jauh: +jauh.toFixed(2) };
  });
  // galeri karakter (?galeri): 18 desain terbentuk tanpa galat
  const g = await b.newPage({ viewport: { width: 1280, height: 800 } });
  hasil.galeri = [];
  g.on('console', (m) => { if (m.type() === 'error') hasil.galeri.push(m.text()); });
  g.on('pageerror', (e) => hasil.galeri.push(e.message));
  await g.goto(`${dasar}/kerja?galeri`, { waitUntil: 'load' });
  await g.waitForFunction(() => window.__siap === true, null, { timeout: 40000 });
  hasil.jumlahLabelGaleri = await g.evaluate(() => document.querySelectorAll('.zona-label').length);
  console.log(JSON.stringify(hasil));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
