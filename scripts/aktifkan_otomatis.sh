#!/usr/bin/env bash
# Aktifkan otomasi proyek (dijalankan PEMILIK sekali per clone):
#   - hook SessionStart / Stop / PreToolUse, izin perintah pipeline, plugin caveman + ponytail
#   dengan menyalin config/claude-settings.json ke .claude/settings.json.
# Sesudahnya buka ulang Claude Code di folder repo dan pilih "trust" saat ditanya.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .claude
if [ -f .claude/settings.json ] && ! cmp -s config/claude-settings.json .claude/settings.json; then
  cp .claude/settings.json ".claude/settings.json.cadangan-$(date +%Y%m%d%H%M%S)"
  echo "settings lama dicadangkan"
fi
cp config/claude-settings.json .claude/settings.json
chmod +x scripts/hooks/jalankan.sh scripts/setup.sh
echo "otomasi aktif: buka ulang Claude Code di folder ini"
