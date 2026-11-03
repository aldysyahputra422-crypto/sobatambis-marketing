import json
import shutil
import subprocess
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TPL = ROOT / "template"


@pytest.mark.lambat
def test_adegan2_tiga_frame_berbeda(tmp_path):
    uji = TPL / "public/uji"
    uji.mkdir(parents=True, exist_ok=True)
    shutil.copy(ROOT / "tests/data/adegan2_contoh.json", uji / "adegan2.json")
    props = tmp_path / "p.json"
    props.write_text(json.dumps({"adeganFile": "uji/adegan2.json", "dialogFile": "contoh/suara.mp3", "mixFile": "contoh/suara.mp3"}))
    hasil = []
    for fr in (10, 45, 80):
        out = tmp_path / f"{fr}.png"
        subprocess.run(["npx", "remotion", "still", "AdeganV2", str(out), f"--props={props}", f"--frame={fr}", "--log=error"],
                       cwd=TPL, check=True, timeout=600)
        im = Image.open(out).convert("RGB")
        assert im.size == (720, 1280)
        a = np.asarray(im, dtype=float)
        assert a.std() > 10
        hasil.append(a)
    assert np.abs(hasil[0] - hasil[1]).mean() > 3 and np.abs(hasil[1] - hasil[2]).mean() > 3
