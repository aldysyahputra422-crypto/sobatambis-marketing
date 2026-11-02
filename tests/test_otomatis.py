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


@pytest.fixture(autouse=True)
def _jangan_sentuh_folder_asli(tmp_path, monkeypatch):
    """Pemasang tidak boleh menulis ke ~/.claude/skills, ~/.cache, atau katalog asli selama test."""
    monkeypatch.setattr(pasang_otomatis, "SKILLS", tmp_path / "_skills_asli")
    monkeypatch.setattr(pasang_otomatis, "CACHE", tmp_path / "_cache_asli")
    monkeypatch.setattr(pasang_otomatis, "LOG", tmp_path / "_log_asli.md")


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
    dua = [BY_ID["stop-slop"], BY_ID["motion-design-skill"]]
    hasil = pasang_otomatis.pasang_semua(dua, skills_dir=tmp_path, runner=runner, log=log)
    assert hasil["terpasang"] == ["stop-slop", "motion-design-skill"] and hasil["gagal"] == []
    assert "stop-slop" in log.read_text()
    jalan.clear()
    hasil2 = pasang_otomatis.pasang_semua(dua, skills_dir=tmp_path, runner=runner, log=log)
    assert jalan == [] and hasil2["sudah_ada"] == ["stop-slop", "motion-design-skill"]


def test_pasang_gagal_tidak_melempar(tmp_path):
    def runner(cmd, **kw):
        return subprocess.CompletedProcess(cmd, 1, "", "jaringan putus")
    hasil = pasang_otomatis.pasang_semua(KATALOG, skills_dir=tmp_path, runner=runner, log=tmp_path / "t.md", cache=tmp_path / "c")
    assert set(hasil["gagal"]) == {e.id for e in KATALOG if e.otomatis} and hasil["terpasang"] == []


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


# ---------- skill terbaik per bidang ----------

def test_skill_bidang_dipasang_bawaan():
    for i in ("humanizer", "stop-slop", "marketingskills", "claude-screenwriting", "anthropic-canvas-design", "remotion-skills", "motion-design-skill"):
        assert BY_ID[i].otomatis and pasang_otomatis.boleh_otomatis(BY_ID[i]), i


def test_subskill_hanya_folder_terpilih(tmp_path):
    cache = tmp_path / "cache"

    def runner(cmd, **kw):
        if cmd[:2] == ["git", "clone"]:
            dst = Path(cmd[-1])
            for s in ("copywriting", "social", "cold-email"):
                (dst / "skills" / s).mkdir(parents=True)
                (dst / "skills" / s / "SKILL.md").write_text(s)
        return subprocess.CompletedProcess(cmd, 0, "", "")

    e = BY_ID["marketingskills"]
    e2 = type(e)(**{**e.__dict__, "pasang": {**e.pasang, "paths": ["skills/copywriting", "skills/social"], "skills": ["copywriting", "social"]}})
    h = pasang_otomatis.pasang_satu(e2, skills_dir=tmp_path / "skills", runner=runner, log=tmp_path / "t.md", cache=cache)
    assert h["status"] == "terpasang"
    assert sorted(p.name for p in (tmp_path / "skills").iterdir()) == ["copywriting", "social"]
    assert pasang_otomatis.sudah_terpasang(e2, tmp_path / "skills")


def test_subskill_bintang_menyalin_semua_folder_skill(tmp_path):
    def runner(cmd, **kw):
        if cmd[:2] == ["git", "clone"]:
            dst = Path(cmd[-1])
            for s in ("remotion-best-practices", "remotion-license"):
                (dst / "skills" / s).mkdir(parents=True)
                (dst / "skills" / s / "SKILL.md").write_text(s)
            (dst / "skills" / "bukan-skill").mkdir()
        return subprocess.CompletedProcess(cmd, 0, "", "")
    h = pasang_otomatis.pasang_satu(BY_ID["remotion-skills"], skills_dir=tmp_path / "s", runner=runner, log=tmp_path / "t.md", cache=tmp_path / "c")
    assert h["status"] == "terpasang" and sorted(p.name for p in (tmp_path / "s").iterdir()) == ["remotion-best-practices", "remotion-license"]


