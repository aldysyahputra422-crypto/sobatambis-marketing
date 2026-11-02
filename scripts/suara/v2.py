"""Suara naskah beat (v2): tata letak dialog bersama, perakitan, dan jalur ElevenLabs (dialog per beat).

Tata letak HARUS sama dengan scripts/adegan2.py: beat visual = jeda `durasi`, beat dialog diawali 0,25 dtk
(+1,5 dtk sunyi untuk beat mengena), antar-dialog 0,3 dtk.
"""
import json
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import requests
import soundfile as sf

from scripts import naskah as naskah_mod
from scripts import status
from scripts.suara import dengar

SR = 44100
LEAD, JEDA, MENGENA = 0.25, 0.3, 1.5
AMBANG = 0.95
POTONG_AWAL, POTONG_AKHIR = 0.08, 0.12
TAG = [("teriak", "[shouting]"), ("bisik", "[whispers]"), ("ragu", "[hesitant]"), ("capek", "[tired]"),
       ("kaget", "[gasps]"), ("tertawa", "[laughs]"), ("semangat", "[excited]"), ("kesal", "[frustrated]"), ("pecah", "[quietly]")]


class IzinKurang(Exception):
    pass


class KreditKurang(Exception):
    pass


API = "https://api.elevenlabs.io/v1"


class KlienElevenLabsV2:
    def __init__(self, kunci: str, model: str = "eleven_v3"):
        self.h, self.model = {"xi-api-key": kunci}, model

    def _cek(self, r):
        if r.status_code in (401, 402, 429):
            try:
                d = r.json().get("detail", {})
            except ValueError:
                d = {}
            st = d.get("status") if isinstance(d, dict) else None
            if st == "missing_permissions":
                raise IzinKurang(d.get("message", "izin API kurang"))
            if st in ("quota_exceeded", "insufficient_credits") or r.status_code == 402:
                raise KreditKurang(d.get("message", "kredit ElevenLabs habis atau paket belum mendukung"))
        r.raise_for_status()
        return r.content

    def sisa_kredit(self):
        return None

    def tts(self, voice_id: str, teks: str) -> bytes:
        return self._cek(requests.post(f"{API}/text-to-speech/{voice_id}", headers=self.h, params={"output_format": "mp3_44100_128"},
                                       json={"text": teks, "model_id": self.model}, timeout=180))

    def dialog(self, masukan: list[dict]) -> bytes:
        return self._cek(requests.post(f"{API}/text-to-dialogue", headers=self.h, params={"output_format": "mp3_44100_128"},
                                       json={"inputs": masukan, "model_id": self.model}, timeout=300))


def kode_keluar(keadaan: str) -> int:
    return {"lulus": 0, "butuh_persetujuan": 3, "butuh_rekam_ulang": 5}.get(keadaan, 1)


def teks_kirim(d: dict) -> str:
    tag = next((t for kata, t in TAG if kata in d.get("arah", "").lower()), None)
    return f"{tag} {d['teks']}" if tag else d["teks"]


def buang_tag(s: str) -> str:
    return re.sub(r"\[[^\]]*\]\s*", "", s).strip()


def daftar_dialog(n: dict) -> list[tuple[str, dict, dict]]:
    return [(f"{b['id']}.{k}", d, b) for b in n["beat"] for k, d in enumerate(b["dialog"], 1)]


def tata_letak(n: dict, durasi: dict[str, float]) -> list[dict]:
    t, hasil = 0.0, []
    for b in n["beat"]:
        if not b["dialog"]:
            t += b.get("durasi", naskah_mod.DURASI_VISUAL)
            continue
        t += LEAD + (MENGENA if b["jenis"] == "mengena" else 0)
        for k in range(1, len(b["dialog"]) + 1):
            kunci = f"{b['id']}.{k}"
            hasil.append({"id": kunci, "mulai": round(t, 3), "selesai": round(t + durasi[kunci], 3)})
            t += durasi[kunci] + JEDA
    return hasil


def jendela_terbaik(kata: list[dict], teks: str, mulai: int = 0, terakhir: bool = False, ambang: float = 0.0):
    """Cari rangkaian kata transkrip yang paling cocok dengan teks. Kembalikan (skor, i, j) atau None."""
    n = len(teks.split())
    calon = []
    for i in range(mulai, len(kata)):
        for L in range(max(1, n - 2), n + 3):
            j = i + L
            if j > len(kata):
                break
            s = dengar.kecocokan(teks, " ".join(k["kata"] for k in kata[i:j]))
            calon.append((s, i, j))
    if not calon:
        return None
    if terakhir:
        lulus = [c for c in calon if c[0] >= ambang]
        if not lulus:
            return None
        terbaik = max(c[0] for c in lulus)
        # kemunculan terakhir di antara yang hampir sama baiknya (ulangan → pakai yang terakhir)
        return max((c for c in lulus if c[0] >= terbaik - 0.03), key=lambda c: (c[1], c[0]))
    return max(calon, key=lambda c: (c[0], -c[1]))


