import { describe, expect, it } from "vitest";
import { ARTA_PENUH, atasCaption, bawahKakiArta } from "../src/tata";

describe("tata letak", () => {
  it("kaki Arta pose penuh tidak tertutup caption dua baris", () => {
    expect(bawahKakiArta()).toBeLessThan(atasCaption(2) - 10);
  });
  it("kepala Arta pose penuh tetap di bawah papan 100 hari (y 466)", () => {
    expect(ARTA_PENUH.y - 180 * ARTA_PENUH.skala).toBeGreaterThan(466);
  });
});
