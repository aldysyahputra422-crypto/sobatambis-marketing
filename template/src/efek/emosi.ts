export type Efek = { goyang: { x: number; y: number }; rona: "merah" | "gelap" | null; skalaCaption: number };

// Arah layar per emosi (story-bible bagian 6). frameLokal = frame sejak adegan dimulai.
export function efekEmosi(emosi: string, intensitas: number, frameLokal: number): Efek {
  const diam = { x: 0, y: 0 };
  if (emosi === "marah") {
    const kuat = intensitas >= 8;
    const goyang =
      kuat && frameLokal < 8
        ? { x: Math.round(Math.sin(frameLokal * 2.7) * 9) || 4, y: Math.round(Math.cos(frameLokal * 3.1) * 6) }
        : diam;
    return { goyang, rona: kuat ? "merah" : null, skalaCaption: kuat ? 1.8 : 1.15 };
  }
  if (emosi === "kaget" && frameLokal < 5) {
    return { goyang: { x: 0, y: frameLokal % 2 ? -6 : 6 }, rona: null, skalaCaption: 1.2 };
  }
  if (emosi === "hancur" && intensitas >= 7) return { goyang: diam, rona: "gelap", skalaCaption: 1 };
  if (emosi === "misterius") return { goyang: diam, rona: "gelap", skalaCaption: 1 };
  return { goyang: diam, rona: null, skalaCaption: 1 };
}