# ---------- pencari-skill: end-to-end, hemat token ----------

def test_alasan_sesuai_jenis():
    assert "setup.sh" in pasang_otomatis.alasan_tidak_boleh(BY_ID["ffmpeg"])
    assert "setup.sh" in pasang_otomatis.alasan_tidak_boleh(BY_ID["faster-whisper"])
    assert "settings" in pasang_otomatis.alasan_tidak_boleh(BY_ID["caveman"])
    assert "izin pemilik" in pasang_otomatis.alasan_tidak_boleh(BY_ID["voicestudio"], saat="diminta")


def test_pasang_untuk_agent_hanya_skill_miliknya(tmp_path):
    dipasang = []

    def runner(cmd, **kw):
        dipasang.append(cmd)
        return subprocess.CompletedProcess(cmd, 1, "", "")
    h = pasang_otomatis.pasang_untuk_agent(KATALOG, "pembasmi-slop", skills_dir=tmp_path, runner=runner, log=tmp_path / "t.md", cache=tmp_path / "c")
    assert sorted(h["gagal"]) == ["humanizer", "stop-slop"]
    assert all("marketingskills" not in " ".join(c) for c in dipasang)


def test_cari_ringkas_maksimal_tiga_baris_berlabel():
    r = subprocess.run([sys.executable, "-m", "scripts.katalog", "cari", "naskah anti slop caption"], capture_output=True, text=True, cwd=ROOT)
    baris = r.stdout.strip().splitlines()
    assert 1 <= len(baris) <= 3
    assert all(("[boleh]" in b) or ("[pemilik:" in b) or ("[sudah:" in b) for b in baris)


# ---------- 13 repo wajib, mode eksplorasi ----------
WAJIB = ["karpathy-skills", "ecc", "youmind-opus-prompts", "threejs", "gsap", "design-dna", "motion-design-skill",
         "genjutsu", "hyperframes", "onetake", "gbro-collage-broll", "claude-animation-base", "lemo-opuscar"]


def test_tiga_belas_repo_wajib_bisa_diambil_kecuali_berbayar(monkeypatch):
    monkeypatch.setattr(pasang_otomatis, "mode", lambda: "eksplorasi")
    for i in WAJIB:
        e = BY_ID[i]
        assert e.wajib, i
        alasan = pasang_otomatis.alasan_tidak_boleh(e, saat="diminta")
        if i == "gbro-collage-broll":
            assert alasan and "GEMINI_API_KEY" in alasan
        else:
            assert alasan is None or "settings" in alasan, f"{i}: {alasan}"


def test_mode_komersial_menghidupkan_cek_lisensi(monkeypatch):
    monkeypatch.setattr(pasang_otomatis, "mode", lambda: "komersial")
    assert "lisensi" in pasang_otomatis.alasan_tidak_boleh(BY_ID["onetake"], saat="diminta")
    monkeypatch.setattr(pasang_otomatis, "mode", lambda: "eksplorasi")
    assert pasang_otomatis.alasan_tidak_boleh(BY_ID["onetake"], saat="diminta") is None


def test_repo_besar_tidak_ikut_dipasang_tiap_sesi():
    assert not pasang_otomatis.boleh_otomatis(BY_ID["lemo-opuscar"])  # 197 MB: hanya saat diminta
    assert not BY_ID["onetake"].otomatis and not BY_ID["ecc"].otomatis


