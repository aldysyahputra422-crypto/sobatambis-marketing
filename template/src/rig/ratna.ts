// Rig Bu Ratna: kerangka sama dengan Arta (Sendi sama), berhijab, blus batik, rok panjang.
// Kaki hampir seluruhnya tertutup rok; hanya sandal terlihat dan ujung rok ikut ayunan kaki.
import { P, eyes, ink, mouth, wc } from "../sistem/gambar";
import type { Pose } from "./pose";
import { BUKA, UKURAN_ARTA, akar, kaki, lengan, posisiTanganDari, type OpsiGambar, type Ukuran } from "./anggota";

const U: Ukuran = { ...UKURAN_ARTA, bahu: { x: 84, y: 130 } };

const sandal = (hx: number, yK: number) => wc(`<ellipse cx="${hx}" cy="${yK + 30}" rx="24" ry="10" fill="${P.hijabSh}"/>`) + ink(`<ellipse cx="${hx}" cy="${yK + 30}" rx="24" ry="10"/>`, 2.4);

function kepalaRatna(ekspresi: string, opsi: OpsiGambar): string {
  const ayun = opsi.ikutan * 0.4;
  return `
  <g transform="rotate(${ayun} 0 40)">${wc(`<path d="M-110 24 q0 -124 110 -124 q110 0 110 124 q0 74 -40 112 q-70 26 -140 0 q-40 -38 -40 -112z" fill="${P.hijab}"/>`)}
  <path d="M-70 120 q70 40 140 0 l20 30 q-90 40 -180 0z" fill="${P.hijabSh}"/>
  ${ink(`<path d="M-110 24 q0 -124 110 -124 q110 0 110 124 q0 74 -40 112 q-70 26 -140 0 q-40 -38 -40 -112z"/>`)}</g>
  ${wc(`<ellipse cx="0" cy="14" rx="78" ry="80" fill="${P.skin}"/>`)}
  ${wc(`<path d="M-84 -6 q0 -86 84 -86 q84 0 84 86 q-22 -52 -84 -56 q-62 4 -84 56z" fill="${P.hijab}"/>`)}
  ${ink(`<ellipse cx="0" cy="14" rx="78" ry="80"/>`)}
  <ellipse cx="-48" cy="52" rx="13" ry="8" fill="${P.blush}" opacity=".45"/><ellipse cx="48" cy="52" rx="13" ry="8" fill="${P.blush}" opacity=".45"/>
  <g transform="translate(0 6) scale(.84)">${eyes(ekspresi, 1, opsi.kedip)}${mouth(ekspresi, 1, BUKA[opsi.mulut])}</g>`;
}

export function gambarRatna(pose: Pose, opsi: OpsiGambar): string {
  const s = pose.sendi;
  const geserRok = ((s.pahaKa - s.pahaKi) + (s.betisKi - s.betisKa)) * 0.6;
  const badan = `
    ${wc(`<path d="M-84 112 q84 -36 168 0 l10 128 h-188z" fill="${P.batik}"/>`)}
    <path d="M-84 112 q84 -36 168 0 l10 128 h-188z" fill="url(#batik)" opacity=".85"/>
    ${ink(`<path d="M-84 112 q84 -36 168 0 l10 128 h-188z"/>`)}
    <g id="ratna-kepala" transform="rotate(${s.kepala} ${U.leher.x} ${U.leher.y})"><g transform="translate(0 -6)">${kepalaRatna(pose.ekspresi, opsi)}</g></g>
    ${lengan("ratna", U, -1, s.lenganAtasKi, s.lenganBawahKi, "Ki", P.batik)}
    ${lengan("ratna", U, 1, s.lenganAtasKa, s.lenganBawahKa, "Ka", P.batik)}`;
  const rok = `${wc(`<path d="M-86 232 L${-104 + geserRok} 438 H${104 + geserRok} L86 232z" fill="${P.batikSh}"/>`)}
    <path d="M-40 250 L${-48 + geserRok} 430 M40 250 L${48 + geserRok} 430" stroke="${P.batik}" stroke-width="4" opacity=".6"/>
    ${ink(`<path d="M-86 232 L${-104 + geserRok} 438 H${104 + geserRok} L86 232"/>`)}`;
  return akar(pose, U.telapak, 112, `
      ${kaki("ratna", U, -1, s.pahaKi, s.betisKi, "Ki", P.batikSh, sandal)}${kaki("ratna", U, 1, s.pahaKa, s.betisKa, "Ka", P.batikSh, sandal)}
      ${rok}
      <g id="ratna-badan" transform="rotate(${s.badan} ${U.pinggang.x} ${U.pinggang.y})">${badan}</g>`);
}

export const posisiTanganRatna = (pose: Pose, sisi: "Ki" | "Ka") => posisiTanganDari(U, pose, sisi);
