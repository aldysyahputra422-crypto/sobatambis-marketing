from scripts.suara import penyedia
from scripts.suara.penyedia import EdgeTTS, ElevenLabs, perlu_karakter


class _Resp:
    def __init__(self, data):
        self._d, self.status_code = data, 200

    def json(self):
        return self._d

    def raise_for_status(self):
        pass


def test_perlu_karakter_menghitung_tag():
    baris = [{"teks": "halo", "tag": "[excited]"}, {"teks": "dunia"}]
    assert perlu_karakter(baris) == len("[excited] halo") + len("dunia")


def test_elevenlabs_sisa_kredit(monkeypatch):
    monkeypatch.setattr(penyedia.requests, "get", lambda *a, **k: _Resp({"character_limit": 10000, "character_count": 9600}))
    assert ElevenLabs("kunci", {"arta": "v1"}).sisa_kredit() == 400


def test_elevenlabs_teks_memakai_tag():
    e = ElevenLabs("kunci", {"arta": "v1"})
    assert e.teks_kirim({"teks": "OKE.", "tag": "[shouting]"}) == "[shouting] OKE."


def test_edge_tts_sisa_kredit_none():
    assert EdgeTTS(penyedia.SUARA_EDGE_BAWAAN).sisa_kredit() is None


def test_edge_tts_membuang_tag():
    assert EdgeTTS(penyedia.SUARA_EDGE_BAWAAN).teks_kirim({"teks": "Halo", "tag": "[whispers]"}) == "Halo"


import pytest


@pytest.mark.lambat
def test_edge_tts_sungguhan(tmp_path):
    import soundfile as sf
    w = EdgeTTS(penyedia.SUARA_EDGE_BAWAAN).sintesis({"id": "b1", "penutur": "arta", "teks": "Halo, nama saya Arta."}, tmp_path / "b1.wav")
    data, sr = sf.read(w)
    assert sr == 44100 and len(data) / sr > 0.8


def _persen(s):
    return int(s.replace("%", "").replace("Hz", ""))


def test_edge_prosodi_marah_lebih_keras_dari_lelah():
    e = EdgeTTS(penyedia.SUARA_EDGE_BAWAAN)
    marah = e.prosodi({"penutur": "arta", "emosi": "marah"})
    lelah = e.prosodi({"penutur": "arta", "emosi": "lelah"})
    assert _persen(marah["volume"]) > _persen(lelah["volume"])
    assert _persen(lelah["rate"]) < _persen(marah["rate"])


def test_edge_prosodi_dikuatkan_saat_rekam_ulang():
    e = EdgeTTS(penyedia.SUARA_EDGE_BAWAAN)
    a = e.prosodi({"penutur": "arta", "emosi": "marah"})
    b = e.prosodi({"penutur": "arta", "emosi": "marah", "_kuat": 2})
    assert _persen(b["volume"]) > _persen(a["volume"])
