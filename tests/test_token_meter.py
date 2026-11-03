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


def test_per_tahap_dari_waktu_status():
    from scripts.token_meter import per_tahap
    st = {"mulai": "2026-11-02T00:59:00+00:00",
          "tahap": {"naskah": {"keadaan": "lulus", "waktu": "2026-11-02T01:30:00+00:00"},
                    "suara": {"keadaan": "lulus", "waktu": "2026-11-02T06:00:00+00:00"}}}
    h = per_tahap([DATA], st)
    assert set(h) == {"naskah", "suara"}
    total = sum(v["output_tokens"] for v in h.values())
    assert total == hitung([DATA], T("2026-11-02T00:59:00"), T("2026-11-02T06:00:00"))["total"]["output_tokens"]
    assert all("setara_input" in v for v in h.values())


def test_setara_input_memberi_bobot_harga():
    from scripts.token_meter import setara_input
    assert setara_input({"input_tokens": 100, "output_tokens": 10, "cache_creation_input_tokens": 40, "cache_read_input_tokens": 1000}) == 100 + 50 + 50 + 100


def test_log_hanya_proyek_ini(tmp_path):
    from scripts.token_meter import log_proyek
    (tmp_path / "-home-user-sobatambis-marketing/sesi/subagents").mkdir(parents=True)
    (tmp_path / "-home-user-sobatambis-marketing/a.jsonl").write_text("")
    (tmp_path / "-home-user-sobatambis-marketing/sesi/subagents/b.jsonl").write_text("")
    (tmp_path / "-home-user-proyek-lain").mkdir()
    (tmp_path / "-home-user-proyek-lain/c.jsonl").write_text("")
    nama = {p.name for p in log_proyek(tmp_path, Path("/home/user/sobatambis-marketing"))}
    assert nama == {"a.jsonl", "b.jsonl"}
