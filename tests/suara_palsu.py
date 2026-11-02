"""Penyedia suara palsu untuk test: sinus sepanjang 0.4 detik per kata."""
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 44100


def sinus(detik: float, hz: float = 220.0, amp: float = 0.3) -> np.ndarray:
    t = np.arange(int(detik * SR)) / SR
    return (amp * np.sin(2 * np.pi * hz * t)).astype(np.float32)


class PenyediaPalsu:
    nama = "palsu"

    def __init__(self, kredit=None, hz=220.0, amp=0.3):
        self.kredit, self.hz, self.amp, self.panggilan = kredit, hz, amp, []

    def sisa_kredit(self):
        return self.kredit

    def sintesis(self, baris: dict, keluar: Path) -> Path:
        self.panggilan.append(baris["id"])
        sf.write(keluar, sinus(0.4 * len(baris["teks"].split()), self.hz, self.amp), SR)
        return keluar
