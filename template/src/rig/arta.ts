// Rig Arta: tubuh penuh dipecah per sendi, setiap segmen berputar di porosnya.
// Koordinat lokal mengikuti artaFull lama (kepala di y≈0, telapak di y≈452), lalu digeser
// sehingga titik akar (pose.x, pose.y) = tengah telapak kaki.
import { P, artaHead, ink, wc } from "../sistem/gambar";
import type { Pose } from "./pose";

export type OpsiGambar = { mulut: 0 | 1 | 2 | 3 | 4; kedip: number; ikutan: number };

const BUKA = [0, 0.3, 0.55, 0.8, 1];
const TELAPAK = 452;
const BAHU = { x: 76, y: 128 };
const SIKU = 66; // panjang lengan atas
const LENGAN_BAWAH = 62;
const PINGGUL = { x: 30, y: 300 };
const PAHA = 64;
const BETIS = 64;
const PINGGANG = { x: 0, y: 236 };
const LEHER = { x: 0, y: 104 };

// sisi: -1 = kiri layar, +1 = kanan layar
const lengan = (sisi: -1 | 1, atas: number, bawah: number, nama: "Ki" | "Ka") => {
  const bx = sisi * BAHU.x;
  const seg = (y0: number, y1: number) =>
    `<path d="M${bx} ${y0} L${bx} ${y1}" stroke="${P.ink}" stroke-width="34" stroke-linecap="round"/>` +
    `<path d="M${bx} ${y0} L${bx} ${y1}" stroke="${P.shirt}" stroke-width="27" stroke-linecap="round"/>`;
  const yS = BAHU.y + SIKU;
  const yT = yS + LENGAN_BAWAH;
  // + atas = menjauh dari badan: kiri layar berputar searah jarum jam (+), kanan berlawanan (−)
  return `<g id="arta-lenganAtas${nama}" transform="rotate(${sisi === -1 ? atas : -atas} ${bx} ${BAHU.y})">${seg(BAHU.y, yS)}
    <g id="arta-lenganBawah${nama}" transform="rotate(${sisi === -1 ? -bawah : bawah} ${bx} ${yS})">${seg(yS, yT)}
      <circle cx="${bx}" cy="${yT + 8}" r="14" fill="${P.skin}" stroke="${P.ink}" stroke-width="2.6"/></g></g>`;
};

const kaki = (sisi: -1 | 1, paha: number, betis: number, nama: "Ki" | "Ka") => {
  const hx = sisi * PINGGUL.x;
  const yL = PINGGUL.y + PAHA;
  const yK = yL + BETIS;
  const seg = (y0: number, y1: number) =>
    `<path d="M${hx} ${y0} L${hx} ${y1}" stroke="${P.ink}" stroke-width="34" stroke-linecap="round"/>` +
    `<path d="M${hx} ${y0} L${hx} ${y1}" stroke="${P.skin}" stroke-width="28" stroke-linecap="round"/>`;
  const sepatu = sisi === -1
    ? `<path d="M${hx - 26} ${yK + 22} h40 v18 h-50 q0 -18 10 -18z" fill="${P.shoe}"/>`
    : `<path d="M${hx - 14} ${yK + 22} h40 q10 0 10 18 h-50z" fill="${P.shoe}"/>`;
  return `<g id="arta-paha${nama}" transform="rotate(${sisi === -1 ? paha : -paha} ${hx} ${PINGGUL.y})">${seg(PINGGUL.y, yL)}
    <g id="arta-betis${nama}" transform="rotate(${sisi === -1 ? -betis : betis} ${hx} ${yL})">${seg(yL, yK)}
      <rect x="${hx - 16}" y="${yK - 6}" width="32" height="30" rx="4" fill="#fff"/>${wc(sepatu)}</g></g>`;
};

export function gambarArta(pose: Pose, opsi: OpsiGambar): string {
  const s = pose.sendi;
  const kepala = artaHead(pose.ekspresi, { kedip: opsi.kedip, buka: BUKA[opsi.mulut], miring: opsi.ikutan });
  const badan = `
    ${wc(`<path d="M-74 112 q74 -32 148 0 l8 128 h-164z" fill="${P.shirt}"/>`)}
    <path d="M-74 112 q74 -32 148 0 l2 26 q-76 -24 -152 0z" fill="${P.shirtSh}" opacity=".8"/>
    ${ink(`<path d="M-74 112 q74 -32 148 0 l8 128 h-164z"/><path d="M-24 100 l24 28 l24 -28"/><rect x="26" y="148" width="28" height="22"/>`)}
    <circle cx="40" cy="160" r="5" fill="${P.red}"/>
    <g id="arta-kepala" transform="rotate(${s.kepala} ${LEHER.x} ${LEHER.y})"><g transform="translate(0 -6)">${kepala}</g></g>
    ${lengan(-1, s.lenganAtasKi, s.lenganBawahKi, "Ki")}
    ${lengan(1, s.lenganAtasKa, s.lenganBawahKa, "Ka")}`;
  const rok = `${wc(`<path d="M-74 232 l-16 104 h180 l-16 -104z" fill="${P.skirt}"/>`)}
    <path d="M-40 240 l-8 92 M0 240 v94 M40 240 l8 92" stroke="${P.skirtSh}" stroke-width="3"/>
    ${ink(`<path d="M-74 232 l-16 104 h180 l-16 -104"/>`)}`;
  const k = pose.skala;
  return `<g transform="translate(${pose.x} ${pose.y}) scale(${k * pose.sx} ${k * pose.sy})">
    <ellipse cx="0" cy="0" rx="${104 / pose.sx}" ry="14" fill="#4a2f14" opacity=".14"/>
    <g transform="translate(0 ${-TELAPAK})">
      ${kaki(-1, s.pahaKi, s.betisKi, "Ki")}${kaki(1, s.pahaKa, s.betisKa, "Ka")}
      ${rok}
      <g id="arta-badan" transform="rotate(${s.badan} ${PINGGANG.x} ${PINGGANG.y})">${badan}</g>
    </g></g>`;
}

// Gerak ikutan cepol + pensil: tertinggal melawan arah gerak kepala/badan lalu meluruh (×0,75 per frame).
export function ikutanCepol(sebelum: Pose, pose: Pose, ikutanSebelum: number): number {
  const dorong = (pose.sendi.kepala + pose.sendi.badan) - (sebelum.sendi.kepala + sebelum.sendi.badan);
  const angkat = (pose.y - sebelum.y) * 0.15; // naik-turun badan juga mengayunkan pensil
  return (ikutanSebelum - (dorong + angkat) * 1.2) * 0.75;
}
