// Bagian tubuh bersama untuk tokoh manusia (Arta, Bu Ratna): lengan dan kaki dua segmen berporos,
// plus kinematika maju tangan. Konvensi sudut: lihat pose.ts.
import { P } from "../sistem/gambar";
import type { Pose } from "./pose";

export type OpsiGambar = { mulut: 0 | 1 | 2 | 3 | 4; kedip: number; ikutan: number };
export const BUKA = [0, 0.3, 0.55, 0.8, 1];

export type Ukuran = {
  telapak: number; bahu: { x: number; y: number }; siku: number; lenganBawah: number;
  pinggul: { x: number; y: number }; paha: number; betis: number;
  pinggang: { x: number; y: number }; leher: { x: number; y: number };
};

export const UKURAN_ARTA: Ukuran = {
  telapak: 452, bahu: { x: 76, y: 128 }, siku: 66, lenganBawah: 62,
  pinggul: { x: 30, y: 300 }, paha: 64, betis: 64, pinggang: { x: 0, y: 236 }, leher: { x: 0, y: 104 },
};

const garis = (x: number, y0: number, y1: number, isi: string, tebal: number) =>
  `<path d="M${x} ${y0} L${x} ${y1}" stroke="${P.ink}" stroke-width="${tebal + 6}" stroke-linecap="round"/>` +
  `<path d="M${x} ${y0} L${x} ${y1}" stroke="${isi}" stroke-width="${tebal}" stroke-linecap="round"/>`;

// sisi: -1 = kiri layar, +1 = kanan layar. + atas = menjauh dari badan, + bawah = siku menekuk ke dalam.
export function lengan(id: string, u: Ukuran, sisi: -1 | 1, atas: number, bawah: number, nama: "Ki" | "Ka", warna: string): string {
  const bx = sisi * u.bahu.x;
  const yS = u.bahu.y + u.siku;
  const yT = yS + u.lenganBawah;
  return `<g id="${id}-lenganAtas${nama}" transform="rotate(${sisi === -1 ? atas : -atas} ${bx} ${u.bahu.y})">${garis(bx, u.bahu.y, yS, warna, 27)}
    <g id="${id}-lenganBawah${nama}" transform="rotate(${sisi === -1 ? -bawah : bawah} ${bx} ${yS})">${garis(bx, yS, yT, warna, 27)}
      <circle cx="${bx}" cy="${yT + 8}" r="14" fill="${P.skin}" stroke="${P.ink}" stroke-width="2.6"/></g></g>`;
}

// + paha = membuka ke luar, + betis = lutut menekuk ke dalam. `ujung` digambar di ujung betis (kaus kaki + sepatu).
export function kaki(id: string, u: Ukuran, sisi: -1 | 1, paha: number, betis: number, nama: "Ki" | "Ka", warna: string, ujung: (hx: number, yK: number) => string): string {
  const hx = sisi * u.pinggul.x;
  const yL = u.pinggul.y + u.paha;
  const yK = yL + u.betis;
  return `<g id="${id}-paha${nama}" transform="rotate(${sisi === -1 ? paha : -paha} ${hx} ${u.pinggul.y})">${garis(hx, u.pinggul.y, yL, warna, 28)}
    <g id="${id}-betis${nama}" transform="rotate(${sisi === -1 ? -betis : betis} ${hx} ${yL})">${garis(hx, yL, yK, warna, 28)}${ujung(hx, yK)}</g></g>`;
}

const putar = (p: { x: number; y: number }, c: { x: number; y: number }, derajat: number) => {
  const r = (derajat * Math.PI) / 180;
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r) };
};

// Kinematika maju: posisi layar tengah tangan, untuk menempelkan benda yang dipegang.
export function posisiTanganDari(u: Ukuran, pose: Pose, sisi: "Ki" | "Ka"): { x: number; y: number; sudut: number } {
  const s = pose.sendi;
  const bx = (sisi === "Ki" ? -1 : 1) * u.bahu.x;
  const yS = u.bahu.y + u.siku;
  const atas = sisi === "Ki" ? s.lenganAtasKi : -s.lenganAtasKa;
  const bawah = sisi === "Ki" ? -s.lenganBawahKi : s.lenganBawahKa;
  let p = { x: bx, y: yS + u.lenganBawah + 8 };
  p = putar(p, { x: bx, y: yS }, bawah);
  p = putar(p, { x: bx, y: u.bahu.y }, atas);
  p = putar(p, u.pinggang, s.badan);
  const k = pose.skala;
  return { x: pose.x + k * pose.sx * p.x, y: pose.y + k * pose.sy * (p.y - u.telapak), sudut: atas + bawah + s.badan };
}

// Gerak ikutan (cepol, ujung hijab, ekor): tertinggal melawan arah gerak kepala/badan lalu meluruh (×0,75 per frame).
export function ikutanCepol(sebelum: Pose, pose: Pose, ikutanSebelum: number): number {
  const dorong = (pose.sendi.kepala + pose.sendi.badan) - (sebelum.sendi.kepala + sebelum.sendi.badan);
  const angkat = (pose.y - sebelum.y) * 0.15;
  return (ikutanSebelum - (dorong + angkat) * 1.2) * 0.75;
}

// Bungkus akar: geser ke telapak, skala + squash-stretch, bayangan.
export const akar = (pose: Pose, telapak: number, lebarBayangan: number, isi: string) => {
  const k = pose.skala;
  return `<g transform="translate(${pose.x} ${pose.y}) scale(${k * pose.sx} ${k * pose.sy})">
    <ellipse cx="0" cy="0" rx="${lebarBayangan / pose.sx}" ry="14" fill="#4a2f14" opacity=".14"/>
    <g transform="translate(0 ${-telapak})">${isi}</g></g>`;
};
