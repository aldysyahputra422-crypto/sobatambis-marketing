"""Gabungkan WAV per baris + jeda sunyi menjadi suara.wav dan timing.json."""
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 44100


def _baca_mono(path: Path) -> np.ndarray:
    data, sr = sf.read(path, dtype="float32", always_2d=True)
    if sr != SR:
        tmp = Path(tempfile.mkstemp(suffix=".wav")[1])
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-ar", str(SR), str(tmp)], check=True)
        data, sr = sf.read(tmp, dtype="float32", always_2d=True)
    return data.mean(axis=1)


def gabung(potongan: list[tuple[str, Path, float]], keluar: Path) -> list[dict]:
    keluar = Path(keluar)
    bagian, timing, pos = [], [], 0
    for id_, wav, jeda in potongan:
        suara = _baca_mono(wav)
        sunyi = np.zeros(int(round(jeda * SR)), dtype=np.float32)
        timing.append({
            "id": id_,
            "mulai": round(pos / SR, 3),
            "selesai": round((pos + len(suara)) / SR, 3),
            "akhir_jeda": round((pos + len(suara) + len(sunyi)) / SR, 3),
        })
        bagian += [suara, sunyi]
        pos += len(suara) + len(sunyi)
    sf.write(keluar, np.concatenate(bagian) if bagian else np.zeros(0, dtype=np.float32), SR)
    (keluar.parent / "timing.json").write_text(json.dumps(timing, indent=2), encoding="utf-8")
    return timing
