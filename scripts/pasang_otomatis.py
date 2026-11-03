"""Pasang/ambil skill dan repo dari katalog secara otomatis, dengan aturan ketat.

Selalu ditolak (kapan pun): yang butuh API key atau berbiaya (berbayar = skip).
Mode kebijakan (config/kebijakan.yaml):
  - eksplorasi (bawaan, belum komersial): lisensi tidak membatasi
  - komersial: hanya lisensi bebas komersial (MIT, Apache-2.0, BSD, ISC, LGPL, Remotion License, GSAP Standard)
Saat "otomatis" (hook SessionStart, setiap sesi) ditambah: status direkomendasikan/opsional dan <= 200 MB.
Saat "diminta" (pencari-skill, --id, --wajib): ukuran dan status tidak membatasi.

Penguncian versi (supply chain): setiap pemasangan harus terkunci ke versi tertentu, supaya repo asli yang berubah
atau dibajak tidak ikut terpasang di komputermu: git_skill/git_subskill/rujukan memakai `pin` (SHA commit 40 huruf),
npm memakai versi tepat ("nama@1.2.3"), uv_tool memakai `sha256` berkas rilis. npx_skill tidak bisa dikunci sehingga
selalu ditolak. Hanya pemilik yang boleh melewati aturan ini dengan --izinkan-tak-terkunci (agent tidak boleh).
Kunci diperbarui dengan python -m scripts.kunci_versi (pemilik memutuskan setelah membaca perubahannya).

Jenis pasang: git_skill, git_subskill, npx_skill (→ ~/.claude/skills), npm (→ template/node_modules),
rujukan (git clone → rujukan/<id>, untuk dipelajari/dipakai agent), unduh (halaman web → rujukan/),
plugin dan setup (diatur .claude/settings.json dan scripts/setup.sh, bukan di sini).

python -m scripts.pasang_otomatis            → pasang semua entri otomatis: true (aturan "otomatis")
python -m scripts.pasang_otomatis --id <id>  → ambil satu entri (aturan "diminta")
python -m scripts.pasang_otomatis --agent <nama>  → pasang semua skill dasar milik satu agent
python -m scripts.pasang_otomatis --wajib    → ambil semua 13 repo wajib pemilik (kecuali berbayar)
"""
import argparse
import hashlib
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
UV_BIN = Path.home() / ".local/bin"  # tempat `uv tool install` menaruh perintah CLI
LISENSI_BEBAS = ("mit", "apache-2.0", "bsd", "isc", "lgpl", "remotion license", "gsap standard")
RUJUKAN = ROOT / "rujukan"
TEMPLATE = ROOT / "template"


def mode() -> str:
    try:
        import yaml
        return yaml.safe_load((ROOT / "config/kebijakan.yaml").read_text(encoding="utf-8")).get("mode", "komersial")
    except OSError:
        return "komersial"
CACHE = Path.home() / ".cache/sobatambis/repo"
STATUS_BOLEH = ("direkomendasikan", "opsional")
MAKS_MB = 200


def _mb(ukuran: str) -> float:
    u = (ukuran or "").lower()
    if "gb" in u:
        return 10_000
    m = re.search(r"([\d.,]+)\s*mb", u)
    return float(m.group(1).replace(",", ".")) if m else 0


SHA = re.compile(r"[0-9a-f]{40}")
VERSI_TEPAT = re.compile(r".+@\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$")


def alasan_belum_terkunci(e: Entri) -> str | None:
    p, jenis = e.pasang or {}, (e.pasang or {}).get("jenis")
    if jenis in ("git_skill", "git_subskill", "rujukan") and not SHA.fullmatch(str(p.get("pin", ""))):
        return f"belum dikunci ke commit: python -m scripts.kunci_versi --id {e.id}"
    if jenis == "npx_skill":
        return "npx menjalankan kode paket yang tidak bisa dikunci; hanya pemilik (--izinkan-tak-terkunci)"
    if jenis == "npm" and not all(VERSI_TEPAT.match(x) for x in p.get("paket", [])):
        return "versi npm belum tepat (tulis nama@1.2.3)"
    if jenis == "uv_tool" and not re.fullmatch(r"[0-9a-f]{64}", str(p.get("sha256", ""))):
        return "berkas rilis belum dikunci dengan sha256"
    return None


