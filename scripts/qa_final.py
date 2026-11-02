"""QA teknis video final: 720x1280, 30 fps, durasi = adegan.durasi + 3 (±0,5), audio ada dan tidak hening.

python -m scripts.qa_final <folder>  (membaca adegan.json dan video.mp4)
"""
import json
import re
import subprocess
import sys
from pathlib import Path


def _probe(video: Path) -> dict:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(video)], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def periksa(video: Path, durasi_harapan: float) -> list[str]:
    d = _probe(video)
    masalah = []
    v = next((s for s in d["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in d["streams"] if s["codec_type"] == "audio"), None)
    if not v or (v["width"], v["height"]) != (720, 1280):
        masalah.append(f"resolusi harus 720x1280, dapat {v and (v['width'], v['height'])}")
    if v and v.get("r_frame_rate") != "30/1":
        masalah.append(f"fps harus 30, dapat {v.get('r_frame_rate')}")
    dur = float(d["format"]["duration"])
    if abs(dur - durasi_harapan) > 0.5:
        masalah.append(f"durasi {dur:.2f} dtk, harapan {durasi_harapan:.2f} ±0,5")
    if not a:
        masalah.append("tidak ada trek audio")
    else:
        err = subprocess.run(["ffmpeg", "-v", "info", "-i", str(video), "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
        m = re.search(r"mean_volume:\s*(-?[\d.]+) dB", err)
        if not m or float(m.group(1)) < -60:
            masalah.append("audio hening")
    return masalah


if __name__ == "__main__":
    folder = Path(sys.argv[1])
    durasi = json.loads((folder / "adegan.json").read_text(encoding="utf-8"))["durasi"] + 3
    masalah = periksa(folder / "video.mp4", durasi)
    for m in masalah:
        print(m)
    print("lulus" if not masalah else "gagal")
    sys.exit(0 if not masalah else 1)
