import json
import subprocess
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TPL = ROOT / "template"


@pytest.mark.lambat
@pytest.mark.parametrize("tokoh", ["arta", "ratna", "mbis"])
def test_rig_render_tidak_kosong_dan_pose_berbeda(tmp_path, tokoh):
    hasil = []
    for i, pose in enumerate(["dasar", "ekstrem"]):
        props = tmp_path / f"p{i}.json"
        props.write_text(json.dumps({"tokoh": tokoh, "variasi": pose}))
        keluar = tmp_path / f"{pose}.png"
        subprocess.run(["npx", "remotion", "still", "RigTokoh", str(keluar), f"--props={props}", "--log=error"],
                       cwd=TPL, check=True, timeout=600)
        im = Image.open(keluar).convert("RGB")
        assert im.size == (720, 1280)
        a = np.asarray(im, dtype=float)
        assert a.std() > 10
        hasil.append(a)
    assert np.abs(hasil[0] - hasil[1]).mean() > 3