def alasan_tidak_boleh(e: Entri, saat: str = "otomatis", izin_tak_terkunci: bool = False) -> str | None:
    jenis = (e.pasang or {}).get("jenis")
    if jenis == "setup":
        return "sudah ditangani scripts/setup.sh (dependensi proyek)"
    if jenis == "plugin":
        return "plugin aktif lewat .claude/settings.json (scripts/aktifkan_otomatis.sh)"
    if e.butuh_key:
        return f"berbayar: butuh {e.butuh_key}"
    if (e.biaya or "").lower() != "gratis":
        return f"berbayar: {e.biaya}"
    if mode() == "komersial" and not (e.lisensi or "").lower().startswith(LISENSI_BEBAS):
        return f"lisensi {e.lisensi} tidak untuk komersial (mode komersial)"
    if saat == "otomatis":
        if e.status not in STATUS_BOLEH:
            return f"status {e.status}: hanya diambil saat diminta"
        if _mb(e.ukuran) > MAKS_MB:
            return f"ukuran {e.ukuran}: hanya diambil saat diminta"
    if not e.pasang or jenis not in ("git_skill", "git_subskill", "npx_skill", "npm", "rujukan", "unduh", "uv_tool"):
        return "tidak ada cara pasang otomatis; pasang manual hanya dengan izin pemilik"
    if not izin_tak_terkunci:
        return alasan_belum_terkunci(e)
    return None


def boleh_otomatis(e: Entri) -> bool:
    return alasan_tidak_boleh(e, saat="otomatis") is None


def perintah(e: Entri, skills_dir: Path = SKILLS) -> list[str]:
    j = e.pasang["jenis"]
    if j == "git_skill":
        return ["git", "clone", "--depth", "1", e.pasang["url"], str(Path(skills_dir) / e.id)]
    if j == "npx_skill":
        return ["npx", "--yes", "skills", "add", e.pasang["repo"], "-g", "-y"]
    raise ValueError(j)


def _nama_paket(p: str) -> str:
    """"three@0.178.0" → "three"; "@remotion/three@4.0.539" → "@remotion/three"."""
    return p.rsplit("@", 1)[0] if re.search(r"@\d", p) else p


def sudah_terpasang(e: Entri, skills_dir: Path = SKILLS) -> bool:
    jenis = (e.pasang or {}).get("jenis")
    if jenis == "npm":
        return all((TEMPLATE / "node_modules" / _nama_paket(p)).exists() for p in e.pasang["paket"])
    if jenis == "rujukan":
        return (RUJUKAN / e.id).is_dir() and any((RUJUKAN / e.id).iterdir())
    if jenis == "unduh":
        return (RUJUKAN / e.pasang["file"]).exists()
    if jenis == "uv_tool":
        return _cli(e) is not None
    if e.pasang and e.pasang.get("jenis") == "git_subskill":
        nama = e.pasang.get("skills") or [Path(x).name for x in e.pasang["paths"] if not x.endswith("*")]
        return bool(nama) and all((Path(skills_dir) / n / "SKILL.md").exists() for n in nama)
    return any(Path(skills_dir).glob(f"{e.id}*/SKILL.md")) or any(Path(skills_dir).glob(f"*/{e.id}*/SKILL.md"))


def _cli(e: Entri) -> str | None:
    nama = e.pasang["perintah"]
    lokal = UV_BIN / nama
    return shutil.which(nama) or (str(lokal) if lokal.exists() else None)


