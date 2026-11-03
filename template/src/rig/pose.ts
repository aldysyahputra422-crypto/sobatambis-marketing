// Pose tokoh: posisi akar + sudut per sendi (derajat) + ekspresi.
// Konvensi sudut (berlaku untuk kiri dan kanan layar):
//   lenganAtas  +  = lengan terangkat menjauhi badan (0 = lurus ke bawah, 180 = lurus ke atas)
//   lenganBawah +  = siku menekuk ke arah dalam badan
//   paha        +  = kaki membuka ke luar
//   betis       +  = lutut menekuk ke dalam
//   badan       +  = condong ke kanan layar (poros pinggang); kepala + = miring ke kanan layar (poros leher)
export type Sendi =
  | "badan" | "kepala"
  | "lenganAtasKi" | "lenganBawahKi" | "lenganAtasKa" | "lenganBawahKa"
  | "pahaKi" | "betisKi" | "pahaKa" | "betisKa";

export const SENDI: Sendi[] = [
  "badan", "kepala", "lenganAtasKi", "lenganBawahKi", "lenganAtasKa", "lenganBawahKa", "pahaKi", "betisKi", "pahaKa", "betisKa",
];

export type Pose = {
  x: number; y: number; // titik tengah telapak kaki di koordinat layar
  skala: number;
  sx: number; sy: number; // squash & stretch, 1 = normal
  sendi: Record<Sendi, number>;
  ekspresi: string;
};

export const POSE_DASAR: Pose = {
  x: 360, y: 1000, skala: 1, sx: 1, sy: 1, ekspresi: "datar",
  sendi: { badan: 0, kepala: 0, lenganAtasKi: 14, lenganBawahKi: 6, lenganAtasKa: 14, lenganBawahKa: 6, pahaKi: 2, betisKi: 0, pahaKa: 2, betisKa: 0 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function interpolasiPose(a: Pose, b: Pose, t: number): Pose {
  const sendi = {} as Record<Sendi, number>;
  for (const s of SENDI) sendi[s] = lerp(a.sendi[s], b.sendi[s], t);
  return {
    x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), skala: lerp(a.skala, b.skala, t),
    sx: lerp(a.sx, b.sx, t), sy: lerp(a.sy, b.sy, t), sendi,
    ekspresi: t >= 0.5 ? b.ekspresi : a.ekspresi,
  };
}

const c1 = 1.70158;
export const easing = {
  linear: (t: number) => t,
  masuk: (t: number) => t * t * t,
  keluar: (t: number) => 1 - Math.pow(1 - t, 3),
  // sinus masuk-keluar: puncak kecepatan ±1,57× rata-rata (lebih halus dari kubik yang 3×)
  sinus: (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  masukKeluar: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  // melewati target lalu kembali (overshoot)
  pantul: (t: number) => 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
  // pegas: berayun beberapa kali sebelum diam
  lentur: (t: number) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};
export type NamaEasing = keyof typeof easing;
