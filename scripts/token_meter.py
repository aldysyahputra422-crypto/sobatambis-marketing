"""Hitung token per model dari log sesi Claude Code (~/.claude/projects/**/*.jsonl) dalam rentang waktu."""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from scripts import status

ROOT = Path(__file__).resolve().parents[1]
# Bobot harga API relatif terhadap input (perkiraan; Anthropic tidak merinci cara batas Pro dihitung).
BOBOT = {"input_tokens": 1.0, "cache_creation_input_tokens": 1.25, "cache_read_input_tokens": 0.1, "output_tokens": 5.0}

KUNCI = ("input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens")


def _waktu(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def setara_input(u: dict) -> int:
    return round(sum(BOBOT[k] * int(u.get(k, 0) or 0) for k in BOBOT))


def log_proyek(akar: Path | None = None, proyek: Path = ROOT) -> list[Path]:
    """Hanya log sesi proyek ini (termasuk subagent), supaya sesi proyek lain tidak ikut terhitung."""
    akar = Path(akar or Path.home() / ".claude/projects")
    d = akar / re.sub(r"[^A-Za-z0-9]", "-", str(proyek))
    return sorted(d.glob("**/*.jsonl")) if d.is_dir() else sorted(akar.glob("**/*.jsonl"))


def _pesan(jsonl_paths: list[Path]) -> dict[str, tuple[datetime, str, dict]]:
    pesan: dict[str, tuple[datetime, str, dict]] = {}  # id -> (waktu, model, usage); entri terakhir menang (streaming)
    for p in jsonl_paths:
        for baris in Path(p).read_text(encoding="utf-8", errors="ignore").splitlines():
            try:
                d = json.loads(baris)
            except json.JSONDecodeError:
                continue
            m = d.get("message") or {}
            if d.get("type") != "assistant" or not m.get("usage") or not d.get("timestamp"):
                continue
            pesan[m.get("id") or f"{p}:{d['timestamp']}"] = (_waktu(d["timestamp"]), m.get("model", "?"), m["usage"])
    return pesan


def _jumlah(isi) -> dict:
    hasil: dict[str, dict] = {}
    for model, u in isi:
        for nama in (model, "total"):
            acc = hasil.setdefault(nama, {k: 0 for k in KUNCI})
            for k in KUNCI:
                acc[k] += int(u.get(k, 0) or 0)
    return hasil


def hitung(jsonl_paths: list[Path], mulai: datetime, selesai: datetime) -> dict:
    return _jumlah((m, u) for w, m, u in _pesan(jsonl_paths).values() if mulai <= w <= selesai)


def per_tahap(jsonl_paths: list[Path], st: dict) -> dict:
    """Token per tahap: jendela dari tanda tahap sebelumnya (atau `mulai`) sampai tanda tahap itu."""
    tanda = sorted((_waktu(v["waktu"]), t) for t, v in st.get("tahap", {}).items() if v.get("waktu"))
    awal = _waktu(st["mulai"]) if st.get("mulai") else datetime.min.replace(tzinfo=timezone.utc)
    pesan = list(_pesan(jsonl_paths).values())
    hasil = {}
    for w, t in tanda:
        tot = _jumlah((m, u) for x, m, u in pesan if awal < x <= w).get("total")
        tot = tot or {k: 0 for k in KUNCI}
        hasil[t] = dict(tot, setara_input=setara_input(tot))
        awal = w
    return hasil


if __name__ == "__main__":
    folder = Path(sys.argv[1])
    st = status.baca(folder)
    mulai = _waktu(st["mulai"]) if st.get("mulai") else datetime.min.replace(tzinfo=timezone.utc)
    selesai = _waktu(st["selesai"]) if st.get("selesai") else datetime.now(timezone.utc)
    log = log_proyek()
    h = hitung(log, mulai, selesai)
    if "total" in h:
        h["total"]["setara_input"] = setara_input(h["total"])
    tahap = per_tahap(log, st)
    (folder / "token.json").write_text(json.dumps({"mulai": str(mulai), "selesai": str(selesai), "per_model": h, "per_tahap": tahap},
                                                  indent=2), encoding="utf-8")
    print(json.dumps(h.get("total", {})))
    for t, v in sorted(tahap.items(), key=lambda kv: -kv[1]["setara_input"])[:3]:
        print(f"terberat: {t} {v['setara_input']} setara-input")
