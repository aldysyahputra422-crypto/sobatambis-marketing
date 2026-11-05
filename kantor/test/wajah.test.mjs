import assert from 'node:assert/strict';
import test from 'node:test';
import { JENIS_MATA, JENIS_MULUT, normaSquircle, PANGKAT, SISI, TATA } from '../runtime/public/assets/sa/wajah.js';
import { MATA, MULUT, WATAK } from '../runtime/public/assets/sa/watak.js';

test('setiap jenis mata dan mulut di watak punya gambarnya di wajah', () => {
  for (const m of MATA) assert.ok(JENIS_MATA.includes(m), `mata "${m}" tidak digambar`);
  for (const m of MULUT) assert.ok(JENIS_MULUT.includes(m), `mulut "${m}" tidak digambar`);
  for (const [id, w] of Object.entries(WATAK)) {
    assert.ok(JENIS_MATA.includes(w.mata), `${id}: mata "${w.mata}"`);
    assert.ok(JENIS_MULUT.includes(w.mulut), `${id}: mulut "${w.mulut}"`);
  }
});

test('tata letak wajah muat di dalam kotak gambar', () => {
  const cx = SISI / 2;
  assert.ok(cx + TATA.mataX + TATA.mataW / 2 < SISI, 'mata keluar kotak');
  assert.ok(cx + TATA.pipiX + TATA.pipiW / 2 <= SISI, 'blush keluar kotak');
  assert.ok(TATA.mulutY + 60 < SISI, 'mulut keluar kotak');
  assert.ok(TATA.mataY < TATA.hidungY && TATA.hidungY < TATA.mulutY, 'urutan mata, hidung, mulut salah');
  assert.ok(TATA.mataX > TATA.hidungR, 'hidung harus berada di antara kedua mata');
});

test('normaSquircle: wajar di sumbu, tidak pernah nol, dan menolak pembagian nol', () => {
  for (const v of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) assert.equal(normaSquircle(...v), 1, 'di sumbu harus 1');
  assert.equal(normaSquircle(0, 0, 0), 1, 'titik pusat tidak boleh membagi dengan nol');
  for (const v of [[0.6, 0.6, 0.5], [-0.3, 0.9, -0.2]]) {
    const n = normaSquircle(...v);
    assert.ok(Number.isFinite(n) && n > 0, `norma tidak wajar: ${n}`);
  }
});

test('squircle lebih berisi daripada bola: titik diagonal terdorong keluar', () => {
  const d = 1 / Math.sqrt(3); // titik diagonal di bola satuan
  assert.ok(PANGKAT > 2, 'pangkat 2 sama dengan bola');
  const n = normaSquircle(d, d, d);
  assert.ok(n < 1, `diagonal harus terdorong keluar (pembagi ${n.toFixed(3)} < 1)`);
  assert.ok(d / n > d, 'jari-jari diagonal squircle harus lebih besar daripada bola');
});
