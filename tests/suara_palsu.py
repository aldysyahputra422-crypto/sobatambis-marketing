"""Penyedia suara palsu untuk test: sinus yang 'berakting' sesuai emosi."""
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 44100
AMP = {"marah": 0.8, "semangat": 0.5, "kaget": 0.5}
DETIK_PER_KATA = {"lelah": 0.6, "hancur": 0.6}


def sinus(detik: float, hz: float = 220.0, amp: float = 0.3) -> np.ndarray:
    t = np.arange(int(detik * SR)) / SR
    return (amp * np.sin(2 * np.pi * hz * t)).astype(np.float32)


class PenyediaPalsu:
    nama = "palsu"

    def __init__(self, kredit=None):
        self.kredit, self.panggilan = kredit, []

    def sisa_kredit(self):
        return self.kredit

    def sintesis(self, baris: dict, keluar: Path) -> Path:
        self.panggilan.append(baris["id"])
        emosi = baris.get("emosi", "datar")
        detik = DETIK_PER_KATA.get(emosi, 0.4) * len(baris["teks"].split())
        sf.write(keluar, sinus(detik, 180 + 10 * baris.get("intensitas", 5), AMP.get(emosi, 0.3)), SR)
        return keluar
