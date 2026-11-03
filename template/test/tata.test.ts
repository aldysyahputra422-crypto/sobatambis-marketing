import { describe, expect, it } from "vitest";
import { ARTA_PENUH, PAPAN_BAWAH, atasCaption, atasPensilArta, bawahKakiArta } from "../src/tata";

describe("tata letak", () => {
  it("kaki Arta pose penuh tidak tertutup caption dua baris", () => {
    expect(bawahKakiArta()).toBeLessThan(atasCaption(2) - 10);
  });
  it("ujung pensil di cepol Arta tidak menabrak papan 100 hari", () => {
    expect(atasPensilArta()).toBeGreaterThan(PAPAN_BAWAH + 6);
  });
  it("Arta pose penuh tidak mengecil berlebihan", () => {
    expect(ARTA_PENUH.skala).toBeGreaterThanOrEqual(0.75);
  });
});
