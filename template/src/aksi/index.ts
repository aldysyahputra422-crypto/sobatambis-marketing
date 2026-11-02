import type { Aksi } from "./tipe";
import { AKSI_ARTA } from "./arta";
import { AKSI_RATNA } from "./ratna";
import { AKSI_MBIS } from "./mbis";

export type IdTokohAksi = "arta" | "ratna" | "mbis";
export const AKSI: Record<IdTokohAksi, Record<string, Aksi>> = { arta: AKSI_ARTA, ratna: AKSI_RATNA, mbis: AKSI_MBIS };
