// Pecah caption menjadi layar-layar berisi maksimal `maksBaris` baris, setiap baris <= `lebar` px.
export function pecahCaption(teks: string, ukur: (s: string) => number, lebar = 592, maksBaris = 2): string[][] {
  const kata = teks.split(/\s+/).filter(Boolean);
  const baris: string[] = [];
  let kini = "";
  for (const k of kata) {
    const coba = kini ? `${kini} ${k}` : k;
    if (kini && ukur(coba) > lebar) {
      baris.push(kini);
      kini = k;
    } else {
      kini = coba;
    }
  }
  if (kini) baris.push(kini);
  const layar: string[][] = [];
  for (let i = 0; i < baris.length; i += maksBaris) layar.push(baris.slice(i, i + maksBaris));
  return layar;
}
