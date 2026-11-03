// Komposisi adegan versi 2: merangkai rig, aksi, kamera, properti, teks kinetik, dan transisi dari adegan.json v2.
import React, { useMemo } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { P, defs, epBadge, handle, vignette } from "./sistem/gambar";
import { LATAR, PROPERTI, kertas } from "./dunia/latar";
import { ikutanCepol } from "./rig/anggota";
import { TOKOH } from "./rig/tokoh";
import { POSE_DASAR, type Pose } from "./rig/pose";
import { rangkaiJalur } from "./aksi/rangkai";
import { kameraPada, type Kamera } from "./lapisan/kamera";
import { propertiPada, teksPada, transisiPada } from "./lapisan/gerak";
import { dalam, pilihPada, type DataAdegan2, type IdTokoh } from "./data/adegan2";

export type PropsAdeganV2 = { adeganFile: string; dialogFile: string; mixFile: string; data?: DataAdegan2 };

// Kedip deterministik: setiap tokoh punya periode 3,5–5 detik.
const kedip = (frame: number, benih: number) => {
  const periode = 105 + ((benih * 37) % 45);
  const f = (frame + benih * 13) % periode;
  return f < 4 ? [0.5, 1, 1, 0.5][f] : 0;
};

// Parallax: lapisan belakang (d < 1) ikut kamera lebih sedikit.
const transformKamera = (k: Kamera, d: number) => {
  const s = 1 + (k.skala - 1) * d;
  return `translate(360 640) rotate(${k.rot * d}) scale(${s}) translate(${-(360 + k.x * d)} ${-(640 + k.y * d)})`;
};

const BENIH: Record<IdTokoh, number> = { arta: 1, ratna: 2, mbis: 3 };

