// Tipe adegan.json versi 2 (skema: schemas/adegan2.schema.json).
import type { EntriAksi } from "../aksi/tipe";
import type { EntriKamera } from "../lapisan/kamera";
import type { EntriProperti, EntriTeks, EntriTransisi } from "../lapisan/gerak";

export type Rentang = { mulai: number; selesai: number };
export type IdTokoh = "arta" | "ratna" | "mbis";
export type JalurTokoh = {
  awal: { x: number; y: number; skala: number; ekspresi: string };
  aksi: EntriAksi[];
  tampil?: Rentang[];
  lapis?: "depan" | "belakang"; // belakang: digambar sebelum latar.depan (mis. di balik sofa)
};
export type PropertiAdegan = EntriProperti & { pusat: { x: number; y: number }; pegang?: { tokoh: IdTokoh; mulai: number } };

export type DataAdegan2 = {
  durasi: number;
  fps: 30;
  jalur: {
    latar: { mulai: number; latar: string }[];
    kamera: EntriKamera[];
    tokoh: Partial<Record<IdTokoh, JalurTokoh>>;
    properti: PropertiAdegan[];
    teks: EntriTeks[];
    dialog: (Rentang & { penutur: string })[];
    sfx: { nama: string; pada: number; volume_db?: number }[];
    musik: (Rentang & { trek: string })[];
    transisi: EntriTransisi[];
    rona?: (Rentang & { warna: "merah" | "gelap" })[];
    sunyi?: Rentang[];
  };
};

export const dalam = (r: Rentang[] | undefined, t: number) => !r || r.some((x) => t >= x.mulai && t < x.selesai);
export const pilihPada = <T extends { mulai: number }>(daftar: T[] | undefined, t: number): T | undefined => {
  const lewat = (daftar ?? []).filter((x) => x.mulai <= t);
  return lewat[lewat.length - 1] ?? daftar?.[0];
};
