#!/usr/bin/env bash
# Siapkan dependensi sekali per mesin/sesi (aman dijalankan berulang).
# Dipakai di komputer sendiri maupun sebagai script setup environment Claude Code di web.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v ffmpeg >/dev/null || { echo "ffmpeg belum terpasang (butuh ffmpeg 6)"; exit 1; }
command -v node >/dev/null || { echo "Node 22 belum terpasang"; exit 1; }
[ -x .venv/bin/python ] || python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt
[ -d template/node_modules ] || npm ci --prefix template --no-audit --no-fund
echo "siap: .venv dan template/node_modules"
