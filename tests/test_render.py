import subprocess
from pathlib import Path

from scripts import qa_final, render


def test_perintah_render_penuh_dan_draf(tmp_path):
    p = render.perintah_render(tmp_path / "ep99", draf=False)
    assert p[:4] == ["npx", "remotion", "render", "AdeganV2"]
    assert p[4].endswith("ep99/adegan-saja.mp4") and any(x.startswith("--props=") and "aktif/ep99/adegan.json" in x for x in p)
    d = render.perintah_render(tmp_path / "ep99", draf=True)
    assert "--scale=0.5" in d and d[4].endswith("ep99/draf.mp4")


def test_perintah_penutup(tmp_path):
    p = render.perintah_penutup(tmp_path / "ep99", "Ep.2: Lanjut")
    assert p[:4] == ["npx", "remotion", "render", "Penutup"] and "Ep.2: Lanjut" in " ".join(p)


def _video(p: Path, detik: float, audio=True):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"testsrc=size=720x1280:rate=30:duration={detik}"]
    if audio:
        cmd += ["-f", "lavfi", "-i", f"sine=frequency=440:duration={detik}", "-shortest"]
    subprocess.run(cmd + ["-pix_fmt", "yuv420p", str(p)], check=True)
    return p


def test_qa_final_lulus_dan_durasi_salah(tmp_path):
    v = _video(tmp_path / "v.mp4", 5)
    assert qa_final.periksa(v, durasi_harapan=5.0) == []
    assert any("durasi" in m for m in qa_final.periksa(v, durasi_harapan=8.0))


def test_qa_final_tanpa_audio(tmp_path):
    assert any("audio" in m for m in qa_final.periksa(_video(tmp_path / "v.mp4", 3, audio=False), durasi_harapan=3.0))
