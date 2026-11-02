import React from "react";
import { AbsoluteFill } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { P } from "../sistem/gambar";
import { pecahCaption } from "./pecah";
import type { Adegan } from "../data/adegan";
import type { Efek } from "../efek/emosi";

const FONT = "Bricolage Grotesque";
const JARAK_KATA = 12; // margin 0 6px per kata
const lebarKata = (w: string, skala: number) => measureText({ text: w, fontFamily: FONT, fontSize: 38 * skala, fontWeight: "800" }).width;
// Lebar satu baris = jumlah lebar kata (kata kapital diperbesar saat puncak marah) + jarak antarkata.
const pengukur = (skalaKapital: number) => (baris: string) =>
  baris.split(" ").reduce((t, w) => t + lebarKata(w, /[A-Z]{3,}/.test(w) ? skalaKapital : 1) + JARAK_KATA, 0);

export const Caption: React.FC<{ adegan: Adegan; detik: number; efek: Efek; frameLokal: number }> = ({ adegan, detik, efek, frameLokal }) => {
  const teks = adegan.caption.teks;
  const puncak = adegan.emosi === "marah" && adegan.intensitas >= 8;
  const layar = pecahCaption(teks, pengukur(puncak ? efek.skalaCaption : 1), 560);
  const kata = adegan.caption.kata;
  const sudah = kata.filter((k) => k.mulai <= detik).length;
  const katakata = layar.map((l) => l.join(" ").split(" "));
  let awal = 0;
  let iLayar = 0;
  for (let i = 0; i < katakata.length; i++) {
    if (sudah > awal + katakata[i].length && i < katakata.length - 1) {
      awal += katakata[i].length;
      iLayar = i + 1;
    }
  }
  const baris = layar[iLayar] ?? [];
  let indeks = awal;
  const puncakMarah = adegan.emosi === "marah" && adegan.intensitas >= 8;
  const hancur = adegan.emosi === "hancur" && adegan.intensitas >= 8;
  const misterius = adegan.emosi === "misterius";

  const gayaKartu: React.CSSProperties = hancur || misterius
    ? { background: "transparent", boxShadow: "none" }
    : { background: "#FFFCF5", boxShadow: "0 10px 24px rgba(90,59,28,.18)", borderRadius: 18 };

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 120 }}>
      <div style={{ ...gayaKartu, width: 592, padding: "18px 0", textAlign: "center" }}>
        {baris.map((b, bi) => (
          <div key={bi} style={{ lineHeight: 1.25 }}>
            {b.split(" ").map((w, wi) => {
              const i = indeks++;
              const aktif = i === sudah - 1;
              const kapital = /[A-Z]{3,}/.test(w);
              const besar = puncakMarah && kapital;
              return (
                <span
                  key={wi}
                  style={{
                    fontFamily: misterius ? "Caveat" : FONT,
                    fontWeight: misterius ? 700 : 800,
                    fontSize: hancur ? 64 : misterius ? 46 : 38 * (besar ? efek.skalaCaption : 1),
                    color: hancur ? "#FFFCF5" : besar ? P.red : P.ink,
                    opacity: i < sudah ? 1 : 0.28,
                    display: "inline-block",
                    margin: "0 6px",
                    rotate: besar ? `${Math.sin(frameLokal * 1.9) * 3}deg` : misterius ? "-3deg" : "0deg",
                    background: aktif && !hancur && !misterius && !besar ? "linear-gradient(transparent 55%, rgba(251,197,49,.75) 55%, rgba(251,197,49,.75) 92%, transparent 92%)" : "none",
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
