"""Pasang skill dari katalog secara otomatis, dengan aturan ketat.

Boleh dipasang TANPA bertanya hanya bila semua benar:
  - butuh_key kosong dan biaya "gratis"
  - lisensi bebas komersial (MIT, Apache-2.0, BSD, ISC, LGPL)
  - status direkomendasikan atau opsional (bukan rujukan/sebagian/alternatif)
  - ukuran bukan GB dan tidak lebih dari 200 MB
  - punya cara pasang terstruktur (pasang.jenis git_skill, git_subskill, atau npx_skill)
Selain itu: status "butuh_pemilik" + alasan (dicatat ke Notion lewat penjadwal-notion), tidak dipasang.

python -m scripts.pasang_otomatis            → pasang semua entri bertanda otomatis: true
python -m scripts.pasang_otomatis --id <id>  → pasang satu entri (dipakai pencari-skill)
python -m scripts.pasang_otomatis --agent <nama>  → pasang semua skill dasar milik satu agent
"""
import argparse
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from scripts.katalog import Entri, muat

ROOT = Path(__file__).resolve().parents[1]
SKILLS = Path.home() / ".claude/skills"
LOG = ROOT / "katalog/terpasang.md"
LISENSI_BEBAS = ("mit", "apache-2.0", "bsd", "isc", "lgpl", "remotion license")  # Remotion License: lisensi mesin inti proyek, sudah diterima pemilik
CACHE = Path.home() / ".cache/sobatambis/repo"
STATUS_BOLEH = ("direkomendasikan", "opsional")
MAKS_MB = 200


def _mb(ukuran: str) -> float:
    u = (ukuran or "").lower()
    if "gb" in u:
        return 10_000
    m = re.search(r"([\d.,]+)\s*mb", u)
    return float(m.group(1).replace(",", ".")) if m else 0


def alasan_tidak_boleh(e: Entri) -> str | None:
    jenis = (e.pasang or {}).get("jenis")
    if jenis == "setup":
        return "sudah ditangani scripts/setup.sh (dependensi proyek)"
    if jenis == "plugin":
        return "plugin aktif lewat .claude/settings.json (scripts/aktifkan_otomatis.sh)"
    if e.butuh_key:
        return f"butuh {e.butuh_key}"
    if (e.biaya or "").lower() != "gratis":
        return f"biaya: {e.biaya}"
    if not (e.lisensi or "").lower().startswith(LISENSI_BEBAS):
        return f"lisensi {e.lisensi} perlu ditinjau pemilik"
    if e.status not in STATUS_BOLEH:
        return f"status {e.status}"
    if _mb(e.ukuran) > MAKS_MB:
        return f"ukuran {e.ukuran}"
    if not e.pasang or e.pasang.get("jenis") not in ("git_skill", "git_subskill", "npx_skill"):
        return "tidak ada cara pasang otomatis; pasang manual hanya dengan izin pemilik"
    return None


def boleh_otomatis(e: Entri) -> bool:
    return alasan_tidak_boleh(e) is None


def perintah(e: Entri, skills_dir: Path = SKILLS) -> list[str]:
    j = e.pasang["jenis"]
    if j == "git_skill":
        return ["git", "clone", "--depth", "1", e.pasang["url"], str(Path(skills_dir) / e.id)]
    if j == "npx_skill":
        return ["npx", "--yes", "skills", "add", e.pasang["repo"], "-g", "-y"]
    raise ValueError(j)


def sudah_terpasang(e: Entri, skills_dir: Path = SKILLS) -> bool:
    if e.pasang and e.pasang.get("jenis") == "git_subskill":
        nama = e.pasang.get("skills") or [Path(x).name for x in e.pasang["paths"] if not x.endswith("*")]
        return bool(nama) and all((Path(skills_dir) / n / "SKILL.md").exists() for n in nama)
    return any(Path(skills_dir).glob(f"{e.id}*/SKILL.md")) or any(Path(skills_dir).glob(f"*/{e.id}*/SKILL.md"))


