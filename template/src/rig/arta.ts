// Rig Arta: tubuh penuh dipecah per sendi, setiap segmen berputar di porosnya.
// Koordinat lokal mengikuti artaFull lama (kepala di y≈0, telapak di y≈452).
import { P, artaHead, ink, wc } from "../sistem/gambar";
import type { Pose } from "./pose";
import { BUKA, UKURAN_ARTA as U, akar, kaki, lengan, posisiTanganDari, type OpsiGambar } from "./anggota";

export { ikutanCepol, type OpsiGambar } from "./anggota";

const sepatu = (sisi: -1 | 1) => (hx: number, yK: number) =>
  `<rect x="${hx - 16}" y="${yK - 6}" width="32" height="30" rx="4" fill="#fff"/>` +
  wc(sisi === -1
    ? `<path d="M${hx - 26} ${yK + 22} h40 v18 h-50 q0 -18 10 -18z" fill="${P.shoe}"/>`
    : `<path d="M${hx - 14} ${yK + 22} h40 q10 0 10 18 h-50z" fill="${P.shoe}"/>`);

export function gambarArta(pose: Pose, opsi: OpsiGambar): string {
  const s = pose.sendi;
  const kepala = artaHead(pose.ekspresi, { kedip: opsi.kedip, buka: BUKA[opsi.mulut], miring: opsi.ikutan });
  const badan = `
    ${wc(`<path d="M-74 112 q74 -32 148 0 l8 128 h-164z" fill="${P.shirt}"/>`)}
    <path d="M-74 112 q74 -32 148 0 l2 26 q-76 -24 -152 0z" fill="${P.shirtSh}" opacity=".8"/>
    ${ink(`<path d="M-74 112 q74 -32 148 0 l8 128 h-164z"/><path d="M-24 100 l24 28 l24 -28"/><rect x="26" y="148" width="28" height="22"/>`)}
    <circle cx="40" cy="160" r="5" fill="${P.red}"/>
    <g id="arta-kepala" transform="rotate(${s.kepala} ${U.leher.x} ${U.leher.y})"><g transform="translate(0 -6)">${kepala}</g></g>
    ${lengan("arta", U, -1, s.lenganAtasKi, s.lenganBawahKi, "Ki", P.shirt)}
    ${lengan("arta", U, 1, s.lenganAtasKa, s.lenganBawahKa, "Ka", P.shirt)}`;
  const rok = `${wc(`<path d="M-74 232 l-16 104 h180 l-16 -104z" fill="${P.skirt}"/>`)}
    <path d="M-40 240 l-8 92 M0 240 v94 M40 240 l8 92" stroke="${P.skirtSh}" stroke-width="3"/>
    ${ink(`<path d="M-74 232 l-16 104 h180 l-16 -104"/>`)}`;
  return akar(pose, U.telapak, 104, `
      ${kaki("arta", U, -1, s.pahaKi, s.betisKi, "Ki", P.skin, sepatu(-1))}${kaki("arta", U, 1, s.pahaKa, s.betisKa, "Ka", P.skin, sepatu(1))}
      ${rok}
      <g id="arta-badan" transform="rotate(${s.badan} ${U.pinggang.x} ${U.pinggang.y})">${badan}</g>`);
}

export const posisiTangan = (pose: Pose, sisi: "Ki" | "Ka") => posisiTanganDari(U, pose, sisi);