def _klon(runner, url: str, tujuan: Path, pin: str | None, induk: list[str] | None = None) -> bool:
    """git clone; bila ada `pin`: ambil persis commit itu lalu verifikasi hash HEAD sama dengan pin (bukan cabang terbaru)."""
    cmd = ["git", "clone", "--depth", "1"] + (["--filter=blob:none", "--sparse"] if induk else []) + (["--no-checkout"] if pin else []) + [url, str(tujuan)]
    if runner(cmd, capture_output=True, text=True, timeout=300).returncode != 0:
        return False
    if induk:
        runner(["git", "-C", str(tujuan), "sparse-checkout", "set", *induk], capture_output=True, text=True, timeout=300)
    if not pin:
        return True
    for langkah in (["fetch", "--depth", "1", "origin", pin], ["checkout", "-q", "--detach", "FETCH_HEAD"]):
        if runner(["git", "-C", str(tujuan), *langkah], capture_output=True, text=True, timeout=300).returncode != 0:
            return False
    r = runner(["git", "-C", str(tujuan), "rev-parse", "HEAD"], capture_output=True, text=True, timeout=60)
    return r.returncode == 0 and r.stdout.strip() == pin


def _pasang_uv(e: Entri, runner, cache: Path | None = None) -> bool:
    """Unduh berkas rilis, cocokkan sha256 dengan kunci, lalu `uv tool install <berkas lokal>` (bukan PyPI) dan perintah `setelah`."""
    cache = Path(cache or CACHE)
    cache.mkdir(parents=True, exist_ok=True)
    berkas = cache / f"{e.id}.zip"
    sha = e.pasang.get("sha256")
    if sha:
        r = runner(["curl", "-sSL", "-o", str(berkas), e.pasang["url"]], capture_output=True, text=True, timeout=600)
        if r.returncode != 0 or not berkas.exists() or hashlib.sha256(berkas.read_bytes()).hexdigest() != sha:
            berkas.unlink(missing_ok=True)
            return False
    r = runner(["uv", "tool", "install", str(berkas) if sha else e.pasang["url"]], capture_output=True, text=True, timeout=900)
    cli = _cli(e)
    if r.returncode != 0 or not cli:
        return False
    for args in e.pasang.get("setelah", []):
        r = runner([cli, *args], capture_output=True, text=True, timeout=600)
        if r.returncode != 0:
            return False
    return True


def _pasang_subskill(e: Entri, skills_dir: Path, runner, cache: Path) -> bool:
    """Sparse clone repo ke cache, lalu salin hanya folder skill terpilih (paths; 'x/*' = semua subfolder ber-SKILL.md)."""
    url = e.pasang["url"]
    tujuan = Path(cache) / re.sub(r"[^a-z0-9]+", "-", url.lower()).strip("-")
    if tujuan.exists():
        shutil.rmtree(tujuan)
    tujuan.parent.mkdir(parents=True, exist_ok=True)
    induk = sorted({p[:-2] if p.endswith("/*") else p for p in e.pasang["paths"]})
    if not _klon(runner, url, tujuan, e.pasang.get("pin"), induk):
        return False
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


def pasang_satu(e: Entri, skills_dir: Path | None = None, runner=subprocess.run, log: Path | None = None,
                cache: Path | None = None, saat: str = "diminta", izin_tak_terkunci: bool = False) -> dict:
    skills_dir, log, cache = skills_dir or SKILLS, log or LOG, cache or CACHE
    alasan = alasan_tidak_boleh(e, saat=saat, izin_tak_terkunci=izin_tak_terkunci)
    if alasan:
        return {"id": e.id, "status": "butuh_pemilik", "alasan": alasan}
    if sudah_terpasang(e, skills_dir):
        return {"id": e.id, "status": "sudah_ada"}
    try:
        jenis = e.pasang["jenis"]
        if jenis == "git_subskill":
            ok = _pasang_subskill(e, skills_dir, runner, cache) and (sudah_terpasang(e, skills_dir) or not e.pasang.get("skills"))
        elif jenis == "uv_tool":
            ok = _pasang_uv(e, runner, cache)
        elif jenis == "rujukan":
            RUJUKAN.mkdir(parents=True, exist_ok=True)
            ok = _klon(runner, e.pasang["url"], RUJUKAN / e.id, e.pasang.get("pin")) and sudah_terpasang(e, skills_dir)
        elif jenis == "git_skill":
            Path(skills_dir).mkdir(parents=True, exist_ok=True)
            ok = _klon(runner, e.pasang["url"], Path(skills_dir) / e.id, e.pasang.get("pin")) and sudah_terpasang(e, skills_dir)
        elif jenis in ("npm", "unduh"):
            if jenis == "npm":
                cmd = ["npm", "install", "--prefix", str(TEMPLATE), "--save-exact", *e.pasang["paket"]]
            else:
                cmd = ["curl", "-sSL", "-o", str(RUJUKAN / e.pasang["file"]), e.pasang["url"]]
            r = runner(cmd, capture_output=True, text=True, timeout=900)
            ok = r.returncode == 0 and sudah_terpasang(e, skills_dir)
        else:
            r = runner(perintah(e, skills_dir), capture_output=True, text=True, timeout=180)
            ok = r.returncode == 0 and sudah_terpasang(e, skills_dir)
    except (OSError, subprocess.TimeoutExpired) as x:
        ok, r = False, None
    _catat(log, e, "terpasang" if ok else "gagal")
    return {"id": e.id, "status": "terpasang" if ok else "gagal"}


