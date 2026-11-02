"""Baca/tulis status.json per folder video (titik lanjut produksi)."""
import json
import os
from datetime import datetime, timezone
from pathlib import Path

TAHAP = ("naskah", "suara", "adegan", "render", "qa_frame", "kemasan", "gerbang")
KEADAAN = ("lulus", "gagal", "butuh_persetujuan", "berjalan")


def _path(folder: Path) -> Path:
    return Path(folder) / "status.json"


def baca(folder: Path) -> dict:
    p = _path(folder)
    if not p.exists():
        return {"tahap": {}}
    return json.loads(p.read_text(encoding="utf-8"))


def tulis(folder: Path, data: dict) -> None:
    p = _path(folder)
    tmp = p.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, p)


def tandai(folder: Path, tahap: str, keadaan: str, **info) -> None:
    if tahap not in TAHAP:
        raise ValueError(f"tahap tidak dikenal: {tahap}")
    if keadaan not in KEADAAN:
        raise ValueError(f"keadaan tidak dikenal: {keadaan}")
    data = baca(folder)
    data.setdefault("tahap", {})[tahap] = {
        "keadaan": keadaan,
        "waktu": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        **info,
    }
    tulis(folder, data)


def sudah_lulus(folder: Path, tahap: str) -> bool:
    return baca(folder)["tahap"].get(tahap, {}).get("keadaan") == "lulus"
