"""Pemeriksaan pemasangan: apakah plugin, hook, dan kantor live siap di komputer ini. Hanya membaca, tidak mengubah apa pun.

python -m scripts.periksa_pasang [--json]   → kode 0 bila tidak ada yang GAGAL, 1 bila ada
Status: ok (siap) · gagal (harus diperbaiki, lihat "perbaiki") · saran (opsional atau menyusul otomatis).
Nilai rahasia (kunci API) tidak pernah dicetak, hanya ada atau tidaknya.
"""
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOOK = ("SessionStart", "Stop", "PreToolUse")


def _h(nama, status, detail, perbaiki=""):
    return {"nama": nama, "status": status, "detail": detail, "perbaiki": perbaiki}


def _json(p: Path) -> dict:
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def periksa(root: Path = ROOT, *, jalankan=subprocess.run, ada=shutil.which, env=None, skills_dir: Path | None = None) -> list[dict]:
    root, env = Path(root), os.environ if env is None else env
    hasil = []

    # --- wajib
    try:
        r = jalankan(["node", "-v"], capture_output=True, text=True, timeout=10)
        v = r.stdout.strip()
        besar = int(re.match(r"v?(\d+)", v).group(1)) if r.returncode == 0 and re.match(r"v?(\d+)", v) else 0
    except (OSError, subprocess.SubprocessError, AttributeError):
        v, besar = "", 0
    if besar >= 18:
        hasil.append(_h("node", "ok", f"Node {v} (kantor live dan render butuh 18 atau lebih)"))
    else:
        hasil.append(_h("node", "gagal", f"Node {v or 'tidak ditemukan'}", "Pasang Node 18 atau lebih baru dari https://nodejs.org lalu buka ulang Claude Code."))
    hasil.append(_h("python venv", "ok", ".venv siap") if (root / ".venv/bin/python").exists()
                  else _h("python venv", "gagal", ".venv belum ada", "Jalankan: bash scripts/setup.sh"))
    hasil.append(_h("dependensi render", "ok", "template/node_modules ada") if (root / "template/node_modules").is_dir()
                 else _h("dependensi render", "gagal", "template/node_modules belum ada", "Jalankan: bash scripts/setup.sh"))
    hasil.append(_h("ffmpeg", "ok", "ada") if ada("ffmpeg") else _h("ffmpeg", "gagal", "tidak ditemukan", "Pasang ffmpeg (mix dan render butuh)."))

    # --- otomasi proyek
    aktif, templat = _json(root / ".claude/settings.json"), _json(root / "config/claude-settings.json")
    if not aktif:
        hasil.append(_h("pengaturan otomatis", "gagal", ".claude/settings.json belum ada: hook tidak jalan", "Jalankan: bash scripts/aktifkan_otomatis.sh lalu buka ulang Claude Code di folder repo dan pilih trust."))
    elif not all(k in aktif.get("hooks", {}) for k in HOOK):
        hasil.append(_h("pengaturan otomatis", "gagal", "hook SessionStart/Stop/PreToolUse tidak lengkap", "Jalankan ulang: bash scripts/aktifkan_otomatis.sh"))
    elif aktif != templat:
        hasil.append(_h("pengaturan otomatis", "saran", "ada beda dari config/claude-settings.json (diubah manual?)", "Bila tidak disengaja: bash scripts/aktifkan_otomatis.sh (yang lama dicadangkan)."))
    else:
        hasil.append(_h("pengaturan otomatis", "ok", "hook dan izin aktif"))
    rusak = [d for d in ("agents", "skills", "commands") if not (root / ".claude" / d).resolve().is_dir()]
    hasil.append(_h("agent, skill, perintah", "gagal", f"tautan .claude/{', '.join(rusak)} rusak", "Jalankan: git checkout -- .claude") if rusak
                 else _h("agent, skill, perintah", "ok", "dimuat dari folder repo"))
    jalankan_sh = root / "scripts/hooks/jalankan.sh"
    hasil.append(_h("berkas hook", "ok", "bisa dijalankan") if os.access(jalankan_sh, os.X_OK)
                 else _h("berkas hook", "gagal", "scripts/hooks/jalankan.sh tidak bisa dijalankan", "Jalankan: chmod +x scripts/hooks/jalankan.sh"))

    # --- kantor live
    hasil.append(_h("kantor autostart", "ok", 'aktif di .claude/kantor-agent.json') if _json(root / ".claude/kantor-agent.json").get("autostart")
                 else _h("kantor autostart", "saran", "autostart mati", 'Tambahkan "autostart": true di .claude/kantor-agent.json.'))
    try:
        r = jalankan(["bash", str(root / "kantor/runtime/bin/kantor.sh"), "url"], capture_output=True, text=True, timeout=15, env={**os.environ, "KANTOR_PROJECT": str(root)})
        url = r.stdout.strip()
        ok = r.returncode == 0 and url
    except (OSError, subprocess.SubprocessError):
        ok, url = False, ""
    hasil.append(_h("kantor menyala", "ok", url) if ok
                 else _h("kantor menyala", "saran", "belum menyala", "Menyala otomatis di sesi baru, atau: bash kantor/runtime/bin/kantor.sh start"))

    # --- yang menyusul / opsional
    from scripts import pasang_otomatis
    from scripts.katalog import muat
    try:
        kat = [e for e in muat(root / "katalog/skill.yaml") if e.otomatis and (e.pasang or {}).get("jenis") not in ("plugin", "setup")]
        sd = skills_dir or pasang_otomatis.SKILLS
        belum = [e.id for e in kat if not pasang_otomatis.sudah_terpasang(e, sd)]
    except (OSError, KeyError, TypeError):
        kat, belum = [], []
    try:
        belum_kunci = [e.id for e in muat(root / "katalog/skill.yaml") if (e.pasang or {}).get("jenis") not in ("plugin", "setup", "unduh", None)
                       and not e.butuh_key and (e.biaya or "").lower() == "gratis" and pasang_otomatis.alasan_belum_terkunci(e)]
    except (OSError, KeyError, TypeError):
        belum_kunci = []
    hasil.append(_h("versi terkunci", "gagal", f"{len(belum_kunci)} entri belum dikunci: {', '.join(belum_kunci[:4])}", "Pemasangan otomatis menolaknya. Pemilik: python -m scripts.kunci_versi --semua (baca perubahannya), lalu commit.") if belum_kunci
                 else _h("versi terkunci", "ok", "semua repo dan paket dikunci ke versi tertentu (commit, versi tepat, sha256)"))
    hasil.append(_h("skill katalog", "ok", f"{len(kat)} skill otomatis terpasang") if kat and not belum
                 else _h("skill katalog", "saran", f"{len(belum)} dari {len(kat)} belum terpasang", "Terpasang otomatis saat sesi dimulai (butuh internet); manual: python -m scripts.pasang_otomatis"))
    hasil.append(_h("kunci ElevenLabs", "ok", "ada (nilainya tidak ditampilkan)") if env.get("ELEVENLABS_API_KEY")
                 else _h("kunci ElevenLabs", "saran", "belum ada", "Perlu hanya bila memakai ElevenLabs: simpan ELEVENLABS_API_KEY sebagai secret environment."))
    hasil.append(_h("izin ElevenLabs", "saran", "AKTIF: pemakaian ElevenLabs tidak lagi diblok", "Hapus .sa/izin-elevenlabs bila tidak ingin memakai kredit.") if (root / ".sa/izin-elevenlabs").exists()
                 else _h("izin ElevenLabs", "ok", "terkunci sampai kamu mengizinkan"))
    notion = (root / "config/notion.yaml").read_text(encoding="utf-8") if (root / "config/notion.yaml").exists() else ""
    hasil.append(_h("Notion", "ok", "database tercatat") if re.search(r"database_id:\s*\S+", notion) and "database_id: null" not in notion
                 else _h("Notion", "saran", "database belum dibuat", "Sambungkan konektor Notion di claude.ai (Settings, Connectors); database dibuat otomatis saat episode pertama."))
    hasil.append(_h("tailscale", "ok", "ada") if ada("tailscale")
                 else _h("tailscale", "saran", "belum terpasang", "Untuk membuka kantor dari HP: pasang Tailscale lalu bash kantor/runtime/bin/kantor.sh tailscale"))
    return hasil


def kode_keluar(hasil: list[dict]) -> int:
    return 1 if any(h["status"] == "gagal" for h in hasil) else 0


def cetak(hasil: list[dict]) -> None:
    label = {"ok": "OK    ", "gagal": "GAGAL ", "saran": "SARAN "}
    for h in hasil:
        print(f"[{label[h['status']]}] {h['nama']}: {h['detail']}")
        if h["status"] != "ok" and h["perbaiki"]:
            print(f"         → {h['perbaiki']}")
    n = {s: sum(1 for h in hasil if h["status"] == s) for s in ("ok", "saran", "gagal")}
    print(f"\n{n['ok']} siap, {n['saran']} saran, {n['gagal']} gagal" + (": perbaiki yang GAGAL dulu." if n["gagal"] else ": siap dipakai."))


if __name__ == "__main__":
    hasil = periksa()
    if "--json" in sys.argv:
        print(json.dumps(hasil, ensure_ascii=False, indent=1))
    else:
        cetak(hasil)
    sys.exit(kode_keluar(hasil))
