"""QA gerak: seberapa banyak yang bergerak setiap 0,5 detik.

Skor jendela = rata-rata |selisih piksel| grayscale (180x320, 0..255) antar sampel 10 fps berurutan.
Gagal bila lebih dari 1,5 detik berturut-turut di bawah ambang, kecuali di rentang yang dikecualikan
(beat `mengena`). Ambang bawaan di config/qa.yaml (gerak.ambang), dikalibrasi: pilot lama gagal, adegan contoh lulus.
"""
import argparse
import subprocess
import sys
from pathlib import Path

import numpy as np
import yaml

ROOT = Path(__file__).resolve().parents[1]
W, H = 180, 320
JENDELA = 0.5
BATAS_DIAM = 1.5


def ambang_bawaan() -> float:
    return float(yaml.safe_load((ROOT / "config/qa.yaml").read_text(encoding="utf-8"))["gerak"]["ambang"])


def _frame(video: Path, fps: int) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-vf", f"fps={fps},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)


def skor_gerak(video: Path, fps_sampel: int = 10) -> list[float]:
    f = _frame(video, fps_sampel)
    beda = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))  # beda[i] = antara sampel i dan i+1
    per = int(fps_sampel * JENDELA)
    n = len(f) // per
    return [round(float(beda[i * per: min((i + 1) * per, len(beda))].mean()) if i * per < len(beda) else 0.0, 3) for i in range(n)]


def periksa(video: Path, kecuali: list[tuple[float, float]], ambang: float, skor: list[float] | None = None) -> list[str]:
    skor = skor if skor is not None else skor_gerak(video)
    def dikecualikan(i):
        a, b = i * JENDELA, (i + 1) * JENDELA
        return any(a >= k0 - 1e-6 and b <= k1 + 1e-6 for k0, k1 in kecuali)
    masalah, mulai = [], None
    for i, s in enumerate(skor + [float("inf")]):
        diam = s < ambang and not dikecualikan(i)
        if diam and mulai is None:
            mulai = i
        elif not diam and mulai is not None:
            lama = (i - mulai) * JENDELA
            if lama > BATAS_DIAM:
                masalah.append(f"diam {lama:.1f} dtk di {mulai * JENDELA:.1f}-{i * JENDELA:.1f} (skor < {ambang})")
            mulai = None
    return masalah


def gambar_grafik(skor: list[float], ambang: float, keluar: Path) -> Path:
    from PIL import Image, ImageDraw

    lebar, tinggi, pad = max(360, 12 * len(skor) + 40), 220, 20
    im = Image.new("RGB", (lebar, tinggi), (247, 238, 220))
    d = ImageDraw.Draw(im)
    puncak = max([ambang * 3, *skor, 1e-6])
    y = lambda v: tinggi - pad - (tinggi - 2 * pad) * min(v, puncak) / puncak
    for i, s in enumerate(skor):
        x0 = pad + i * 12
        d.rectangle([x0, y(s), x0 + 9, tinggi - pad], fill=(30, 58, 138) if s >= ambang else (194, 65, 45))
    d.line([pad, y(ambang), lebar - pad, y(ambang)], fill=(194, 65, 45), width=2)
    d.text((pad, 4), f"skor gerak per 0,5 dtk (merah = di bawah ambang {ambang})", fill=(30, 58, 138))
    im.save(keluar)
    return keluar


def _rentang(s: str) -> tuple[float, float]:
    a, b = s.split("-")
    return float(a), float(b)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--kecuali", nargs="*", type=_rentang, default=[])
    ap.add_argument("--ambang", type=float)
    a = ap.parse_args()
    video = Path(a.video)
    ambang = a.ambang if a.ambang is not None else ambang_bawaan()
    skor = skor_gerak(video)
    gambar_grafik(skor, ambang, video.parent / "cek-gerak.png")
    masalah = periksa(video, a.kecuali, ambang, skor)
    print(f"skor: min {min(skor):.2f} median {float(np.median(skor)):.2f} max {max(skor):.2f}")
    for m in masalah:
        print(m)
    print("lulus" if not masalah else "gagal")
    sys.exit(0 if not masalah else 1)
