"""Hook PreToolUse (Bash): tidak ada pemakaian API ElevenLabs tanpa izin pemilik (.sa/izin-elevenlabs)."""
import json
import re
import shlex

from _umum import PROYEK, baca_masukan, keluar_json  # noqa: E402

POLA = re.compile(r"scripts\.suara\.audisi|scripts\.aset\b|api\.elevenlabs\.io|scripts/suara/audisi|scripts/aset\.py")


def produksi_elevenlabs(cmd: str) -> bool:
    if "scripts.suara.produksi" not in cmd and "scripts/suara/produksi" not in cmd:
        return False
    try:
        bagian = shlex.split(cmd)
    except ValueError:
        bagian = cmd.split()
    for b in bagian:
        n = PROYEK / b / "naskah.json"
        if n.exists():
            try:
                return json.loads(n.read_text()).get("sumber_suara") == "elevenlabs"
            except ValueError:
                return False
    return False


if __name__ == "__main__":
    m = baca_masukan()
    cmd = (m.get("tool_input") or {}).get("command", "")
    if (PROYEK / ".sa/izin-elevenlabs").exists():
        raise SystemExit(0)
    if POLA.search(cmd) or produksi_elevenlabs(cmd):
        keluar_json({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny",
                     "permissionDecisionReason": "Pemakaian ElevenLabs butuh izin pemilik di sesi ini. Tanyakan dulu; bila pemilik setuju, "
                                                 "buat file .sa/izin-elevenlabs berisi persetujuannya, lalu ulangi."}})
