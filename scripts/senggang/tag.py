"""Kosakata tag ekspresi jalur senggang: baca config/tag_ekspresi.yaml, uraikan tag di satu baris dialog.

Deterministik, tanpa LLM. Tag yang tidak dikenal ditolak, tidak ditebak.
"""
import functools
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
BERKAS = ROOT / "config/tag_ekspresi.yaml"
AWALAN_NON_SUARA = ("aksi", "sfx", "narasi")


class TagTidakDikenal(ValueError):
    pass


@functools.lru_cache(maxsize=None)
def _muat(path: str) -> dict:
    return yaml.safe_load(Path(path).read_text(encoding="utf-8"))


def muat(path: Path = BERKAS) -> dict:
    return _muat(str(path))


def nama_tag(kamus: dict | None = None) -> list[str]:
    return sorted((kamus or muat())["tag"])


def uraikan(isi: str, kamus: dict | None = None) -> dict:
    """'tense, slowly' → emosi, intensitas, ekspresi, arah, dan tag audio ElevenLabs.

    Tag suara pertama menentukan emosi dan ekspresi; pengubah menggeser intensitas.
    """
    kamus = kamus or muat()
    bagian = [p.strip().lower() for p in re.split(r"[,;]", isi) if p.strip()]
    if not bagian:
        raise TagTidakDikenal("kurung siku kosong")
    tak_dikenal = [p for p in bagian if p not in kamus["tag"]]
    if tak_dikenal:
        raise TagTidakDikenal(f"tag tidak dikenal: {', '.join(tak_dikenal)}. Tag yang dikenal: {', '.join(nama_tag(kamus))}")
    suara = [kamus["tag"][p] for p in bagian if kamus["tag"][p]["jenis"] == "suara"]
    if not suara:
        raise TagTidakDikenal(f"butuh minimal satu tag emosi (bukan hanya pengubah): {', '.join(bagian)}")
    delta = sum(kamus["tag"][p]["delta"] for p in bagian if kamus["tag"][p]["jenis"] == "pengubah")
    return {
        "emosi": suara[0]["emosi"],
        "intensitas": max(1, min(10, suara[0]["intensitas"] + delta)),
        "ekspresi": suara[0]["ekspresi"],
        "arah": ", ".join(bagian),
        "tag_audio": " ".join(kamus["tag"][p]["elevenlabs"] for p in bagian),
    }


@functools.lru_cache(maxsize=None)
def aksi_tokoh() -> dict[str, set[str]]:
    """Nama aksi per tokoh, dibaca dari pustaka aksi di template (sumber yang sama dengan animasi)."""
    hasil = {}
    for tokoh in ("arta", "ratna", "mbis"):
        f = ROOT / f"template/src/aksi/{tokoh}.ts"
        hasil[tokoh] = set(re.findall(r'nama:\s*"(\w+)"', f.read_text(encoding="utf-8")))
    return hasil


def aksi_penuh() -> set[str]:
    from scripts import naskah
    return naskah.aksi_penuh()


def ekspresi_rig() -> dict[str, set[str]]:
    kode = (ROOT / "template/src/sistem/gambar.ts").read_text(encoding="utf-8")
    awal = kode.index("function eyesInner")
    return {"orang": set(re.findall(r"case '(\w+)'", kode[awal:awal + 4000])), "mbis": {"senang", "intip", "datar", "tutup"}}
