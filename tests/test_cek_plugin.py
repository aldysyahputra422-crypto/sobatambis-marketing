import json
from pathlib import Path

from scripts.cek_plugin import periksa

ROOT = Path(__file__).resolve().parents[1]


def _manifest(root: Path):
    (root / ".claude-plugin").mkdir(parents=True)
    (root / ".claude-plugin/plugin.json").write_text(json.dumps({"name": "x", "version": "0.1.0", "description": "d"}))
    (root / ".claude-plugin/marketplace.json").write_text(
        json.dumps({"name": "m", "owner": {"name": "o"}, "plugins": [{"name": "x", "source": "./"}]})
    )


def test_plugin_kosong_lulus(tmp_path):
    _manifest(tmp_path)
    assert periksa(tmp_path) == []


def test_agent_tanpa_model_gagal(tmp_path):
    _manifest(tmp_path)
    (tmp_path / "agents").mkdir()
    (tmp_path / "agents/x.md").write_text("---\nname: x\ndescription: d\n---\nisi\n")
    assert periksa(tmp_path) == ["agents/x.md: model hilang"]


def test_agent_model_tidak_dikenal_gagal(tmp_path):
    _manifest(tmp_path)
    (tmp_path / "agents").mkdir()
    (tmp_path / "agents/x.md").write_text("---\nname: x\ndescription: d\nmodel: gpt\n---\n")
    masalah = periksa(tmp_path)
    assert len(masalah) == 1 and "model tidak dikenal" in masalah[0]


def test_skill_tanpa_description_gagal(tmp_path):
    _manifest(tmp_path)
    (tmp_path / "skills/s").mkdir(parents=True)
    (tmp_path / "skills/s/SKILL.md").write_text("---\nname: s\n---\n")
    assert periksa(tmp_path) == ["skills/s/SKILL.md: description hilang"]


def test_manifest_json_rusak_gagal(tmp_path):
    _manifest(tmp_path)
    (tmp_path / ".claude-plugin/plugin.json").write_text("{rusak")
    assert any("plugin.json" in m for m in periksa(tmp_path))


def test_repo_ini_lulus():
    assert periksa(ROOT) == []
