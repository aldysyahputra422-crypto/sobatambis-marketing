import json
from pathlib import Path

import jsonschema
import pytest

from scripts import waktu_kata

ROOT = Path(__file__).resolve().parents[1]
TRANSKRIP = {
    "b06": [{"kata": "Oke,", "mulai": 19.9, "selesai": 20.3}, {"kata": "aku", "mulai": 20.5, "selesai": 20.7},
            {"kata": "belajar", "mulai": 20.7, "selesai": 21.1}, {"kata": "7", "mulai": 21.2, "selesai": 21.6},
            {"kata": "jam.", "mulai": 21.6, "selesai": 22.0}],
}


def test_sisipkan_kata():
    a = {"jalur": {"sfx": [{"nama": "brak", "pada_kata": "TUJUH", "baris": "b06"}],
                   "kamera": [{"mulai_kata": "OKE", "baris": "b06", "selesai_kata": "jam", "jenis": "lebar"}]}}
    h = waktu_kata.sisipkan(a, TRANSKRIP)
    assert h["jalur"]["sfx"][0] == {"nama": "brak", "pada": 21.2}
    assert h["jalur"]["kamera"][0]["mulai"] == 19.9 and h["jalur"]["kamera"][0]["selesai"] == 22.0


def test_geser_ditambahkan():
    h = waktu_kata.sisipkan({"x": [{"pada_kata": "belajar", "baris": "b06", "geser": -0.1}]}, TRANSKRIP)
    assert h["x"][0]["pada"] == pytest.approx(20.6)


def test_kata_tidak_ada_error():
    with pytest.raises(waktu_kata.KataTidakAda, match="SEMBILAN di b06"):
        waktu_kata.sisipkan({"x": [{"pada_kata": "SEMBILAN", "baris": "b06"}]}, TRANSKRIP)


def test_sumber_contoh_valid_skema():
    sumber = json.loads((ROOT / "tests/data/adegan2_contoh.json").read_text())
    skema = json.loads((ROOT / "schemas/adegan2.schema.json").read_text())
    jsonschema.validate(sumber, skema)


def test_masuk_kata_untuk_properti():
    h = waktu_kata.sisipkan({"p": [{"id": "s", "masuk_kata": "TUJUH", "baris": "b06"}]}, TRANSKRIP)
    assert h["p"][0] == {"id": "s", "masuk": 21.2}