def _pasang_subskill(e: Entri, skills_dir: Path, runner, cache: Path) -> bool:
    """Sparse clone repo ke cache, lalu salin hanya folder skill terpilih (paths; 'x/*' = semua subfolder ber-SKILL.md)."""
    url = e.pasang["url"]
    tujuan = Path(cache) / re.sub(r"[^a-z0-9]+", "-", url.lower()).strip("-")
    if tujuan.exists():
        shutil.rmtree(tujuan)
    tujuan.parent.mkdir(parents=True, exist_ok=True)
    induk = sorted({p[:-2] if p.endswith("/*") else p for p in e.pasang["paths"]})
    r = runner(["git", "clone", "--depth", "1", "--filter=blob:none", "--sparse", url, str(tujuan)], capture_output=True, text=True, timeout=300)
    if r.returncode != 0:
        return False
    runner(["git", "-C", str(tujuan), "sparse-checkout", "set", *induk], capture_output=True, text=True, timeout=300)
    Path(skills_dir).mkdir(parents=True, exist_ok=True)
    sumber = []
    for p in e.pasang["paths"]:
        if p.endswith("/*"):
            sumber += [d for d in sorted((tujuan / p[:-2]).glob("*")) if (d / "SKILL.md").exists()]
        elif (tujuan / p / "SKILL.md").exists():
            sumber.append(tujuan / p)
    for d in sumber:
        shutil.copytree(d, Path(skills_dir) / d.name, dirs_exist_ok=True)
    return bool(sumber)


def _catat(log: Path, e: Entri, hasil: str) -> None:
    log.parent.mkdir(parents=True, exist_ok=True)
    if not log.exists():
        log.write_text("# Skill terpasang otomatis\n\n| Waktu (UTC) | id | hasil |\n|---|---|---|\n", encoding="utf-8")
    with log.open("a", encoding="utf-8") as f:
        f.write(f"| {datetime.now(timezone.utc).isoformat(timespec='minutes')} | {e.id} | {hasil} |\n")


def pasang_satu(e: Entri, skills_dir: Path | None = None, runner=subprocess.run, log: Path | None = None, cache: Path | None = None) -> dict:
    skills_dir, log, cache = skills_dir or SKILLS, log or LOG, cache or CACHE
    alasan = alasan_tidak_boleh(e)
    if alasan:
        return {"id": e.id, "status": "butuh_pemilik", "alasan": alasan}
    if sudah_terpasang(e, skills_dir):
        return {"id": e.id, "status": "sudah_ada"}
    try:
        if e.pasang["jenis"] == "git_subskill":
            ok = _pasang_subskill(e, skills_dir, runner, cache) and (sudah_terpasang(e, skills_dir) or not e.pasang.get("skills"))
        else:
            r = runner(perintah(e, skills_dir), capture_output=True, text=True, timeout=180)
            ok = r.returncode == 0 and sudah_terpasang(e, skills_dir)
    except (OSError, subprocess.TimeoutExpired) as x:
        ok, r = False, None
    _catat(log, e, "terpasang" if ok else "gagal")
    return {"id": e.id, "status": "terpasang" if ok else "gagal"}


def pasang_semua(katalog: list[Entri], skills_dir: Path | None = None, runner=subprocess.run, log: Path | None = None, cache: Path | None = None) -> dict:
    hasil = {"terpasang": [], "sudah_ada": [], "gagal": [], "butuh_pemilik": []}
    for e in katalog:
        if not e.otomatis:
            continue
        h = pasang_satu(e, skills_dir, runner, log, cache)
        hasil[h["status"]].append(e.id)
    return hasil


def pasang_untuk_agent(katalog: list[Entri], agent: str, skills_dir: Path | None = None, runner=subprocess.run,
                      log: Path | None = None, cache: Path | None = None) -> dict:
    """Pasang semua skill dasar milik satu agent (field `agent` di katalog) yang lolos aturan."""
    milik = [e for e in katalog if e.agent and (agent in e.agent or "semua" in e.agent)]
    hasil = {"terpasang": [], "sudah_ada": [], "gagal": [], "butuh_pemilik": []}
    for e in milik:
        if (e.pasang or {}).get("jenis") in ("plugin", "setup"):
            continue
        h = pasang_satu(e, skills_dir, runner, log, cache)
        hasil[h["status"]].append(e.id)
    return hasil


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--id")
    ap.add_argument("--agent")
    a = ap.parse_args()
    kat = muat(ROOT / "katalog/skill.yaml")
    if a.agent:
        print(json.dumps({k: v for k, v in pasang_untuk_agent(kat, a.agent).items() if v}, ensure_ascii=False))
    elif a.id:
        e = next((x for x in kat if x.id == a.id), None)
        print(json.dumps(pasang_satu(e) if e else {"id": a.id, "status": "butuh_pemilik", "alasan": "tidak ada di katalog"}, ensure_ascii=False))
    else:
        print(json.dumps(pasang_semua(kat), ensure_ascii=False))