def pasang_semua(katalog: list[Entri], skills_dir: Path | None = None, runner=subprocess.run, log: Path | None = None, cache: Path | None = None,
                 izin_tak_terkunci: bool = False) -> dict:
    hasil = {"terpasang": [], "sudah_ada": [], "gagal": [], "butuh_pemilik": []}
    for e in katalog:
        if not e.otomatis:
            continue
        h = pasang_satu(e, skills_dir, runner, log, cache, saat="otomatis", izin_tak_terkunci=izin_tak_terkunci)
        hasil[h["status"]].append(e.id)
    return hasil


def pasang_untuk_agent(katalog: list[Entri], agent: str, skills_dir: Path | None = None, runner=subprocess.run,
                      log: Path | None = None, cache: Path | None = None, izin_tak_terkunci: bool = False) -> dict:
    """Pasang semua skill dasar milik satu agent (field `agent` di katalog) yang lolos aturan."""
    milik = [e for e in katalog if e.agent and (agent in e.agent or "semua" in e.agent)]
    hasil = {"terpasang": [], "sudah_ada": [], "gagal": [], "butuh_pemilik": []}
    for e in milik:
        if (e.pasang or {}).get("jenis") in ("plugin", "setup"):
            continue
        h = pasang_satu(e, skills_dir, runner, log, cache, izin_tak_terkunci=izin_tak_terkunci)
        hasil[h["status"]].append(e.id)
    return hasil


def ambil_wajib(katalog: list[Entri], **kw) -> dict:
    """Ambil semua repo wajib pemilik (aturan "diminta"); plugin didaftarkan lewat settings, berbayar di-skip."""
    hasil = {"terpasang": [], "sudah_ada": [], "gagal": [], "butuh_pemilik": []}
    for e in katalog:
        if e.wajib and (e.pasang or {}).get("jenis") != "plugin":
            h = pasang_satu(e, saat="diminta", **kw)
            hasil[h["status"]].append(e.id if h["status"] != "butuh_pemilik" else f"{e.id} ({h['alasan']})")
    return hasil


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--id")
    ap.add_argument("--agent")
    ap.add_argument("--wajib", action="store_true")
    ap.add_argument("--izinkan-tak-terkunci", action="store_true", help="HANYA pemilik: lewati aturan penguncian versi")
    a = ap.parse_args()
    kat = muat(ROOT / "katalog/skill.yaml")
    iz = a.izinkan_tak_terkunci
    if a.wajib:
        print(json.dumps({k: v for k, v in ambil_wajib(kat, izin_tak_terkunci=iz).items() if v}, ensure_ascii=False))
    elif a.agent:
        print(json.dumps({k: v for k, v in pasang_untuk_agent(kat, a.agent, izin_tak_terkunci=iz).items() if v}, ensure_ascii=False))
    elif a.id:
        e = next((x for x in kat if x.id == a.id), None)
        print(json.dumps(pasang_satu(e, izin_tak_terkunci=iz) if e else {"id": a.id, "status": "butuh_pemilik", "alasan": "tidak ada di katalog"}, ensure_ascii=False))
    else:
        print(json.dumps(pasang_semua(kat, izin_tak_terkunci=iz), ensure_ascii=False))
