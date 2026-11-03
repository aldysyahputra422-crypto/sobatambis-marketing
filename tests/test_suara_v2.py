import copy
import json
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

from scripts import status
from scripts.suara import lembar, manusia, v2

ROOT = Path(__file__).resolve().parents[1]
NASKAH = json.loads((ROOT / "tests/data/naskah2_contoh.json").read_text())
SR = 44100


def _folder(tmp_path, sumber="manusia"):
    n = copy.deepcopy(NASKAH)
    n["sumber_suara"] = sumber
    (tmp_path / "naskah.json").write_text(json.dumps(n))
    return tmp_path


def _baris(tokoh=None):
    return [(f"{b['id']}.{k}", d) for b in NASKAH["beat"] for k, d in enumerate(b["dialog"], 1) if tokoh in (None, d["penutur"])]


def _rekam(folder, tokoh, urutan, ulang_kali=1, buang=()):
    """Rekaman sintetis: setiap kata 0,3 dtk nada, jeda 0,6 dtk antarbaris; kembalikan kata palsu Whisper."""
    t, kata, x = 0.5, [], []
    for kunci, d in urutan:
        if kunci in buang:
            continue
        for _ in range(ulang_kali):
            for w in d["teks"].split():
                kata.append({"kata": w, "mulai": round(t, 3), "selesai": round(t + 0.3, 3)})
                t += 0.3
            t += 0.6
    n = int((t + 0.5) * SR)
    y = np.zeros(n)
    for k in kata:
        a, b = int(k["mulai"] * SR), int(k["selesai"] * SR)
        y[a:b] = 0.3 * np.sin(2 * np.pi * 220 * np.arange(b - a) / SR)
    (folder / "rekaman").mkdir(exist_ok=True)
    sf.write(folder / "rekaman" / f"{tokoh}.wav", y.astype(np.float32), SR)
    return kata


def _palsu(peta):
    def f(wav):
        for nama, kata in peta.items():
            if nama in Path(wav).name:
                return kata
        raise AssertionError(f"tak terduga {wav}")
    return f


def test_lembar_bernomor_per_tokoh(tmp_path):
    f = _folder(tmp_path)
    teks = lembar.tulis(f).read_text()
    assert "## Arta" in teks and "## Mbis" in teks
    assert "[t04.1] Arta · teriak · OKE. Aku belajar TUJUH jam!" in teks


def _semua(folder, buang=(), urut_arta=None, ulang=1):
    peta = {}
    for tokoh in ("arta", "ratna", "mbis"):
        b = _baris(tokoh)
        if tokoh == "arta" and urut_arta:
            b = urut_arta(b)
        peta[tokoh] = _rekam(folder, tokoh, b, ulang, buang)
    return peta


def test_manusia_potong_urutan_ditukar(tmp_path):
    f = _folder(tmp_path)
    peta = _semua(f, urut_arta=lambda b: list(reversed(b)))
    assert manusia.jalankan(f, transkrip_fn=_palsu(peta)) == "lulus"
    timing = json.loads((f / "timing.json").read_text())
    assert [t["id"] for t in timing] == [k for k, _ in _baris()]
    d = {t["id"]: t["selesai"] - t["mulai"] for t in timing}
    assert d["t04.1"] == pytest.approx(5 * 0.3 + 0.2, abs=0.05)


def test_manusia_baris_hilang_kode_5(tmp_path):
    f = _folder(tmp_path)
    peta = _semua(f, buang=("t06.2",))
    assert manusia.jalankan(f, transkrip_fn=_palsu(peta)) == "butuh_rekam_ulang"
    s = status.baca(f)["tahap"]["suara"]
    assert s["baris_tersisa"] == ["t06.2"]
    assert manusia.kode_keluar("butuh_rekam_ulang") == 5


def test_manusia_ulangan_pakai_terakhir(tmp_path):
    f = _folder(tmp_path)
    peta = _semua(f, ulang=2)
    assert manusia.jalankan(f, transkrip_fn=_palsu(peta)) == "lulus"
    det = status.baca(f)["tahap"]["suara"]["detail"]["t04.1"]
    kata_arta = [k for k in peta["arta"] if k["kata"] == "OKE."]
    assert det["mulai_rekaman"] == pytest.approx(kata_arta[-1]["mulai"] - 0.08, abs=0.01)


def test_rerun_lewati_lulus(tmp_path):
    f = _folder(tmp_path)
    peta = _semua(f)
    assert manusia.jalankan(f, transkrip_fn=_palsu(peta)) == "lulus"
    def jangan(_):
        raise AssertionError("tidak boleh transkrip ulang")
    assert manusia.jalankan(f, transkrip_fn=jangan) == "lulus"


def test_tata_letak_sama_dengan_timeline():
    from tests.test_adegan2 import susun
    durasi = {t["id"]: t["selesai"] - t["mulai"] for t in susun(NASKAH)[0]}
    assert [round(t["mulai"], 3) for t in v2.tata_letak(NASKAH, durasi)] == [t["mulai"] for t in susun(NASKAH)[0]]


