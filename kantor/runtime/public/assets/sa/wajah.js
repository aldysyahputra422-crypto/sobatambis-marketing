// Wajah 2D digambar di canvas lalu ditempel ke depan kepala (pendekatan C: badan 3D, wajah datar seperti lembar
// karakter teman pemilik). Semua penanda khas lembar ada di sini: mata oval hitam pekat tanpa putih mata,
// hidung belah ketupat oranye di antara mata, blush oval, garis tepi tipis cokelat gelap.
// Satuan gambar: kotak 512x512 yang menutupi seluruh sisi depan kepala.

export const SISI = 512;
export const JENIS_MATA = ['titik', 'bulat', 'senyum', 'x', 'sipit', 'kosong', 'cincin'];
export const JENIS_MULUT = ['datar', 'senyum', 'gigi', 'ternganga', 'o', 'gigit', 'kecil'];
export const GARIS_WAJAH = '#4A3129'; // cokelat gelap, bukan hitam (lihat lembar)

// Tata letak dari lembar: mata sedikit di bawah tengah, hidung di antara mata, mulut di bawahnya.
export const TATA = {
  mataY: 266, mataX: 104, mataW: 94, mataH: 114,
  hidungY: 292, hidungR: 17,
  mulutY: 340,
  pipiX: 176, pipiY: 300, pipiW: 110, pipiH: 58,
  bintikY: 286,
};

// Kepala berbentuk kotak-membulat (squircle), bukan bola: |x|^p + |y|^p + |z|^p = 1 dengan p > 2.
// normaSquircle memberi pembagi untuk mendorong titik bola satuan ke permukaan squircle. Murni, diuji di Node.
export const PANGKAT = 2.7;
export function normaSquircle(x, y, z, p = PANGKAT) {
  return (Math.abs(x) ** p + Math.abs(y) ** p + Math.abs(z) ** p) ** (1 / p) || 1;
}

function oval(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
}

function belahKetupat(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.78, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.78, y);
  ctx.closePath();
}

function satuMata(ctx, jenis, cx, cy, hitam) {
  const { mataW: w, mataH: h } = TATA;
  ctx.fillStyle = hitam;
  ctx.strokeStyle = hitam;
  ctx.lineCap = 'round';
  switch (jenis) {
    case 'bulat': // oval hitam dengan kilau putih
      oval(ctx, cx, cy, w, h);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      oval(ctx, cx - w * 0.19, cy - h * 0.22, w * 0.32, h * 0.3);
      ctx.fill();
      break;
    case 'cincin': // lingkaran berongga (gaya kaget di lembar)
      ctx.lineWidth = 16;
      oval(ctx, cx, cy, w, h);
      ctx.stroke();
      oval(ctx, cx, cy, w * 0.42, h * 0.42);
      ctx.fill();
      break;
    case 'kosong':
      ctx.lineWidth = 15;
      oval(ctx, cx, cy, w, h);
      ctx.stroke();
      break;
    case 'senyum': // lengkung ke atas
      ctx.lineWidth = 17;
      ctx.beginPath();
      ctx.arc(cx, cy + h * 0.16, w * 0.46, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
      break;
    case 'x':
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.4, cy - h * 0.33);
      ctx.lineTo(cx + w * 0.4, cy + h * 0.33);
      ctx.moveTo(cx + w * 0.4, cy - h * 0.33);
      ctx.lineTo(cx - w * 0.4, cy + h * 0.33);
      ctx.stroke();
      break;
    case 'sipit': // garis mendatar: tatapan serius
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.44, cy);
      ctx.lineTo(cx + w * 0.44, cy);
      ctx.stroke();
      break;
    default: // 'titik': oval hitam pekat, paling sering di lembar
      oval(ctx, cx, cy, w * 0.86, h);
      ctx.fill();
  }
}

