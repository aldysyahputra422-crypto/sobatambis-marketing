import { describe, expect, it } from "vitest";
import { AKSI } from "../src/aksi/index";
import { rangkaiJalur, titikKontak } from "../src/aksi/rangkai";
import { POSE_DASAR, SENDI } from "../src/rig/pose";

const FPS = 30;
const tokohs = ["arta", "ratna", "mbis"] as const;

describe("pustaka aksi per tokoh", () => {
  it("arta punya aksi tambahan", () => {
    for (const n of ["lari", "tunjuk", "lemas", "kaget", "tidur_berdiri", "terduduk", "menoleh", "serahkan", "tabrak"]) expect(AKSI.arta[n]).toBeDefined();
  });
  it("ratna dan mbis punya aksinya", () => {
    for (const n of ["diam_hidup", "lirik_hp", "menghela", "jalan", "serahkan"]) expect(AKSI.ratna[n]).toBeDefined();
    for (const n of ["diam_hidup", "ngintip", "geleng", "muncul", "tutup_mata"]) expect(AKSI.mbis[n]).toBeDefined();
  });
  for (const t of tokohs) {
    it(`${t}: setiap aksi tersampel tanpa NaN`, () => {
      for (const [nama, a] of Object.entries(AKSI[t])) {
        expect(a.durasi).toBeGreaterThan(0);
        const f = rangkaiJalur([{ mulai: 0, aksi: nama }], FPS, POSE_DASAR, t);
        for (let fr = 0; fr <= a.durasi * FPS + 2; fr++) {
          const p = f(fr);
          for (const s of SENDI) expect(Number.isFinite(p.sendi[s])).toBe(true);
          expect(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.sy)).toBe(true);
        }
      }
    });
    it(`${t}: peralihan antar aksi acak tidak melompat > 25 derajat`, () => {
      const nama = Object.keys(AKSI[t]);
      let benih = 7;
      const acak = () => ((benih = (benih * 1103515245 + 12345) % 2147483648) / 2147483648);
      const entri = Array.from({ length: 6 }, (_, i) => ({ mulai: i * 1.3, aksi: nama[Math.floor(acak() * nama.length)] }));
      const f = rangkaiJalur(entri, FPS, POSE_DASAR, t);
      for (const e of entri.slice(1)) {
        const awal = Math.round(e.mulai * FPS);
        for (let fr = awal - 1; fr < awal + 6; fr++) {
          const a = f(fr), b = f(fr + 1);
          for (const s of SENDI) expect(Math.abs(b.sendi[s] - a.sendi[s])).toBeLessThanOrEqual(25);
        }
      }
    });
  }
  it("aksi yang tidak cocok dengan tokoh error menyebut tokoh", () => {
    expect(() => rangkaiJalur([{ mulai: 0, aksi: "banting" }], FPS, POSE_DASAR, "mbis")).toThrow(/banting.*mbis/);
  });
  it("lari lebih cepat dari jalan", () => {
    const jalan = rangkaiJalur([{ mulai: 0, aksi: "jalan", param: { dx: 400 } }], FPS, POSE_DASAR, "arta");
    const lari = rangkaiJalur([{ mulai: 0, aksi: "lari", param: { dx: 400 } }], FPS, POSE_DASAR, "arta");
    expect(lari(36).x - POSE_DASAR.x).toBeGreaterThan(jalan(36).x - POSE_DASAR.x + 100);
  });
  it("tabrak punya titik kontak", () => {
    expect(titikKontak([{ mulai: 1, aksi: "tabrak" }], "arta")[0].detik).toBeGreaterThan(1);
  });
  it("menoleh mengubah kepala minimal 20 derajat", () => {
    const f = rangkaiJalur([{ mulai: 0, aksi: "menoleh" }], FPS, POSE_DASAR, "arta");
    const maks = Math.max(...Array.from({ length: 30 }, (_, i) => Math.abs(f(i).sendi.kepala)));
    expect(maks).toBeGreaterThanOrEqual(20);
  });
});
