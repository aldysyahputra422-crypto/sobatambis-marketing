// Tata letak bersama Episode dan Caption, supaya tokoh tidak tertutup kartu caption.
export const CAPTION = { jarakBawah: 120, padding: 18, ukuranHuruf: 38, tinggiBaris: 1.25 };
// Pose penuh Arta (kamar). Bayangan kaki ada di y lokal 452; kepala + pensil sampai sekitar y lokal -180.
export const ARTA_PENUH = { x: 250, y: 625, skala: 0.8 };
const BAYANGAN_KAKI = 452 + 14;

export const atasCaption = (baris: number) =>
  1280 - CAPTION.jarakBawah - 2 * CAPTION.padding - baris * CAPTION.ukuranHuruf * CAPTION.tinggiBaris;

export const bawahKakiArta = () => ARTA_PENUH.y + BAYANGAN_KAKI * ARTA_PENUH.skala;
