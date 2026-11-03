import json
import shutil
from pathlib import Path

import pytest

from scripts import status
from scripts.suara import dengar, produksi
from tests.suara_palsu import PenyediaPalsu

DATA = Path(__file__).parent / "data/naskah_ep01_contoh.json"


@pytest.fixture
def folder(tmp_path):
    shutil.copy(DATA, tmp_path / "naskah.json")
    return tmp_path


def _teks_per_wav(monkeypatch, folder, salah=False):
    n = json.loads((folder / "naskah.json").read_text())
    peta = {b["id"]: b["teks"] for b in n["baris"]}

    def palsu(wav):
        teks = "kucing makan ikan" if salah else peta[Path(wav).stem.split("_")[0]]
        return [{"kata": k, "mulai": i * 0.3, "selesai": i * 0.3 + 0.25} for i, k in enumerate(teks.split())]

    monkeypatch.setattr(dengar, "transkrip", palsu)


def test_jalur_normal_lulus(folder, monkeypatch):
    _teks_per_wav(monkeypatch, folder)
    assert produksi.jalankan(folder, PenyediaPalsu()) == "lulus"
    assert (folder / "suara.wav").exists() and (folder / "timing.json").exists()
    tr = json.loads((folder / "transkrip.json").read_text())
    tm = {t["id"]: t for t in json.loads((folder / "timing.json").read_text())}
    assert tr["b02"][0]["mulai"] >= tm["b02"]["mulai"]


def test_kredit_kurang_berhenti(folder, monkeypatch):
    _teks_per_wav(monkeypatch, folder)
    assert produksi.jalankan(folder, PenyediaPalsu(kredit=10)) == "butuh_persetujuan"
    st = status.baca(folder)["tahap"]["suara"]
    assert st["keadaan"] == "butuh_persetujuan" and len(st["baris_tersisa"]) == 12
    assert not (folder / "suara.wav").exists()
    assert produksi.kode_keluar("butuh_persetujuan") == 3


def test_edge_tanpa_persetujuan_berhenti(folder, monkeypatch):
    _teks_per_wav(monkeypatch, folder)
    p = PenyediaPalsu(); p.nama = "edge"
    assert produksi.jalankan(folder, p) == "butuh_persetujuan"
    assert p.panggilan == []


def test_rerun_tidak_rekam_ulang_baris_lulus(folder, monkeypatch):
    _teks_per_wav(monkeypatch, folder)
    status.tandai(folder, "suara", "butuh_persetujuan", baris_lulus=[])
    p1 = PenyediaPalsu()
    produksi.jalankan(folder, p1)
    data = status.baca(folder)
    data["tahap"]["suara"]["keadaan"] = "butuh_persetujuan"
    status.tulis(folder, data)
    p2 = PenyediaPalsu()
    assert produksi.jalankan(folder, p2) == "lulus"
    assert p2.panggilan == []


def test_rekam_ulang_maks_dua_kali(folder, monkeypatch):
    _teks_per_wav(monkeypatch, folder, salah=True)
    p = PenyediaPalsu()
    assert produksi.jalankan(folder, p, maks_ulang=2) == "gagal"
    assert p.panggilan.count("b01") == 3


def test_kode_keluar():
    assert [produksi.kode_keluar(k) for k in ("lulus", "gagal", "butuh_persetujuan")] == [0, 1, 3]


def test_edge_disetujui_emosi_kurang_jadi_peringatan(folder, monkeypatch):
    _teks_per_wav(monkeypatch, folder)
    monkeypatch.setattr(dengar, "cek_emosi", lambda uk, n: ["b06: nada puncak kurang tinggi"])
    p = PenyediaPalsu(); p.nama = "edge"
    assert produksi.jalankan(folder, p, setuju_edge_tts=True) == "lulus"
    assert status.baca(folder)["tahap"]["suara"]["peringatan"] == ["b06: nada puncak kurang tinggi"]


def test_elevenlabs_emosi_kurang_tetap_gagal(folder, monkeypatch):
    _teks_per_wav(monkeypatch, folder)
    monkeypatch.setattr(dengar, "cek_emosi", lambda uk, n: ["b06: nada puncak kurang tinggi"])
    p = PenyediaPalsu(); p.nama = "elevenlabs"
    assert produksi.jalankan(folder, p) == "gagal"
