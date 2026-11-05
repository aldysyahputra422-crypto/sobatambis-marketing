import json
from datetime import date

from scripts import jadwal_minggu, kapasitas


def _ep(root, nama, out, usage=None):
    f = root / "2026-W46" / nama
    f.mkdir(parents=True)
    tot = {"input_tokens": 50, "output_tokens": out, "cache_creation_input_tokens": 30000, "cache_read_input_tokens": 5_000_000}
    (f / "token.json").write_text(json.dumps({"per_model": {"total": tot}}))
    if usage:
        kapasitas.catat_usage(f, **usage)
    return f


def test_belum_diukur_tidak_mengarang_kapasitas(tmp_path):
    _ep(tmp_path, "ep01", 18000)
    h = kapasitas.hitung(tmp_path)
    assert h["episode_terukur"] == 1 and h["token_rata"]["output_tokens"] == 18000
    assert h["kapasitas_mingguan"] is None and "/usage" in h["cara_ukur"]


def test_kapasitas_dari_persen_usage(tmp_path):
    _ep(tmp_path, "ep01", 18000, {"jendela": "mingguan", "awal": 10, "akhir": 22})
    _ep(tmp_path, "ep02", 20000, {"jendela": "mingguan", "awal": 22, "akhir": 36})
    h = kapasitas.hitung(tmp_path, cadangan=15)
    assert h["persen_per_episode"]["mingguan"] == 13.0
    assert h["kapasitas_mingguan"] == 6          # floor(85 / 13)


def test_catat_usage_validasi(tmp_path):
    import pytest
    with pytest.raises(ValueError):
        kapasitas.catat_usage(tmp_path, jendela="mingguan", awal=30, akhir=20)
    with pytest.raises(ValueError):
        kapasitas.catat_usage(tmp_path, jendela="harian", awal=1, akhir=2)


def test_jadwal_tujuh_hari_semua_serial_bila_cukup():
    j = jadwal_minggu.susun("2026-W47", kapasitas_mingguan=8, ep_awal=2, target=7, jam="19:00", jeda_produksi=2)
    assert len(j["hari"]) == 7 and all(h["jenis"] == "serial" for h in j["hari"])
    assert j["hari"][0]["tayang"] == "2026-11-16T19:00:00+07:00"
    assert j["hari"][0]["produksi"] == "2026-11-14" and j["hari"][0]["episode"] == "ep02"
    assert j["hari"][6]["episode"] == "ep08" and j["peringatan"] == []


def test_jadwal_kurang_kapasitas_diisi_turunan_merata():
    j = jadwal_minggu.susun("2026-W47", kapasitas_mingguan=3, ep_awal=2, target=7)
    jenis = [h["jenis"] for h in j["hari"]]
    assert jenis.count("serial") == 3 and jenis.count("turunan") == 4
    assert jenis[0] == "serial" and jenis != ["serial"] * 3 + ["turunan"] * 4
    t = next(h for h in j["hari"] if h["jenis"] == "turunan")
    assert t["sumber_episode"] and t["folder"].startswith("videos/2026-W47/turunan-")


def test_jadwal_tanpa_ukuran_memberi_peringatan():
    j = jadwal_minggu.susun("2026-W47", kapasitas_mingguan=None, ep_awal=2, target=7)
    assert len([h for h in j["hari"] if h["jenis"] == "serial"]) == 7
    assert any("belum diukur" in p for p in j["peringatan"])


def test_baris_notion_jadwal():
    j = jadwal_minggu.susun("2026-W47", kapasitas_mingguan=7, ep_awal=2, target=7)
    j["hari"][0]["judul"] = "Grup Wali Murid"
    rows = jadwal_minggu.baris_notion(j)
    assert rows[0]["Episode"] == "ep02 · Grup Wali Murid" and rows[0]["Tahap"] == "rencana"
    assert rows[0]["Status"] == "direncanakan" and rows[0]["Jadwal tayang"] == "2026-11-16T19:00:00+07:00"
    assert rows[0]["Folder"] == "videos/2026-W47/ep02"


def test_ep_awal_melanjutkan_episode_yang_ada(tmp_path):
    (tmp_path / "2026-W46/ep01-v2").mkdir(parents=True)
    (tmp_path / "2026-W46/ep01").mkdir(parents=True)
    assert jadwal_minggu.ep_berikutnya(tmp_path) == 2
    assert jadwal_minggu.ep_berikutnya(tmp_path / "kosong") == 1


def test_saran_jalur_batas_menipis_senggang():
    j = jadwal_minggu.susun("2026-W47", kapasitas_mingguan=3, ep_awal=2, target=7)
    serial = [h for h in j["hari"] if h["jenis"] == "serial"]
    assert serial and all(h["saran_jalur"] == "senggang" and "menipis" in h["alasan_jalur"] for h in serial)
    assert all("saran_jalur" not in h for h in j["hari"] if h["jenis"] == "turunan")


def test_saran_jalur_cukup_atau_belum_diukur_otomatis():
    for kap in (8, None):
        j = jadwal_minggu.susun("2026-W47", kapasitas_mingguan=kap, ep_awal=2, target=7)
        assert all(h["saran_jalur"] == "otomatis" for h in j["hari"] if h["jenis"] == "serial")


def test_saran_jalur_pemilik_sibuk_otomatis_walau_menipis():
    j = jadwal_minggu.susun("2026-W47", kapasitas_mingguan=3, ep_awal=2, target=7, sibuk={"Senin"})
    senin = j["hari"][0]
    assert senin["jenis"] == "serial" and senin["saran_jalur"] == "otomatis" and "sibuk" in senin["alasan_jalur"]
    lain = [h for h in j["hari"] if h["jenis"] == "serial" and h["hari"] != "Senin"]
    assert all(h["saran_jalur"] == "senggang" for h in lain)


def test_saran_jalur_hanya_saran_tidak_mengubah_jumlah_episode():
    a = jadwal_minggu.susun("2026-W47", kapasitas_mingguan=3, ep_awal=2, target=7)
    b = jadwal_minggu.susun("2026-W47", kapasitas_mingguan=3, ep_awal=2, target=7, sibuk={"Senin", "Selasa"})
    assert [h["jenis"] for h in a["hari"]] == [h["jenis"] for h in b["hari"]]
