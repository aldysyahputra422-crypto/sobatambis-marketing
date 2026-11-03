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
  console.log(JSON.stringify(hasil));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
