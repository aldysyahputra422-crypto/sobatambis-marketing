import { describe, expect, it } from "vitest";
import { AKSI_ARTA } from "../src/aksi/arta";
import { rangkaiJalur, titikKontak } from "../src/aksi/rangkai";
import { POSE_DASAR, SENDI } from "../src/rig/pose";

const FPS = 30;

describe("rangkaiJalur", () => {
  it("diam_hidup tetap bergerak", () => {
    const f = rangkaiJalur([{ mulai: 0, aksi: "diam_hidup" }], FPS, POSE_DASAR);
    const a = f(0);
    const b = f(45);
    const beda = SENDI.some((s) => Math.abs(a.sendi[s] - b.sendi[s]) > 0.5);
    expect(beda).toBe(true);
  });

  it("titik kontak banting = mulai + kontak aksi", () => {
    const k = titikKontak([{ mulai: 2, aksi: "banting" }]);
    expect(k[0].detik).toBeCloseTo(2 + (AKSI_ARTA.banting.kontak ?? -99), 5);
  });

  it("tidak ada lompatan sendi > 25 derajat di batas antar aksi", () => {
    const entri = [
      { mulai: 0, aksi: "jalan", param: { dx: 200 } },
      { mulai: 1.6, aksi: "hentak" },
      { mulai: 2.4, aksi: "banting" },
      { mulai: 3.6, aksi: "lompat" },
      { mulai: 4.8, aksi: "diam_hidup" },
    ];
    const f = rangkaiJalur(entri, FPS, POSE_DASAR);
    for (const e of entri.slice(1)) {
      const awal = Math.round(e.mulai * FPS);
      for (let fr = awal - 1; fr < awal + 6; fr++) {
        const a = f(fr);
        const b = f(fr + 1);
        for (const s of SENDI) expect(Math.abs(b.sendi[s] - a.sendi[s])).toBeLessThanOrEqual(25);
        expect(Math.abs(b.x - a.x)).toBeLessThanOrEqual(30);
        expect(Math.abs(b.y - a.y)).toBeLessThanOrEqual(30);
      }
    }
  });

  it("jalan berpindah sejauh dx", () => {
    const f = rangkaiJalur([{ mulai: 0, aksi: "jalan", param: { dx: 200 } }, { mulai: 1.6, aksi: "diam_hidup" }], FPS, POSE_DASAR);
    expect(f(3 * FPS).x).toBeCloseTo(POSE_DASAR.x + 200, 0);
  });

  it("lompat memipih lalu memanjang", () => {
    const f = rangkaiJalur([{ mulai: 0, aksi: "lompat" }], FPS, POSE_DASAR);
    const frames = Array.from({ length: Math.ceil(AKSI_ARTA.lompat.durasi * FPS) }, (_, i) => f(i));
    expect(frames.some((p) => p.sy < 0.9)).toBe(true);
    expect(frames.some((p) => p.sy > 1.08)).toBe(true);
    expect(Math.min(...frames.map((p) => p.y))).toBeLessThan(POSE_DASAR.y - 80);
  });

  it("aksi tak dikenal error", () => {
    expect(() => rangkaiJalur([{ mulai: 0, aksi: "terbang" }], FPS, POSE_DASAR)).toThrow(/terbang/);
  });
});
