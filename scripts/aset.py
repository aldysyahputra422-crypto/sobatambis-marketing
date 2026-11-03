"""Bangun pustaka SFX dari aset/sfx/katalog.yaml lewat ElevenLabs Sound Effects.

python -m scripts.aset sfx [--ulang] [--katalog PATH]
Kode keluar: 0 selesai, 3 kunci API kurang izin (butuh tindakan pemilik).
Setiap entri dicatat sumber dan lisensinya; lisensi mengikuti paket akun saat dibuat.
"""
import argparse
import os
import sys
from pathlib import Path

import requests
import yaml

ROOT = Path(__file__).resolve().parents[1]
API = "https://api.elevenlabs.io/v1"
KATALOG_SFX = ROOT / "aset/sfx/katalog.yaml"


class IzinKurang(Exception):
    pass


def _status(r) -> str | None:
    try:
        d = r.json().get("detail", {})
    except ValueError:
        return None
    return d.get("status") if isinstance(d, dict) else None


class KlienElevenLabs:
    def __init__(self, kunci: str):
        self.h = {"xi-api-key": kunci}

    def paket(self) -> str | None:
        r = requests.get(f"{API}/user/subscription", headers=self.h, timeout=30)
        if r.status_code == 401:
            return None
        r.raise_for_status()
        return r.json().get("tier")

    def sfx(self, teks: str, durasi: float) -> bytes:
        r = requests.post(f"{API}/sound-generation", headers=self.h, timeout=120,
                          json={"text": teks, "duration_seconds": durasi, "prompt_influence": 0.6})
        if r.status_code == 401 and _status(r) == "missing_permissions":
            raise IzinKurang("sound_generation")
        r.raise_for_status()
        return r.content


def lisensi_dari_paket(tier: str | None) -> str:
    if tier is None:
        return "elevenlabs-paket-tidak-terbaca-anggap-nonkomersial"
    return "elevenlabs-gratis-nonkomersial" if tier == "free" else f"elevenlabs-{tier}-komersial"


def bangun_sfx(nama: str, entri: dict, klien, folder: Path, lisensi: str, ulang: bool = False) -> Path:
    keluar = folder / entri["file"]
    if keluar.exists() and not ulang:
        return keluar
    keluar.write_bytes(klien.sfx(entri["prompt"], float(entri["durasi"])))
    entri["sumber"] = "elevenlabs-sound-generation"
    entri["lisensi"] = lisensi
    return keluar


def main(argv: list[str], klien=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("jenis", choices=["sfx"])
    ap.add_argument("--katalog", default=str(KATALOG_SFX))
    ap.add_argument("--ulang", action="store_true")
    a = ap.parse_args(argv)
    kat_path = Path(a.katalog)
    katalog = yaml.safe_load(kat_path.read_text(encoding="utf-8"))
    if klien is None:
        kunci = os.environ.get("ELEVENLABS_API_KEY")
        if not kunci:
            print("ELEVENLABS_API_KEY belum ada di environment")
            return 3
        klien = KlienElevenLabs(kunci)
    lisensi = lisensi_dari_paket(klien.paket())
    try:
        for nama, entri in katalog.items():
            p = bangun_sfx(nama, entri, klien, kat_path.parent, lisensi, a.ulang)
            print(f"{nama}: {p.name}")
    except IzinKurang as e:
        print(f"Kunci API ElevenLabs kurang izin '{e}'. Buat kunci baru dengan izin {e} lalu simpan sebagai ELEVENLABS_API_KEY.")
        return 3
    finally:
        kat_path.write_text(yaml.safe_dump(katalog, allow_unicode=True, sort_keys=False), encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
