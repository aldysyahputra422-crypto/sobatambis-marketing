"""Pengatur tahap produksi per folder video: tahap berikutnya dan reset tahap."""
import sys
from datetime import datetime, timezone
from pathlib import Path

from scripts import status


def berikutnya(folder: Path) -> str | None:
    data = status.baca(folder)
    if "mulai" not in data:
        data["mulai"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        status.tulis(folder, data)
    for t in status.TAHAP:
        if data["tahap"].get(t, {}).get("keadaan") != "lulus":
            return t
    if "selesai" not in data:
        data["selesai"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        status.tulis(folder, data)
    return None


def ulang(folder: Path, nama: str) -> None:
    if nama not in status.TAHAP:
        raise ValueError(f"tahap tidak dikenal: {nama}")
    data = status.baca(folder)
    for t in status.TAHAP[status.TAHAP.index(nama):]:
        data["tahap"].pop(t, None)
    data.pop("selesai", None)
    status.tulis(folder, data)


if __name__ == "__main__":
    perintah, folder = sys.argv[1], Path(sys.argv[2])
    if perintah == "berikutnya":
        print(berikutnya(folder) or "selesai")
    elif perintah == "mulai":
        # tandai produksi aktif agar hook Stop melanjutkan otomatis sampai titik persetujuan
        import json
        penanda = Path(".sa/aktif.json")
        penanda.parent.mkdir(exist_ok=True)
        penanda.write_text(json.dumps({"folder": folder.as_posix()}))
        print(berikutnya(folder) or "selesai")
    elif perintah == "ulang":
        ulang(folder, sys.argv[3])
        print(f"tahap {sys.argv[3]} dan sesudahnya direset")
    else:
        sys.exit("pakai: python -m scripts.tahap berikutnya|ulang <folder> [tahap]")