function mulut(ctx, jenis, cx, cy, hitam, lidah) {
  ctx.fillStyle = hitam;
  ctx.strokeStyle = hitam;
  ctx.lineCap = 'round';
  switch (jenis) {
    case 'senyum':
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 30, Math.PI * 0.16, Math.PI * 0.84);
      ctx.stroke();
      break;
    case 'gigi': { // senyum lebar bergigi
      ctx.beginPath();
      ctx.moveTo(cx - 52, cy - 16);
      ctx.quadraticCurveTo(cx, cy + 40, cx + 52, cy - 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy - 11);
      ctx.lineTo(cx + 40, cy - 11);
      ctx.lineTo(cx + 33, cy + 6);
      ctx.lineTo(cx - 33, cy + 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = hitam;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 11);
      ctx.lineTo(cx, cy + 6);
      ctx.stroke();
      break;
    }
    case 'ternganga': { // mulut terbuka, lidah menjulur
      oval(ctx, cx, cy, 70, 86);
      ctx.fill();
      ctx.fillStyle = lidah ?? '#F5A623';
      oval(ctx, cx, cy + 20, 52, 48);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy + 24);
      ctx.quadraticCurveTo(cx + 2, cy + 96, cx + 18, cy + 30);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'o':
      oval(ctx, cx, cy, 34, 42);
      ctx.fill();
      break;
    case 'gigit': // gigi dirapatkan
      ctx.beginPath();
      ctx.rect(cx - 44, cy - 14, 88, 30);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.rect(cx - 38, cy - 9, 76, 20);
      ctx.fill();
      ctx.strokeStyle = hitam;
      ctx.lineWidth = 4;
      for (const dx of [-19, 0, 19]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx, cy - 9);
        ctx.lineTo(cx + dx, cy + 11);
        ctx.stroke();
      }
      break;
    case 'kecil':
      oval(ctx, cx, cy, 17, 12);
      ctx.fill();
      break;
    default: // datar
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(cx - 22, cy);
      ctx.lineTo(cx + 22, cy);
      ctx.stroke();
  }
}

// Gambar seluruh wajah ke ctx 512x512 berlatar bening. `w` = satu entri WATAK.
export function gambarWajah(ctx, w, { kedip = false } = {}) {
  const hitam = w.garisWajah ?? GARIS_WAJAH;
  const t = TATA;
  const cx = SISI / 2;
  ctx.clearRect(0, 0, SISI, SISI);
  ctx.lineJoin = 'round';

  // blush dan bayang mata di belakang mata
  if (w.pipi) {
    ctx.fillStyle = w.pipi;
    ctx.globalAlpha = 0.85;
    for (const s of [-1, 1]) {
      oval(ctx, cx + s * t.pipiX, t.pipiY, t.pipiW, t.pipiH);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (w.bayangMata) {
    ctx.fillStyle = w.bayangMata;
    ctx.globalAlpha = 0.9;
    for (const s of [-1, 1]) {
      oval(ctx, cx + s * t.mataX, t.mataY + 46, t.mataW * 1.15, 34);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (w.bintik) {
    ctx.fillStyle = '#B9784B';
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        oval(ctx, cx + s * (t.pipiX - 22 + i * 20), t.bintikY + (i % 2) * 14, 9, 9);
        ctx.fill();
      }
    }
  }

  for (const s of [-1, 1]) satuMata(ctx, kedip ? 'sipit' : w.mata, cx + s * t.mataX, t.mataY, hitam);

  // hidung belah ketupat oranye: penanda paling khas lembar
  if (w.hidung) {
    ctx.fillStyle = w.hidung;
    belahKetupat(ctx, cx, t.hidungY, t.hidungR);
    ctx.fill();
  }

  mulut(ctx, w.mulut, cx, t.mulutY, hitam, w.lidah);

  // kacamata bulat digambar di atas mata
  if (w.kacamata) {
    ctx.strokeStyle = w.kacamata;
    ctx.lineWidth = 10;
    for (const s of [-1, 1]) {
      oval(ctx, cx + s * t.mataX, t.mataY, t.mataW * 1.75, t.mataH * 1.45);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - t.mataX + t.mataW * 0.88, t.mataY);
    ctx.lineTo(cx + t.mataX - t.mataW * 0.88, t.mataY);
    ctx.stroke();
  }
}
