"""Mixing adegan: dialog + musik (ducking) + SFX → mix.wav pada −14 LUFS, puncak ≤ −1 dBTP.

CLI: python -m scripts.mix <folder>  (membaca adegan.json, dialog.wav, aset/*/katalog.yaml)
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
import yaml

ROOT = Path(__file__).resolve().parents[1]
SR = 44100
DUCK_DB = -14.0
ATTACK, RELEASE, GABUNG = 0.060, 0.300, 0.250
MUSIK_DB = -8.0  # level musik (belum di-duck) relatif RMS dialog
SFX_DB = -6.0
FADE = 0.3


class AsetTanpaLisensi(Exception):
    pass


def _baca(p: Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def amplop_duck(dialog: np.ndarray, sr: int = SR) -> np.ndarray:
    """Gain linear per sampel untuk musik: −14 dB saat ada dialog. Celah < 250 ms digabung (tidak memompa)."""
    hop = int(0.010 * sr)
    n = int(np.ceil(len(dialog) / hop))
    pad = np.zeros(n * hop)
    pad[: len(dialog)] = dialog
    rms = np.sqrt((pad.reshape(n, hop) ** 2).mean(axis=1))
    bicara = rms > 10 ** (-40 / 20)
    # gabungkan celah pendek
    idx = np.flatnonzero(bicara)
    if len(idx):
        celah = np.diff(idx)
        for a, c in zip(idx[:-1], celah):
            if 1 < c <= GABUNG / 0.010:
                bicara[a:a + c] = True
    target = np.where(bicara, DUCK_DB, 0.0)
    g = np.zeros(n)
    a_att = 1 - np.exp(-0.010 / ATTACK)
    a_rel = 1 - np.exp(-0.010 / RELEASE)
    cur = 0.0
    for i, t in enumerate(target):
        cur += (t - cur) * (a_att if t < cur else a_rel)
        g[i] = cur
    per_sampel = np.interp(np.arange(len(dialog)) / hop, np.arange(n), g)
    return 10 ** (per_sampel / 20)


def selesaikan(jalur: dict, katalog_musik: dict, katalog_sfx: dict, dasar_musik: Path = ROOT, dasar_sfx: Path = ROOT / "aset/sfx") -> dict:
    """Ubah nama aset di jalur menjadi path file; tolak aset tanpa lisensi. Path relatif ikut folder dasar katalognya."""
    def ambil(kat, nama, jenis, dasar):
        e = kat.get(nama)
        if e is None:
            raise KeyError(f"{jenis} '{nama}' tidak ada di katalog")
        if not e.get("lisensi"):
            raise AsetTanpaLisensi(f"{jenis} '{nama}' tidak punya catatan lisensi")
        f = Path(e["file"])
        return f if f.is_absolute() else dasar / f

    musik = [dict(m, file=ambil(katalog_musik, m["trek"], "musik", dasar_musik)) for m in jalur.get("musik", [])]
    sfx = [dict(s, file=ambil(katalog_sfx, s["nama"], "sfx", dasar_sfx)) for s in jalur.get("sfx", [])]
    return {"musik": musik, "sfx": sfx}


def _ukur(p: Path) -> tuple[float, float]:
    err = subprocess.run(["ffmpeg", "-v", "info", "-nostats", "-i", str(p), "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    blok = err[err.rfind("Summary:"):]
    lufs = float(re.search(r"I:\s+(-?[\d.]+) LUFS", blok).group(1))
    tp = float(re.search(r"Peak:\s+(-?[\d.inf]+) dBFS", blok).group(1))
    return lufs, tp


def _normalisasi(x: np.ndarray, keluar: Path) -> None:
    """Gain ke −14 LUFS lalu limiter puncak; diulang sampai LUFS −14 ±0,5 dan true peak ≤ −1 dBTP.
    Gain statis (bukan loudnorm dinamis) supaya bagian sunyi tetap sunyi."""
    with tempfile.TemporaryDirectory() as d:
        kini = Path(d) / "0.wav"
        sf.write(kini, x.astype(np.float32), SR)
        batas = 10 ** (-1.6 / 20)
        for i in range(4):
            lufs, tp = _ukur(kini)
            if abs(lufs + 14) <= 0.5 and tp <= -1.0:
                break
            berikut = Path(d) / f"{i + 1}.wav"
            gain = -14.0 - lufs
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(kini), "-af",
                            f"volume={gain:.2f}dB,alimiter=limit={batas:.4f}:attack=1:release=60:level=disabled",
                            "-ar", str(SR), str(berikut)], check=True)
            kini = berikut
            batas *= 10 ** (-0.3 / 20)
        shutil.copy(kini, keluar)


def campur(dialog: Path, jalur_musik: list[dict], jalur_sfx: list[dict], keluar: Path, sunyi: list[tuple[float, float]]) -> dict:
    d = _baca(dialog)
    n = len(d)
    musik = np.zeros(n)
    for m in jalur_musik:
        trek = _baca(Path(m["file"]))
        a, b = int(m["mulai"] * SR), min(n, int(m["selesai"] * SR))
        if b <= a:
            continue
        ulang = np.tile(trek, int(np.ceil((b - a) / len(trek))) + 1)[: b - a]
        f = min(int(FADE * SR), (b - a) // 2)
        env = np.ones(b - a)
        env[:f] = np.linspace(0, 1, f)
        env[-f:] = np.linspace(1, 0, f)
        musik[a:b] += ulang * env
    if np.any(musik):
        # musik (belum di-duck) 8 dB di bawah RMS dialog saat bicara; tanpa dialog, acuan 0,1 (−20 dBFS)
        aktif = d[np.abs(d) > 1e-4]
        acuan = np.sqrt(np.mean(aktif ** 2)) if len(aktif) else 0.1
        isi = musik[np.abs(musik) > 1e-6]
        musik *= acuan * 10 ** (MUSIK_DB / 20) / (np.sqrt(np.mean(isi ** 2)) + 1e-12)
    musik *= amplop_duck(d)
    for a0, b0 in sunyi:
        a, b = int(a0 * SR), min(n, int(b0 * SR))
        f = int(0.05 * SR)
        musik[max(0, a - f):a] *= np.linspace(1, 0, a - max(0, a - f))
        musik[a:b] = 0
        musik[b:b + f] *= np.linspace(0, 1, len(musik[b:b + f]))
    efek = np.zeros(n)
    for s in jalur_sfx:
        x = _baca(Path(s["file"]))
        x = x / (np.abs(x).max() + 1e-9) * 10 ** ((SFX_DB + s.get("volume_db", 0)) / 20)  # puncak setara antar SFX
        a = int(s["pada"] * SR)
        b = min(n, a + len(x))
        efek[a:b] += x[: b - a]
    _normalisasi(d + musik + efek, keluar)
    lufs, tp = _ukur(keluar)
    return {"lufs": lufs, "puncak_dbtp": tp}


def jalankan(folder: Path) -> dict:
    folder = Path(folder)
    adegan = json.loads((folder / "adegan.json").read_text(encoding="utf-8"))
    km = yaml.safe_load((ROOT / "aset/musik/katalog.yaml").read_text(encoding="utf-8"))
    ks = yaml.safe_load((ROOT / "aset/sfx/katalog.yaml").read_text(encoding="utf-8"))
    j = selesaikan(adegan["jalur"], km, ks)
    sunyi = [(s["mulai"], s["selesai"]) for s in adegan["jalur"].get("sunyi", [])]
    return campur(folder / "dialog.wav", j["musik"], j["sfx"], folder / "mix.wav", sunyi)


if __name__ == "__main__":
    try:
        r = jalankan(Path(sys.argv[1]))
    except AsetTanpaLisensi as e:
        print(f"ditolak: {e}")
        sys.exit(1)
    print(json.dumps(r))
