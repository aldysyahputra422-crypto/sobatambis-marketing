"""Kunci versi repo di katalog/skill.yaml ke commit tertentu (supply chain).

python -m scripts.kunci_versi                 → status kunci tiap entri
python -m scripts.kunci_versi --semua         → kunci entri yang BELUM terkunci ke HEAD sekarang
python -m scripts.kunci_versi --id <id>       → kunci atau perbarui satu entri ke HEAD sekarang
python -m scripts.kunci_versi --perbarui      → segarkan SEMUA pin ke HEAD sekarang (baca perubahan di repo asal dulu!)

HEAD dibaca dengan `git ls-remote`. Yang dikunci di sini hanya jenis git (git_skill, git_subskill, rujukan);
versi npm dan sha256 uv ditulis manual di katalog. Mengubah pin = memutuskan mempercayai kode baru: jalankan hanya oleh pemilik.
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

from scripts.katalog import muat

ROOT = Path(__file__).resolve().parents[1]
KATALOG = ROOT / "katalog/skill.yaml"
JENIS = ("git_skill", "git_subskill", "rujukan")
SHA = re.compile(r"[0-9a-f]{40}")


def head(url: str, runner=subprocess.run) -> str | None:
    r = runner(["git", "ls-remote", url, "HEAD"], capture_output=True, text=True, timeout=60)
    m = re.match(r"([0-9a-f]{40})\s+HEAD", r.stdout or "")
    return m.group(1) if r.returncode == 0 and m else None


def tulis_pin(teks: str, id_: str, sha: str) -> str:
    """Sisipkan atau ganti `pin: "<sha>"` pada baris `pasang: {...}` milik entri `id_`, tanpa mengubah bagian katalog lain."""
    baris = teks.split("\n")
    mulai = next((i for i, b in enumerate(baris) if b.strip() == f"- id: {id_}"), None)
    if mulai is None:
        raise KeyError(id_)
    for i in range(mulai + 1, len(baris)):
        if baris[i].startswith("- id: "):
            break
        if baris[i].lstrip().startswith("pasang:"):
            b = baris[i]
            if re.search(r'pin: "?[0-9a-f]{40}"?', b):
                baris[i] = re.sub(r'pin: "?[0-9a-f]{40}"?', f'pin: "{sha}"', b)
            else:
                baris[i] = re.sub(r"\}\s*$", f', pin: "{sha}"}}', b)
            return "\n".join(baris)
    raise KeyError(f"{id_}: tidak ada baris pasang")


def kunci(katalog_teks: str, entri, mode: str, runner=subprocess.run) -> tuple[str, list[tuple[str, str, str]]]:
    """mode: 'baru' (yang belum terkunci), 'semua' (perbarui semua). Mengembalikan teks baru dan daftar (id, lama, baru)."""
    perubahan = []
    for e in entri:
        p = e.pasang or {}
        if p.get("jenis") not in JENIS:
            continue
        lama = p.get("pin")
        if mode == "baru" and lama and SHA.fullmatch(str(lama)):
            continue
        sha = head(p["url"], runner)
        if sha is None:
            perubahan.append((e.id, str(lama or "-"), "GAGAL: repo tidak terjangkau"))
            continue
        if sha != lama:
            katalog_teks = tulis_pin(katalog_teks, e.id, sha)
        perubahan.append((e.id, str(lama or "-"), sha))
    return katalog_teks, perubahan


def status(entri) -> list[tuple[str, str]]:
    return [(e.id, "terkunci" if SHA.fullmatch(str((e.pasang or {}).get("pin", ""))) else "BELUM") for e in entri if (e.pasang or {}).get("jenis") in JENIS]


def main(argv: list[str], runner=subprocess.run, katalog: Path = KATALOG) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--semua", action="store_true")
    ap.add_argument("--perbarui", action="store_true")
    ap.add_argument("--id")
    a = ap.parse_args(argv)
    entri = muat(katalog)
    if not (a.semua or a.perbarui or a.id):
        for i, s in status(entri):
            print(f"{i:<26} {s}")
        return 1 if any(s == "BELUM" for _, s in status(entri)) else 0
    pilih = [e for e in entri if e.id == a.id] if a.id else entri
    if a.id and not pilih:
        print(f"{a.id}: tidak ada di katalog")
        return 2
    teks, ubah = kunci(katalog.read_text(encoding="utf-8"), pilih, "semua" if (a.perbarui or a.id) else "baru", runner)
    katalog.write_text(teks, encoding="utf-8")
    for i, lama, baru in ubah:
        print(f"{i:<26} {lama[:12]} → {baru[:12] if not baru.startswith('GAGAL') else baru}")
    return 1 if any(b.startswith("GAGAL") for _, _, b in ubah) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
