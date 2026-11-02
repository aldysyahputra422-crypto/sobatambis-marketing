"""Penyedia suara: ElevenLabs (utama) dan edge-tts (cadangan dengan persetujuan)."""
import asyncio
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Protocol

import requests

API = "https://api.elevenlabs.io/v1"
SR = 44100

SUARA_EDGE_BAWAAN = {
    "arta": {"voice": "id-ID-GadisNeural", "rate": "+0%", "pitch": "+0Hz"},
    "mbis": {"voice": "id-ID-ArdiNeural", "rate": "+0%", "pitch": "-10Hz"},
    "ratna": {"voice": "id-ID-GadisNeural", "rate": "-10%", "pitch": "+0Hz"},
    "bima": {"voice": "id-ID-ArdiNeural", "rate": "+0%", "pitch": "+0Hz"},
}


class KreditKurang(Exception):
    def __init__(self, dibutuhkan: int, sisa: int):
        super().__init__(f"kredit kurang: butuh {dibutuhkan}, sisa {sisa}")
        self.dibutuhkan, self.sisa = dibutuhkan, sisa


class Penyedia(Protocol):
    nama: str

    def sisa_kredit(self) -> int | None: ...

    def sintesis(self, baris: dict, keluar: Path) -> Path: ...


def perlu_karakter(baris_list: list[dict]) -> int:
    return sum(len((b["tag"] + " " if b.get("tag") else "") + b["teks"]) for b in baris_list)


def ke_wav(src: Path, dst: Path) -> Path:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ac", "1", "-ar", str(SR), str(dst)], check=True)
    return dst


class ElevenLabs:
    nama = "elevenlabs"

    def __init__(self, api_key: str, suara: dict[str, str], model: str = "eleven_v3"):
        self.api_key, self.suara, self.model = api_key, suara, model

    def _h(self) -> dict:
        return {"xi-api-key": self.api_key}

    def sisa_kredit(self) -> int | None:
        r = requests.get(f"{API}/user/subscription", headers=self._h(), timeout=30)
        r.raise_for_status()
        d = r.json()
        return int(d["character_limit"]) - int(d["character_count"])

    def teks_kirim(self, baris: dict) -> str:
        return f"{baris['tag']} {baris['teks']}" if baris.get("tag") else baris["teks"]

    def sintesis(self, baris: dict, keluar: Path) -> Path:
        r = requests.post(
            f"{API}/text-to-speech/{self.suara[baris['penutur']]}",
            params={"output_format": "mp3_44100_128"},
            headers=self._h(),
            json={"text": self.teks_kirim(baris), "model_id": self.model},
            timeout=120,
        )
        r.raise_for_status()
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            f.write(r.content)
        return ke_wav(Path(f.name), Path(keluar))


def _percayai_ca_lingkungan() -> None:
    """edge-tts memakai bundle certifi sendiri; tambahkan CA lingkungan (mis. proxy perusahaan) tanpa mematikan verifikasi."""
    ca = os.environ.get("SSL_CERT_FILE")
    if ca and os.path.exists(ca):
        from edge_tts import communicate

        communicate._SSL_CTX.load_verify_locations(cafile=ca)


class EdgeTTS:
    nama = "edge"

    def __init__(self, suara: dict[str, dict]):
        self.suara = suara

    def sisa_kredit(self) -> int | None:
        return None

    def teks_kirim(self, baris: dict) -> str:
        return baris["teks"]

    def sintesis(self, baris: dict, keluar: Path) -> Path:
        import edge_tts

        _percayai_ca_lingkungan()
        s = self.suara[baris["penutur"]]
        mp3 = Path(tempfile.mkstemp(suffix=".mp3")[1])
        proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
        asyncio.run(
            edge_tts.Communicate(self.teks_kirim(baris), s["voice"], rate=s["rate"], pitch=s["pitch"], proxy=proxy).save(str(mp3))
        )
        return ke_wav(mp3, Path(keluar))
