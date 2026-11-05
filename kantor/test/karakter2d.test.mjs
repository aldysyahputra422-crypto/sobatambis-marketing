import assert from 'node:assert/strict';
import test from 'node:test';
import { gambarKarakter2d, LEBAR, RAMBUT2D, TINGGI, TUBUH } from '../runtime/public/assets/sa/karakter2d.js';
import { GAYA_RAMBUT, WATAK } from '../runtime/public/assets/sa/watak.js';

// ctx palsu: merekam titik yang digambar supaya gambar bisa diuji di Node tanpa canvas.
function ctxPalsu() {
  const titik = [];
  const hitung = { fill: 0, stroke: 0, drawImage: 0 };
  const catat = (...xy) => {
    for (let i = 0; i + 1 < xy.length; i += 2) if (Number.isFinite(xy[i]) && Number.isFinite(xy[i + 1])) titik.push([xy[i], xy[i + 1]]);
  };
  const c = {
    titik, hitung,
    beginPath() {}, closePath() {}, save() {}, restore() {}, clip() {}, setLineDash() {},
    moveTo: catat, lineTo: catat,
    quadraticCurveTo: (x1, y1, x2, y2) => catat(x1, y1, x2, y2),
    bezierCurveTo: (a, b, d, e, f, g) => catat(a, b, d, e, f, g),
    arcTo: (x1, y1, x2, y2) => catat(x1, y1, x2, y2),
    arc: (x, y, r) => catat(x - r, y - r, x + r, y + r),
    ellipse: (x, y, rx, ry) => catat(x - rx, y - ry, x + rx, y + ry),
    rect: (x, y, w, h) => catat(x, y, x + w, y + h),
    roundRect: (x, y, w, h) => catat(x, y, x + w, y + h),
    fillRect: (x, y, w, h) => catat(x, y, x + w, y + h),
    clearRect() {},
    drawImage: (img, x, y, w, h) => { hitung.drawImage++; catat(x, y, x + w, y + h); },
    fill() { hitung.fill++; }, stroke() { hitung.stroke++; },
  };
  return c;
}

const wajahPalsu = { width: 512, height: 512 };

test('gaya rambut 2D yang terdaftar memang ada di daftar gaya watak', () => {
  for (const g of Object.keys(RAMBUT2D)) assert.ok(GAYA_RAMBUT.includes(g), `gaya "${g}" tidak dikenal watak.js`);
});

test('setiap watak dengan gaya rambut 2D tergambar tanpa galat dan tetap di dalam kanvas', () => {
  const dipakai = Object.entries(WATAK).filter(([, w]) => RAMBUT2D[w.rambut.gaya]);
  assert.ok(dipakai.length > 0, 'belum ada watak yang memakai gaya 2D');
  for (const [id, w] of dipakai) {
    const c = ctxPalsu();
    assert.doesNotThrow(() => gambarKarakter2d(c, w, wajahPalsu), `${id} gagal digambar`);
    assert.equal(c.hitung.drawImage, 1, `${id}: wajah harus ditempel sekali`);
    assert.ok(c.hitung.fill > 10 && c.hitung.stroke > 10, `${id}: gambar terlalu sedikit bagian`);
    const batas = 120; // boleh sedikit meluber (rambut panjang), tapi tidak jauh keluar kanvas
    for (const [x, y] of c.titik) {
      assert.ok(x > -batas && x < LEBAR + batas, `${id}: titik x=${x.toFixed(0)} jauh di luar kanvas`);
      assert.ok(y > -batas && y < TINGGI + batas, `${id}: titik y=${y.toFixed(0)} jauh di luar kanvas`);
    }
  }
});

test('rambut tidak boleh turun menutupi mata', () => {
  const K = TUBUH.kepala;
  const mataAtas = K.cy - K.ry + K.ry * 2 * 0.42; // tepi atas mata menurut TATA di wajah.js
  for (const [gaya, fn] of Object.entries(RAMBUT2D)) {
    const c = ctxPalsu();
    const w = Object.values(WATAK).find((x) => x.rambut.gaya === gaya);
    fn.depan?.(c, w.rambut);
    const terendahTengah = c.titik.filter(([x]) => Math.abs(x - TUBUH.cx) < K.rx * 0.45).reduce((m, [, y]) => Math.max(m, y), -Infinity);
    assert.ok(terendahTengah < mataAtas, `${gaya}: rambut turun sampai y=${terendahTengah.toFixed(0)}, menutupi mata (batas ${mataAtas.toFixed(0)})`);
  }
});

test('proporsi lembar: kepala kira-kira separuh tinggi tubuh dan kaki berpijak di atas bayangan', () => {
  const K = TUBUH.kepala;
  const atas = K.cy - K.ry;
  const bawah = TUBUH.kaki.atas + TUBUH.kaki.panjang + TUBUH.sepatu.tinggi - 10;
  const bagianKepala = (K.ry * 2) / (bawah - atas);
  assert.ok(bagianKepala > 0.42 && bagianKepala < 0.58, `kepala ${(bagianKepala * 100).toFixed(0)}% dari tinggi tubuh`);
  assert.ok(K.rx > K.ry, 'kepala di lembar lebih lebar daripada tinggi');
  assert.ok(TUBUH.bayang.cy >= bawah - 12, 'bayangan harus di bawah sepatu');
  assert.ok(bawah < TINGGI, 'tubuh keluar dari bawah kanvas');
});
