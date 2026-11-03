import { describe, expect, it } from "vitest";
import { efekEmosi } from "../src/efek/emosi";
import { pecahCaption } from "../src/teks/pecah";
import { adeganAktif } from "../src/data/adegan";

const ukurKasar = (s: string) => s.length * 22; // ±22 px per huruf pada 38px Bricolage 800

describe("efekEmosi", () => {
  it("marah puncak menggoyang kamera dan merahkan tepi", () => {
    const e = efekEmosi("marah", 9, 3);
    expect(e.goyang.x).not.toBe(0);
    expect(e.rona).toBe("merah");
    expect(e.skalaCaption).toBeGreaterThan(1.5);
  });
  it("lelah tidak bergoyang dan tanpa rona", () => {
    const e = efekEmosi("lelah", 3, 3);
    expect(e.goyang).toEqual({ x: 0, y: 0 });
    expect(e.rona).toBeNull();
  });
  it("hancur puncak menggelapkan tepi", () => {
    expect(efekEmosi("hancur", 9, 10).rona).toBe("gelap");
  });
  it("goyang marah reda setelah 8 frame", () => {
    expect(efekEmosi("marah", 9, 20).goyang).toEqual({ x: 0, y: 0 });
  });
});

describe("pecahCaption", () => {
  it("setiap layar maksimal 2 baris dan setiap baris muat 592 px", () => {
    const layar = pecahCaption("Hari pertama. Aku bikin rencana yang nggak mungkin gagal.", ukurKasar);
    for (const baris of layar) {
      expect(baris.length).toBeLessThanOrEqual(2);
      for (const b of baris) expect(ukurKasar(b)).toBeLessThanOrEqual(592);
    }
    expect(layar.flat().join(" ")).toBe("Hari pertama. Aku bikin rencana yang nggak mungkin gagal.");
  });
  it("teks sangat panjang dipecah ke beberapa layar", () => {
    const panjang = Array(30).fill("kata").join(" ");
    expect(pecahCaption(panjang, ukurKasar).length).toBeGreaterThan(1);
  });
});

describe("adeganAktif", () => {
  const a = { durasi: 6, adegan: [{ mulai: 0, akhir_jeda: 2 }, { mulai: 2, akhir_jeda: 4 }, { mulai: 4, akhir_jeda: 6 }] };
  it("memilih adegan sesuai detik", () => {
    expect(adeganAktif(a as never, 0.5)).toBe(0);
    expect(adeganAktif(a as never, 3.9)).toBe(1);
    expect(adeganAktif(a as never, 5.99)).toBe(2);
  });
  it("lewat durasi tetap adegan terakhir", () => {
    expect(adeganAktif(a as never, 9)).toBe(2);
  });
});

import { posisiCatatan, pecahCatatan } from "../src/teks/catatan";

describe("catatan merah", () => {
  it("catatan panjang dipecah jadi dua baris", () => {
    expect(pecahCatatan("ini jam tidur atau jam kerja?")).toHaveLength(2);
    expect(pecahCatatan("realistis??")).toHaveLength(1);
  });
  it("setiap latar punya posisi catatan di kanan kepala Arta", () => {
    for (const latar of ["kamar", "dinding_sticky", "ruang_tamu", "meja_malam"]) {
      const p = posisiCatatan(latar);
      expect(p.x).toBeGreaterThanOrEqual(430);
      expect(p.x).toBeLessThanOrEqual(520);
    }
  });
});
