import { describe, expect, it } from "vitest";
import { POSE_DASAR, type Pose } from "../src/rig/pose";
import { TOKOH } from "../src/rig/tokoh";

const opsi = { mulut: 0 as const, kedip: 0, ikutan: 0 };
const dengan = (ubah: Partial<Pose["sendi"]>, lain: Partial<Pose> = {}): Pose => ({ ...POSE_DASAR, ...lain, sendi: { ...POSE_DASAR.sendi, ...ubah } });

describe("registry tokoh", () => {
  it("tiga tokoh terdaftar", () => {
    expect(Object.keys(TOKOH).sort()).toEqual(["arta", "mbis", "ratna"]);
  });
  for (const id of ["ratna", "mbis"] as const) {
    it(`${id}: segmen per sendi dan pose mengubah gambar`, () => {
      const svg = TOKOH[id].gambar(POSE_DASAR, opsi);
      for (const s of ["badan", "kepala", "lenganAtasKa", "pahaKi"]) expect(svg).toContain(`id="${id}-${s}"`);
      expect(TOKOH[id].gambar(dengan({ lenganAtasKa: 120 }), opsi)).not.toBe(svg);
      expect(TOKOH[id].gambar(dengan({ kepala: 15 }), opsi)).not.toBe(svg);
    });
  }
  it("ratna: ekspresi dan mulut mengubah gambar, tangan tersedia", () => {
    const a = TOKOH.ratna.gambar({ ...POSE_DASAR, ekspresi: "lirik" }, opsi);
    expect(TOKOH.ratna.gambar({ ...POSE_DASAR, ekspresi: "senyum" }, opsi)).not.toBe(a);
    expect(TOKOH.ratna.gambar({ ...POSE_DASAR, ekspresi: "lirik" }, { ...opsi, mulut: 3 })).not.toBe(a);
    expect(TOKOH.ratna.tangan).toBeDefined();
  });
  it("mbis: ekor ikut sudut betisKa dan ikutan", () => {
    const a = TOKOH.mbis.gambar(POSE_DASAR, opsi);
    expect(TOKOH.mbis.gambar(dengan({ betisKa: 30 }), opsi)).not.toBe(a);
    expect(TOKOH.mbis.gambar(POSE_DASAR, { ...opsi, ikutan: 20 })).not.toBe(a);
    expect(TOKOH.mbis.gambar({ ...POSE_DASAR, ekspresi: "datar" }, opsi)).not.toBe(TOKOH.mbis.gambar({ ...POSE_DASAR, ekspresi: "senang" }, opsi));
  });
});
