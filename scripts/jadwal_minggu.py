"""Jadwal 7 hari tayang dari kapasitas terukur.

python -m scripts.jadwal_minggu susun 2026-W47 [--sibuk Senin,Rabu]  → tulis videos/2026-W47/jadwal.json (+ cetak ringkasan)
python -m scripts.jadwal_minggu notion videos/2026-W47 → JSON baris database Notion "Produksi Sobat Ambis"

Hari tanpa kapasitas untuk episode serial diisi "turunan": format hemat token dari episode yang sudah jadi
(carousel momen mengena, potongan 15 detik), dikerjakan perencana-konten, bukan pipeline penuh.
Tiap hari serial membawa SARAN jalur ("saran_jalur": otomatis|senggang, dengan "alasan_jalur"); pemilik tetap memilih.
Batas mingguan menipis (kapasitas < target) → senggang; hari yang ditandai --sibuk → otomatis (senggang butuh pemilik menulis di ChatGPT dan menempel ke ElevenLabs).
Judul episode diisi perencana-konten langsung di jadwal.json (field "judul").
"""
import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

import yaml

from scripts import kapasitas

ROOT = Path(__file__).resolve().parents[1]
VIDEOS = ROOT / "videos"
KONFIG = ROOT / "config/jadwal.yaml"
NAMA_HARI = ("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu")


def konfig() -> dict:
    return yaml.safe_load(KONFIG.read_text(encoding="utf-8")) if KONFIG.exists() else {}


def ep_berikutnya(root: Path = VIDEOS) -> int:
    nomor = [int(m.group(1)) for p in Path(root).glob("*/ep*") if (m := re.match(r"ep(\d+)", p.name))]
    return max(nomor, default=0) + 1


def _hari_serial(n: int) -> set[int]:
    """n hari serial disebar merata di 7 hari, mulai Senin."""
    return {round(i * 7 / n) for i in range(n)} if n else set()


def saran_jalur(kapasitas_mingguan: int | None, target: int, hari_sibuk: bool = False) -> tuple[str, str]:
    """Saran saja. Pemilik sibuk menang atas batas menipis: jalur senggang memakai waktu pemilik."""
    if hari_sibuk:
        return "otomatis", "pemilik sibuk: jalur senggang butuh pemilik menulis di ChatGPT dan menempel ke ElevenLabs"
    if kapasitas_mingguan is not None and kapasitas_mingguan < target:
        return "senggang", f"batas mingguan menipis: kapasitas {kapasitas_mingguan} < target {target}; senggang menghemat token naskah dan suara"
    return "otomatis", "kapasitas cukup" if kapasitas_mingguan is not None else "kapasitas belum diukur"


def susun(minggu: str, kapasitas_mingguan: int | None, ep_awal: int, target: int = 7, jam: str = "19:00",
          jeda_produksi: int = 2, zona: str = "+07:00", sibuk: set[str] | None = None) -> dict:
    th, mg = re.fullmatch(r"(\d{4})-W(\d{2})", minggu).groups()
    senin = date.fromisocalendar(int(th), int(mg), 1)
    peringatan = []
    if kapasitas_mingguan is None:
        n = target
        peringatan.append("kapasitas belum diukur: jadwal memakai target. Ukur dulu dengan /usage (python -m scripts.kapasitas).")
    else:
        n = min(target, kapasitas_mingguan)
        if n < target:
            peringatan.append(f"kapasitas {kapasitas_mingguan} episode/minggu: {target - n} hari diisi konten turunan.")
    serial = _hari_serial(n)
    hari, ep, terakhir = [], ep_awal, f"ep{ep_awal - 1:02d}" if ep_awal > 1 else None
    for i in range(7):
        tgl = senin + timedelta(days=i)
        slot = {"hari": NAMA_HARI[i], "tayang": f"{tgl.isoformat()}T{jam}:00{zona}",
                "produksi": (tgl - timedelta(days=jeda_produksi)).isoformat(), "judul": ""}
        if i in serial:
            nama = f"ep{ep:02d}"
            jalur, alasan = saran_jalur(kapasitas_mingguan, target, NAMA_HARI[i] in (sibuk or set()))
            slot.update(jenis="serial", episode=nama, folder=f"videos/{minggu}/{nama}", saran_jalur=jalur, alasan_jalur=alasan)
            terakhir, ep = nama, ep + 1
        else:
            slot.update(jenis="turunan", episode=None, sumber_episode=terakhir,
                        folder=f"videos/{minggu}/turunan-{tgl.isoformat()}")
        hari.append(slot)
    return {"minggu": minggu, "kapasitas_mingguan": kapasitas_mingguan, "target": target, "hari": hari, "peringatan": peringatan}


def baris_notion(j: dict) -> list[dict]:
    rows = []
    for h in j["hari"]:
        nama = h["episode"] or f"turunan dari {h.get('sumber_episode') or 'episode sebelumnya'}"
        rows.append({
            "Episode": f"{nama} · {h['judul']}" if h.get("judul") else nama,
            "Folder": h["folder"],
            "Tahap": "rencana",
            "Status": "direncanakan",
            "Butuh dari pemilik": "",
            "Jadwal tayang": h["tayang"],
        })
    return rows


def main(argv: list[str]) -> int:
    if len(argv) < 2 or argv[0] not in ("susun", "notion"):
        print(__doc__)
        return 2
    if argv[0] == "notion":
        print(json.dumps(baris_notion(json.loads((Path(argv[1]) / "jadwal.json").read_text(encoding="utf-8"))), ensure_ascii=False, indent=1))
        return 0
    k = konfig()
    sibuk = set(argv[argv.index("--sibuk") + 1].split(",")) if "--sibuk" in argv else set()
    kap = kapasitas.hitung(cadangan=k.get("cadangan_persen", 15))
    j = susun(argv[1], kap["kapasitas_mingguan"], ep_berikutnya(), target=k.get("target_serial", 7),
              jam=k.get("jam_tayang", "19:00"), jeda_produksi=k.get("jeda_produksi_hari", 2), sibuk=sibuk)
    folder = VIDEOS / argv[1]
    folder.mkdir(parents=True, exist_ok=True)
    p = folder / "jadwal.json"
    if p.exists():
        lama = {h["folder"]: h.get("judul", "") for h in json.loads(p.read_text(encoding="utf-8"))["hari"]}
        for h in j["hari"]:
            h["judul"] = lama.get(h["folder"], "")
    p.write_text(json.dumps(j, ensure_ascii=False, indent=1), encoding="utf-8")
    for h in j["hari"]:
        print(f"{h['hari']:<7} {h['tayang'][:10]} {h['jenis']:<8} {h['episode'] or '-':<5} {h.get('saran_jalur', '')}")
    for x in j["peringatan"]:
        print(f"! {x}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
