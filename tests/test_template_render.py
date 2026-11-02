import subprocess
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TPL = ROOT / "template"


def _still(komposisi: str, keluar: Path, props: Path, frame: int = 0) -> Image.Image:
    subprocess.run(
        ["npx", "remotion", "still", komposisi, str(keluar), f"--props={props}", f"--frame={frame}", "--log=error"],
        cwd=TPL, check=True, timeout=600,
    )
    return Image.open(keluar).convert("RGB")


def _jarak(a, b):
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


@pytest.mark.lambat
def test_cover_render(tmp_path):
    im = _still("Cover", tmp_path / "cover.png", ROOT / "tests/data/cover_props.json")
    assert im.size == (720, 1280)
    assert np.asarray(im).std() > 10
    assert _jarak(im.getpixel((360, 40)), (0xF7, 0xEE, 0xDC)) < 30


@pytest.mark.lambat
def test_episode_frame_marah_berbeda_dari_lelah(tmp_path):
    props = ROOT / "template/public/contoh/props.json"
    marah = np.asarray(_still("Episode", tmp_path / "m.png", props, frame=int(3.0 * 30)), dtype=float)
    lelah = np.asarray(_still("Episode", tmp_path / "l.png", props, frame=int(5.0 * 30)), dtype=float)
    assert marah.shape == (1280, 720, 3)
    assert np.abs(marah - lelah).mean() > 6