def baca(p: Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def potong(sumber: np.ndarray, a: float, b: float, keluar: Path) -> Path:
    x = sumber[max(0, int(a * SR)): int(b * SR)]
    sf.write(keluar, x.astype(np.float32), SR)
    return keluar


def rakit(folder: Path, n: dict, detail: dict) -> None:
    folder = Path(folder)
    klip = {k: baca(folder / d["wav"]) for k, d in detail.items()}
    timing = tata_letak(n, {k: len(x) / SR for k, x in klip.items()})
    total = (timing[-1]["selesai"] if timing else 0) + 1.0
    y = np.zeros(int(total * SR))
    transkrip = {}
    for t in timing:
        x = klip[t["id"]]
        a = int(t["mulai"] * SR)
        y[a:a + len(x)] += x[: len(y) - a]
        transkrip[t["id"]] = [dict(k, mulai=round(k["mulai"] + t["mulai"], 3), selesai=round(k["selesai"] + t["mulai"], 3)) for k in detail[t["id"]]["kata"]]
    sf.write(folder / "dialog.wav", y.astype(np.float32), SR)
    (folder / "timing.json").write_text(json.dumps(timing, indent=2), encoding="utf-8")
    (folder / "transkrip.json").write_text(json.dumps(transkrip, ensure_ascii=False, indent=2), encoding="utf-8")


def _simpan_audio(isi: bytes, keluar: Path) -> Path:
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        f.write(isi)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f.name, "-ac", "1", "-ar", str(SR), str(keluar)], check=True)
    return keluar


def _klip_dari(kata: list[dict], i: int, j: int, sumber: np.ndarray, keluar: Path) -> tuple[Path, list[dict]]:
    a = max(0.0, kata[i]["mulai"] - POTONG_AWAL)
    b = kata[j - 1]["selesai"] + POTONG_AKHIR
    potong(sumber, a, b, keluar)
    return keluar, [dict(k, mulai=round(k["mulai"] - a, 3), selesai=round(k["selesai"] - a, 3)) for k in kata[i:j]]


def jalankan(folder: Path, klien, suara: dict[str, str], transkrip_fn=None, versi: int = 2) -> str:
    """Jalur ElevenLabs: beat ber-banyak-dialog memakai mode dialog, beat satu dialog memakai TTS."""
    transkrip_fn = transkrip_fn or dengar.transkrip
    folder = Path(folder)
    n = naskah_mod.muat(folder / "naskah.json")
    detail = status.baca(folder)["tahap"].get("suara", {}).get("detail", {})
    dir_ = folder / "suara_baris"
    dir_.mkdir(exist_ok=True)
    status.tandai(folder, "suara", "berjalan", penyedia="elevenlabs", detail=detail)
    gagal = []
    try:
        for b in n["beat"]:
            ids = [f"{b['id']}.{k}" for k in range(1, len(b["dialog"]) + 1)]
            if not ids or all(i in detail for i in ids):
                continue
            terbaik = None
            for v in range(versi):
                mentah = dir_ / f"{b['id']}_v{v}.wav"
                if len(ids) > 1:
                    isi = klien.dialog([{"text": teks_kirim(d), "voice_id": suara[d["penutur"]]} for d in b["dialog"]])
                else:
                    isi = klien.tts(suara[b["dialog"][0]["penutur"]], teks_kirim(b["dialog"][0]))
                wav = _simpan_audio(isi, mentah)
                kata = transkrip_fn(wav)
                hasil, posisi = [], 0
                for d in b["dialog"]:
                    c = jendela_terbaik(kata, d["teks"], mulai=posisi)
                    hasil.append(c)
                    posisi = c[2] if c else posisi
                skor = min((c[0] if c else 0.0) for c in hasil)
                if terbaik is None or skor > terbaik[0]:
                    terbaik = (skor, wav, kata, hasil)
                if skor >= 0.99:
                    break
            skor, wav, kata, hasil = terbaik
            sumber = baca(wav)
            for kunci, d, c in zip(ids, b["dialog"], hasil):
                if not c or c[0] < AMBANG:
                    gagal.append(kunci)
                    continue
                p, kk = _klip_dari(kata, c[1], c[2], sumber, dir_ / f"{kunci}.wav")
                detail[kunci] = {"wav": p.relative_to(folder).as_posix(), "kata": kk, "skor": round(c[0], 3)}
            status.tandai(folder, "suara", "berjalan", penyedia="elevenlabs", detail=detail)
    except (IzinKurang, KreditKurang) as e:
        status.tandai(folder, "suara", "butuh_persetujuan", alasan=str(e), detail=detail,
                      baris_tersisa=[k for k, _, _ in daftar_dialog(n) if k not in detail])
        return "butuh_persetujuan"
    if gagal:
        status.tandai(folder, "suara", "gagal", alasan=f"kata tidak cocok: {', '.join(gagal)}", detail=detail)
        return "gagal"
    rakit(folder, n, detail)
    status.tandai(folder, "suara", "lulus", penyedia="elevenlabs", detail=detail)
    return "lulus"
