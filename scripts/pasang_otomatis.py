"""Pasang skill dari katalog secara otomatis, dengan aturan ketat.

Boleh dipasang TANPA bertanya hanya bila semua benar:
  - butuh_key kosong dan biaya "gratis"
  - lisensi bebas komersial (MIT, Apache-2.0, BSD, ISC, LGPL)
  - status direkomendasikan atau opsional (bukan rujukan/sebagian/alternatif)
  - ukuran bukan GB dan tidak lebih dari 200 MB
  - punya cara pasang terstruktur (pasang.jenis git_skill atau npx_skill)
Selain itu: status "butuh_pemilik" + alasan (dicatat ke Notion lewat penjadwal-notion), tidak dipasang.

python -m scripts.pasang_otomatis            → pasang semua entri bertanda otomatis: true
python -m scripts.pasang_otomatis --id <id>  → pasang satu entri (dipakai pencari-skill)
"""
import argparse
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from scripts.katalog import Entri, muat

ROOT = Path(__file__).resolve().parents[1]
SKILLS = Path.home() / ".claude/skills"
LOG = ROOT / "katalog/terpasang.md"
LISENSI_BEBAS = ("mit", "apache-2.0", "bsd", "isc", "lgpl")
STATUS_BOLEH = ("direkomendasikan", "opsional")
MAKS_MB = 200


def _mb(ukuran: str) -> float:
    u = (ukuran or "").lower()
    if "gb" in u:
        return 10_000
    m = re.search(r"([\d.,]+)\s*mb", u)
    return float(m.group(1).replace(",", ".")) if m else 0


def alasan_tidak_boleh(e: Entri) -> str | None:
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
    if not e.pasang or e.pasang.get("jenis") not in ("git_skill", "npx_skill"):
        return "tidak ada cara pasang otomatis (plugin diatur lewat .claude/settings.json)"
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
    return any(Path(skills_dir).glob(f"{e.id}*/SKILL.md")) or any(Path(skills_dir).glob(f"*/{e.id}*/SKILL.md"))


def _catat(log: Path, e: Entri, hasil: str) -> None:
    log.parent.mkdir(parents=True, exist_ok=True)
    if not log.exists():
        log.write_text("# Skill terpasang otomatis\n\n| Waktu (UTC) | id | hasil |\n|---|---|---|\n", encoding="utf-8")
    with log.open("a", encoding="utf-8") as f:
        f.write(f"| {datetime.now(timezone.utc).isoformat(timespec='minutes')} | {e.id} | {hasil} |\n")


def pasang_satu(e: Entri, skills_dir: Path = SKILLS, runner=subprocess.run, log: Path = LOG) -> dict:
    alasan = alasan_tidak_boleh(e)
    if alasan:
        return {"id": e.id, "status": "butuh_pemilik", "alasan": alasan}
    if sudah_terpasang(e, skills_dir):
        return {"id": e.id, "status": "sudah_ada"}
    try:
        r = runner(perintah(e, skills_dir), capture_output=True, text=True, timeout=180)
        ok = r.returncode == 0 and sudah_terpasang(e, skills_dir)
    except (OSError, subprocess.TimeoutExpired) as x:
        ok, r = False, None
    _catat(log, e, "terpasang" if ok else "gagal")
    return {"id": e.id, "status": "terpasang" if ok else "gagal"}


def pasang_semua(katalog: list[Entri], skills_dir: Path = SKILLS, runner=subprocess.run, log: Path = LOG) -> dict:
    hasil = {"terpasang": [], "sudah_ada": [], "gagal": [], "butuh_pemilik": []}
    for e in katalog:
        if not e.otomatis:
            continue
        h = pasang_satu(e, skills_dir, runner, log)
        hasil[h["status"]].append(e.id)
    return hasil


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--id")
    a = ap.parse_args()
    kat = muat(ROOT / "katalog/skill.yaml")
    if a.id:
        e = next((x for x in kat if x.id == a.id), None)
        print(json.dumps(pasang_satu(e) if e else {"id": a.id, "status": "butuh_pemilik", "alasan": "tidak ada di katalog"}, ensure_ascii=False))
    else:
        print(json.dumps(pasang_semua(kat), ensure_ascii=False))
