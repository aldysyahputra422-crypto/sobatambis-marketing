"""Akses lewat Tailscale: nama host *.ts.net diizinkan hanya bila diminta, dan perintah memakai `tailscale serve` (bukan funnel)."""
import os
import shutil
import socket
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
KANTOR = ROOT / "kantor/runtime/bin/kantor.sh"
pytestmark = pytest.mark.skipif(shutil.which("node") is None or shutil.which("curl") is None, reason="butuh node dan curl")


def _port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _siapkan(tmp_path, tailscale_aktif=False):
    proyek = tmp_path / "proyek"
    (proyek / ".claude").mkdir(parents=True)
    if tailscale_aktif:
        (proyek / ".claude/kantor-agent.json").write_text('{"tailscale": true}')
    palsu = tmp_path / "bin"
    palsu.mkdir()
    log = tmp_path / "tailscale.log"
    (palsu / "tailscale").write_text(
        '#!/usr/bin/env bash\n'
        f'echo "$@" >> "{log}"\n'
        'if [ "$1 $2" = "serve status" ]; then echo "https://kantor-pc.tail1234.ts.net (tailnet only)"; fi\n'
    )
    (palsu / "tailscale").chmod(0o755)
    env = {**os.environ, "PATH": f"{palsu}:{os.environ['PATH']}", "KANTOR_STATE_DIR": str(tmp_path / "state"), "CLAUDE_CONFIG_DIR": str(tmp_path / "claude")}
    return proyek, env, log


def _host(port, nama):
    r = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-H", f"Host: {nama}", f"http://127.0.0.1:{port}/kerja/api/ping"], capture_output=True, text=True, timeout=10)
    return r.stdout


def _hentikan(proyek, env):
    subprocess.run(["bash", str(KANTOR), "stop", "--project", str(proyek)], env=env, capture_output=True, timeout=30)


def test_host_tailnet_ditolak_bila_tidak_diminta(tmp_path):
    proyek, env, _ = _siapkan(tmp_path)
    port = _port()
    subprocess.run(["bash", str(KANTOR), "start", "--quiet", "--port", str(port), "--project", str(proyek)], env=env, check=True, capture_output=True, timeout=60)
    try:
        assert _host(port, "kantor-pc.tail1234.ts.net") == "421"
        assert _host(port, "127.0.0.1") == "200"
    finally:
        _hentikan(proyek, env)


def test_host_tailnet_diizinkan_dengan_config(tmp_path):
    proyek, env, _ = _siapkan(tmp_path, tailscale_aktif=True)
    port = _port()
    subprocess.run(["bash", str(KANTOR), "start", "--quiet", "--port", str(port), "--project", str(proyek)], env=env, check=True, capture_output=True, timeout=60)
    try:
        assert _host(port, "kantor-pc.tail1234.ts.net") == "200"
        assert _host(port, "evil.example.com") == "421"
    finally:
        _hentikan(proyek, env)


def test_perintah_tailscale_memakai_serve_tailnet_saja(tmp_path):
    proyek, env, log = _siapkan(tmp_path)
    port = _port()
    r = subprocess.run(["bash", str(KANTOR), "tailscale", "--port", str(port), "--project", str(proyek)], env=env, capture_output=True, text=True, timeout=60)
    try:
        assert r.returncode == 0, r.stderr
        panggilan = log.read_text().splitlines()
        assert f"serve --bg --https=443 localhost:{port}" in panggilan
        assert not any("funnel" in p for p in panggilan), "funnel membuka ke internet; tidak boleh dipakai"
        assert "https://kantor-pc.tail1234.ts.net/kerja" in r.stdout and "tailnet" in r.stdout
        assert _host(port, "kantor-pc.tail1234.ts.net") == "200", "perintah tailscale harus mengizinkan host .ts.net walau config tidak diatur"
        s = subprocess.run(["bash", str(KANTOR), "tailscale-stop", "--project", str(proyek)], env=env, capture_output=True, text=True, timeout=30)
        assert s.returncode == 0
        assert f"serve --https=443 localhost:{port} off" in log.read_text().splitlines()
    finally:
        _hentikan(proyek, env)


def test_tanpa_tailscale_pesan_jelas(tmp_path):
    proyek, env, _ = _siapkan(tmp_path)
    env["PATH"] = "/usr/bin:/bin"  # tanpa tailscale palsu
    if shutil.which("tailscale", path=env["PATH"]):
        pytest.skip("tailscale asli terpasang")
    node_dir = str(Path(shutil.which("node")).parent)
    env["PATH"] = f"{node_dir}:{env['PATH']}"
    r = subprocess.run(["bash", str(KANTOR), "tailscale", "--project", str(proyek)], env=env, capture_output=True, text=True, timeout=30)
    assert r.returncode != 0 and "Tailscale belum terpasang" in r.stderr
