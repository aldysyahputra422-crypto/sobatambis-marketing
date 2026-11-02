"""Jalur suara manusia: bersihkan rekaman per tokoh, potong per baris naskah, rakit dialog.wav.

python -m scripts.suara.manusia <folder>
Kode keluar: 0 lulus, 5 butuh rekam ulang (daftar baris di status.json), 1 gagal.
"""
import subprocess
import sys
from pathlib import Path

import yaml

from scripts import naskah as naskah_mod
from scripts import status
from scripts.suara import dengar
from scripts.suara.v2 import _klip_dari, baca, daftar_dialog, jendela_terbaik, kode_keluar, rakit  # noqa: F401

ROOT = Path(__file__).resolve().parents[2]
AMBANG = 0.9
EKSTENSI = (".wav", ".m4a", ".mp3", ".ogg", ".opus", ".aac", ".webm")


def _cari_file(folder: Path, nama: str) -> Path | None:
    for e in EKSTENSI:
        p = folder / "rekaman" / f"{nama}{e}"
        if p.exists():
            return p
    return None


def _bersihkan(src: Path, keluar: Path, efek_mbis: bool = False) -> Path:
    af = "afftdn=nf=-25,highpass=f=70,loudnorm=I=-18:TP=-2"
    if efek_mbis:
        af = "asetrate=44100*0.89,aresample=44100,atempo=1.12," + af + ",aecho=0.8:0.5:40:0.15"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ac", "1", "-ar", "44100", "-af", af, str(keluar)], check=True)
    return keluar


def _efek_mbis() -> bool:
    try:
        return bool(yaml.safe_load((ROOT / "config/suara.yaml").read_text(encoding="utf-8")).get("manusia", {}).get("mbis_efek", False))
    except OSError:
        return False


def jalankan(folder: Path, transkrip_fn=None) -> str:
    transkrip_fn = transkrip_fn or dengar.transkrip
    folder = Path(folder)
    n = naskah_mod.muat(folder / "naskah.json")
    detail = status.baca(folder)["tahap"].get("suara", {}).get("detail", {})
    detail = {k: v for k, v in detail.items() if (folder / v["wav"]).exists()}
    semua = daftar_dialog(n)
    dir_ = folder / "suara_baris"
    dir_.mkdir(exist_ok=True)

    # rekam ulang satu baris
    for kunci, d, _ in semua:
        p = _cari_file(folder, f"ulang-{kunci}")
        if p and kunci not in detail:
            bersih = _bersihkan(p, folder / "rekaman" / f"_bersih_ulang-{kunci}.wav", d["penutur"] == "mbis" and _efek_mbis())
            kata = transkrip_fn(bersih)
            c = jendela_terbaik(kata, d["teks"], terakhir=True, ambang=AMBANG)
            if c:
                wav, kk = _klip_dari(kata, c[1], c[2], baca(bersih), dir_ / f"{kunci}.wav")
                detail[kunci] = {"wav": wav.relative_to(folder).as_posix(), "kata": kk, "skor": round(c[0], 3), "mulai_rekaman": round(max(0, kata[c[1]]["mulai"] - 0.08), 3)}

    sisa_per_tokoh: dict[str, list] = {}
    for kunci, d, _ in semua:
        if kunci not in detail:
            sisa_per_tokoh.setdefault(d["penutur"], []).append((kunci, d))
    for tokoh, sisa in sisa_per_tokoh.items():
        src = _cari_file(folder, tokoh)
        if not src:
            continue
        bersih = _bersihkan(src, folder / "rekaman" / f"_bersih_{tokoh}.wav", tokoh == "mbis" and _efek_mbis())
        kata = transkrip_fn(bersih)
        sumber = baca(bersih)
        for kunci, d in sisa:
            c = jendela_terbaik(kata, d["teks"], terakhir=True, ambang=AMBANG)
            if not c:
                continue
            wav, kk = _klip_dari(kata, c[1], c[2], sumber, dir_ / f"{kunci}.wav")
            detail[kunci] = {"wav": wav.relative_to(folder).as_posix(), "kata": kk, "skor": round(c[0], 3),
                             "mulai_rekaman": round(max(0, kata[c[1]]["mulai"] - 0.08), 3)}

    hilang = [k for k, _, _ in semua if k not in detail]
    if hilang:
        status.tandai(folder, "suara", "butuh_rekam_ulang", penyedia="manusia", detail=detail, baris_tersisa=hilang,
                      alasan=f"{len(hilang)} baris belum terekam atau tidak jelas")
        return "butuh_rekam_ulang"
    rakit(folder, n, detail)
    status.tandai(folder, "suara", "lulus", penyedia="manusia", detail=detail)
    return "lulus"


if __name__ == "__main__":
    k = jalankan(Path(sys.argv[1]))
    print(k)
    if k == "butuh_rekam_ulang":
        print("rekam ulang:", ", ".join(status.baca(Path(sys.argv[1]))["tahap"]["suara"]["baris_tersisa"]))
    sys.exit(kode_keluar(k))
