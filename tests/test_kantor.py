"""Kantor Agent (visualisasi real-time agent): konfigurasi proyek dan pemasangan plugin."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KONFIG = json.loads((ROOT / ".claude/kantor-agent.json").read_text(encoding="utf-8"))


def test_ketua_dan_tim_sesuai_permintaan():
    assert KONFIG["names"]["ketua"] == "Hapis"
    assert len(KONFIG["names"]["team"]) == 4
    assert KONFIG["autostart"] is True
    assert "Marketing" in KONFIG["title"]


def test_nama_tidak_bentrok_dan_freelancer_cukup():
    tim = set(KONFIG["names"]["team"]) | {KONFIG["names"]["ketua"]}
    frl = KONFIG["names"]["freelancers"]
    assert len(set(frl)) == len(frl), "nama freelancer ganda"
    assert not tim & set(frl), "nama tim dan freelancer tidak boleh sama"
    agen = len(list((ROOT / "agents").glob("*.md")))
    assert len(frl) >= agen - 4, "freelancer harus cukup untuk semua agent selain 4 anggota tim"


def test_plugin_terdaftar_di_settings_proyek():
    s = json.loads((ROOT / "config/claude-settings.json").read_text(encoding="utf-8"))
    assert s["extraKnownMarketplaces"]["kantor-agent"]["source"]["repo"] == "humaedihume/kantor-agent"
    assert s["enabledPlugins"]["kantor-agent@kantor-agent"] is True


def test_readme_menjelaskan_cara_membuka_kantor():
    t = (ROOT / "README.md").read_text(encoding="utf-8")
    assert "kantor-agent" in t and "127.0.0.1:8788/kerja" in t and "Hapis" in t
