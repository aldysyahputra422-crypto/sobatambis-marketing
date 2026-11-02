// Tata letak bersama Episode, Caption, dan latar, supaya tokoh tidak tertutup caption atau menabrak properti.
export const CAPTION = { jarakBawah: 120, padding: 18, ukuranHuruf: 38, tinggiBaris: 1.25 };
// Pose penuh Arta (kamar). Bayangan kaki di y lokal 452 (+14); ujung pensil di cepol di y lokal -266.
export const ARTA_PENUH = { x: 250, y: 648, skala: 0.78 };
const BAYANGAN_KAKI = 452 + 14;
const UJUNG_PENSIL = 266;
// Papan "100 HARI" di latar kamar dinaikkan 40 px dari desain awal (y 196..466 -> 156..426).
export const PAPAN_GESER = -40;
export const PAPAN_BAWAH = 466 + PAPAN_GESER;

export const atasCaption = (baris: number) =>
  1280 - CAPTION.jarakBawah - 2 * CAPTION.padding - baris * CAPTION.ukuranHuruf * CAPTION.tinggiBaris;

export const bawahKakiArta = () => ARTA_PENUH.y + BAYANGAN_KAKI * ARTA_PENUH.skala;
export const atasPensilArta = () => ARTA_PENUH.y - UJUNG_PENSIL * ARTA_PENUH.skala;
