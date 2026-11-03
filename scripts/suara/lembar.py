"""Lembar rekaman untuk jalur suara manusia: dialog bernomor per tokoh dengan arahan emosi.

python -m scripts.suara.lembar <folder>  → <folder>/lembar-rekaman.md
"""
import sys
from pathlib import Path

from scripts import naskah as naskah_mod
from scripts.suara.v2 import daftar_dialog

NAMA = {"arta": "Arta", "ratna": "Bu Ratna", "mbis": "Mbis", "bima": "Kak Bima"}


def tulis(folder: Path) -> Path:
    folder = Path(folder)
    n = naskah_mod.muat(folder / "naskah.json")
    per_tokoh: dict[str, list[str]] = {}
    for kunci, d, _ in daftar_dialog(n):
        per_tokoh.setdefault(d["penutur"], []).append(f"[{kunci}] {NAMA[d['penutur']].split()[-1]} · {d['arah']} · {d['teks']}")
    baris = [f"# Lembar rekaman {n['episode']}: {n['judul']}", "",
             "Rekam satu file per tokoh (voice note / m4a / wav) di folder `rekaman/` dengan nama tokoh, misalnya `rekaman/arta.m4a`.",
             "Ucapkan baris berurutan, beri jeda satu tarikan napas antarbaris. Salah ucap? Ulangi saja barisnya; yang terakhir dipakai.",
             "Rekam ulang satu baris: `rekaman/ulang-<nomor>.m4a`, misalnya `rekaman/ulang-t04.1.m4a`.", ""]
    for tokoh, isi in per_tokoh.items():
        baris += [f"## {NAMA[tokoh]}", "", *isi, ""]
    p = folder / "lembar-rekaman.md"
    p.write_text("\n".join(baris), encoding="utf-8")
    return p


if __name__ == "__main__":
    print(tulis(Path(sys.argv[1])))
