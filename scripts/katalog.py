"""Muat dan cari katalog skill (katalog/skill.yaml)."""
import re
import sys
from dataclasses import dataclass, fields
from pathlib import Path

import yaml

STATUS_VALID = {"direkomendasikan", "opsional", "alternatif", "sebagian", "rujukan"}


@dataclass
class Entri:
    id: str
    sumber: str
    fungsi: str
    pakai_saat: str
    cara_pasang: str
    lisensi: str
    catatan_lisensi: str
    butuh_key: str | None
    biaya: str
    ukuran: str
    status: str
    otomatis: bool = False  # boleh dipasang tanpa bertanya (lihat scripts/pasang_otomatis.py)
    pasang: dict | None = None  # cara pasang terstruktur: git_skill | git_subskill | npx_skill | plugin
    agent: list | None = None  # agent yang dibangun dari skill ini ("semua" = seluruh agent)


def muat(path: Path) -> list[Entri]:
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8")) or []
    nama = {f.name for f in fields(Entri)}
    return [Entri(**{k: v for k, v in d.items() if k in nama}) for d in data]


def _kata(teks: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", teks.lower()))


def cari(entri: list[Entri], kebutuhan: str) -> list[Entri]:
    q = _kata(kebutuhan)
    skor = []
    for e in entri:
        s = 2 * len(q & _kata(e.pakai_saat)) + len(q & _kata(e.fungsi))
        if s:
            skor.append((s, e.status == "direkomendasikan", e))
    skor.sort(key=lambda t: (t[0], t[1]), reverse=True)
    return [e for _, _, e in skor]


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] != "cari":
        print("pakai: python -m scripts.katalog cari \"<kebutuhan>\"")
        sys.exit(2)
    for e in cari(muat(Path("katalog/skill.yaml")), " ".join(sys.argv[2:]))[:5]:
        kunci = f" (butuh {e.butuh_key})" if e.butuh_key else ""
        print(f"{e.id} [{e.status}]{kunci}: {e.cara_pasang}")
