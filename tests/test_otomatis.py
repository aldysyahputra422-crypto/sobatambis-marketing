import json
import subprocess
import sys
from pathlib import Path

import pytest

from scripts import pasang_otomatis, status
from scripts.katalog import muat

ROOT = Path(__file__).resolve().parents[1]
KATALOG = muat(ROOT / "katalog/skill.yaml")
BY_ID = {e.id: e for e in KATALOG}


# ---------- pemasang otomatis ----------

def test_boleh_otomatis_hanya_gratis_tanpa_key_lisensi_bebas():
    assert pasang_otomatis.boleh_otomatis(BY_ID["stop-slop"])
    assert pasang_otomatis.boleh_otomatis(BY_ID["motion-design-skill"])
    assert not pasang_otomatis.boleh_otomatis(BY_ID["elevenlabs"])          # butuh key, berbayar
    assert not pasang_otomatis.boleh_otomatis(BY_ID["onetake"])             # lisensi nonkomersial
    assert not pasang_otomatis.boleh_otomatis(BY_ID["karpathy-skills"])     # tanpa lisensi
    assert not pasang_otomatis.boleh_otomatis(BY_ID["lemo-opuscar"])        # 197 MB rujukan
    assert not pasang_otomatis.boleh_otomatis(BY_ID["voicestudio"])         # GB


def test_perintah_pasang_per_jenis(tmp_path):
    p = pasang_otomatis.perintah(BY_ID["stop-slop"], skills_dir=tmp_path)
    assert p[:3] == ["git", "clone", "--depth"] and p[-1] == str(tmp_path / "stop-slop")
    q = pasang_otomatis.perintah(BY_ID["motion-design-skill"], skills_dir=tmp_path)
    assert q[:4] == ["npx", "--yes", "skills", "add"] and "LottieFiles/motion-design-skill" in q


def test_pasang_otomatis_memasang_yang_belum_dan_mencatat(tmp_path):
    jalan = []

    def runner(cmd, **kw):
        jalan.append(cmd)
        if cmd[0] == "git":
            Path(cmd[-1]).mkdir(parents=True)
            (Path(cmd[-1]) / "SKILL.md").write_text("x")
        else:
            (tmp_path / "motion-design-skill").mkdir()
            (tmp_path / "motion-design-skill" / "SKILL.md").write_text("x")
        return subprocess.CompletedProcess(cmd, 0, "", "")

    log = tmp_path / "terpasang.md"
    hasil = pasang_otomatis.pasang_semua(KATALOG, skills_dir=tmp_path, runner=runner, log=log)
    assert hasil["terpasang"] == ["stop-slop", "motion-design-skill"] and hasil["gagal"] == []
    assert "stop-slop" in log.read_text()
    jalan.clear()
    hasil2 = pasang_otomatis.pasang_semua(KATALOG, skills_dir=tmp_path, runner=runner, log=log)
    assert jalan == [] and hasil2["sudah_ada"] == ["stop-slop", "motion-design-skill"]


def test_pasang_gagal_tidak_melempar(tmp_path):
    def runner(cmd, **kw):
        return subprocess.CompletedProcess(cmd, 1, "", "jaringan putus")
    hasil = pasang_otomatis.pasang_semua(KATALOG, skills_dir=tmp_path, runner=runner, log=tmp_path / "t.md")
    assert set(hasil["gagal"]) == {"stop-slop", "motion-design-skill"}


def test_pasang_satu_id_yang_tidak_boleh_ditolak(tmp_path):
    hasil = pasang_otomatis.pasang_satu(BY_ID["elevenlabs"], skills_dir=tmp_path, runner=None, log=tmp_path / "t.md")
    assert hasil["status"] == "butuh_pemilik" and "ELEVENLABS_API_KEY" in hasil["alasan"]


# ---------- hook ----------

def _hook(nama, masukan, cwd):
    r = subprocess.run([sys.executable, str(ROOT / "scripts/hooks" / f"{nama}.py")], input=json.dumps(masukan),
                       capture_output=True, text=True, cwd=cwd, env={"CLAUDE_PROJECT_DIR": str(cwd), "PATH": "/usr/bin:/bin", "SA_LEWATI_SETUP": "1", "SA_LEWATI_PASANG": "1"})
    return r


def _proyek(tmp_path, tahap_lulus, sumber="manusia"):
    f = tmp_path / "videos/w/ep"
    f.mkdir(parents=True)
    (f / "naskah.json").write_text(json.dumps({"episode": "ep", "judul": "J", "disetujui": True, "sumber_suara": sumber, "judul_berikut": "x", "beat": []}))
    for t in tahap_lulus:
        status.tandai(f, t, "lulus")
    (tmp_path / ".sa").mkdir()
    (tmp_path / ".sa/aktif.json").write_text(json.dumps({"folder": "videos/w/ep"}))
    return f


