"""Bangun adegan.json dari naskah.json + timing.json + transkrip.json."""
import json
import re
import sys
from pathlib import Path

from scripts import naskah as naskah_mod

ROOT = Path(__file__).resolve().parents[1]
LATAR_TS = ROOT / "template/src/dunia/latar.ts"


class AsetTidakAda(Exception):
    pass


def aset_tersedia() -> tuple[set[str], set[str]]:
    """Baca id latar dan properti yang benar-benar ada di template."""
    teks = LATAR_TS.read_text(encoding="utf-8")
    blok = lambda nama: teks.split(f"export const {nama}", 1)[1].split("\n};", 1)[0]
    latar = set(re.findall(r"^\s{2}(\w+):", blok("LATAR"), re.M))
    properti = set(re.findall(r"^\s{2}(\w+):", blok("PROPERTI"), re.M))
    return latar, properti


def _kata(b: dict, waktu: dict, transkrip: list[dict]) -> list[dict]:
    teks = b.get("caption", b["teks"])
    token = teks.split()
    if len(transkrip) == len(token):
        return [dict(t, kata=k) for t, k in zip(transkrip, token)]
    langkah = (waktu["selesai"] - waktu["mulai"]) / len(token)
    return [
        {"kata": k, "mulai": round(waktu["mulai"] + i * langkah, 3), "selesai": round(waktu["mulai"] + (i + 1) * langkah, 3)}
        for i, k in enumerate(token)
    ]


def bangun(naskah: dict, timing: list[dict], transkrip: dict[str, list[dict]]) -> dict:
    latar_ada, properti_ada = aset_tersedia()
    waktu = {t["id"]: t for t in timing}
    adegan = []
    for b in naskah["baris"]:
        v = b["visual"]
        if v["latar"] not in latar_ada:
            raise AsetTidakAda(f"latar '{v['latar']}' belum ada di template/src/dunia/latar.ts")
        for p in v.get("properti", []):
            if p not in properti_ada:
                raise AsetTidakAda(f"properti '{p}' belum ada di template/src/dunia/latar.ts")
        w = waktu[b["id"]]
        adegan.append({
            "id": b["id"], "mulai": w["mulai"], "selesai": w["selesai"], "akhir_jeda": w["akhir_jeda"],
            "penutur": b["penutur"], "emosi": b["emosi"], "intensitas": b["intensitas"], "visual": v,
            "caption": {"teks": b.get("caption", b["teks"]), "kata": _kata(b, w, transkrip.get(b["id"], []))},
        })
    return {
        "episode": naskah["episode"], "judul": naskah["judul"], "durasi": timing[-1]["akhir_jeda"], "adegan": adegan,
        "penutup": {"judul_berikut": naskah.get("judul_berikut", "")},
    }


if __name__ == "__main__":
    folder = Path(sys.argv[1])
    try:
        hasil = bangun(
            naskah_mod.muat(folder / "naskah.json"),
            json.loads((folder / "timing.json").read_text(encoding="utf-8")),
            json.loads((folder / "transkrip.json").read_text(encoding="utf-8")),
        )
    except AsetTidakAda as e:
        print(f"aset tidak ada: {e}")
        sys.exit(1)
    (folder / "adegan.json").write_text(json.dumps(hasil, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"adegan.json: {len(hasil['adegan'])} adegan, {hasil['durasi']} detik")
