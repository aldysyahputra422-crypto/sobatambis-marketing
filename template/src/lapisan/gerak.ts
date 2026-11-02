// Gerak lapisan B: properti yang masuk/keluar, teks kinetik per kata, transisi antar beat.
import { easing } from "../rig/pose";

export type EntriProperti = {
  id: string; masuk: number; cara: "pop" | "jatuh" | "banting" | "terlempar";
  keluar?: number; caraKeluar?: "jatuh" | "terlempar";
};
export type GerakProperti = { tampil: boolean; x: number; y: number; skala: number; sx: number; sy: number; rot: number };

const DIAM: GerakProperti = { tampil: true, x: 0, y: 0, skala: 1, sx: 1, sy: 1, rot: 0 };

function masuk(cara: EntriProperti["cara"], tau: number): GerakProperti {
  switch (cara) {
    case "pop":
    case "terlempar": {
      if (tau >= 0.25) return DIAM;
      return { ...DIAM, skala: Math.max(0.01, easing.pantul(tau / 0.25)), rot: -12 * (1 - tau / 0.25) };
    }
    case "jatuh": {
      if (tau < 0.3) return { ...DIAM, y: -800 * (1 - easing.masuk(tau / 0.3)) };
      const u = Math.min(1, (tau - 0.3) / 0.2);
      return u >= 1 ? DIAM : { ...DIAM, sx: 1 + 0.15 * (1 - u), sy: 1 - 0.15 * (1 - u) };
    }
    case "banting": {
      if (tau >= 0.3) return DIAM;
      const u = tau / 0.3;
      const k = 1 - easing.keluar(u);
      return { ...DIAM, sx: 1 + 0.25 * k, sy: 1 - 0.2 * k, rot: 4 * Math.sin(tau * 60) * k };
    }
  }
}

export function propertiPada(e: EntriProperti, detik: number): GerakProperti {
  if (detik < e.masuk) return { ...DIAM, tampil: false };
  const g = masuk(e.cara, detik - e.masuk);
  if (e.keluar === undefined || detik < e.keluar) return g;
  const tau = detik - e.keluar;
  if (tau > 1.5) return { ...DIAM, tampil: false };
  if (e.caraKeluar === "terlempar") {
    return { ...g, x: 1400 * tau, y: -900 * tau + 1500 * tau * tau, rot: 400 * tau };
  }
  // jatuh (bawaan): gravitasi + sedikit hanyut ke samping dan berputar
  return { ...g, x: 40 * tau, y: 0.5 * 3000 * tau * tau, rot: 70 * tau };
}

export type EntriTeks = { kata: string; mulai: number; selesai: number; gaya: "biasa" | "cap"; layar?: number };
export type GerakTeks = { kata: string; skala: number; rot: number; aktif: boolean; gaya: "biasa" | "cap" };

// Kata yang sudah mulai pada layar terakhir yang aktif. Satu "layar" = satu kelompok caption.
export function teksPada(jalur: EntriTeks[], detik: number): GerakTeks[] {
  const mulai = jalur.filter((k) => k.mulai <= detik);
  if (!mulai.length) return [];
  const layar = mulai[mulai.length - 1].layar ?? 0;
  const terakhir = mulai[mulai.length - 1];
  return mulai
    .filter((k) => (k.layar ?? 0) === layar)
    .map((k) => {
      const tau = detik - k.mulai;
      let skala = 1;
      let rot = 0;
      if (k.gaya === "cap") {
        if (tau < 0.3) {
          skala = 3.2 - 2.2 * easing.keluar(tau / 0.3);
          rot = 3 * Math.sin(tau * 60) * (1 - tau / 0.3);
        }
      } else if (tau < 0.133) {
        skala = 0.6 + 0.4 * easing.pantul(tau / 0.133);
      }
      return { kata: k.kata, skala, rot, aktif: k === terakhir && detik < Math.max(k.selesai, k.mulai + 0.2), gaya: k.gaya };
    });
}

export type EntriTransisi = { pada: number; jenis: "halaman" | "coret" | "potong" };
const SETENGAH = 0.175;

export function transisiPada(jalur: EntriTransisi[], detik: number): { jenis: string; kemajuan: number } | null {
  const t = jalur.find((x) => Math.abs(detik - x.pada) <= SETENGAH);
  if (!t) return null;
  return { jenis: t.jenis, kemajuan: (detik - (t.pada - SETENGAH)) / (2 * SETENGAH) };
}
