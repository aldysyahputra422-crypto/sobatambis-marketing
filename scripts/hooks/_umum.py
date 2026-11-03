"""Bagian bersama hook proyek: lokasi proyek dan impor modul scripts."""
import json
import os
import sys
from pathlib import Path

PROYEK = Path(os.environ.get("CLAUDE_PROJECT_DIR") or Path.cwd())
REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO))


def baca_masukan() -> dict:
    try:
        return json.loads(sys.stdin.read() or "{}")
    except ValueError:
        return {}


def keluar_json(d: dict) -> None:
    print(json.dumps(d, ensure_ascii=False))
