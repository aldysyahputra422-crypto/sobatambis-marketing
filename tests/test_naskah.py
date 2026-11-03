import copy
import json
import subprocess
import sys
from pathlib import Path

import pytest

from scripts.naskah import NaskahTidakValid, muat, periksa_aturan

DATA = Path(__file__).parent / "data/naskah_ep01_contoh.json"


def _n():
    return json.loads(DATA.read_text(encoding="utf-8"))


def _tulis(tmp_path, n):
    p = tmp_path / "naskah.json"
    p.write_text(json.dumps(n, ensure_ascii=False), encoding="utf-8")
    return p


def test_contoh_ep01_lulus():
    assert periksa_aturan(muat(DATA)) == []


def test_skema_menolak_emosi_tak_dikenal(tmp_path):
    n = _n(); n["baris"][0]["emosi"] = "galau"
    with pytest.raises(NaskahTidakValid):
        muat(_tulis(tmp_path, n))


def test_kurang_dari_4_emosi():
    n = _n()
    for b in n["baris"]:
        b["emosi"] = "semangat" if b["emosi"] not in ("marah",) else "marah"
    assert any("minimal 4 emosi" in m for m in periksa_aturan(n))


def test_tanpa_puncak():
    n = _n()
    for b in n["baris"]:
        b["intensitas"] = min(b["intensitas"], 7)
    assert any("puncak intensitas" in m for m in periksa_aturan(n))


def test_datar_lebih_10_detik():
    n = _n()
    tambahan = [dict(copy.deepcopy(n["baris"][6]), id=f"x{i}") for i in range(5)]
    n["baris"][6:6] = tambahan
    assert any("datar" in m for m in periksa_aturan(n, {b["id"]: 3.0 for b in n["baris"]}))


def test_mbis_4_baris():
    n = _n()
    for i in range(3):
        n["baris"].append(dict(copy.deepcopy(n["baris"][10]), id=f"m{i}"))
    assert any("Mbis maksimal 3" in m for m in periksa_aturan(n))


def test_mbis_sebut_brand():
    n = _n(); n["baris"][10]["teks"] = "Ta, daftar Sobat Ambis aja."
    assert any("Mbis tidak boleh" in m for m in periksa_aturan(n))


def test_tanda_pisah_panjang():
    n = _n(); n["baris"][0]["teks"] = "Hari pertama — rencana sempurna."
    assert any("tanda pisah" in m for m in periksa_aturan(n))


def test_cli_belum_disetujui_kode_4(tmp_path):
    n = _n(); n["disetujui"] = False
    _tulis(tmp_path, n)
    r = subprocess.run([sys.executable, "-m", "scripts.naskah", "periksa", str(tmp_path)], capture_output=True)
    assert r.returncode == 4


def test_cli_lulus_kode_0(tmp_path):
    _tulis(tmp_path, _n())
    r = subprocess.run([sys.executable, "-m", "scripts.naskah", "periksa", str(tmp_path)], capture_output=True)
    assert r.returncode == 0
