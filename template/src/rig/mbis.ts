// Rig Mbis (kucing stabilo bulat). Pemetaan Sendi:
//   badan = condong seluruh tubuh (poros telapak), kepala = miring wajah+telinga (poros tengah tubuh),
//   lenganAtasKi/Ka = kaki depan (+ terangkat ke atas/luar, 150 = menutup mata), pahaKi/Ka = kaki belakang,
//   betisKa = sudut ekor (+ ikutan).
import { P, ink, wc } from "../sistem/gambar";
import type { Pose } from "./pose";
import { akar, type OpsiGambar } from "./anggota";

const TELAPAK = 104;
const MATA: Record<string, string> = {
  senang: `<ellipse cx="-22" cy="0" rx="15" ry="18" fill="#fff" stroke="${P.ink}" stroke-width="3"/><ellipse cx="22" cy="0" rx="15" ry="18" fill="#fff" stroke="${P.ink}" stroke-width="3"/><circle cx="-18" cy="4" r="6.5" fill="${P.ink}"/><circle cx="26" cy="4" r="6.5" fill="${P.ink}"/><circle cx="-16" cy="1" r="2" fill="#fff"/><circle cx="28" cy="1" r="2" fill="#fff"/>`,
  intip: `<ellipse cx="-22" cy="2" rx="15" ry="13" fill="#fff" stroke="${P.ink}" stroke-width="3"/><ellipse cx="22" cy="2" rx="15" ry="13" fill="#fff" stroke="${P.ink}" stroke-width="3"/><path d="M-38 -4 h32 M6 -4 h32" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/><circle cx="-12" cy="6" r="5.5" fill="${P.ink}"/><circle cx="32" cy="6" r="5.5" fill="${P.ink}"/>`,
  datar: `<ellipse cx="-22" cy="4" rx="15" ry="10" fill="#fff" stroke="${P.ink}" stroke-width="3"/><ellipse cx="22" cy="4" rx="15" ry="10" fill="#fff" stroke="${P.ink}" stroke-width="3"/><path d="M-38 1 h32 M6 1 h32" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/><circle cx="-22" cy="8" r="5" fill="${P.ink}"/><circle cx="22" cy="8" r="5" fill="${P.ink}"/>`,
  tutup: `<path d="M-36 4 q14 8 28 0 M8 4 q14 8 28 0" stroke="${P.ink}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
};

const kakiDepan = (sisi: -1 | 1, sudut: number, nama: "Ki" | "Ka") => {
  const px = sisi * 44;
  return `<g id="mbis-lenganAtas${nama}" transform="rotate(${sisi === -1 ? sudut : -sudut} ${px} 30)">
    ${wc(`<ellipse cx="${px}" cy="62" rx="14" ry="20" fill="${P.yel}"/>`)}${ink(`<ellipse cx="${px}" cy="62" rx="14" ry="20"/>`, 2.6)}</g>`;
};
const kakiBelakang = (sisi: -1 | 1, sudut: number, nama: "Ki" | "Ka") => {
  const px = sisi * 30;
  return `<g id="mbis-paha${nama}" transform="rotate(${sisi === -1 ? sudut : -sudut} ${px} 80)">
    ${wc(`<ellipse cx="${px}" cy="96" rx="16" ry="10" fill="${P.yel}"/>`)}${ink(`<ellipse cx="${px}" cy="96" rx="16" ry="10"/>`, 2.6)}</g>`;
};

export function gambarMbis(pose: Pose, opsi: OpsiGambar): string {
  const s = pose.sendi;
  const mata = MATA[pose.ekspresi] ?? MATA.senang;
  const mulut = opsi.mulut > 0
    ? `<ellipse cx="0" cy="34" rx="${5 + opsi.mulut}" ry="${3 + opsi.mulut * 2.5}" fill="#8A3A33" stroke="${P.ink}" stroke-width="2.4"/>`
    : `<path d="M0 29 q-8 8 -14 2 M0 29 q8 8 14 2" stroke="${P.ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  const ekor = `<g id="mbis-betisKa" transform="rotate(${s.betisKa + opsi.ikutan} 52 60)">
    <path d="M52 60 q60 -6 52 -70 q-4 -22 -18 -24" stroke="${P.yel}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="M86 -34 q12 2 16 14" stroke="${P.ink}" stroke-width="15" fill="none" stroke-linecap="round"/>
    ${ink(`<path d="M52 60 q60 -6 52 -70 q-4 -22 -18 -24"/>`, 2.6)}</g>`;
  const wajah = `<g id="mbis-kepala" transform="rotate(${s.kepala} 0 40)">
    ${wc(`<path d="M-50 -30 l-6 -46 l36 22z" fill="${P.yel}"/>`)}
    <path d="M24 -54 l30 -26 l8 44z" fill="${P.ink}"/><path d="M30 -56 l20 -16" stroke="#fff" stroke-width="3" opacity=".5"/>
    ${ink(`<path d="M-50 -30 l-6 -46 l36 22"/><path d="M-40 18 h-28 M-40 28 l-26 8 M40 18 h28 M40 28 l26 8" stroke-width="2.2"/>`, 3.2)}
    <g transform="translate(0 2) scale(1 ${Math.max(0.1, 1 - opsi.kedip)}) translate(0 -2)">${mata}</g>
    <path d="M-5 24 l5 5 l5 -5z" fill="#E77F6E"/>${mulut}
    <ellipse cx="-40" cy="22" rx="9" ry="5" fill="${P.blush}" opacity=".55"/><ellipse cx="40" cy="22" rx="9" ry="5" fill="${P.blush}" opacity=".55"/></g>`;
  return akar(pose, TELAPAK, 58, `
    <g id="mbis-badan" transform="rotate(${s.badan} 0 ${TELAPAK})">
      ${ekor}${kakiBelakang(-1, s.pahaKi, "Ki")}${kakiBelakang(1, s.pahaKa, "Ka")}
      ${wc(`<path d="M-58 50 q-10 -96 58 -98 q68 2 58 98 q-4 46 -58 48 q-54 -2 -58 -48z" fill="${P.yel}"/>`)}
      <path d="M-58 50 q-4 44 58 48 q50 -2 58 -48 q-30 30 -58 30 q-34 0 -58 -30z" fill="${P.yelSh}" opacity=".5"/>
      ${ink(`<path d="M-58 50 q-10 -96 58 -98 q68 2 58 98 q-4 46 -58 48 q-54 -2 -58 -48z"/>`, 3.2)}
      ${wajah}${kakiDepan(-1, s.lenganAtasKi, "Ki")}${kakiDepan(1, s.lenganAtasKa, "Ka")}
    </g>`);
}
