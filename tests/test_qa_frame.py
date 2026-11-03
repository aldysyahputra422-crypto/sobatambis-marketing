import json
import subprocess
import sys
from pathlib import Path

from scripts.qa_frame import periksa

ROOT = Path(__file__).resolve().parents[1]
ADEGAN = {"episode": "ep01", "judul": "x", "durasi": 3.0, "penutup": {"judul_berikut": ""}, "adegan": [
    {"id": "b1", "mulai": 0.0, "selesai": 0.9, "akhir_jeda": 1.0, "penutur": "arta", "emosi": "datar", "intensitas": 4,
     "visual": {"latar": "kamar", "tokoh": [], "kamera": "diam"}, "caption": {"teks": "a", "kata": []}},
    {"id": "b2", "mulai": 1.0, "selesai": 2.9, "akhir_jeda": 3.0, "penutur": "arta", "emosi": "marah", "intensitas": 9,
     "visual": {"latar": "kamar", "tokoh": [], "kamera": "diam"}, "caption": {"teks": "b", "kata": []}},
]}


def _video(folder: Path, detik: float = 6.0, sumber: str = "campur", audio: bool = True, ukuran="720x1280"):
    """sumber 'campur': 1 detik smptebars lalu testsrc2, supaya puncak (detik 1–3) jelas beda dari detik 0,5."""
    (folder / "adegan.json").write_text(json.dumps(ADEGAN))
    if sumber == "campur":
        grafik = (f"smptebars=size={ukuran}:rate=30:duration=1[a];testsrc2=size={ukuran}:rate=30:duration={detik - 1}[b];"
                  "[a][b]concat=n=2:v=1:a=0")
    else:
        grafik = f"{sumber}:size={ukuran}:rate=30:duration={detik}"
    args = ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", grafik]
    if audio:
        args += ["-f", "lavfi", "-i", f"sine=frequency=220:duration={detik}", "-shortest"]
    args += ["-pix_fmt", "yuv420p", str(folder / "video.mp4")]
    subprocess.run(args, check=True)


def test_video_baik_lulus(tmp_path):
    _video(tmp_path)
    assert periksa(tmp_path) == []


def test_durasi_salah(tmp_path):
    _video(tmp_path, detik=4.0)
    assert any("durasi" in m for m in periksa(tmp_path))


def test_resolusi_salah(tmp_path):
    _video(tmp_path, ukuran="1080x1080")
    assert any("resolusi" in m for m in periksa(tmp_path))


def test_frame_kosong_terdeteksi(tmp_path):
    _video(tmp_path, sumber="color=c=0xF7EEDC")
    masalah = periksa(tmp_path)
    assert any("kosong" in m for m in masalah)


def test_tanpa_audio_gagal(tmp_path):
    _video(tmp_path, audio=False)
    assert any("audio" in m for m in periksa(tmp_path))


def test_cek_frame_png_dibuat(tmp_path):
    _video(tmp_path)
    r = subprocess.run([sys.executable, "-m", "scripts.qa_frame", str(tmp_path)], capture_output=True, cwd=ROOT)
    assert r.returncode == 0, r.stdout + r.stderr
    assert (tmp_path / "cek-frame.png").exists()
    assert "## Frame" in (tmp_path / "qa.md").read_text()