export const AdeganV2: React.FC<PropsAdeganV2> = ({ data, dialogFile, mixFile }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dialogAudio = useAudioData(staticFile(dialogFile));

  // Jalur pose setiap tokoh + gerak ikutan (cepol/hijab/ekor) dihitung berurutan dari frame 0.
  const jalur = useMemo(() => {
    const hasil: Partial<Record<IdTokoh, { pose: (f: number) => Pose; ikutan: number[] }>> = {};
    if (!data) return hasil;
    const n = Math.ceil(data.durasi * fps) + 1;
    for (const [id, t] of Object.entries(data.jalur.tokoh) as [IdTokoh, NonNullable<DataAdegan2["jalur"]["tokoh"][IdTokoh]>][]) {
      const awal: Pose = { ...POSE_DASAR, x: t.awal.x, y: t.awal.y, skala: t.awal.skala, ekspresi: t.awal.ekspresi };
      const pose = rangkaiJalur(t.aksi, fps, awal, id);
      const ik = [0];
      for (let f = 1; f < n; f++) ik.push(ikutanCepol(pose(f - 1), pose(f), ik[f - 1]));
      hasil[id] = { pose, ikutan: ik };
    }
    return hasil;
  }, [data, fps]);

  if (!data) return null;
  const j = data.jalur;
  const detik = frame / fps;

  // Mulut: amplitudo trek dialog, hanya untuk penutur yang sedang bicara.
  const bicara = j.dialog.find((d) => detik >= d.mulai && detik < d.selesai)?.penutur;
  let mulut: 0 | 1 | 2 | 3 | 4 = 0;
  if (dialogAudio && bicara) {
    const v = visualizeAudio({ fps, frame, audioData: dialogAudio, numberOfSamples: 16 });
    const amp = Math.min(1, (v.reduce((a, b) => a + b, 0) / v.length) * 10);
    mulut = Math.min(4, Math.round(amp * 4)) as 0 | 1 | 2 | 3 | 4;
  }

  const latarId = pilihPada(j.latar, detik)?.latar ?? "kamar";
  const latar = LATAR[latarId];
  const kam = kameraPada(j.kamera, detik);

  const gambarProperti = (id: string, pusat: { x: number; y: number }, g: { x: number; y: number; skala: number; sx: number; sy: number; rot: number }) =>
    PROPERTI[id]
      ? `<g transform="translate(${pusat.x + g.x} ${pusat.y + g.y}) rotate(${g.rot}) scale(${g.skala * g.sx} ${g.skala * g.sy}) translate(${-pusat.x} ${-pusat.y})">${PROPERTI[id]()}</g>`
      : "";

  const propertiBebas = j.properti
    .map((p) => ({ p, g: propertiPada(p, detik) }))
    .filter(({ g }) => g.tampil)
    .map(({ p, g }) => gambarProperti(p.id, p.pusat, g))
    .join("");

  const belakang: string[] = [];
  const depan: string[] = [];
  let dipegang = "";
  for (const [id, t] of Object.entries(j.tokoh) as [IdTokoh, NonNullable<DataAdegan2["jalur"]["tokoh"][IdTokoh]>][]) {
    const jl = jalur[id];
    if (!jl || !dalam(t.tampil, detik)) continue;
    const pose = jl.pose(frame);
    const svgTokoh = TOKOH[id].gambar(pose, { mulut: bicara === id ? mulut : 0, kedip: kedip(frame, BENIH[id]), ikutan: jl.ikutan[Math.min(frame, jl.ikutan.length - 1)] ?? 0 });
    const lapis = Array.isArray(t.lapis) ? pilihPada(t.lapis, detik)?.lapis : t.lapis;
    (lapis === "belakang" ? belakang : depan).push(svgTokoh);
    for (const p of j.properti) {
      const tangan = TOKOH[id].tangan;
      if (p.pegang?.tokoh === id && tangan && detik >= p.pegang.mulai && detik < Math.min(p.masuk, p.pegang.selesai ?? Infinity)) {
        const h = tangan(pose, "Ka");
        dipegang += `<g transform="translate(${h.x} ${h.y}) rotate(${-h.sudut * 0.3 - 8}) scale(.42) translate(${-p.pusat.x} ${-p.pusat.y})">${PROPERTI[p.id]?.() ?? ""}</g>`;
      }
    }
  }

  const tr = transisiPada(j.transisi, detik);
  let transisi = "";
  if (tr && tr.jenis !== "potong") {
    const k = tr.kemajuan;
    const x0 = k < 0.5 ? 0 : (k - 0.5) * 2 * 760 - 20;
    const x1 = k < 0.5 ? k * 2 * 760 : 760;
    if (tr.jenis === "coret") {
      const garis = Array.from({ length: 22 }, (_, i) => `M${x0 - 40} ${i * 62 - 20} L${x1 + 40} ${i * 62 + 70}`).join(" ");
      transisi = `<clipPath id="tr"><rect x="${x0}" y="0" width="${Math.max(0, x1 - x0)}" height="1280"/></clipPath>
        <g clip-path="url(#tr)"><rect width="720" height="1280" fill="${P.paper}"/><path d="${garis}" stroke="${P.ink}" stroke-width="46" stroke-linecap="round" filter="url(#ink)"/></g>`;
    } else {
      transisi = `<path d="M${720 - x1} 0 L${720 - x0} 0 L${720 - x0 - 60} 1280 L${720 - x1 - 60} 1280z" fill="${P.paper2}" filter="url(#soft)"/>`;
    }
  }

  const rona = (j.rona ?? []).find((r) => detik >= r.mulai && detik < r.selesai);
  const ronaOp = rona ? Math.min(1, (detik - rona.mulai) / 0.15, (rona.selesai - detik) / 0.15) : 0;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">${defs(5 + (Math.floor(frame / 4) % 6))}
    <g transform="${transformKamera(kam, 0.6)}">${kertas(latarId)}${latar.gambar()}</g>
    <g transform="${transformKamera(kam, 1)}">${propertiBebas}${belakang.join("")}${latar.depan ? latar.depan() : ""}${depan.join("")}${dipegang}</g>
    ${transisi}
    ${epBadge("1", "Rencana Sempurna")}${handle()}${vignette()}</svg>`;

  const kata = teksPada(j.teks, detik);

  return (
    <AbsoluteFill style={{ backgroundColor: P.paper }}>
      <Audio src={staticFile(mixFile)} />
      <AbsoluteFill dangerouslySetInnerHTML={{ __html: svg }} />
      {rona && (
        <AbsoluteFill
          style={{
            opacity: ronaOp,
            background: rona.warna === "merah"
              ? "radial-gradient(ellipse at center, rgba(194,65,45,0) 50%, rgba(194,65,45,.45) 100%)"
              : "radial-gradient(ellipse at 50% 55%, rgba(13,20,48,0) 35%, rgba(13,20,48,.72) 100%)",
          }}
        />
      )}
      {kata.length > 0 && (
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 110 }}>
          <div style={{ width: 600, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", columnGap: 12, rowGap: 0, padding: "14px 10px", background: "#FFFCF5", borderRadius: 18, boxShadow: "0 10px 24px rgba(90,59,28,.18)" }}>
            {kata.map((k, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "Bricolage Grotesque", fontWeight: 800,
                  fontSize: k.gaya === "cap" ? Math.round(76 * Math.min(1, 6 / Math.max(1, k.kata.length))) : 44, lineHeight: 1.15,
                  color: k.gaya === "cap" ? P.red : P.ink,
                  display: "inline-block", transform: `scale(${k.skala}) rotate(${k.rot}deg)`,
                  background: k.aktif && k.gaya !== "cap" ? "linear-gradient(transparent 58%, rgba(251,197,49,.8) 58%, rgba(251,197,49,.8) 92%, transparent 92%)" : "none",
                }}
              >
                {k.kata}
              </span>
            ))}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
