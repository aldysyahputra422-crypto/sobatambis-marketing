// @ts-nocheck
// Latar dan properti dunia jurnal (port dari docs/desain/sumber/frames.js & emo.js).
import { P, ink, wc, hand, highlight, paper } from "../sistem/gambar";
import { PAPAN_GESER } from "../tata";

const jendela = (malam: boolean) => `
  ${wc(`<rect x="470" y="180" width="170" height="200" rx="6" fill="${malam ? "#3B4C86" : "#BFD9F0"}" opacity="${malam ? 0.55 : 0.7}"/>`)}
  ${malam ? `<path d="M612 214 a20 20 0 1 0 7 27 a16 16 0 1 1 -7 -27z" fill="#FFF3C4"/>` : `<circle cx="602" cy="226" r="20" fill="#FFE7A0"/>`}
  ${ink(`<rect x="470" y="180" width="170" height="200" rx="6"/><line x1="555" y1="180" x2="555" y2="380"/><line x1="470" y1="280" x2="640" y2="280"/><path d="M458 380 h194"/>`, 3)}`;

const meja = (y = 820) => `
  ${wc(`<rect x="70" y="${y}" width="580" height="22" rx="4" fill="#E2C8A2"/><rect x="92" y="${y + 22}" width="536" height="200" fill="#EAD5B4"/>`)}
  <rect x="92" y="${y + 22}" width="536" height="26" fill="#C9AC84" opacity=".45"/>
  ${ink(`<path d="M70 ${y} h580 M70 ${y + 22} h580"/><rect x="92" y="${y + 22}" width="536" height="200"/><rect x="380" y="${y + 70}" width="200" height="70" rx="6"/><path d="M455 ${y + 105} h50"/>`, 3)}`;

const lampu = () => `
  ${ink(`<path d="M590 820 v-110 l-50 -66"/><path d="M500 630 l64 -30 l16 36 z"/>`, 3)}
  ${wc(`<path d="M500 630 l64 -30 l16 36 z" fill="#E8A13A"/>`)}`;

const jam = (x: number, y: number, t: string) =>
  `${wc(`<circle cx="${x}" cy="${y}" r="44" fill="#FFFCF5"/>`)}${ink(`<circle cx="${x}" cy="${y}" r="44"/><path d="M${x} ${y} v-30 M${x} ${y} l20 8"/>`, 3)}${hand(x, y + 80, t, { size: 30, anchor: "middle" })}`;

export const sticky = (x, y, w, h, txt: string[], rot: number, color = "#FFE58A", size = 30) => `
  <g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><g filter="url(#soft)">${wc(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`)}</g>
  <rect x="${x + w / 2 - 22}" y="${y - 8}" width="44" height="16" fill="#EDE3CF" opacity=".85"/>
  ${txt.map((t, i) => hand(x + w / 2, y + 44 + i * 34, t, { size, anchor: "middle" })).join("")}</g>`;

const papan = () => `
  <g transform="translate(0 ${PAPAN_GESER}) rotate(-3 300 330)">
    <g filter="url(#soft)">${wc(`<rect x="150" y="196" width="320" height="270" fill="#FFFCF5"/>`)}</g>
    ${ink(`<rect x="150" y="196" width="320" height="270"/>`, 3)}
    <circle cx="310" cy="206" r="7" fill="${P.red}"/>
    ${hand(310, 270, "100 HARI", { size: 58, anchor: "middle" })}
    ${hand(310, 330, "MENUJU", { size: 40, anchor: "middle" })}
    ${highlight(222, 348, 176, 40, 0.8)}
    ${hand(310, 388, "ITS!!", { size: 64, anchor: "middle" })}
    ${hand(310, 440, "Teknik Informatika", { size: 30, anchor: "middle", color: P.red })}
  </g>`;

const kertasNilai = (x = 400, y = 752, rot = -7) => `
  <g transform="rotate(${rot} ${x + 60} ${y + 30})">
    <g filter="url(#soft)"><rect x="${x}" y="${y}" width="122" height="62" fill="#FFFCF5"/></g>
    ${ink(`<rect x="${x}" y="${y}" width="122" height="62"/>`, 2.6)}
    ${hand(x + 61, y + 47, "58", { size: 50, color: P.red, anchor: "middle" })}
    ${ink(`<ellipse cx="${x + 61}" cy="${y + 31}" rx="50" ry="34"/>`, 3, P.red)}
  </g>`;

const grupWA = () => `
  <g transform="rotate(2 400 300)">
  <g filter="url(#soft)"><rect x="190" y="170" width="430" height="230" rx="22" fill="#FFFCF5"/></g>
  ${ink(`<rect x="190" y="170" width="430" height="230" rx="22"/>`, 2.8)}
  <rect x="190" y="170" width="430" height="58" rx="22" fill="${P.batik}"/><rect x="190" y="200" width="430" height="28" fill="${P.batik}"/>
  <text x="216" y="208" font-family="Plus Jakarta Sans" font-weight="800" font-size="21" fill="#fff">Grup Wali Murid XI-3</text>
  <text x="594" y="208" text-anchor="end" font-family="Plus Jakarta Sans" font-weight="700" font-size="17" fill="#d6efe9">127 anggota</text>
  <rect x="214" y="246" width="380" height="128" rx="16" fill="#E8F4EC"/>
  <text x="232" y="276" font-family="Plus Jakarta Sans" font-weight="800" font-size="18" fill="${P.batik}">Bu Sinta</text>
  ${hand(232, 316, "Alhamdulillah anak saya", { size: 31 })}
  ${hand(232, 352, "sekarang les di 3 tempat :)", { size: 31 })}
  </g>`;

// Ruang tamu: bingkai foto + lampu berdiri di dinding; sandaran sofa di depan (menutupi badan bawah Bu Ratna).
const ruangTamu = () => `
  ${wc(`<rect x="150" y="250" width="150" height="120" rx="4" fill="#FFFCF5"/>`)}
  <rect x="166" y="266" width="118" height="88" fill="#BFD9F0" opacity=".7"/>
  <path d="M166 354 l38 -40 l26 22 l24 -30 l30 48z" fill="${P.batik}" opacity=".55"/>
  ${ink(`<rect x="150" y="250" width="150" height="120" rx="4"/><path d="M225 250 l0 -26"/>`, 3)}
  ${ink(`<path d="M610 900 v-420"/><path d="M560 480 h100 l-20 -70 h-60z"/>`, 3)}
  ${wc(`<path d="M560 480 h100 l-20 -70 h-60z" fill="#F3D9A4"/>`)}
  <line x1="0" y1="930" x2="720" y2="930" stroke="${P.ink}" stroke-width="3" opacity=".5"/>`;
const sofa = () => `
  ${wc(`<path d="M300 820 q0 -40 40 -40 h300 q40 0 40 40 v140 h-380z" fill="#C9705C"/>`)}
  <path d="M310 860 h400" stroke="#A9584A" stroke-width="6" opacity=".6"/>
  ${wc(`<rect x="280" y="880" width="60" height="110" rx="24" fill="#B9614F"/><rect x="680" y="880" width="60" height="110" rx="24" fill="#B9614F"/>`)}
  ${ink(`<path d="M300 820 q0 -40 40 -40 h300 q40 0 40 40 v140 h-380z"/><rect x="280" y="880" width="60" height="110" rx="24"/>`, 3)}`;

// Properti yang bisa dirujuk adegan.visual.properti
export const PROPERTI: Record<string, () => string> = {
  papan_100_hari: papan,
  sticky_0400: () => sticky(130, 170, 190, 170, ["04.00", "bangun!"], -6),
  sticky_5jam: () => sticky(350, 150, 210, 170, ["belajar", "5 jam/hari"], 4, "#FFFCF5"),
  sticky_0hp: () => sticky(150, 380, 200, 160, ["0 main HP"], 3, "#FFFCF5"),
  sticky_tryout: () => sticky(380, 370, 200, 170, ["Tryout", "tiap hari"], -4),
  sticky_3tempat: () => `<g transform="rotate(5 360 250)"><g filter="url(#soft)">${wc(`<rect x="225" y="140" width="270" height="210" fill="#FFFCF5"/>`)}</g><rect x="338" y="132" width="44" height="16" fill="#EDE3CF" opacity=".85"/>${hand(360, 212, "les di", { size: 40, anchor: "middle" })}${hand(360, 294, "3 TEMPAT?!", { size: 62, anchor: "middle", color: P.red })}</g>`,
  sticky_7jam: () => `<g transform="rotate(-6 360 330)"><g filter="url(#soft)">${wc(`<rect x="240" y="250" width="240" height="200" fill="#FFE58A"/>`)}</g>${hand(360, 368, "7 JAM", { size: 84, anchor: "middle", color: P.red })}</g>`,
  // versi dinding dalam jangkauan tangan Arta (adegan contoh Fase 1)
  sticky_7jam_b: () => `<g transform="rotate(-6 500 560)"><g filter="url(#soft)">${wc(`<rect x="400" y="475" width="200" height="170" fill="#FFE58A"/>`)}</g><rect x="478" y="467" width="44" height="16" fill="#EDE3CF" opacity=".85"/>${hand(500, 585, "7 JAM", { size: 72, anchor: "middle", color: P.red })}</g>`,
  wa_grup: grupWA,
  jam_0047: () => jam(250, 260, "00.47"),
  kertas_58: () => kertasNilai(),
};

// Latar: { gambar, malam, lampu (posisi cahaya hangat), lantaiMeja (apakah meja menutup tubuh) }
export const LATAR: Record<string, { malam: boolean; lampu: number[] | null; gambar: () => string; depan?: () => string }> = {
  kamar: { malam: false, lampu: null, gambar: () => jendela(false) },
  dinding_sticky: { malam: false, lampu: null, gambar: () => "" },
  ruang_tamu: { malam: false, lampu: [600, 520, 300], gambar: ruangTamu, depan: sofa },
  meja_malam: { malam: true, lampu: [560, 700, 420], gambar: () => `${jendela(true)}${lampu()}`, depan: () => meja(820) },
};

export const latarAda = (id: string) => id in LATAR;

export const kertas = (id: string) => {
  const l = LATAR[id];
  return paper({ night: l.malam, lamp: l.lampu });
};
