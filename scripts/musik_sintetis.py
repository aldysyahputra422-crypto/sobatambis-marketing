"""Trek musik sementara buatan sendiri (numpy), lisensi jelas milik sendiri.

Dipakai sampai trek ElevenLabs Music / berlisensi tersedia (paket berbayar).
python -m scripts.musik_sintetis  → aset/musik/ceria_konyol.mp3, aset/musik/tegang_naik.mp3
"""
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
SR = 44100
rng = np.random.default_rng(7)


def _hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def _nada(f: float, dur: float, jenis: str) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    if jenis == "marimba":
        x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 40)
        return x * np.exp(-t * 9)
    if jenis == "pizz":
        x = np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + np.sin(2 * np.pi * f * t)
        return x * np.exp(-t * 18) * 0.6
    if jenis == "bas":
        return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 6)
    if jenis == "timpani":
        fx = f * (1 + 0.15 * np.exp(-t * 30))
        return np.sin(2 * np.pi * np.cumsum(fx) / SR) * np.exp(-t * 5)
    if jenis == "celesta":
        x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * 3.01 * f * t)
        return x * np.exp(-t * 3.5)
    if jenis == "pad":
        lfo = 1 + 0.004 * np.sin(2 * np.pi * 0.5 * t)
        x = sum(np.sin(2 * np.pi * f * k * lfo * t) / k for k in (1, 2, 3))
        a = np.minimum(1, t / 0.6) * np.minimum(1, (t[-1] - t + 1e-3) / 0.6)
        return x * a * 0.5
    if jenis == "shaker":
        return rng.normal(0, 1, len(t)) * np.exp(-t * 70) * 0.25
    if jenis == "tepuk":
        return rng.normal(0, 1, len(t)) * np.exp(-t * 35) * 0.5
    raise ValueError(jenis)


def _taruh(buf: np.ndarray, x: np.ndarray, detik: float, gain: float) -> None:
    a = int(detik * SR)
    if a >= len(buf):
        return
    b = min(len(buf), a + len(x))
    buf[a:b] += gain * x[: b - a]


def _ceria(detik: float, bpm: int) -> np.ndarray:
    buf = np.zeros(int(detik * SR))
    ketuk = 60 / bpm
    melodi = [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 83, 79, 74, 71]  # C mayor, lompat-lompat
    bas = [48, 55, 50, 55, 53, 57, 55, 50]
    n = int(detik / (ketuk / 2))
    for i in range(n):
        t = i * ketuk / 2
        _taruh(buf, _nada(_hz(melodi[i % len(melodi)]), 0.35, "marimba"), t, 0.32 if i % 2 == 0 else 0.22)
        _taruh(buf, _nada(0, 0.08, "shaker"), t + ketuk / 4, 0.6)
        if i % 2 == 0:
            _taruh(buf, _nada(_hz(bas[(i // 2) % len(bas)]), 0.3, "bas"), t, 0.35)
        if i % 4 == 2:
            _taruh(buf, _nada(0, 0.12, "tepuk"), t, 0.35)
    return buf


def _tegang(detik: float, bpm: int) -> np.ndarray:
    buf = np.zeros(int(detik * SR))
    ketuk = 60 / bpm
    pola = [62, 62, 65, 62, 69, 62, 65, 62]  # D minor, ostinato pizzicato
    n = int(detik / (ketuk / 4))
    for i in range(n):
        t = i * ketuk / 4
        naik = (t / detik)  # crescendo dan naik setengah nada tiap 2 birama
        geser = int(t / (ketuk * 8))
        _taruh(buf, _nada(_hz(pola[i % 8] + geser), 0.18, "pizz"), t, 0.12 + 0.18 * naik)
        if i % 4 == 0:
            _taruh(buf, _nada(_hz(38 + geser), 0.6, "timpani"), t, 0.25 + 0.35 * naik)
        if i % 16 == 12:
            _taruh(buf, _nada(_hz(50 + geser), 0.25, "bas"), t, 0.3)
    return buf


def _tema_mbis(detik: float, bpm: int) -> np.ndarray:
    """Tema Mbis: hangat dan misterius, arpeggio celesta di atas pad F mayor7."""
    buf = np.zeros(int(detik * SR))
    ketuk = 60 / bpm
    arpeggio = [65, 69, 72, 76, 74, 72, 69, 72]  # F A C E D C A C
    akor = [[53, 57, 60, 64], [50, 53, 57, 60]]  # Fmaj7, Dm7
    for i in range(int(detik / (ketuk / 2))):
        t = i * ketuk / 2
        _taruh(buf, _nada(_hz(arpeggio[i % 8] + (12 if i % 16 >= 12 else 0)), 1.2, "celesta"), t, 0.22)
    birama = ketuk * 4
    for j in range(int(np.ceil(detik / birama))):
        for m in akor[j % 2]:
            _taruh(buf, _nada(_hz(m), birama + 0.3, "pad"), j * birama, 0.08)
    return buf


RESEP = {"ceria_konyol": _ceria, "tegang_naik": _tegang, "tema_mbis": _tema_mbis}


def buat(nama: str, detik: float, bpm: int, keluar: Path) -> Path:
    x = RESEP[nama](detik, bpm)
    x = x / (np.abs(x).max() + 1e-9) * 0.8
    f = int(0.02 * SR)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    keluar = Path(keluar)
    if keluar.suffix == ".wav":
        sf.write(keluar, x.astype(np.float32), SR)
    else:
        with tempfile.TemporaryDirectory() as d:
            w = Path(d) / "t.wav"
            sf.write(w, x.astype(np.float32), SR)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(w), "-b:a", "160k", str(keluar)], check=True)
    return keluar


if __name__ == "__main__":
    folder = ROOT / "aset/musik"
    folder.mkdir(parents=True, exist_ok=True)
    print(buat("ceria_konyol", 17.14, 112, folder / "ceria_konyol.mp3"))
    print(buat("tegang_naik", 15.0, 128, folder / "tegang_naik.mp3"))
    print(buat("tema_mbis", 11.43, 84, folder / "tema_mbis.mp3"))
    sys.exit(0)
