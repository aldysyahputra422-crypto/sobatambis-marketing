import { describe, expect, it } from "vitest";
import { POSE_DASAR, easing, interpolasiPose, type Pose } from "../src/rig/pose";
import { gambarArta, ikutanCepol } from "../src/rig/arta";

const dengan = (ubah: Partial<Pose["sendi"]>, lain: Partial<Pose> = {}): Pose => ({
  ...POSE_DASAR, ...lain, sendi: { ...POSE_DASAR.sendi, ...ubah },
});

describe("pose", () => {
  it("interpolasi sendi di tengah = rata-rata", () => {
    const a = dengan({ badan: 0 });
    const b = dengan({ badan: 20 });
    expect(interpolasiPose(a, b, 0.5).sendi.badan).toBe(10);
  });
  it("ekspresi berganti di t >= 0,5", () => {
    const a = { ...POSE_DASAR, ekspresi: "datar" };
    const b = { ...POSE_DASAR, ekspresi: "marah" };
    expect(interpolasiPose(a, b, 0.49).ekspresi).toBe("datar");
    expect(interpolasiPose(a, b, 0.5).ekspresi).toBe("marah");
  });
  it("easing berakhir di 1", () => {
    for (const f of Object.values(easing)) expect(f(1)).toBeCloseTo(1, 5);
    expect(easing.pantul(0)).toBeCloseTo(0, 5);
  });
});

describe("gambarArta", () => {
  const opsi = { mulut: 0 as const, kedip: 0, ikutan: 0 };
  it("memuat segmen per sendi", () => {
    const svg = gambarArta(POSE_DASAR, opsi);
    for (const s of ["lenganBawahKa", "lenganAtasKi", "pahaKa", "betisKi", "kepala", "badan"]) {
      expect(svg).toContain(`id="arta-${s}"`);
    }
  });
  it("sudut sendi mengubah gambar", () => {
    expect(gambarArta(dengan({ lenganAtasKa: 90 }), opsi)).not.toBe(gambarArta(POSE_DASAR, opsi));
  });
  it("bentuk mulut berbeda per tingkat", () => {
    const m = [0, 1, 2, 3, 4].map((x) => gambarArta(POSE_DASAR, { ...opsi, mulut: x as 0 | 1 | 2 | 3 | 4 }));
    expect(new Set(m).size).toBe(5);
  });
  it("ekspresi baru panik dan tawa tersedia", () => {
    expect(gambarArta({ ...POSE_DASAR, ekspresi: "panik" }, opsi)).not.toBe(gambarArta(POSE_DASAR, opsi));
    expect(gambarArta({ ...POSE_DASAR, ekspresi: "tawa" }, opsi)).not.toBe(gambarArta(POSE_DASAR, opsi));
  });
});

describe("ikutanCepol", () => {
  it("bereaksi terhadap gerak kepala lalu meredam ke nol", () => {
    let ik = 0;
    let sebelum = POSE_DASAR;
    const gerak = dengan({ kepala: 25 });
    ik = ikutanCepol(sebelum, gerak, ik);
    expect(Math.abs(ik)).toBeGreaterThan(1);
    sebelum = gerak;
    for (let i = 0; i < 30; i++) ik = ikutanCepol(sebelum, sebelum, ik);
    expect(Math.abs(ik)).toBeLessThan(1);
  });
});