def test_cara_ambil_npm_unduh_rujukan(tmp_path, monkeypatch):
    monkeypatch.setattr(pasang_otomatis, "mode", lambda: "eksplorasi")
    monkeypatch.setattr(pasang_otomatis, "RUJUKAN", tmp_path / "rujukan")
    monkeypatch.setattr(pasang_otomatis, "TEMPLATE", tmp_path / "template")
    jalan = []

    def runner(cmd, **kw):
        jalan.append(cmd)
        if cmd[0] == "npm":
            for p in cmd[4:]:
                (tmp_path / "template/node_modules" / p).mkdir(parents=True, exist_ok=True)
        elif cmd[0] == "curl":
            Path(cmd[cmd.index("-o") + 1]).parent.mkdir(parents=True, exist_ok=True)
            Path(cmd[cmd.index("-o") + 1]).write_text("<html>")
        elif cmd[:2] == ["git", "clone"]:
            Path(cmd[-1]).mkdir(parents=True)
            (Path(cmd[-1]) / "README.md").write_text("x")
        return subprocess.CompletedProcess(cmd, 0, "", "")
    for i in ("threejs", "gsap", "youmind-opus-prompts", "claude-animation-base", "ecc"):
        h = pasang_otomatis.pasang_satu(BY_ID[i], skills_dir=tmp_path / "s", runner=runner, log=tmp_path / "t.md", cache=tmp_path / "c")
        assert h["status"] == "terpasang", (i, h)
    assert ["npm", "install", "--prefix", str(tmp_path / "template"), "three", "@remotion/three"] in jalan
    assert (tmp_path / "rujukan/ecc/README.md").exists()


def test_settings_mendaftarkan_marketplace_repo_wajib():
    s = json.loads((ROOT / "config/claude-settings.json").read_text())
    for m in ("karpathy-skills", "ecc", "genjutsu", "hyperframes", "lemolab"):
        assert m in s["extraKnownMarketplaces"], m
    assert s["enabledPlugins"]["andrej-karpathy-skills@karpathy-skills"] is True
    assert "ecc@ecc" not in s["enabledPlugins"]


def test_agent_reach_dipasang_lewat_uv_untuk_periset(tmp_path, monkeypatch):
    monkeypatch.setattr(pasang_otomatis, "UV_BIN", tmp_path / "bin")
    monkeypatch.setattr(pasang_otomatis.shutil, "which", lambda n: None)
    e = BY_ID["agent-reach"]
    assert e.pasang["jenis"] == "uv_tool" and "releases/latest/download/agent-reach.zip" in e.pasang["url"]
    assert "periset-tren" in e.agent and not e.otomatis
    jalan = []

    def runner(cmd, **kw):
        jalan.append(cmd)
        if cmd[:3] == ["uv", "tool", "install"]:
            (tmp_path / "bin").mkdir(exist_ok=True)
            (tmp_path / "bin/agent-reach").write_text("#!/bin/sh")
        return subprocess.CompletedProcess(cmd, 0, "", "")
    assert not pasang_otomatis.sudah_terpasang(e)
    h = pasang_otomatis.pasang_untuk_agent(KATALOG, "periset-tren", skills_dir=tmp_path / "s", runner=runner,
                                           log=tmp_path / "t.md", cache=tmp_path / "c")
    assert "agent-reach" in h["terpasang"], h
    assert ["uv", "tool", "install", e.pasang["url"]] in jalan
    assert [str(tmp_path / "bin/agent-reach"), "setup"] in jalan
    assert not any("pypi" in " ".join(c) or c[:2] == ["pip", "install"] for c in jalan)


def test_label_cari_sama_dengan_aturan_id():
    """pencari-skill memutuskan `--id` dari label `cari`; keduanya harus memakai aturan "diminta"."""
    r = subprocess.run([sys.executable, "-m", "scripts.katalog", "cari", "riset tren baca web transkrip youtube"],
                       capture_output=True, text=True, cwd=ROOT)
    baris = next(b for b in r.stdout.splitlines() if b.startswith("agent-reach "))
    assert "[boleh]" in baris or "[sudah:" in baris, baris
    r = subprocess.run([sys.executable, "-m", "scripts.katalog", "cari", "elevenlabs suara"], capture_output=True, text=True, cwd=ROOT)
    assert "elevenlabs [pemilik: berbayar" in r.stdout
