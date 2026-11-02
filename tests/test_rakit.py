import json

import numpy as np
import soundfile as sf

from scripts.suara.rakit import gabung
from tests.suara_palsu import SR, PenyediaPalsu


def _potongan(tmp_path, jeda):
    p = PenyediaPalsu()
    hasil = []
    for i, (teks, j) in enumerate(zip(["satu dua", "tiga empat lima", "enam"], jeda)):
        w = p.sintesis({"id": f"b{i}", "teks": teks}, tmp_path / f"b{i}.wav")
        hasil.append((f"b{i}", w, j))
    return hasil


def test_gabung_durasi_sesuai_timing(tmp_path):
    timing = gabung(_potongan(tmp_path, [0.3, 0.5, 0.2]), tmp_path / "suara.wav")
    data, sr = sf.read(tmp_path / "suara.wav")
    assert sr == SR
    assert abs(len(data) / SR - timing[-1]["akhir_jeda"]) < 0.01
    assert json.loads((tmp_path / "timing.json").read_text()) == timing


def test_jeda_benar_benar_sunyi(tmp_path):
    timing = gabung(_potongan(tmp_path, [0.5, 0.5, 0.0]), tmp_path / "suara.wav")
    data, _ = sf.read(tmp_path / "suara.wav")
    a, b = int(timing[0]["selesai"] * SR) + 2, int(timing[1]["mulai"] * SR) - 2
    assert b > a and np.all(data[a:b] == 0)


def test_jeda_terakhir_tetap_ditulis(tmp_path):
    timing = gabung(_potongan(tmp_path, [0.0, 0.0, 1.0]), tmp_path / "suara.wav")
    data, _ = sf.read(tmp_path / "suara.wav")
    assert timing[-1]["akhir_jeda"] - timing[-1]["selesai"] == 1.0
    assert abs(len(data) / SR - timing[-1]["akhir_jeda"]) < 0.01
