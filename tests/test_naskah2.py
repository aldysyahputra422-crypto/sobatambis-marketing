import copy
import json
from pathlib import Path

import pytest

from scripts import naskah

ROOT = Path(__file__).resolve().parents[1]
CONTOH = json.loads((ROOT / "tests/data/naskah2_contoh.json").read_text())


def _n():
    return copy.deepcopy(CONTOH)


def _tulis(tmp_path, n):
    p = tmp_path / "naskah.json"
    p.write_text(json.dumps(n, ensure_ascii=False))
    return p


def test_v2_contoh_lulus(tmp_path):
    n = naskah.muat(_tulis(tmp_path, _n()))
    assert naskah.periksa_beat(n) == []


def test_tanpa_hook():
    n = _n()
    n["beat"][0]["jenis"] = "lucu"
    assert any("hook" in m for m in naskah.periksa_beat(n))


def test_mengena_di_luar_rentang():
    n = _n()
    b = n["beat"]
    b.insert(1, b.pop(6))  # mengena dipindah ke depan
    m = [x for x in naskah.periksa_beat(n) if "mengena" in x]
    assert m and "%" in m[0]


def test_dua_mengena():
    n = _n()
    n["beat"][5]["jenis"] = "mengena"
    assert any("tepat satu" in m for m in naskah.periksa_beat(n))


def test_celah_tanpa_lucu():
    n = _n()
    for b in n["beat"][1:6]:
        b["jenis"] = "naik"
    assert any("8 detik" in m for m in naskah.periksa_beat(n))


def test_mbis_lebih_dari_3():
    n = _n()
    n["beat"][7]["dialog"] = [{"penutur": "mbis", "teks": "Meong.", "arah": "datar"}] * 4
    assert any("Mbis maksimal 3" in m for m in naskah.periksa_beat(n))


def test_mbis_kata_terlarang():
    n = _n()
    n["beat"][7]["dialog"][0]["teks"] = "Daftar Sobat Ambis sekarang."
    assert any("Mbis tidak boleh" in m for m in naskah.periksa_beat(n))


def test_aksi_penuh_kurang():
    n = _n()
    for b in n["beat"]:
        b["aksi"] = [a for a in b["aksi"] if a["aksi"] in ("menghela", "geleng", "muncul", "terduduk", "kaget")]
    assert any("aksi seluruh badan" in m for m in naskah.periksa_beat(n))


def test_tanda_pisah():
    n = _n()
    n["beat"][2]["dialog"][1]["teks"] = "Ini cuma HP — Ta."
    assert any("tanda pisah" in m for m in naskah.periksa_beat(n))


def test_beat_visual_tanpa_dialog_berdurasi():
    assert naskah.perkiraan_durasi_beat({"dialog": [], "durasi": 2.0}) == 2.0
    assert naskah.perkiraan_durasi_beat({"dialog": []}) == 1.5


def test_v1_tetap_valid(tmp_path):
    n = naskah.muat(ROOT / "tests/data/naskah_ep01_contoh.json")
    assert "baris" in n


def test_belum_disetujui_kode_4(tmp_path):
    n = _n()
    n["disetujui"] = False
    (tmp_path / "naskah.json").write_text(json.dumps(n))
    assert naskah.main(["periksa", str(tmp_path)]) == 4
