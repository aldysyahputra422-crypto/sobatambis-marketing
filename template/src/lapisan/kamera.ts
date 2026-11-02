// Kamera adegan: jenis bidikan (lebar/dekat/sisipan) + gerak. Potongan antar entri tanpa blend.
// Keluaran dipakai sebagai: translate(360 640) rotate(rot) scale(skala) translate(-(360+x) -(640+y)).
export type EntriKamera = {
  mulai: number; selesai: number;
  jenis: "lebar" | "dekat" | "sisipan";
  target?: { x: number; y: number };
  gerak?: "diam" | "dorong" | "hentak" | "sapu" | "getar";
};
export type Kamera = { skala: number; x: number; y: number; rot: number };

const SKALA = { lebar: 1, dekat: 2.4, sisipan: 3 };

// Lonjakan hentak: naik dalam 0,05 detik, turun habis dalam 0,25 detik berikutnya.
const lonjak = (tau: number) => (tau < 0 ? 0 : tau < 0.05 ? tau / 0.05 : Math.max(0, 1 - (tau - 0.05) / 0.25));

export function kameraPada(jalur: EntriKamera[], detik: number): Kamera {
  const e = jalur.find((k) => detik >= k.mulai && detik < k.selesai) ?? (jalur.length && detik >= jalur[jalur.length - 1].selesai ? jalur[jalur.length - 1] : undefined);
  if (!e) return { skala: 1, x: 0, y: 0, rot: 0 };
  const tau = detik - e.mulai;
  const lama = Math.max(0.001, e.selesai - e.mulai);
  let skala = SKALA[e.jenis];
  let x = e.target && e.jenis !== "lebar" ? e.target.x - 360 : 0;
  let y = e.target && e.jenis !== "lebar" ? e.target.y - 640 : 0;
  let rot = 0;
  switch (e.gerak) {
    case "dorong":
      skala *= 1 + 0.06 * Math.min(1, tau / lama);
      break;
    case "hentak": {
      const k = lonjak(tau);
      skala *= 1 + 0.12 * k;
      x += 4 * Math.sin(tau * 90) * k;
      y += 4 * Math.cos(tau * 77) * k;
      break;
    }
    case "sapu": {
      const u = Math.min(1, tau / 0.25);
      x += -300 * Math.pow(1 - u, 3);
      break;
    }
    case "getar":
      x += 3 * Math.sin(tau * 70);
      y += 2 * Math.sin(tau * 53);
      rot = 0.6 * Math.sin(tau * 41);
      break;
  }
  return { skala, x, y, rot };
}
