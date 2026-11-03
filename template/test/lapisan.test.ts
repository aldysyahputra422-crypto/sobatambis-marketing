import { describe, expect, it } from "vitest";
import { kameraPada } from "../src/lapisan/kamera";
import { propertiPada, teksPada, transisiPada } from "../src/lapisan/gerak";

describe("kamera", () => {
  it("hentak melonjak lalu kembali", () => {
    const j = [{ mulai: 1, selesai: 3, jenis: "lebar" as const, gerak: "hentak" as const }];
    expect(kameraPada(j, 1.1).skala).toBeGreaterThan(1.08);
    expect(kameraPada(j, 1.5).skala).toBeLessThanOrEqual(1.02);
  });
  it("dekat berskala 2,4 dan sisipan 3", () => {
    expect(kameraPada([{ mulai: 0, selesai: 2, jenis: "dekat", target: { x: 360, y: 500 } }], 1).skala).toBeCloseTo(2.4, 5);
    expect(kameraPada([{ mulai: 0, selesai: 2, jenis: "sisipan", target: { x: 360, y: 500 } }], 1).skala).toBeCloseTo(3, 5);
  });
  it("dorong naik pelan sampai +6%", () => {
    const j = [{ mulai: 0, selesai: 2, jenis: "lebar" as const, gerak: "dorong" as const }];
    expect(kameraPada(j, 0).skala).toBeCloseTo(1, 5);
    expect(kameraPada(j, 2).skala).toBeCloseTo(1.06, 2);
  });
  it("di luar semua entri = lebar diam", () => {
    expect(kameraPada([], 5)).toEqual({ skala: 1, x: 0, y: 0, rot: 0 });
  });
});

describe("properti", () => {
  it("banting: tidak tampil sebelum masuk, memipih saat masuk, diam 0,3 detik sesudahnya", () => {
    const e = { id: "sticky_7jam", masuk: 2, cara: "banting" as const };
    expect(propertiPada(e, 1.9).tampil).toBe(false);
    expect(propertiPada(e, 2).sx).toBeGreaterThan(1.15);
    const diam = propertiPada(e, 2.35);
    expect(diam.sx).toBeCloseTo(1, 1);
    expect(diam.x).toBeCloseTo(0, 0);
  });
  it("terlempar keluar jauh dari asal", () => {
    const e = { id: "a", masuk: 0, cara: "pop" as const, keluar: 1, caraKeluar: "terlempar" as const };
    const p = propertiPada(e, 1.4);
    expect(Math.hypot(p.x, p.y)).toBeGreaterThan(400);
  });
  it("jatuh keluar turun ke bawah layar", () => {
    const e = { id: "a", masuk: 0, cara: "pop" as const, keluar: 1, caraKeluar: "jatuh" as const };
    expect(propertiPada(e, 1.8).y).toBeGreaterThan(800);
  });
});

describe("teks", () => {
  const j = [{ kata: "OKE.", mulai: 1, selesai: 1.4, gaya: "biasa" as const }, { kata: "TUJUH", mulai: 2, selesai: 2.5, gaya: "cap" as const }];
  it("cap masuk besar lalu normal", () => {
    const awal = teksPada(j, 2).find((k) => k.kata === "TUJUH");
    expect(awal?.skala).toBeGreaterThan(2);
    const akhir = teksPada(j, 2.3).find((k) => k.kata === "TUJUH");
    expect(akhir?.skala).toBeCloseTo(1, 1);
  });
  it("kata belum muncul tidak dikembalikan, kata aktif ditandai", () => {
    expect(teksPada(j, 0.5).length).toBe(0);
    const k = teksPada(j, 1.2);
    expect(k.map((x) => x.kata)).toEqual(["OKE."]);
    expect(k[0].aktif).toBe(true);
  });
});

describe("transisi", () => {
  it("null di luar jendela 0,35 detik", () => {
    const t = [{ pada: 3, jenis: "halaman" as const }];
    expect(transisiPada(t, 2.5)).toBeNull();
    expect(transisiPada(t, 3)?.kemajuan).toBeCloseTo(0.5, 2);
  });
});
