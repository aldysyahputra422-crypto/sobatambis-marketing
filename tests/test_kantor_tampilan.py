"""Uji asap tampilan 3D kantor (butuh Node + Playwright/Chromium; lambat)."""
import json
import os
import shutil
import socket
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
KANTOR = ROOT / "kantor/runtime/bin/kantor.sh"


def _punya_playwright() -> bool:
    if shutil.which("node") is None:
        return False
    return subprocess.run(["node", "-e", "require('playwright')"], capture_output=True).returncode == 0


def _port_bebas() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


pytestmark = [pytest.mark.lambat, pytest.mark.skipif(not _punya_playwright(), reason="Playwright tidak tersedia")]


def test_tampilan_demo_render_dan_karakter_berjalan(tmp_path):
    proyek = tmp_path / "proyek"
    (proyek / ".claude").mkdir(parents=True)
    port = _port_bebas()
    env = {**os.environ, "KANTOR_STATE_DIR": str(tmp_path / "state"), "CLAUDE_CONFIG_DIR": str(tmp_path / "claude")}
    subprocess.run(["bash", str(KANTOR), "start", "--port", str(port), "--project", str(proyek)], env=env, check=True, capture_output=True, timeout=60)
    try:
        r = subprocess.run(["node", str(ROOT / "kantor/test/tampilan.cjs"), f"http://127.0.0.1:{port}"], capture_output=True, text=True, timeout=240, env=env)
        assert r.returncode == 0, r.stderr[-800:]
        h = json.loads(r.stdout.strip().splitlines()[-1])
    finally:
        subprocess.run(["bash", str(KANTOR), "stop", "--project", str(proyek)], env=env, capture_output=True, timeout=30)
    assert h["galat"] == [], h["galat"]
    assert h["info"]["aktor"] == 18 + 1, h["info"]  # 16 agent + direktur + pemilik + 1 freelancer demo
    assert h["info"]["kartu"] == 17 and h["info"]["spanduk"] is True
    assert h["info"]["panggilan"] < 1200, "terlalu banyak draw call (penggabungan geometri rusak?)"
    assert h["gerak"]["segera"]["mode"] == "jalan" and h["gerak"]["segera"]["titik"] > 0
    assert h["gerak"]["jauh"] >= 1.0, "karakter tidak berpindah"
