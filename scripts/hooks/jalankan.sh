#!/usr/bin/env bash
# Pembungkus hook proyek: pakai Python .venv repo (siapkan dulu bila belum ada), lalu jalankan scripts/hooks/<nama>.py.
DIR="$(cd "$(dirname "$0")/../.." && pwd)"
NAMA="$1"
if [ ! -x "$DIR/.venv/bin/python" ] && [ "$NAMA" = "mulai" ] && [ -z "$SA_LEWATI_SETUP" ]; then
  bash "$DIR/scripts/setup.sh" >&2 || true
fi
PY="$DIR/.venv/bin/python"; [ -x "$PY" ] || PY="$(command -v python3)"
exec "$PY" "$DIR/scripts/hooks/$NAMA.py"
