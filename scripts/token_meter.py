"""Hitung token per model dari log sesi Claude Code (~/.claude/projects/**/*.jsonl) dalam rentang waktu."""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from scripts import status

KUNCI = ("input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens")


def _waktu(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def hitung(jsonl_paths: list[Path], mulai: datetime, selesai: datetime) -> dict:
    pesan: dict[str, tuple[str, dict]] = {}  # id pesan -> (model, usage); entri terakhir menang (log streaming berulang)
    for p in jsonl_paths:
        for baris in Path(p).read_text(encoding="utf-8", errors="ignore").splitlines():
            try:
                d = json.loads(baris)
            except json.JSONDecodeError:
                continue
            m = d.get("message") or {}
            if d.get("type") != "assistant" or not m.get("usage") or not d.get("timestamp"):
                continue
            if mulai <= _waktu(d["timestamp"]) <= selesai:
                pesan[m.get("id") or f"{p}:{d['timestamp']}"] = (m.get("model", "?"), m["usage"])
    hasil: dict[str, dict] = {}
    for model, u in pesan.values():
        for nama in (model, "total"):
            acc = hasil.setdefault(nama, {k: 0 for k in KUNCI})
            for k in KUNCI:
                acc[k] += int(u.get(k, 0) or 0)
    return hasil


if __name__ == "__main__":
    folder = Path(sys.argv[1])
    st = status.baca(folder)
    mulai = _waktu(st["mulai"]) if st.get("mulai") else datetime.min.replace(tzinfo=timezone.utc)
    selesai = _waktu(st["selesai"]) if st.get("selesai") else datetime.now(timezone.utc)
    log = list((Path.home() / ".claude/projects").glob("**/*.jsonl"))
    h = hitung(log, mulai, selesai)
    (folder / "token.json").write_text(json.dumps({"mulai": str(mulai), "selesai": str(selesai), "per_model": h}, indent=2), encoding="utf-8")
    print(json.dumps(h.get("total", {}), indent=2))
