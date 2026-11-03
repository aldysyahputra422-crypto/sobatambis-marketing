import subprocess
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

from scripts import aset, mix, musik_sintetis

SR = 44100


def _tulis(p: Path, x: np.ndarray) -> Path:
    sf.write(p, x.astype(np.float32), SR)
    return p


def _sinus(detik, f=220, amp=0.3):
    t = np.arange(int(detik * SR)) / SR
    return amp * np.sin(2 * np.pi * f * t)


def _db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def _dialog(total, rentang):
    x = np.zeros(int(total * SR))
    for a, b in rentang:
        x[int(a * SR):int(b * SR)] = _sinus(b - a, 300, 0.3)[: int(b * SR) - int(a * SR)]
    return x


def test_ducking_saat_dialog():
    g = mix.amplop_duck(_dialog(4, [(1.0, 2.0)]), SR)
    db = 20 * np.log10(g)
    assert db[int(1.5 * SR)] <= -12
    assert db[int(3.5 * SR)] > -1


def test_tidak_memompa_di_celah_pendek():
    g = 20 * np.log10(mix.amplop_duck(_dialog(4, [(1.0, 1.8), (2.0, 2.8)]), SR))
    celah = g[int(1.82 * SR):int(1.98 * SR)]
    assert celah.max() - celah.min() < 3


def _katalog(tmp_path, lisensi="milik-sendiri"):
    musik = _tulis(tmp_path / "m.wav", np.random.default_rng(0).normal(0, 0.1, 6 * SR))
    klik = np.zeros(int(0.2 * SR))
    klik[:400] = 0.8
    sfx = _tulis(tmp_path / "s.wav", klik)
    ent = {"lisensi": lisensi, "sumber": "uji"} if lisensi else {"sumber": "uji"}
    return {"m": {"file": str(musik), **ent}}, {"s": {"file": str(sfx), **ent}}


def test_aset_tanpa_lisensi_ditolak(tmp_path):
    km, ks = _katalog(tmp_path, lisensi=None)
    with pytest.raises(mix.AsetTanpaLisensi):
        mix.selesaikan({"musik": [{"trek": "m", "mulai": 0, "selesai": 2}], "sfx": []}, km, ks)


def test_sunyi_nol_dan_lufs(tmp_path):
    km, ks = _katalog(tmp_path)
    dialog = _tulis(tmp_path / "d.wav", _dialog(5, [(0.5, 1.5)]))
    jalur = mix.selesaikan({"musik": [{"trek": "m", "mulai": 0, "selesai": 5}], "sfx": []}, km, ks)
    keluar = tmp_path / "mix.wav"
    r = mix.campur(dialog, jalur["musik"], jalur["sfx"], keluar, sunyi=[(3.0, 4.0)])
    x, sr = sf.read(keluar)
    assert _db(x[int(3.1 * sr):int(3.9 * sr)]) < -60
    assert -15 <= r["lufs"] <= -13
    assert r["puncak_dbtp"] <= -0.9


def test_sfx_di_titik(tmp_path):
    km, ks = _katalog(tmp_path)
    dialog = _tulis(tmp_path / "d.wav", np.zeros(3 * SR))
    jalur = mix.selesaikan({"musik": [], "sfx": [{"nama": "s", "pada": 1.0}]}, km, ks)
    keluar = tmp_path / "mix.wav"
    mix.campur(dialog, jalur["musik"], jalur["sfx"], keluar, sunyi=[])
    x, sr = sf.read(keluar)
    onset = np.argmax(np.abs(x) > 0.05 * np.abs(x).max()) / sr
    assert abs(onset - 1.0) <= 1 / 30


class _KlienIzinKurang:
    def sfx(self, teks, durasi):
        raise aset.IzinKurang("sound_generation")

    def paket(self):
        return None


def test_izin_kurang_kode_3(tmp_path, capsys):
    kat = tmp_path / "k.yaml"
    kat.write_text("brak:\n  prompt: x\n  durasi: 0.5\n  file: brak.mp3\n  tag: [banting]\n")
    assert aset.main(["sfx", "--katalog", str(kat)], klien=_KlienIzinKurang()) == 3
    assert "izin" in capsys.readouterr().out.lower()


def test_musik_sintetis_durasi_dan_tidak_hening(tmp_path):
    p = musik_sintetis.buat("ceria_konyol", 8.0, 112, tmp_path / "c.wav")
    x, sr = sf.read(p)
    assert abs(len(x) / sr - 8.0) < 0.05
    assert _db(x) > -30


def test_sfx_pelan_dan_keras_setara(tmp_path):
    klik = np.zeros(int(0.2 * SR))
    klik[:400] = 1.0
    pelan = _tulis(tmp_path / "pelan.wav", klik * 0.05)
    keras = _tulis(tmp_path / "keras.wav", klik * 0.9)
    ks = {"pelan": {"file": str(pelan), "lisensi": "x"}, "keras": {"file": str(keras), "lisensi": "x"}}
    dialog = _tulis(tmp_path / "d.wav", np.zeros(3 * SR))
    jalur = mix.selesaikan({"musik": [], "sfx": [{"nama": "pelan", "pada": 0.5}, {"nama": "keras", "pada": 2.0}]}, {}, ks)
    keluar = tmp_path / "mix.wav"
    mix.campur(dialog, jalur["musik"], jalur["sfx"], keluar, sunyi=[])
    x, sr = sf.read(keluar)
    a = np.abs(x[int(0.5 * sr):int(0.7 * sr)]).max()
    b = np.abs(x[int(2.0 * sr):int(2.2 * sr)]).max()
    assert abs(20 * np.log10(a / b)) < 2


def test_path_relatif_ikut_folder_katalog(tmp_path):
    (tmp_path / "sfx").mkdir()
    _tulis(tmp_path / "sfx" / "k.wav", np.ones(100) * 0.1)
    ks = {"k": {"file": "k.wav", "lisensi": "x"}}
    j = mix.selesaikan({"musik": [], "sfx": [{"nama": "k", "pada": 0}]}, {}, ks, dasar_sfx=tmp_path / "sfx")
    assert j["sfx"][0]["file"] == tmp_path / "sfx" / "k.wav"


def test_musik_tema_mbis_ada(tmp_path):
    p = musik_sintetis.buat("tema_mbis", 6.0, 84, tmp_path / "m.wav")
    x, sr = sf.read(p)
    assert abs(len(x) / sr - 6.0) < 0.05 and _db(x) > -30


def test_tanpa_dialog_dengan_transien_tetap_sesuai_target(tmp_path):
    rng = np.random.default_rng(1)
    musik = _tulis(tmp_path / "m.wav", rng.normal(0, 0.03, 8 * SR))
    klik = np.zeros(int(0.3 * SR))
    klik[:600] = 1.0
    sfx = _tulis(tmp_path / "s.wav", klik)
    km, ks = {"m": {"file": str(musik), "lisensi": "x"}}, {"s": {"file": str(sfx), "lisensi": "x"}}
    dialog = _tulis(tmp_path / "d.wav", np.zeros(8 * SR))
    j = mix.selesaikan({"musik": [{"trek": "m", "mulai": 0, "selesai": 8}], "sfx": [{"nama": "s", "pada": t} for t in (1, 3, 5)]}, km, ks)
    r = mix.campur(dialog, j["musik"], j["sfx"], tmp_path / "mix.wav", sunyi=[])
    assert -15 <= r["lufs"] <= -13 and r["puncak_dbtp"] <= -0.9
