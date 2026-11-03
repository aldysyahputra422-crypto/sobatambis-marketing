import subprocess
from pathlib import Path

from scripts import qa_gerak


def _bergerak(p: Path, detik=4):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"testsrc=size=720x1280:rate=30:duration={detik}",
                    "-pix_fmt", "yuv420p", str(p)], check=True)
    return p


def _diam_berkedip(p: Path, detik=4):
    # latar kertas diam + kotak 10x10 yang berkedip (seperti kedip mata saja): harus dianggap diam
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=0xF7EEDC:size=720x1280:rate=30:duration={detik}",
                    "-vf", "drawbox=x=350:y=600:w=10:h=10:color=0x1E3A8A:t=fill:enable='lt(mod(t,1),0.15)'",
                    "-pix_fmt", "yuv420p", str(p)], check=True)
    return p


def test_video_bergerak_lulus(tmp_path):
    assert qa_gerak.periksa(_bergerak(tmp_path / "a.mp4"), kecuali=[], ambang=1.0) == []


def test_diam_dengan_kedip_gagal(tmp_path):
    masalah = qa_gerak.periksa(_diam_berkedip(tmp_path / "b.mp4"), kecuali=[], ambang=1.0)
    assert masalah and "diam" in masalah[0]


def test_diam_di_rentang_kecuali_lulus(tmp_path):
    assert qa_gerak.periksa(_diam_berkedip(tmp_path / "c.mp4"), kecuali=[(0.0, 4.0)], ambang=1.0) == []


def test_skor_per_setengah_detik(tmp_path):
    skor = qa_gerak.skor_gerak(_bergerak(tmp_path / "d.mp4", 3))
    assert len(skor) == 6


def test_grafik_dibuat(tmp_path):
    keluar = tmp_path / "cek-gerak.png"
    qa_gerak.gambar_grafik([0.5, 3.0, 8.0, 0.2], 1.0, keluar)
    assert keluar.exists() and keluar.stat().st_size > 1000
