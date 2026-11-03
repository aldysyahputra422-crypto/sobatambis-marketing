"""Dengar ulang hasil suara: transkrip, cocokkan dengan naskah, ukur emosi."""
import re
from difflib import SequenceMatcher
from pathlib import Path
from statistics import mean, median

import numpy as np
import soundfile as sf

SATUAN = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"]
VARIAN = {
    "enggak": "nggak", "engga": "nggak", "ngga": "nggak", "gak": "nggak", "ga": "nggak", "nggak": "nggak",
    "ok": "oke", "okay": "oke", "okey": "oke", "hape": "hp", "loh": "lho", "lo": "lho",
}
_model = None


def angka_ke_kata(n: int) -> str:
    if n < 10:
        return SATUAN[n]
    if n == 10:
        return "sepuluh"
    if n == 11:
        return "sebelas"
    if n < 20:
        return f"{SATUAN[n - 10]} belas"
    if n < 100:
        p, s = divmod(n, 10)
        return f"{SATUAN[p]} puluh" + (f" {SATUAN[s]}" if s else "")
    if n < 1000:
        r, s = divmod(n, 100)
        depan = "seratus" if r == 1 else f"{SATUAN[r]} ratus"
        return depan + (f" {angka_ke_kata(s)}" if s else "")
    r, s = divmod(n, 1000)
    depan = "seribu" if r == 1 else f"{angka_ke_kata(r)} ribu"
    return depan + (f" {angka_ke_kata(s)}" if s else "")


def normalisasi(teks: str) -> list[str]:
    t = teks.lower().replace("try out", "tryout")
    t = re.sub(r"\d+", lambda m: f" {angka_ke_kata(int(m.group()))} ", t)
    t = re.sub(r"[^a-z\s]", " ", t)
    return [VARIAN.get(k, k) for k in t.split()]


def kecocokan(diharapkan: str, terdengar: str) -> float:
    # Dibandingkan per huruf tanpa spasi: Whisper sering memenggal kata berbeda ("HP-ku kutitipkan" -> "HP kuku titipkan").
    a, b = "".join(normalisasi(diharapkan)), "".join(normalisasi(terdengar))
    if not a and not b:
        return 1.0
    return SequenceMatcher(None, a, b, autojunk=False).ratio()


def _audio_16k(wav: Path) -> np.ndarray:
    """Baca audio sebagai float32 mono 16 kHz lewat ffmpeg (tidak bergantung API PyAV)."""
    import subprocess

    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(wav), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def transkrip(wav: Path) -> list[dict]:
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        _model = WhisperModel("small", device="cpu", compute_type="int8")
    segmen, _ = _model.transcribe(_audio_16k(wav), language="id", word_timestamps=True, beam_size=5)
    return [
        {"kata": w.word.strip(), "mulai": round(w.start, 3), "selesai": round(w.end, 3)}
        for s in segmen for w in (s.words or [])
    ]


def _pitch(frame: np.ndarray, sr: int) -> float | None:
    frame = frame - frame.mean()
    ac = np.correlate(frame, frame, mode="full")[len(frame) - 1:]
    lo, hi = int(sr / 500), int(sr / 70)
    if hi >= len(ac) or ac[0] <= 0:
        return None
    lag = lo + int(np.argmax(ac[lo:hi]))
    return sr / lag if ac[lag] / ac[0] > 0.3 else None


def ukur(wav: Path, jumlah_kata: int) -> dict:
    data, sr = sf.read(wav, dtype="float32", always_2d=True)
    x = data.mean(axis=1)
    durasi = len(x) / sr if len(x) else 0.0
    ukuran = int(0.04 * sr)
    frames = [x[i:i + ukuran] for i in range(0, len(x) - ukuran + 1, ukuran)]
    energi = [float(np.sqrt(np.mean(f ** 2))) for f in frames]
    batas = max(energi) * 0.1 if energi and max(energi) > 1e-4 else None
    bersuara = [f for f, e in zip(frames, energi) if batas and e >= batas]
    rms = float(np.sqrt(np.mean(np.concatenate(bersuara) ** 2))) if bersuara else 0.0
    nada = [p for p in (_pitch(f, sr) for f in bersuara) if p]
    return {
        "rms_db": round(20 * np.log10(rms), 2) if rms > 0 else -120.0,
        "pitch_hz": round(float(median(nada)), 1) if nada else None,
        "kata_per_detik": round(jumlah_kata / durasi, 3) if durasi else 0.0,
    }


def cek_emosi(ukuran: dict[str, dict], naskah: dict) -> list[str]:
    baris = [b for b in naskah["baris"] if b["id"] in ukuran]
    masalah: list[str] = []

    # Kekerasan marah dibandingkan dengan baris tenang penutur yang sama: tiap voice punya volume dasar berbeda.
    # Bila penutur itu tidak punya baris tenang, pakai semua baris tenang sebagai acuan.
    tenang_semua = [b for b in baris if b["emosi"] in ("tertekan", "lelah")]
    for marah_penutur in {b["penutur"] for b in baris if b["emosi"] == "marah"}:
        marah = [b for b in baris if b["emosi"] == "marah" and b["penutur"] == marah_penutur]
        tenang = [b for b in tenang_semua if b["penutur"] == marah_penutur] or tenang_semua
        if not tenang:
            continue
        acuan = mean(ukuran[b["id"]]["rms_db"] for b in tenang) + 4
        for b in marah:
            if ukuran[b["id"]]["rms_db"] < acuan:
                masalah.append(f"{b['id']}: marah kurang keras ({ukuran[b['id']]['rms_db']} dB, minimal {acuan:.1f} dB)")

    for penutur in {b["penutur"] for b in baris}:
        milik = [b for b in baris if b["penutur"] == penutur]
        nada = [ukuran[b["id"]]["pitch_hz"] for b in milik if ukuran[b["id"]]["pitch_hz"]]
        if len(nada) >= 3:
            tengah = median(nada)
            for b in milik:
                p = ukuran[b["id"]]["pitch_hz"]
                if b["intensitas"] >= 8 and b["emosi"] in ("marah", "semangat", "kaget") and p and p <= tengah:
                    masalah.append(f"{b['id']}: nada puncak kurang tinggi ({p} Hz, median {tengah} Hz)")
        lelah = [ukuran[b["id"]]["kata_per_detik"] for b in milik if b["emosi"] == "lelah"]
        semangat = [ukuran[b["id"]]["kata_per_detik"] for b in milik if b["emosi"] == "semangat"]
        if lelah and semangat and mean(lelah) >= mean(semangat):
            for b in milik:
                if b["emosi"] == "lelah":
                    masalah.append(f"{b['id']}: lelah kurang lambat ({ukuran[b['id']]['kata_per_detik']} kata/dtk)")
    return masalah
