from datetime import datetime, timezone
from pathlib import Path

from scripts.token_meter import hitung

DATA = Path(__file__).parent / "data/sesi_contoh.jsonl"
T = lambda s: datetime.fromisoformat(s).replace(tzinfo=timezone.utc)


def test_hitung_per_model_dan_buang_duplikat():
    h = hitung([DATA], T("2026-11-02T00:59:00"), T("2026-11-02T02:00:00"))
    assert h["claude-opus-5-5"] == {"input_tokens": 10, "output_tokens": 120, "cache_creation_input_tokens": 1000, "cache_read_input_tokens": 5000}
    assert h["claude-haiku-5-5"]["output_tokens"] == 30
    assert h["total"]["output_tokens"] == 150


def test_di_luar_rentang_diabaikan():
    h = hitung([DATA], T("2026-11-02T04:00:00"), T("2026-11-02T06:00:00"))
    assert set(h) == {"claude-opus-5-5", "total"} and h["total"]["input_tokens"] == 999


def test_baris_rusak_dilewati(tmp_path):
    p = tmp_path / "x.jsonl"
    p.write_text(DATA.read_text() + "{rusak\n")
    assert hitung([p], T("2026-11-02T00:59:00"), T("2026-11-02T02:00:00"))["total"]["output_tokens"] == 150
