"""Audisi suara Indonesia dari pustaka ElevenLabs untuk setiap tokoh.

python -m scripts.suara.audisi arta ratna mbis   → audisi/<tokoh>/<nama>.mp3 + audisi/audisi.md
Kode keluar 3 bila kunci API kurang izin (voices_read / voices_write) atau paket belum berbayar.
Pemilik memilih satu kandidat per tokoh; voice_id-nya lalu dicatat di config/suara.yaml (audisi tidak menambah suara ke akun).
"""
import os
import re
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
API = "https://api.elevenlabs.io/v1"

KRITERIA = {
    "arta": {"gender": "female", "age": "young", "kata": "remaja perempuan SMA, ceria, ekspresif"},
    "ratna": {"gender": "female", "age": "middle_aged", "kata": "ibu, hangat, lembut"},
    "mbis": {"gender": "male", "age": "middle_aged", "kata": "kering, deadpan, serak"},
    "bima": {"gender": "male", "age": "young", "kata": "mahasiswa, tenang, ramah"},
}
TEKS = {
    "arta": ["[excited] HARI PERTAMA RENCANA SEMPURNA!", "[frustrated] Tiga tempat?", "[shouting] OKE. Aku belajar TUJUH jam!"],
    "ratna": ["[hesitant] Ta... anaknya Bu Sinta sekarang les di tiga tempat, lho.", "...Ini cuma HP, Ta."],
    "mbis": ["[whispers] Rencanamu nggak salah, Ta. Cuma kebanyakan."],
    "bima": ["Coba ceritain, kamu salah di langkah keberapa?"],
}
MAKS = 4


class IzinKurang(Exception):
    pass


def _cek(r):
    if r.status_code in (401, 402):
        try:
            d = r.json().get("detail", {})
        except ValueError:
            d = {}
        status = d.get("status") if isinstance(d, dict) else None
        pesan = d.get("message", "") if isinstance(d, dict) else ""
        if status == "missing_permissions":
            izin = re.search(r"permission (\w+)", pesan)
            raise IzinKurang(izin.group(1) if izin else "voices_read")
        if r.status_code == 402:
            raise IzinKurang("paket berbayar (suara pustaka tidak tersedia untuk akun gratis)")
    r.raise_for_status()
    return r


class KlienElevenLabs:
    def __init__(self, kunci: str):
        self.h = {"xi-api-key": kunci}

    def cari(self, params: dict) -> list[dict]:
        r = _cek(requests.get(f"{API}/shared-voices", headers=self.h, params=params, timeout=30))
        return r.json().get("voices", [])

    def tambah(self, owner: str, voice_id: str, nama: str) -> str:
        r = _cek(requests.post(f"{API}/voices/add/{owner}/{voice_id}", headers=self.h, json={"new_name": nama}, timeout=30))
        return r.json()["voice_id"]

    def tts(self, voice_id: str, teks: str) -> bytes:
        r = _cek(requests.post(f"{API}/text-to-speech/{voice_id}", headers=self.h, params={"output_format": "mp3_44100_128"},
                               json={"text": teks, "model_id": "eleven_v3"}, timeout=120))
        return r.content


def cari(klien, tokoh: str) -> list[dict]:
    k = KRITERIA[tokoh]
    hasil = klien.cari({"language": "id", "gender": k["gender"], "age": k["age"], "sort": "trending", "page_size": 30})
    return [s for s in hasil if s.get("language") == "id"][:MAKS]


def _aman(nama: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", nama.lower()).strip("-")


def main(argv: list[str], klien=None, folder: Path | None = None) -> int:
    folder = Path(folder or ROOT / "audisi")
    if klien is None:
        kunci = os.environ.get("ELEVENLABS_API_KEY")
        if not kunci:
            print("ELEVENLABS_API_KEY belum ada di environment")
            return 3
        klien = KlienElevenLabs(kunci)
    baris = ["# Audisi suara", "", "Dengarkan setiap file, lalu pilih satu suara per tokoh.", ""]
    try:
        for tokoh in argv:
            kandidat = cari(klien, tokoh)
            (folder / tokoh).mkdir(parents=True, exist_ok=True)
            baris += [f"## {tokoh.capitalize()} ({KRITERIA[tokoh]['kata']})", "", "Teks sampel: " + " / ".join(TEKS[tokoh]), "",
                      "| Kandidat | Aksen | Deskripsi | voice_id | File |", "|---|---|---|---|---|"]
            for s in kandidat:
                # Sampel memakai voice_id pustaka langsung (boleh di paket berbayar); tidak menambah ke akun,
                # supaya slot suara tidak habis. Hanya suara terpilih yang dicatat di config/suara.yaml.
                vid = s["voice_id"]
                f = folder / tokoh / f"{_aman(s['name'])}.mp3"
                f.write_bytes(klien.tts(vid, " ".join(TEKS[tokoh])))
                baris.append(f"| {s['name']} | {s.get('accent', '')} | {s.get('description', '')[:80]} | `{vid}` | `{f.relative_to(folder)}` |")
            baris.append("")
    except IzinKurang as e:
        print(f"Kunci API ElevenLabs kurang izin/paket: {e}. Buat kunci baru dengan izin voices_read, voices_write, text_to_speech pada paket berbayar.")
        return 3
    (folder / "audisi.md").write_text("\n".join(baris), encoding="utf-8")
    print(folder / "audisi.md")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
