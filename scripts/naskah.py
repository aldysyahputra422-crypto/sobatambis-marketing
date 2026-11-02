"""Muat naskah.json, validasi skema, dan periksa aturan cerita/emosi."""
import json
import re
import sys
from pathlib import Path

import jsonschema

SKEMA = json.loads((Path(__file__).resolve().parents[1] / "schemas/naskah.schema.json").read_text(encoding="utf-8"))
KATA_PER_DETIK = 2.6
JEDA_BAWAAN = 0.25
DILARANG_MBIS = re.compile(r"sobat\s*ambis|daftar|\brp\b", re.IGNORECASE)


class NaskahTidakValid(Exception):
    pass


def muat(path: Path) -> dict:
    try:
        n = json.loads(Path(path).read_text(encoding="utf-8"))
        jsonschema.validate(n, SKEMA)
    except (json.JSONDecodeError, jsonschema.ValidationError) as e:
        raise NaskahTidakValid(str(e).splitlines()[0]) from e
    return n


def perkiraan_durasi(baris: dict) -> float:
    return len(baris["teks"].split()) / KATA_PER_DETIK


def periksa_aturan(n: dict, durasi_per_baris: dict[str, float] | None = None) -> list[str]:
    baris = n["baris"]
    masalah: list[str] = []

    emosi = {b["emosi"] for b in baris}
    if len(emosi) < 4:
        masalah.append(f"minimal 4 emosi berbeda, baru {len(emosi)}")
    if not any(b["intensitas"] >= 8 for b in baris):
        masalah.append("butuh minimal satu puncak intensitas 8 ke atas")

    # Datar = emosi DAN intensitas sama berturut-turut lebih dari 10 detik.
    run, kunci_lalu, awal = 0.0, None, None
    for b in baris:
        dur = (durasi_per_baris or {}).get(b["id"], perkiraan_durasi(b)) + b.get("jeda_sesudah", JEDA_BAWAAN)
        kunci = (b["emosi"], b["intensitas"])
        if kunci == kunci_lalu:
            run += dur
        else:
            run, kunci_lalu, awal = dur, kunci, b["id"]
        if run > 10 and not any(m.startswith(f"datar lebih dari 10 detik mulai {awal}") for m in masalah):
            masalah.append(f"datar lebih dari 10 detik mulai {awal} ({kunci[0]} {kunci[1]})")

    mbis = [b for b in baris if b["penutur"] == "mbis"]
    if len(mbis) > 3:
        masalah.append(f"Mbis maksimal 3 baris, ada {len(mbis)}")
    for b in mbis:
        if DILARANG_MBIS.search(b["teks"]):
            masalah.append(f"{b['id']}: Mbis tidak boleh menyebut brand, daftar, atau harga")

    for b in baris:
        for medan in ("teks", "caption"):
            if "—" in b.get(medan, ""):
                masalah.append(f"{b['id']}: {medan} berisi tanda pisah panjang")
    return masalah


def _cli(argv: list[str]) -> int:
    if len(argv) != 2 or argv[0] != "periksa":
        print("pakai: python -m scripts.naskah periksa <folder-video>")
        return 2
    try:
        n = muat(Path(argv[1]) / "naskah.json")
    except (NaskahTidakValid, OSError) as e:
        print(f"naskah tidak valid: {e}")
        return 1
    masalah = periksa_aturan(n)
    for m in masalah:
        print(m)
    if masalah:
        return 1
    if not n.get("disetujui", False):
        print("naskah valid, menunggu persetujuan pemilik")
        return 4
    print("lulus")
    return 0


if __name__ == "__main__":
    sys.exit(_cli(sys.argv[1:]))
