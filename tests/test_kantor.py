"""Kantor Agent (visualisasi real-time agent): konfigurasi proyek dan pemasangan plugin."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KONFIG = json.loads((ROOT / ".claude/kantor-agent.json").read_text(encoding="utf-8"))


def test_ketua_direktur_marketing_dan_autostart():
    assert KONFIG["names"]["ketua"] == "Direktur Marketing"
    assert KONFIG["autostart"] is True
    assert "Marketing" in KONFIG["title"]
    assert "Hapis" not in json.dumps(KONFIG)


def test_fork_menggantikan_plugin_upstream():
    """Satu server saja: plugin upstream dilepas dari settings, fork di kantor/ dinyalakan hook dan /sa-kantor."""
    s = json.loads((ROOT / "config/claude-settings.json").read_text(encoding="utf-8"))
    assert "kantor-agent" not in s["extraKnownMarketplaces"]
    assert "kantor-agent@kantor-agent" not in s["enabledPlugins"]
    assert "Bash(bash kantor/runtime/bin/kantor.sh *)" in s["permissions"]["allow"]
    assert (ROOT / "kantor/LICENSE").exists() and "ad92a7a" in (ROOT / "kantor/NOTICE.md").read_text(encoding="utf-8")
    assert not (ROOT / "kantor/runtime/lib/php").exists()
    cmd = (ROOT / "commands/sa-kantor.md").read_text(encoding="utf-8")
    assert "kantor/runtime/bin/kantor.sh" in cmd and "$ARGUMENTS" in cmd


def _mulai():
    import sys
    from importlib import util
    sys.path.insert(0, str(ROOT / "scripts/hooks"))
    spec = util.spec_from_file_location("mulai_hook_kantor", ROOT / "scripts/hooks/mulai.py")
    m = util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def test_hook_mulai_menyalakan_kantor_senyap(monkeypatch):
    m = _mulai()
    panggilan = []
    monkeypatch.setattr(m.subprocess, "run", lambda cmd, **kw: panggilan.append((cmd, kw)))
    monkeypatch.delenv("SA_LEWATI_SETUP", raising=False)
    m.kantor()
    assert panggilan and panggilan[0][0][-1] == "autostart" and panggilan[0][0][1].endswith("kantor/runtime/bin/kantor.sh")
    assert panggilan[0][1]["env"]["CLAUDE_PROJECT_DIR"]
    monkeypatch.setenv("SA_LEWATI_SETUP", "1")
    panggilan.clear()
    m.kantor()
    assert panggilan == []


def test_hook_kantor_tidak_pernah_menggagalkan_sesi(monkeypatch):
    m = _mulai()
    monkeypatch.delenv("SA_LEWATI_SETUP", raising=False)

    def meledak(*a, **k):
        raise OSError("bash tidak ada")
    monkeypatch.setattr(m.subprocess, "run", meledak)
    m.kantor()  # tidak boleh melempar


def test_readme_menjelaskan_cara_membuka_kantor():
    t = (ROOT / "README.md").read_text(encoding="utf-8")
    assert "kantor/" in t and "127.0.0.1:8788/kerja" in t and "Direktur Marketing" in t and "/sa-kantor" in t


def test_izin_karakter_tercatat_tanpa_gambar_di_repo_publik():
    import yaml
    k = yaml.safe_load((ROOT / "aset/karakter/katalog.yaml").read_text(encoding="utf-8"))["acuan_chibi"]
    assert k["lisensi"] == "izin-pembuat-lewat-chat" and "gratis" in k["syarat"]
    assert "tidak di repo publik" in k["file"]
    assert not list((ROOT / "aset/karakter").glob("*.webp")) and not list((ROOT / "aset/karakter").glob("*.png"))


def test_brief_desain_kantor_ada_di_repo():
    t = (ROOT / "docs/desain/kantor-marketing-brief.md").read_text(encoding="utf-8")
    for kunci in ("Direktur Marketing", "Pemilik (Aldy)", "#294D82", "#FFC400", "Opsi A", "Chibi", "aset/karakter/katalog.yaml"):
        assert kunci in t, kunci
    assert "—" not in t
