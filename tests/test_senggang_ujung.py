"""Ujung ke ujung jalur senggang tanpa layanan berbayar: tempelan ChatGPT → naskah.json → lembar tempel → audio palsu → dialog.wav."""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

from scripts import naskah as naskah_mod
from scripts import status
from scripts.senggang import impor, lembar_tempel
from scripts.suara import dengar, produksi
from scripts.suara.v2 import daftar_dialog
from tests.suara_palsu import PenyediaPalsu

ROOT = Path(__file__).resolve().parents[1]
TEMPELAN = (ROOT / "tests/data/tempelan_chatgpt.txt").read_text(encoding="utf-8")
SR = 44100


def _audio_per_tokoh(folder: Path, n: dict):
    """Mirip hasil ElevenLabs: SATU file panjang per tokoh, baris berurutan dengan jeda; kembalikan transkrip palsu per tokoh."""
    palsu = PenyediaPalsu()
    (folder / "rekaman").mkdir(exist_ok=True)
    transkrip = {}
    for tokoh in sorted({d["penutur"] for _, d, _ in daftar_dialog(n)}):
        potong, kata, t = [np.zeros(int(0.5 * SR), dtype=np.float32)], [], 0.5
        for kunci, d, b in daftar_dialog(n):
            if d["penutur"] != tokoh:
                continue
            wav = palsu.sintesis({"id": kunci, "teks": d["teks"], "emosi": b["emosi"], "intensitas": b["intensitas"]}, folder / f"_{kunci}.wav")
            y, _ = sf.read(wav, dtype="float32")
            w = d["teks"].split()
            for i, kt in enumerate(w):  # tag ElevenLabs tidak diucapkan, jadi tidak ada di transkrip
                kata.append({"kata": kt, "mulai": round(t + i * len(y) / SR / len(w), 3), "selesai": round(t + (i + 0.9) * len(y) / SR / len(w), 3)})
            potong += [y, np.zeros(int(0.7 * SR), dtype=np.float32)]
            t += len(y) / SR + 0.7
            wav.unlink()
        sf.write(folder / "rekaman" / f"{tokoh}.wav", np.concatenate(potong), SR)
        transkrip[tokoh] = kata
    # Mbis datang sebagai mp3 seperti unduhan ElevenLabs
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(folder / "rekaman/mbis.wav"), str(folder / "rekaman/mbis.mp3")], check=True)
    (folder / "rekaman/mbis.wav").unlink()
    return transkrip


def test_ujung_ke_ujung_tanpa_layanan_berbayar(tmp_path, monkeypatch):
    folder = tmp_path / "ep02"
    folder.mkdir()
    (folder / "tempelan.txt").write_text(TEMPELAN, encoding="utf-8")

    assert impor.main([str(folder)]) == 0
    n = naskah_mod.muat(folder / "naskah.json")
    assert naskah_mod.periksa_beat(n) == [] and n["jalur"] == "senggang" and n["sumber_suara"] == "manual"
    assert not n["disetujui"]

    lembar = lembar_tempel.tulis(folder).read_text(encoding="utf-8")
    assert "[tense] [slowly] Tiba-tiba" in lembar and "[aksi" not in lembar

    n["disetujui"] = True  # Approval 1 milik pemilik
    (folder / "naskah.json").write_text(json.dumps(n, ensure_ascii=False))
    transkrip = _audio_per_tokoh(folder, n)

    def palsu(wav):
        nama = Path(wav).name
        for tokoh, kata in transkrip.items():
            if tokoh in nama:
                return kata
        raise AssertionError(f"tak terduga {wav}")

    monkeypatch.setattr(dengar, "transkrip", palsu)
    assert produksi.main([str(folder)]) == 0
    dialog, sr = sf.read(folder / "dialog.wav")
    jumlah = len(daftar_dialog(n))
    assert len(dialog) / sr > jumlah * 0.5
    st = status.baca(folder)["tahap"]["suara"]
    assert st["keadaan"] == "lulus" and st["penyedia"] == "manusia" and len(st["detail"]) == jumlah


def test_baris_hilang_di_audio_minta_ulang_dengan_nomor(tmp_path, monkeypatch):
    folder = tmp_path / "ep02"
    folder.mkdir()
    (folder / "tempelan.txt").write_text(TEMPELAN, encoding="utf-8")
    impor.main([str(folder)])
    n = naskah_mod.muat(folder / "naskah.json")
    transkrip = _audio_per_tokoh(folder, n)
    transkrip["arta"] = [k for k in transkrip["arta"] if k["kata"] not in ("kasirnya", "hidup?")]  # satu baris tidak terbaca
    monkeypatch.setattr(dengar, "transkrip", lambda wav: next(k for t, k in transkrip.items() if t in Path(wav).name))
    assert produksi.main([str(folder)]) == 5
    assert "t01.1" in status.baca(folder)["tahap"]["suara"]["baris_tersisa"]
