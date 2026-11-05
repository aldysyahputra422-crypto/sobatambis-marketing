"""Lembar tempel ElevenLabs per tokoh: hanya baris yang diucapkan, dengan tag audio, siap salin.

python -m scripts.senggang.lembar_tempel <folder>  → <folder>/lembar-elevenlabs.md
Aksi, SFX, narasi, dan arahan visual tidak ikut. Nomor baris = kunci daftar_dialog (sama dengan jalur rekaman manusia).
"""
import sys
from pathlib import Path

from scripts import naskah as naskah_mod
from scripts.senggang import tag as tag_mod
from scripts.suara.v2 import daftar_dialog

NAMA = {"arta": "Arta", "ratna": "Bu Ratna", "mbis": "Mbis", "bima": "Kak Bima"}


def _baris_tempel(d: dict) -> str:
    return f"{d['tag']} {d['teks']}" if d.get("tag") else d["teks"]


def tulis(folder: Path) -> Path:
    folder = Path(folder)
    n = naskah_mod.muat(folder / "naskah.json")
    kamus = tag_mod.muat()["tag"]
    per_tokoh: dict[str, list[tuple[str, dict]]] = {}
    for kunci, d, _ in daftar_dialog(n):
        per_tokoh.setdefault(d["penutur"], []).append((kunci, d))

    baris = [f"# Lembar tempel ElevenLabs {n['episode']}: {n['judul']}", "",
             "Satu tokoh = satu kali generate dengan voice tokoh itu. Salin seluruh blok, tempel ke Text to Speech (model Eleven v3),",
             "generate, unduh satu file, simpan sebagai `rekaman/<tokoh>.mp3` (mis. `rekaman/arta.mp3`), lalu kirim ke Claude.",
             "Biarkan baris kosong antarbaris. Satu baris salah? Generate hanya baris itu dan simpan sebagai `rekaman/ulang-<nomor>.mp3`, mis. `rekaman/ulang-t03.1.mp3`.",
             "Tag dalam kurung siku adalah arahan ElevenLabs, bukan teks ucapan. Aksi dan SFX tidak ada di sini (diurus animasi dan mix)."]
    dipakai: set[str] = set()
    for tokoh, isi in per_tokoh.items():
        baris += ["", f"## {NAMA[tokoh]}", "", "```text", "\n\n".join(_baris_tempel(d) for _, d in isi), "```", "", "Nomor baris, urut seperti blok di atas:", ""]
        baris += [f"{i}. {kunci}  {d['teks'][:48]}" for i, (kunci, d) in enumerate(isi, 1)]
        for _, d in isi:
            dipakai |= {x.strip() for x in d.get("arah", "").split(",") if x.strip()}
    belum = [(k, kamus[k]) for k in sorted(dipakai) if k in kamus and kamus[k]["terverifikasi"] == "belum"]
    if belum:
        baris += ["", "## Tag belum terverifikasi di episode ini", "",
                  "Dokumentasi ElevenLabs tidak memuat tag ini dan dukungan bahasa Indonesia belum diuji. Bila tidak berpengaruh, ganti dengan tag cadangan lalu generate ulang barisnya:", ""]
        baris += [f"- {k}: {t['elevenlabs']} → cadangan {t.get('cadangan', '-')}" for k, t in belum]
    p = folder / "lembar-elevenlabs.md"
    p.write_text("\n".join(baris) + "\n", encoding="utf-8")
    return p


if __name__ == "__main__":
    print(tulis(Path(sys.argv[1])))
