import math

import pytest
import soundfile as sf

from scripts.suara import dengar
from tests.suara_palsu import SR, sinus


def test_normalisasi_angka_dan_varian():
    assert dengar.normalisasi("Lima puluh delapan, enggak!") == dengar.normalisasi("58 nggak")


def test_normalisasi_tanda_hubung_dan_tryout():
    assert dengar.normalisasi("HP-ku, try out") == ["hp", "ku", "tryout"]


def test_kecocokan_sempurna_dan_rendah():
    assert dengar.kecocokan("Aku belajar tujuh jam!", "aku belajar 7 jam") == 1.0
    assert dengar.kecocokan("Aku belajar tujuh jam", "kucing makan ikan") < 0.5


def test_ukur_sinus_220hz(tmp_path):
    sf.write(tmp_path / "a.wav", sinus(1.0, 220, 0.3), SR)
    u = dengar.ukur(tmp_path / "a.wav", jumlah_kata=3)
    assert abs(u["pitch_hz"] - 220) < 5
    assert abs(u["rms_db"] - 20 * math.log10(0.3 / math.sqrt(2))) < 0.5
    assert abs(u["kata_per_detik"] - 3.0) < 0.05


def test_ukur_sunyi_pitch_none(tmp_path):
    sf.write(tmp_path / "s.wav", sinus(0.5, 220, 0.0), SR)
    assert dengar.ukur(tmp_path / "s.wav", jumlah_kata=1)["pitch_hz"] is None


def _n(baris):
    return {"baris": [{"id": i, "penutur": "arta", "emosi": e, "intensitas": s} for i, e, s in baris]}


def test_cek_emosi_marah_kurang_keras():
    n = _n([("b1", "marah", 9), ("b2", "lelah", 3)])
    uk = {"b1": {"rms_db": -20, "pitch_hz": 300, "kata_per_detik": 3}, "b2": {"rms_db": -22, "pitch_hz": 200, "kata_per_detik": 1.5}}
    assert any(m.startswith("b1:") and "marah kurang keras" in m for m in dengar.cek_emosi(uk, n))


def test_cek_emosi_puncak_kurang_tinggi():
    n = _n([("b1", "semangat", 9), ("b2", "datar", 5), ("b3", "datar", 5)])
    uk = {"b1": {"rms_db": -15, "pitch_hz": 180, "kata_per_detik": 3}, "b2": {"rms_db": -15, "pitch_hz": 220, "kata_per_detik": 3}, "b3": {"rms_db": -15, "pitch_hz": 220, "kata_per_detik": 3}}
    assert any(m.startswith("b1:") and "nada puncak" in m for m in dengar.cek_emosi(uk, n))


def test_cek_emosi_lelah_kurang_lambat():
    n = _n([("b1", "semangat", 7), ("b2", "lelah", 3)])
    uk = {"b1": {"rms_db": -15, "pitch_hz": 250, "kata_per_detik": 2.0}, "b2": {"rms_db": -20, "pitch_hz": 200, "kata_per_detik": 2.5}}
    assert any(m.startswith("b2:") and "lelah kurang lambat" in m for m in dengar.cek_emosi(uk, n))


@pytest.mark.lambat
def test_whisper_sungguhan_mengenali_bahasa_indonesia(tmp_path):
    from scripts.suara.penyedia import SUARA_EDGE_BAWAAN, EdgeTTS
    w = EdgeTTS(SUARA_EDGE_BAWAAN).sintesis({"id": "b1", "penutur": "arta", "teks": "Hari pertama. Aku bikin rencana."}, tmp_path / "b1.wav")
    kata = dengar.transkrip(w)
    assert dengar.kecocokan("Hari pertama. Aku bikin rencana.", " ".join(k["kata"] for k in kata)) >= 0.8
    assert all(k["selesai"] >= k["mulai"] for k in kata)


def test_kecocokan_tahan_pemenggalan_kata_whisper():
    naskah = "Bangun jam empat! Belajar lima jam sehari! HP-ku kutitipkan ke Mama!"
    assert dengar.kecocokan(naskah, "bangun jam 4 belajar 5 jam sehari hape kuku titipkan ke mama") >= 0.97


def test_kecocokan_tetap_menangkap_kata_salah():
    assert dengar.kecocokan("Aku belajar tujuh jam", "Aku belajar tiga jam") < 0.97


def test_kecocokan_sapaan_pendek_dan_lho_lolos_ambang():
    from scripts.suara.produksi import AMBANG
    naskah = "Ta... anaknya Bu Sinta sekarang les di tiga tempat, lho."
    assert dengar.kecocokan(naskah, "Teya, anaknya Businta sekarang les di tiga tempat, Loh.") >= AMBANG


def test_kata_salah_di_kalimat_panjang_tetap_gagal_ambang():
    from scripts.suara.produksi import AMBANG
    naskah = "Hari kedua belas. Nilai tryout pertamaku keluar."
    assert dengar.kecocokan(naskah, "Hari kedua puluh. Nilai tryout pertamaku keluar.") < AMBANG