class _Klien:
    def __init__(self, izin=True):
        self.panggil, self.izin = [], izin

    def sisa_kredit(self):
        return None

    def tts(self, voice_id, teks):
        if not self.izin:
            raise v2.IzinKurang("text_to_speech")
        self.panggil.append(("tts", teks))
        return teks

    def dialog(self, masukan):
        self.panggil.append(("dialog", [m["text"] for m in masukan]))
        return " | ".join(m["text"] for m in masukan)


def _ke_wav_palsu(isi, keluar):
    teks = [t for t in isi.split(" | ")]
    kata = sum(len(t.split()) for t in teks)
    sf.write(keluar, (0.2 * np.sin(np.arange(int((kata * 0.3 + 0.5) * SR)) / 10)).astype(np.float32), SR)
    return keluar


def _transkrip_dari_teks(peta):
    def f(wav):
        return peta[Path(wav).name]
    return f


def test_tag_dari_arah():
    assert v2.teks_kirim({"teks": "OKE.", "arah": "teriak kesal"}).startswith("[shouting]")
    assert v2.teks_kirim({"teks": "Hm.", "arah": "bisik kering"}).startswith("[whispers]")
    assert v2.teks_kirim({"teks": "Hm.", "arah": "datar"}) == "Hm."


def test_elevenlabs_dialog_mode_untuk_beat_multi(tmp_path, monkeypatch):
    f = _folder(tmp_path, "elevenlabs")
    k = _Klien()
    def transkrip(wav):
        # setiap klip/dialog dikenali sempurna: susun kata dari teks yang dikirim
        isi = Path(wav).with_suffix(".txt").read_text()
        t, out = 0.25, []
        for bagian in isi.split(" | "):
            for w in v2.buang_tag(bagian).split():
                out.append({"kata": w, "mulai": round(t, 3), "selesai": round(t + 0.3, 3)}); t += 0.3
            t += 0.1
        return out
    monkeypatch.setattr(v2, "_simpan_audio", lambda isi, keluar: (keluar.with_suffix(".txt").write_text(isi), _ke_wav_palsu(isi, keluar))[1])
    assert v2.jalankan(f, k, {"arta": "a", "ratna": "r", "mbis": "m"}, transkrip_fn=transkrip) == "lulus"
    jenis = [p[0] for p in k.panggil]
    assert "dialog" in jenis and "tts" in jenis
    assert (f / "dialog.wav").exists() and (f / "timing.json").exists()


def test_izin_kurang_kode_3(tmp_path):
    f = _folder(tmp_path, "elevenlabs")
    assert v2.jalankan(f, _Klien(izin=False), {"arta": "a", "ratna": "r", "mbis": "m"}, transkrip_fn=lambda w: []) == "butuh_persetujuan"
    assert v2.kode_keluar("butuh_persetujuan") == 3


class _R:
    def __init__(self, kode, isi=b"ID3", detail=None):
        self.status_code, self.content, self._d = kode, isi, {"detail": detail or {}}

    def json(self):
        return self._d

    def raise_for_status(self):
        if self.status_code >= 400:
            import requests
            raise requests.HTTPError(str(self.status_code))


def test_klien_dialog_memanggil_text_to_dialogue(monkeypatch):
    dipanggil = {}
    def post(url, **kw):
        dipanggil["url"], dipanggil["json"] = url, kw["json"]
        return _R(200)
    monkeypatch.setattr(v2.requests, "post", post)
    k = v2.KlienElevenLabsV2("kunci")
    assert k.dialog([{"text": "a", "voice_id": "x"}]) == b"ID3"
    assert dipanggil["url"].endswith("/text-to-dialogue") and dipanggil["json"]["model_id"] == "eleven_v3"


def test_klien_galat_izin_dan_kredit(monkeypatch):
    monkeypatch.setattr(v2.requests, "post", lambda url, **kw: _R(401, detail={"status": "missing_permissions"}))
    with pytest.raises(v2.IzinKurang):
        v2.KlienElevenLabsV2("k").tts("v", "a")
    monkeypatch.setattr(v2.requests, "post", lambda url, **kw: _R(402, detail={"status": "quota_exceeded"}))
    with pytest.raises(v2.KreditKurang):
        v2.KlienElevenLabsV2("k").dialog([{"text": "a", "voice_id": "x"}])


def test_produksi_tanpa_pilihan_suara_kode_4(tmp_path):
    from scripts.suara import produksi
    _folder(tmp_path, None)
    assert produksi.main([str(tmp_path)]) == 4


def test_produksi_elevenlabs_tanpa_voice_terpilih_kode_3(tmp_path, monkeypatch, capsys):
    from scripts.suara import produksi
    _folder(tmp_path, "elevenlabs")
    monkeypatch.setenv("ELEVENLABS_API_KEY", "kunci-palsu")
    def jangan(*a, **k):
        raise AssertionError("tidak boleh memanggil API")
    monkeypatch.setattr(v2.requests, "post", jangan)
    assert produksi.main([str(tmp_path)]) == 3
    assert "config/suara.yaml" in capsys.readouterr().out
