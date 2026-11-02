// Posisi dan pemecahan catatan merah guru agar tidak menabrak kepala/pensil Arta.
const POSISI: Record<string, { x: number; y: number }> = {
  kamar: { x: 470, y: 560 },
  dinding_sticky: { x: 480, y: 600 },
  ruang_tamu: { x: 500, y: 600 },
  meja_malam: { x: 450, y: 500 },
};

export const posisiCatatan = (latar: string) => POSISI[latar] ?? { x: 470, y: 560 };

export function pecahCatatan(teks: string, maks = 14): string[] {
  if (teks.length <= maks) return [teks];
  const kata = teks.split(" ");
  let kiri = "";
  for (const k of kata) {
    if ((kiri + " " + k).trim().length > teks.length / 2 && kiri) break;
    kiri = (kiri + " " + k).trim();
  }
  return [kiri, teks.slice(kiri.length).trim()];
}
