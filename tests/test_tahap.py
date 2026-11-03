from scripts import status, tahap


def test_berikutnya_urut(tmp_path):
    assert tahap.berikutnya(tmp_path) == "naskah"
    status.tandai(tmp_path, "naskah", "lulus")
    assert tahap.berikutnya(tmp_path) == "suara"


def test_berikutnya_mencatat_waktu_mulai_sekali(tmp_path):
    tahap.berikutnya(tmp_path)
    awal = status.baca(tmp_path)["mulai"]
    tahap.berikutnya(tmp_path)
    assert status.baca(tmp_path)["mulai"] == awal


def test_ulang_mereset_tahap_sesudahnya(tmp_path):
    for t in ("naskah", "suara", "dialog_ok", "adegan", "render"):
        status.tandai(tmp_path, t, "lulus")
    tahap.ulang(tmp_path, "adegan")
    assert status.sudah_lulus(tmp_path, "suara")
    assert not status.sudah_lulus(tmp_path, "adegan") and not status.sudah_lulus(tmp_path, "render")
    assert tahap.berikutnya(tmp_path) == "adegan"


def test_semua_lulus_none(tmp_path):
    for t in status.TAHAP:
        status.tandai(tmp_path, t, "lulus")
    assert tahap.berikutnya(tmp_path) is None


def test_tahap_v2_berurutan():
    assert status.TAHAP == ("naskah", "suara", "dialog_ok", "adegan", "mix", "render_draf", "qa_gerak", "render", "qa_final", "kemasan", "video_ok", "gerbang")


# ---------- tahap jalan: semua tahap mekanis dalam satu panggilan ----------
import json

import pytest


def _siap(folder, sumber="manusia"):
    (folder / "naskah.json").write_text(json.dumps({"episode": "ep01", "judul": "x", "disetujui": True, "sumber_suara": sumber, "beat": []}))
    for t in ("naskah", "suara", "dialog_ok"):
        status.tandai(folder, t, "lulus")


def _palsu(jejak, gagal=None, gagal_kali=99):
    hit = {"n": 0}

    def buat(t):
        def f(folder):
            jejak.append(t)
            if t == gagal and hit["n"] < gagal_kali:
                hit["n"] += 1
                raise tahap.Gagal("skor gerak rendah 2.0-4.0", skor_median=0.8)
            return {"lufs": -14.0} if t == "mix" else {"skor_median": 4.2} if t == "qa_gerak" else {}
        return f
    return {t: buat(t) for t in tahap.MEKANIS}


def test_jalan_menjalankan_mekanis_dan_berhenti_di_kemasan(tmp_path):
    _siap(tmp_path)
    jejak = []
    h = tahap.jalan(tmp_path, langkah=_palsu(jejak))
    assert jejak == ["adegan", "mix", "render_draf", "qa_gerak", "render", "qa_final"]
    assert h["kode"] == 0 and h["berhenti_di"] == "kemasan" and "desainer-cover" in h["pegang"]
    st = status.baca(tmp_path)["tahap"]
    assert st["mix"]["lufs"] == -14.0 and st["qa_gerak"]["skor_median"] == 4.2


def test_jalan_berhenti_di_titik_persetujuan(tmp_path):
    (tmp_path / "naskah.json").write_text(json.dumps({"disetujui": True, "sumber_suara": "manusia", "beat": []}))
    status.tandai(tmp_path, "naskah", "lulus")
    status.tandai(tmp_path, "suara", "lulus")
    h = tahap.jalan(tmp_path, langkah=_palsu([]))
    assert h["berhenti_di"] == "dialog_ok" and "Approval 2" in h["pegang"]


def test_jalan_gagal_mencatat_dan_mengulang_render_sebelum_cek(tmp_path):
    _siap(tmp_path)
    jejak = []
    langkah = _palsu(jejak, gagal="qa_gerak", gagal_kali=1)
    h = tahap.jalan(tmp_path, langkah=langkah)
    assert h["kode"] == 1 and h["berhenti_di"] == "qa_gerak" and "animator" in h["perbaiki"]
    st = status.baca(tmp_path)["tahap"]["qa_gerak"]
    assert st["keadaan"] == "gagal" and st["percobaan"] == 1 and st["skor_median"] == 0.8
    jejak.clear()
    h = tahap.jalan(tmp_path, langkah=langkah)       # sesudah animator memperbaiki
    assert jejak[:2] == ["render_draf", "qa_gerak"] and h["berhenti_di"] == "kemasan"


def test_jalan_gagal_dua_kali_berhenti_untuk_pemilik(tmp_path):
    _siap(tmp_path)
    langkah = _palsu([], gagal="mix")
    tahap.jalan(tmp_path, langkah=langkah)
    h = tahap.jalan(tmp_path, langkah=langkah)
    assert h["kode"] == 1 and status.baca(tmp_path)["tahap"]["mix"]["percobaan"] == 2
    jejak = []
    h = tahap.jalan(tmp_path, langkah=_palsu(jejak, gagal="mix"))
    assert jejak == [] and "pemilik" in h["alasan"]


def test_jalan_tidak_memakai_elevenlabs_tanpa_izin(tmp_path, monkeypatch):
    monkeypatch.setattr(tahap, "IZIN_ELEVENLABS", tmp_path / "tidak-ada")
    (tmp_path / "naskah.json").write_text(json.dumps({"disetujui": True, "sumber_suara": "elevenlabs", "beat": []}))
    status.tandai(tmp_path, "naskah", "lulus")
    dipanggil = []
    monkeypatch.setattr("scripts.suara.produksi.main", lambda a: dipanggil.append(a) or 0)
    h = tahap.jalan(tmp_path)
    assert h["kode"] == 3 and dipanggil == [] and "izin" in h["alasan"]
    assert status.baca(tmp_path)["tahap"]["suara"]["keadaan"] == "butuh_persetujuan"
