"""QA frame: durasi, resolusi, audio, frame kosong, puncak emosi terlihat; buat lembar cuplikan."""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

PENUTUP = 3.0
TOLERANSI = 0.5


def _probe(video: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height:format=duration", "-of", "json", str(video)],
        check=True, capture_output=True, text=True,
    ).stdout
    return json.loads(out)


def frame_pada(video: Path, detik: float, lebar: int = 720, tinggi: int = 1280) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", f"{detik:.3f}", "-i", str(video), "-frames:v", "1", "-s", f"{lebar}x{tinggi}",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.uint8).reshape(tinggi, lebar, 3).astype(float)


def _volume_rata(video: Path) -> float | None:
    err = subprocess.run(["ffmpeg", "-i", str(video), "-af", "volumedetect", "-vn", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.search(r"mean_volume:\s*(-?[\d.]+) dB", err)
    return float(m.group(1)) if m else None


def periksa(folder: Path) -> list[str]:
    folder = Path(folder)
    video, adegan = folder / "video.mp4", json.loads((folder / "adegan.json").read_text(encoding="utf-8"))
    info = _probe(video)
    masalah: list[str] = []
    durasi = float(info["format"]["duration"])
    harapan = adegan["durasi"] + PENUTUP
    if abs(durasi - harapan) > TOLERANSI:
        masalah.append(f"durasi {durasi:.2f} dtk, seharusnya {harapan:.2f} ± {TOLERANSI}")
    vs = [s for s in info["streams"] if s["codec_type"] == "video"]
    if not vs or (vs[0]["width"], vs[0]["height"]) != (720, 1280):
        masalah.append(f"resolusi {vs[0]['width']}x{vs[0]['height'] if vs else '?'}, seharusnya 720x1280")
    if not any(s["codec_type"] == "audio" for s in info["streams"]):
        masalah.append("audio tidak ada")
    else:
        v = _volume_rata(video)
        if v is None or v < -60:
            masalah.append(f"audio hening (rata-rata {v} dB)")

    # Simpangan baku kecerahan (bukan lintas kanal RGB): frame satu warna = 0.
    kosong = [t for t in range(int(durasi)) if frame_pada(video, t, 180, 320).mean(axis=2).std() < 4]
    if kosong:
        masalah.append(f"frame kosong di detik {kosong[:10]}")

    for a in adegan["adegan"]:
        if a["intensitas"] >= 8 and a["mulai"] >= 0.5:
            tengah = (a["mulai"] + a["selesai"]) / 2
            beda = np.abs(frame_pada(video, tengah, 180, 320) - frame_pada(video, a["mulai"] - 0.5, 180, 320)).mean()
            if beda <= 6:
                masalah.append(f"{a['id']}: puncak {a['emosi']} tidak terlihat beda (selisih {beda:.1f})")
    return masalah


def lembar_cuplikan(folder: Path, kolom: int = 4, lebar_sel: int = 180) -> Path:
    video = Path(folder) / "video.mp4"
    durasi = float(_probe(video)["format"]["duration"])
    tinggi_sel = lebar_sel * 16 // 9
    waktu = [t for t in np.arange(0, durasi, 2.0)]
    baris = (len(waktu) + kolom - 1) // kolom
    im = Image.new("RGB", (kolom * lebar_sel, baris * tinggi_sel), (30, 26, 22))
    for i, t in enumerate(waktu):
        f = frame_pada(video, float(t), lebar_sel, tinggi_sel).astype(np.uint8)
        im.paste(Image.fromarray(f), ((i % kolom) * lebar_sel, (i // kolom) * tinggi_sel))
    keluar = Path(folder) / "cek-frame.png"
    im.save(keluar)
    return keluar


if __name__ == "__main__":
    folder = Path(sys.argv[1])
    masalah = periksa(folder)
    lembar_cuplikan(folder)
    qa = folder / "qa.md"
    lama = qa.read_text(encoding="utf-8").split("## Frame")[0] if qa.exists() else "# QA\n\n"
    isi = "\n".join(f"- [ ] {m}" for m in masalah) or "- [x] semua pemeriksaan frame lulus"
    qa.write_text(f"{lama}## Frame\n\n{isi}\n\nLembar cuplikan: cek-frame.png\n", encoding="utf-8")
    for m in masalah:
        print(m)
    sys.exit(1 if masalah else 0)
