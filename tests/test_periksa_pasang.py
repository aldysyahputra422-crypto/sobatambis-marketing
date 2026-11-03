import json
import os
import subprocess
from pathlib import Path

import pytest

from scripts import periksa_pasang

ROOT = Path(__file__).resolve().parents[1]
RAHASIA = "sk_rahasia_jangan_tercetak_123"


def _repo(tmp_path, settings=True):
    r = tmp_path / "repo"
    (r / ".venv/bin").mkdir(parents=True)
    (r / ".venv/bin/python").write_text("")
    (r / "template/node_modules").mkdir(parents=True)
    for d in ("agents", "skills", "commands"):
        (r / d).mkdir()
    (r / ".claude").mkdir()
    for d in ("agents", "skills", "commands"):
        (r / ".claude" / d).symlink_to(f"../{d}")
    (r / "config").mkdir()
    tmpl = (ROOT / "config/claude-settings.json").read_text()
    (r / "config/claude-settings.json").write_text(tmpl)
    (r / "config/notion.yaml").write_text("database_id: null\n")
    if settings:
        (r / ".claude/settings.json").write_text(tmpl)
    (r / ".claude/kantor-agent.json").write_text('{"autostart": true}')
    (r / "scripts/hooks").mkdir(parents=True)
    h = r / "scripts/hooks/jalankan.sh"
    h.write_text("#!/usr/bin/env bash\n")
    h.chmod(0o755)
    (r / "kantor/runtime/bin").mkdir(parents=True)
    (r / "katalog").mkdir()
    (r / "katalog/skill.yaml").write_text((ROOT / "katalog/skill.yaml").read_text())
    return r


def _jalan(node="v22.1.0", kantor=True):
    def f(cmd, **kw):
        if cmd[0] == "node":
            return subprocess.CompletedProcess(cmd, 0, node + "\n", "")
        if cmd[0] == "bash" and cmd[-1] == "url":
            return subprocess.CompletedProcess(cmd, 0 if kantor else 1, "http://127.0.0.1:8788/kerja\n" if kantor else "", "")
        return subprocess.CompletedProcess(cmd, 1, "", "")
    return f


def _ada(*ada):
    return lambda n: f"/usr/bin/{n}" if n in ada else None


def _status(hasil):
    return {h["nama"]: h["status"] for h in hasil}


def test_semua_beres_tanpa_gagal(tmp_path):
    r = _repo(tmp_path)
    h = periksa_pasang.periksa(r, jalankan=_jalan(), ada=_ada("ffmpeg", "tailscale"), env={"ELEVENLABS_API_KEY": RAHASIA}, skills_dir=tmp_path / "skills_kosong")
    s = _status(h)
    assert "gagal" not in s.values(), [x for x in h if x["status"] == "gagal"]
    assert s["node"] == "ok" and s["pengaturan otomatis"] == "ok" and s["kantor menyala"] == "ok"
    assert periksa_pasang.kode_keluar(h) == 0


def test_node_lama_gagal_dengan_perbaikan(tmp_path):
    h = periksa_pasang.periksa(_repo(tmp_path), jalankan=_jalan(node="v16.20.0"), ada=_ada("ffmpeg"), env={}, skills_dir=tmp_path / "s")
    n = next(x for x in h if x["nama"] == "node")
    assert n["status"] == "gagal" and "18" in n["perbaiki"]
    assert periksa_pasang.kode_keluar(h) == 1


def test_pengaturan_belum_diaktifkan_gagal(tmp_path):
    h = periksa_pasang.periksa(_repo(tmp_path, settings=False), jalankan=_jalan(), ada=_ada("ffmpeg"), env={}, skills_dir=tmp_path / "s")
    p = next(x for x in h if x["nama"] == "pengaturan otomatis")
    assert p["status"] == "gagal" and "aktifkan_otomatis.sh" in p["perbaiki"]


def test_ffmpeg_hilang_gagal_tailscale_hanya_saran(tmp_path):
    h = periksa_pasang.periksa(_repo(tmp_path), jalankan=_jalan(), ada=_ada(), env={}, skills_dir=tmp_path / "s")
    s = _status(h)
    assert s["ffmpeg"] == "gagal" and s["tailscale"] == "saran"


def test_kantor_belum_menyala_hanya_saran(tmp_path):
    h = periksa_pasang.periksa(_repo(tmp_path), jalankan=_jalan(kantor=False), ada=_ada("ffmpeg"), env={}, skills_dir=tmp_path / "s")
    assert _status(h)["kantor menyala"] == "saran"


def test_kunci_elevenlabs_tidak_pernah_dicetak(tmp_path, capsys):
    h = periksa_pasang.periksa(_repo(tmp_path), jalankan=_jalan(), ada=_ada("ffmpeg"), env={"ELEVENLABS_API_KEY": RAHASIA}, skills_dir=tmp_path / "s")
    periksa_pasang.cetak(h)
    assert RAHASIA not in capsys.readouterr().out and RAHASIA not in json.dumps(h)
    assert _status(h)["kunci ElevenLabs"] == "ok"


def test_izin_elevenlabs_aktif_diberi_tahu(tmp_path):
    r = _repo(tmp_path)
    (r / ".sa").mkdir()
    (r / ".sa/izin-elevenlabs").write_text("ok")
    h = periksa_pasang.periksa(r, jalankan=_jalan(), ada=_ada("ffmpeg"), env={}, skills_dir=tmp_path / "s")
    assert _status(h)["izin ElevenLabs"] == "saran"


def test_repo_asli_bisa_diperiksa_tanpa_mengubah_apa_pun():
    sebelum = set(os.listdir(ROOT / ".claude"))
    h = periksa_pasang.periksa(ROOT, jalankan=_jalan(), ada=_ada("ffmpeg"), env={}, skills_dir=ROOT / "tidak-ada")
    assert {x["status"] for x in h} <= {"ok", "gagal", "saran"}
    assert set(os.listdir(ROOT / ".claude")) == sebelum


def test_repo_yang_belum_dikunci_dinyatakan_gagal(tmp_path):
    r = _repo(tmp_path)
    teks = (r / "katalog/skill.yaml").read_text()
    import re
    (r / "katalog/skill.yaml").write_text(re.sub(r', pin: "[0-9a-f]{40}"', "", teks, count=1))
    h = periksa_pasang.periksa(r, jalankan=_jalan(), ada=_ada("ffmpeg"), env={}, skills_dir=tmp_path / "s")
    v = next(x for x in h if x["nama"] == "versi terkunci")
    assert v["status"] == "gagal" and "kunci_versi" in v["perbaiki"]
    assert periksa_pasang.kode_keluar(h) == 1


def test_katalog_asli_terkunci_menurut_pemeriksaan():
    h = periksa_pasang.periksa(ROOT, jalankan=_jalan(), ada=_ada("ffmpeg"), env={}, skills_dir=ROOT / "tidak-ada")
    assert next(x for x in h if x["nama"] == "versi terkunci")["status"] == "ok"
