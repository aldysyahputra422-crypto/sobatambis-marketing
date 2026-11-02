import json

from scripts import status


def test_status_lanjut(tmp_path):
    status.tandai(tmp_path, "suara", "lulus", baris_lulus=["b01"])
    assert status.sudah_lulus(tmp_path, "suara")
    assert not status.sudah_lulus(tmp_path, "adegan")
    assert status.baca(tmp_path)["tahap"]["suara"]["baris_lulus"] == ["b01"]


def test_status_kosong_bila_belum_ada(tmp_path):
    assert status.baca(tmp_path) == {"tahap": {}}


def test_tandai_tahap_tak_dikenal_ditolak(tmp_path):
    import pytest
    with pytest.raises(ValueError):
        status.tandai(tmp_path, "masak", "lulus")


def test_tulis_atomik_tanpa_sisa_tmp(tmp_path):
    status.tandai(tmp_path, "naskah", "berjalan")
    assert not list(tmp_path.glob("*.tmp"))
    json.loads((tmp_path / "status.json").read_text())
