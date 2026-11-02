"""Kapasitas produksi dari pemakaian nyata (Claude Pro).

Batas Claude Pro tidak diumumkan dalam token dan bergantung model, panjang konteks, dan cache, jadi
kapasitas TIDAK ditebak dari token. Caranya diukur: catat persen di /usage sebelum dan sesudah satu episode
penuh, lalu kapasitas = (100 - cadangan) / persen per episode.

python -m scripts.kapasitas                                   → JSON ringkasan semua episode di videos/
python -m scripts.kapasitas catat <folder> --jendela mingguan --awal 12 --akhir 25
  (jendela: mingguan atau 5jam; angka persen dari /usage, dibaca pemilik)
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIDEOS = ROOT / "videos"
JENDELA = ("mingguan", "5jam")
KUNCI = ("input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens")
CARA_UKUR = ("Belum diukur. Sebelum satu episode: buka /usage, catat persen batas mingguan (dan sesi 5 jam). "
             "Sesudah episode selesai: catat lagi, lalu `python -m scripts.kapasitas catat <folder> --jendela mingguan --awal A --akhir B`.")


def catat_usage(folder: Path, jendela: str, awal: float, akhir: float) -> dict:
    if jendela not in JENDELA:
        raise ValueError(f"jendela harus salah satu dari {JENDELA}")
    if not (0 <= awal < akhir <= 100):
        raise ValueError("persen harus 0 <= awal < akhir <= 100 (episode yang melewati reset jendela diukur ulang)")
    folder = Path(folder)
    p = folder / "usage.json"
    data = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    data[jendela] = {"awal": awal, "akhir": akhir, "persen": round(akhir - awal, 2)}
    folder.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return data


def _episode(root: Path) -> list[Path]:
    return sorted({p.parent for p in Path(root).glob("*/*/token.json")} | {p.parent for p in Path(root).glob("*/*/usage.json")})


def hitung(root: Path = VIDEOS, cadangan: float = 15) -> dict:
    token, persen = [], {j: [] for j in JENDELA}
    for f in _episode(root):
        try:
            token.append(json.loads((f / "token.json").read_text(encoding="utf-8"))["per_model"]["total"])
        except (OSError, ValueError, KeyError):
            pass
        try:
            u = json.loads((f / "usage.json").read_text(encoding="utf-8"))
            for j in JENDELA:
                if j in u:
                    persen[j].append(float(u[j]["persen"]))
        except (OSError, ValueError, KeyError):
            pass
    rata = {k: round(sum(int(t.get(k, 0)) for t in token) / len(token)) for k in KUNCI} if token else None
    per_ep = {j: round(sum(v) / len(v), 2) if v else None for j, v in persen.items()}
    kap = {j: (math.floor((100 - cadangan) / p) if p else None) for j, p in per_ep.items()}
    return {
        "episode_terukur": len(token),
        "token_rata": rata,
        "persen_per_episode": per_ep,
        "cadangan_persen": cadangan,
        "kapasitas_mingguan": kap["mingguan"],
        "episode_per_sesi_5jam": kap["5jam"],
        "cara_ukur": None if per_ep["mingguan"] else CARA_UKUR,
    }


def main(argv: list[str]) -> int:
    if argv and argv[0] == "catat":
        ambil = lambda k: argv[argv.index(k) + 1]
        try:
            print(json.dumps(catat_usage(Path(argv[1]), ambil("--jendela"), float(ambil("--awal")), float(ambil("--akhir")))))
        except (ValueError, IndexError) as x:
            print(f"gagal: {x}")
            return 1
        return 0
    print(json.dumps(hitung(), ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
