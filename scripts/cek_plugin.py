"""Periksa struktur plugin: manifest valid dan frontmatter agent/skill/perintah lengkap."""
import json
import sys
from pathlib import Path

import yaml

MODEL_DIKENAL = {"opus", "sonnet", "haiku"}


def _frontmatter(path: Path) -> dict | None:
    teks = path.read_text(encoding="utf-8")
    if not teks.startswith("---"):
        return None
    bagian = teks.split("---", 2)
    if len(bagian) < 3:
        return None
    data = yaml.safe_load(bagian[1])
    return data if isinstance(data, dict) else None


def periksa(root: Path) -> list[str]:
    root = Path(root)
    masalah: list[str] = []
    for nama in ("plugin.json", "marketplace.json"):
        p = root / ".claude-plugin" / nama
        try:
            json.loads(p.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as e:
            masalah.append(f".claude-plugin/{nama}: tidak valid ({e.__class__.__name__})")

    wajib = [
        ("agents/*.md", ("name", "description", "model")),
        ("skills/*/SKILL.md", ("name", "description")),
        ("commands/*.md", ("description",)),
    ]
    for pola, kunci in wajib:
        for p in sorted(root.glob(pola)):
            rel = p.relative_to(root).as_posix()
            fm = _frontmatter(p)
            if fm is None:
                masalah.append(f"{rel}: frontmatter hilang")
                continue
            for k in kunci:
                if not fm.get(k):
                    masalah.append(f"{rel}: {k} hilang")
            if "model" in kunci and fm.get("model") and fm["model"] not in MODEL_DIKENAL:
                masalah.append(f"{rel}: model tidak dikenal ({fm['model']})")
    return masalah


if __name__ == "__main__":
    hasil = periksa(Path("."))
    for m in hasil:
        print(m)
    sys.exit(1 if hasil else 0)
