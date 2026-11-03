"""Dialog SEMENTARA adegan contoh: klip pilot b04 (Bu Ratna) dan b05, b06 (Arta) dari videos/2026-W46/ep01.

Diganti hasil audisi suara Indonesia (scripts/suara/audisi.py) atau rekaman manusia begitu tersedia.
python videos/contoh-fase1/buat_dialog.py  → dialog.wav + transkrip.json di folder ini
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from scripts.mix import _baca, SR  # noqa: E402

PILOT = ROOT / "videos/2026-W46/ep01"
MULAI = {"b04": 0.6, "b05": 4.45, "b06": 6.7}
DURASI = 11.4

status = json.loads((PILOT / "status.json").read_text())["tahap"]["suara"]["detail"]
x = np.zeros(int(DURASI * SR))
transkrip = {}
for b, t0 in MULAI.items():
    klip = _baca(PILOT / status[b]["wav"])
    a = int(t0 * SR)
    x[a:a + len(klip)] += klip[: len(x) - a]
    transkrip[b] = [dict(k, mulai=round(k["mulai"] + t0, 3), selesai=round(k["selesai"] + t0, 3)) for k in status[b]["kata"]]
folder = Path(__file__).parent
sf.write(folder / "dialog.wav", x.astype(np.float32), SR)
(folder / "transkrip.json").write_text(json.dumps(transkrip, ensure_ascii=False, indent=2))
print(folder / "dialog.wav")
