export type Kata = { kata: string; mulai: number; selesai: number };
export type Tokoh = { id: string; ekspresi: string; pose: string };
export type Visual = { latar: string; tokoh: Tokoh[]; properti?: string[]; kamera: string; catatan_merah?: string | null };
export type Adegan = {
  id: string; mulai: number; selesai: number; akhir_jeda: number;
  penutur: string; emosi: string; intensitas: number; visual: Visual;
  caption: { teks: string; kata: Kata[] };
};
export type DataAdegan = {
  episode: string; judul: string; durasi: number; adegan: Adegan[];
  penutup: { judul_berikut: string };
};

export function adeganAktif(data: Pick<DataAdegan, "adegan">, detik: number): number {
  const a = data.adegan;
  for (let i = 0; i < a.length; i++) if (detik < a[i].akhir_jeda) return i;
  return a.length - 1;
}
