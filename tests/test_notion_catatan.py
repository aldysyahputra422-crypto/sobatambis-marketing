import json
from pathlib import Path

from scripts import notion_catatan, status


def _naskah(folder, sumber=None):
    (folder / "naskah.json").write_text(json.dumps({"episode": "ep01", "judul": "Rencana Sempurna", "disetujui": True,
                                                     "sumber_suara": sumber, "judul_berikut": "Ep.2", "beat": []}))


def test_tahap_berikutnya_dan_butuh_pemilik_saat_approval(tmp_path):
    _naskah(tmp_path)
    status.tandai(tmp_path, "naskah", "lulus")
    r = notion_catatan.ringkas(tmp_path)
    assert r["properti"]["Episode"] == "ep01 · Rencana Sempurna"
    assert r["properti"]["Tahap"] == "suara"
    assert r["properti"]["Status"] == "butuh persetujuan"
    assert "sumber suara" in r["properti"]["Butuh dari pemilik"].lower()


def test_rekam_ulang_menyebut_baris(tmp_path):
    _naskah(tmp_path, "manusia")
    status.tandai(tmp_path, "naskah", "lulus")
    status.tandai(tmp_path, "suara", "butuh_rekam_ulang", baris_tersisa=["t04.1", "t09.2"])
    r = notion_catatan.ringkas(tmp_path)
    assert r["properti"]["Status"] == "butuh rekam ulang"
    assert "t04.1" in r["properti"]["Butuh dari pemilik"] and "t09.2" in r["properti"]["Butuh dari pemilik"]
    assert r["properti"]["Sumber suara"] == "manusia"


def test_angka_qa_dari_file(tmp_path):
    _naskah(tmp_path, "manusia")
    for t in ("naskah", "suara", "dialog_ok", "adegan", "mix", "render_draf", "qa_gerak"):
        status.tandai(tmp_path, t, "lulus")
    status.tandai(tmp_path, "qa_gerak", "lulus", skor_median=4.27, skor_min=0.57)
    status.tandai(tmp_path, "mix", "lulus", lufs=-14.4, puncak_dbtp=-1.1)
    (tmp_path / "token.json").write_text(json.dumps({"per_model": {"total": {"output_tokens": 1234}}}))
    p = notion_catatan.ringkas(tmp_path)["properti"]
    assert p["Skor gerak (median)"] == 4.27 and p["LUFS"] == -14.4 and p["Token output"] == 1234
    assert p["Status"] == "berjalan" and p["Butuh dari pemilik"] == ""


def test_selesai_siap_posting(tmp_path):
    _naskah(tmp_path, "manusia")
    for t in status.TAHAP:
        status.tandai(tmp_path, t, "lulus")
    r = notion_catatan.ringkas(tmp_path)
    assert r["properti"]["Tahap"] == "selesai" and r["properti"]["Status"] == "siap posting"


def test_log_baris_untuk_halaman(tmp_path):
    _naskah(tmp_path)
    status.tandai(tmp_path, "naskah", "lulus")
    r = notion_catatan.ringkas(tmp_path)
    assert r["log"].startswith("20") and "naskah" in r["log"]