def test_stop_diblok_saat_produksi_berjalan(tmp_path):
    _proyek(tmp_path, ["naskah", "suara", "dialog_ok"])
    r = _hook("lanjut", {"stop_hook_active": False}, tmp_path)
    keluar = json.loads(r.stdout)
    assert keluar["decision"] == "block" and "adegan" in keluar["reason"]


def test_stop_diizinkan_di_titik_persetujuan(tmp_path):
    _proyek(tmp_path, ["naskah", "suara"])  # berikutnya dialog_ok = Approval 2
    r = _hook("lanjut", {"stop_hook_active": False}, tmp_path)
    assert r.returncode == 0 and '"block"' not in r.stdout


def test_stop_diizinkan_bila_macet(tmp_path):
    _proyek(tmp_path, ["naskah", "suara", "dialog_ok"])
    for _ in range(2):
        _hook("lanjut", {"stop_hook_active": True}, tmp_path)
    r = _hook("lanjut", {"stop_hook_active": True}, tmp_path)
    assert '"block"' not in r.stdout
    assert "macet" in (tmp_path / "videos/w/ep/catatan-notion.md").read_text()


def test_stop_tanpa_produksi_aktif_bebas(tmp_path):
    r = _hook("lanjut", {"stop_hook_active": False}, tmp_path)
    assert r.returncode == 0 and r.stdout.strip() == ""


def test_selesai_menghapus_penanda(tmp_path):
    _proyek(tmp_path, list(status.TAHAP))
    _hook("lanjut", {"stop_hook_active": False}, tmp_path)
    assert not (tmp_path / ".sa/aktif.json").exists()


@pytest.mark.parametrize("perintah", [
    ".venv/bin/python -m scripts.suara.audisi arta",
    "python -m scripts.aset sfx --ulang",
    "curl https://api.elevenlabs.io/v1/voices",
])
def test_jaga_elevenlabs_tanpa_izin_ditolak(tmp_path, perintah):
    r = _hook("jaga", {"tool_name": "Bash", "tool_input": {"command": perintah}}, tmp_path)
    d = json.loads(r.stdout)["hookSpecificOutput"]
    assert d["permissionDecision"] == "deny" and ".sa/izin-elevenlabs" in d["permissionDecisionReason"]


def test_jaga_produksi_elevenlabs_ditolak_manusia_boleh(tmp_path):
    f = _proyek(tmp_path, ["naskah"], sumber="elevenlabs")
    cmd = {"tool_name": "Bash", "tool_input": {"command": f".venv/bin/python -m scripts.suara.produksi {f.relative_to(tmp_path)}"}}
    assert "deny" in _hook("jaga", cmd, tmp_path).stdout
    (f / "naskah.json").write_text(json.dumps({"sumber_suara": "manusia", "beat": []}))
    assert _hook("jaga", cmd, tmp_path).stdout.strip() == ""


def test_jaga_dengan_izin_boleh(tmp_path):
    (tmp_path / ".sa").mkdir()
    (tmp_path / ".sa/izin-elevenlabs").write_text("disetujui pemilik")
    r = _hook("jaga", {"tool_name": "Bash", "tool_input": {"command": "python -m scripts.aset sfx"}}, tmp_path)
    assert r.stdout.strip() == ""


def test_mulai_memberi_konteks_hemat_token_dan_produksi(tmp_path):
    _proyek(tmp_path, ["naskah"])
    r = _hook("mulai", {"source": "startup"}, tmp_path)
    ctx = json.loads(r.stdout)["hookSpecificOutput"]["additionalContext"]
    assert "hemat token" in ctx.lower() and "videos/w/ep" in ctx and "Notion" in ctx


# ---------- konfigurasi proyek ----------

def test_settings_proyek():
    s = json.loads((ROOT / "config/claude-settings.json").read_text())
    assert "config/claude-settings.json" in (ROOT / "scripts/aktifkan_otomatis.sh").read_text()
    assert s["enabledPlugins"]["caveman@caveman"] is True and s["enabledPlugins"]["ponytail@ponytail"] is True
    assert s["extraKnownMarketplaces"]["caveman"]["source"]["repo"] == "JuliusBrussee/caveman"
    assert s["extraKnownMarketplaces"]["ponytail"]["source"]["repo"] == "DietrichGebert/ponytail"
    for ev in ("SessionStart", "Stop", "PreToolUse"):
        assert ev in s["hooks"]
    assert s["env"]["DO_NOT_TRACK"] == "1"
    for d in ("agents", "skills", "commands"):
        p = ROOT / ".claude" / d
        assert p.is_symlink() and p.resolve() == (ROOT / d).resolve()


def test_mulai_mengabaikan_episode_v1(tmp_path):
    f = tmp_path / "videos/w/lama"
    f.mkdir(parents=True)
    (f / "naskah.json").write_text(json.dumps({"episode": "lama", "judul": "J", "baris": []}))
    status.tandai(f, "naskah", "lulus")
    r = _hook("mulai", {"source": "startup"}, tmp_path)
    assert "videos/w/lama" not in json.loads(r.stdout)["hookSpecificOutput"]["additionalContext"]
