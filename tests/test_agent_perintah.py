from pathlib import Path

import yaml

from scripts.cek_plugin import periksa

ROOT = Path(__file__).resolve().parents[1]
MODEL = {
    "direktur-marketing": "opus", "penulis-naskah": "sonnet", "pembasmi-slop": "sonnet", "pemeriksa-fakta": "sonnet",
    "storyboarder": "sonnet", "animator": "opus", "sutradara-suara": "haiku", "qa-suara": "haiku",
    "inspektur-frame": "sonnet", "desainer-cover": "sonnet", "penulis-caption": "sonnet",
    "penjaga-gerbang-qa": "sonnet", "pencari-skill": "haiku", "akuntan-token": "haiku",
}


def _fm(p: Path) -> dict:
    return yaml.safe_load(p.read_text(encoding="utf-8").split("---", 2)[1])


def test_semua_agent_ada_dan_model_sesuai():
    ada = {p.stem: _fm(p)["model"] for p in (ROOT / "agents").glob("*.md")}
    assert ada == MODEL


def test_hanya_animator_dan_direktur_opus():
    assert {n for n, m in MODEL.items() if m == "opus"} == {"animator", "direktur-marketing"}


def test_agent_menulis_ke_file_dan_punya_verifikasi():
    for p in (ROOT / "agents").glob("*.md"):
        teks = p.read_text(encoding="utf-8")
        assert "Tulis" in teks or "tulis" in teks, p.name
        assert "Verifikasi" in teks, p.name


def test_sa_video_menyebut_semua_tahap():
    teks = (ROOT / "commands/sa-video.md").read_text(encoding="utf-8")
    posisi = [teks.index(f"`{t}`") for t in ("naskah", "suara", "adegan", "render", "qa_frame", "kemasan", "gerbang")]
    assert posisi == sorted(posisi)


def test_sa_video_menyebut_kode_3_minta_persetujuan():
    teks = (ROOT / "commands/sa-video.md").read_text(encoding="utf-8")
    assert "kode 3" in teks and "persetujuan" in teks


def test_sa_video_menyebut_approval_naskah_kode_4():
    teks = (ROOT / "commands/sa-video.md").read_text(encoding="utf-8")
    assert "kode 4" in teks and "Approval 1" in teks


def test_cek_plugin_lulus():
    assert periksa(ROOT) == []
