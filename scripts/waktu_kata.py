"""Ganti penanda kata (pada_kata, mulai_kata, selesai_kata) di adegan.sumber.json dengan detik dari transkrip.

Contoh: {"nama": "brak", "pada_kata": "TUJUH", "baris": "b06"} -> {"nama": "brak", "pada": 21.2}
"geser" (detik) ditambahkan ke setiap waktu hasil penanda di objek yang sama lalu dibuang.
"""
import json
import sys
from pathlib import Path

import jsonschema

from scripts.suara.dengar import normalisasi

ROOT = Path(__file__).resolve().parents[1]
PENANDA = {"pada_kata": ("pada", "mulai"), "mulai_kata": ("mulai", "mulai"), "selesai_kata": ("selesai", "selesai")}


class KataTidakAda(Exception):
    pass


def _cari(kata: str, baris: str, transkrip: dict) -> dict:
    target = "".join(normalisasi(kata))
    for k in transkrip.get(baris, []):
        if "".join(normalisasi(k["kata"])) == target:
            return k
    raise KataTidakAda(f"{kata} di {baris}")


def sisipkan(data, transkrip: dict):
    if isinstance(data, list):
        return [sisipkan(x, transkrip) for x in data]
    if not isinstance(data, dict):
        return data
    hasil = {k: sisipkan(v, transkrip) for k, v in data.items() if k not in PENANDA and k not in ("baris", "geser")}
    ada = [k for k in PENANDA if k in data]
    if not ada:
        if "baris" in data:
            hasil["baris"] = data["baris"]
        return hasil
    geser = data.get("geser", 0)
    for k in ada:
        kunci, sisi = PENANDA[k]
        hasil[kunci] = round(_cari(data[k], data["baris"], transkrip)[sisi] + geser, 3)
    return hasil


def jalankan(folder: Path) -> Path:
    folder = Path(folder)
    sumber = json.loads((folder / "adegan.sumber.json").read_text(encoding="utf-8"))
    transkrip = json.loads((folder / "transkrip.json").read_text(encoding="utf-8"))
    hasil = sisipkan(sumber, transkrip)
    jsonschema.validate(hasil, json.loads((ROOT / "schemas/adegan2.schema.json").read_text(encoding="utf-8")))
    keluar = folder / "adegan.json"
    keluar.write_text(json.dumps(hasil, ensure_ascii=False, indent=2), encoding="utf-8")
    return keluar


if __name__ == "__main__":
    try:
        print(jalankan(Path(sys.argv[1])))
    except KataTidakAda as e:
        print(f"kata tidak ditemukan di transkrip: {e}")
        sys.exit(1)
