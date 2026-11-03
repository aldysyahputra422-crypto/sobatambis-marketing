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


def test_tandai_ulang_keadaan_sama_tanpa_info_tidak_menghapus_detail(tmp_path):
    # Pilot Ep.1: direktur menandai 'suara' lulus setelah produksi.py, dan detail baris yang lulus ikut terhapus.
    status.tandai(tmp_path, "suara", "lulus", detail={"b01": {"wav": "suara_baris/b01_0.wav"}}, rekam_ulang=0)
    status.tandai(tmp_path, "suara", "lulus")
    s = status.baca(tmp_path)["tahap"]["suara"]
    assert s["detail"] == {"b01": {"wav": "suara_baris/b01_0.wav"}} and s["rekam_ulang"] == 0


def test_tandai_keadaan_berbeda_tetap_mengganti_info(tmp_path):
    status.tandai(tmp_path, "render", "gagal", alasan="ffmpeg error")
    status.tandai(tmp_path, "render", "lulus")
    assert "alasan" not in status.baca(tmp_path)["tahap"]["render"]
