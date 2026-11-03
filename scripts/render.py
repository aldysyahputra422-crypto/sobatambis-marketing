"""Render adegan v2 + kartu penutup 3 detik.

python -m scripts.render <folder> [--draf]
  --draf : 360x640 → <folder>/draf.mp4 (untuk QA gerak, cepat)
  penuh  : AdeganV2 → adegan-saja.mp4, Penutup → penutup.mp4, disambung → video.mp4
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from scripts import naskah as naskah_mod

ROOT = Path(__file__).resolve().parents[1]
TPL = ROOT / "template"


def _props(folder: Path) -> str:
    a = f"aktif/{Path(folder).name}"
    return json.dumps({"adeganFile": f"{a}/adegan.json", "dialogFile": f"{a}/dialog.wav", "mixFile": f"{a}/mix.wav"})


def perintah_render(folder: Path, draf: bool) -> list[str]:
    folder = Path(folder).resolve()
    keluar = folder / ("draf.mp4" if draf else "adegan-saja.mp4")
    p = ["npx", "remotion", "render", "AdeganV2", str(keluar), f"--props={_props(folder)}", "--log=error"]
    return p + (["--scale=0.5"] if draf else [])


def perintah_penutup(folder: Path, judul_berikut: str) -> list[str]:
    folder = Path(folder).resolve()
    return ["npx", "remotion", "render", "Penutup", str(folder / "penutup.mp4"),
            f"--props={json.dumps({'judulBerikut': judul_berikut}, ensure_ascii=False)}", "--log=error"]


def siapkan(folder: Path) -> None:
    tujuan = TPL / "public/aktif" / Path(folder).name
    tujuan.mkdir(parents=True, exist_ok=True)
    for f in ("adegan.json", "dialog.wav", "mix.wav"):
        shutil.copy(Path(folder) / f, tujuan / f)


def sambung(a: Path, b: Path, keluar: Path) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a), "-i", str(b), "-f", "lavfi", "-t", "3", "-i", "anullsrc=r=44100:cl=mono",
                    "-filter_complex", "[0:v][0:a][1:v][2:a]concat=n=2:v=1:a=1[v][a]", "-map", "[v]", "-map", "[a]",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "160k", str(keluar)], check=True)


def jalankan(folder: Path, draf: bool) -> Path:
    folder = Path(folder).resolve()
    siapkan(folder)
    subprocess.run(perintah_render(folder, draf), cwd=TPL, check=True)
    if draf:
        return folder / "draf.mp4"
    n = naskah_mod.muat(folder / "naskah.json")
    subprocess.run(perintah_penutup(folder, n["judul_berikut"]), cwd=TPL, check=True)
    sambung(folder / "adegan-saja.mp4", folder / "penutup.mp4", folder / "video.mp4")
    return folder / "video.mp4"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--draf", action="store_true")
    a = ap.parse_args()
    print(jalankan(Path(a.folder), a.draf))
    sys.exit(0)
