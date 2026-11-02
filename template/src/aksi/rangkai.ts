// Merangkai daftar aksi bertanggal menjadi fungsi frame → Pose.
// Setiap aksi mulai dari posisi akar akhir aksi sebelumnya; peralihan diblend 5 sampai 12 frame sesuai jarak pose.
import { easing, interpolasiPose, SENDI, type Pose, type Sendi } from "../rig/pose";
import { AKSI_ARTA } from "./arta";
import type { Aksi, EntriAksi } from "./tipe";

const BLEND_FRAME = 5;
const BLEND_MAKS = 12;
const LAJU_JALAN = 150; // px per detik bila jalan tidak dibatasi aksi berikutnya

type KunciPenuh = { t: number; dx: number; dy: number; sx: number; sy: number; sendi: Record<Sendi, number>; easing: keyof typeof easing };

const ambilAksi = (nama: string): Aksi => {
  const a = (AKSI_ARTA as Record<string, Aksi>)[nama];
  if (!a) throw new Error(`aksi tidak dikenal: ${nama}`);
  return a;
};

const cacheKunci = new Map<string, KunciPenuh[]>();
function kunciPenuh(a: Aksi, dasar: Pose): KunciPenuh[] {
  const ada = cacheKunci.get(a.nama);
  if (ada) return ada;
  let k: KunciPenuh = { t: 0, dx: 0, dy: 0, sx: 1, sy: 1, sendi: { ...dasar.sendi }, easing: "linear" };
  const hasil = a.kunci.map((kk) => {
    k = {
      t: kk.t, dx: kk.dx ?? k.dx, dy: kk.dy ?? k.dy, sx: kk.sx ?? k.sx, sy: kk.sy ?? k.sy,
      sendi: { ...k.sendi, ...kk.sendi }, easing: kk.easing ?? "linear",
    };
    return k;
  });
  cacheKunci.set(a.nama, hasil);
  return hasil;
}

function sampel(kunci: KunciPenuh[], tau: number): Omit<KunciPenuh, "t" | "easing"> {
  if (tau <= kunci[0].t) return kunci[0];
  for (let i = 1; i < kunci.length; i++) {
    const a = kunci[i - 1];
    const b = kunci[i];
    if (tau <= b.t) {
      const u = easing[b.easing]((tau - a.t) / (b.t - a.t));
      const sendi = {} as Record<Sendi, number>;
      for (const s of SENDI) sendi[s] = a.sendi[s] + (b.sendi[s] - a.sendi[s]) * u;
      const l = (x: number, y: number) => x + (y - x) * u;
      return { dx: l(a.dx, b.dx), dy: l(a.dy, b.dy), sx: l(a.sx, b.sx), sy: l(a.sy, b.sy), sendi };
    }
  }
  return kunci[kunci.length - 1];
}

export function rangkaiJalur(entri: EntriAksi[], fps: number, awal: Pose): (frame: number) => Pose {
  const urut = [...entri].sort((a, b) => a.mulai - b.mulai);
  const aksi = urut.map((e) => ambilAksi(e.aksi));
  const kunci = aksi.map((a) => kunciPenuh(a, awal));

  // Posisi akar awal setiap entri = posisi akhir entri sebelumnya.
  const rentang = urut.map((e, i) => (i + 1 < urut.length ? urut[i + 1].mulai - e.mulai : Infinity));
  const geserJalan = (i: number, tau: number) => {
    const dx = urut[i].param?.dx ?? 0;
    if (!dx || aksi[i].nama !== "jalan") return 0;
    const lama = Number.isFinite(rentang[i]) ? rentang[i] : Math.abs(dx) / LAJU_JALAN;
    return dx * Math.min(1, Math.max(0, tau / lama));
  };
  const nilai = (i: number, tau: number) => {
    const a = aksi[i];
    const t = a.ulang ? ((tau % a.durasi) + a.durasi) % a.durasi : Math.min(tau, a.durasi);
    return sampel(kunci[i], t);
  };
  const basis: { x: number; y: number }[] = [];
  urut.forEach((_, i) => {
    if (i === 0) return basis.push({ x: awal.x, y: awal.y });
    const p = basis[i - 1];
    const tau = rentang[i - 1];
    const akhir = nilai(i - 1, tau);
    const ulang = aksi[i - 1].ulang;
    basis.push({ x: p.x + geserJalan(i - 1, tau) + (ulang ? 0 : akhir.dx), y: p.y + (ulang ? 0 : akhir.dy) });
  });

  const poseEntri = (i: number, t: number): Pose => {
    const tau = Math.max(0, t - urut[i].mulai);
    const v = nilai(i, tau);
    return {
      x: basis[i].x + geserJalan(i, tau) + v.dx, y: basis[i].y + v.dy,
      skala: awal.skala, sx: v.sx, sy: v.sy, sendi: v.sendi,
      ekspresi: urut[i].ekspresi ?? (i > 0 ? (urut[i - 1].ekspresi ?? awal.ekspresi) : awal.ekspresi),
    };
  };

  // Panjang blend menyesuaikan jarak pose: puncak kecepatan easing sinus ≈ 1,57× rata-rata, jaga ≤ 22°/frame.
  const panjangBlend = urut.map((e, i) => {
    if (i === 0) return BLEND_FRAME;
    const a = poseEntri(i - 1, e.mulai);
    const b = poseEntri(i, e.mulai);
    const jarak = Math.max(...SENDI.map((s) => Math.abs(a.sendi[s] - b.sendi[s])));
    return Math.min(BLEND_MAKS, Math.max(BLEND_FRAME, Math.ceil((jarak * 1.6) / 22)));
  });

  return (frame: number) => {
    const t = frame / fps;
    let i = 0;
    while (i + 1 < urut.length && t >= urut[i + 1].mulai) i++;
    if (urut.length === 0 || t < urut[0].mulai) return awal;
    const p = poseEntri(i, t);
    const lewat = (t - urut[i].mulai) * fps;
    if (i > 0 && lewat < panjangBlend[i]) {
      return interpolasiPose(poseEntri(i - 1, t), p, easing.sinus(lewat / panjangBlend[i]));
    }
    return p;
  };
}

export function titikKontak(entri: EntriAksi[]): { aksi: string; detik: number }[] {
  return entri
    .map((e) => ({ e, a: ambilAksi(e.aksi) }))
    .filter(({ a }) => a.kontak !== undefined)
    .map(({ e, a }) => ({ aksi: a.nama, detik: e.mulai + (a.kontak as number) }));
}
