"""Logika kursi pemilik (JS, kantor/) harus identik dengan scripts/notion_catatan.py (Python), dan test node ikut dijalankan."""
import json
import shutil
import subprocess
from pathlib import Path

import pytest

from scripts import notion_catatan, status

ROOT = Path(__file__).resolve().parents[1]
pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="Node tidak terpasang")

JS = """
import { ringkasProduksi, TAHAP } from './kantor/runtime/lib/node/marketing.mjs';
const r = ringkasProduksi(process.argv[1]);
console.log(JSON.stringify({ tahap: TAHAP, Status: r.status, Tahap: r.tahap, Butuh: r.butuh, Episode: r.episode }));
"""


def _js(folder: Path) -> dict:
    out = subprocess.run(["node", "--input-type=module", "-e", JS, str(folder)], cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def _siapkan(tmp, naskah, tahap):
    (tmp / "naskah.json").write_text(json.dumps(dict({"episode": "ep01", "judul": "Rencana Sempurna", "beat": []}, **naskah)))
    for t, (keadaan, info) in tahap.items():
        status.tandai(tmp, t, keadaan, **info)


KASUS = {
    "naskah_belum_disetujui": ({"disetujui": False}, {}),
    "sumber_suara_belum_dipilih": ({"disetujui": True}, {"naskah": ("lulus", {})}),
    "dialog_ok": ({"disetujui": True, "sumber_suara": "manusia"}, {"naskah": ("lulus", {}), "suara": ("lulus", {})}),
    "rekam_ulang": ({"disetujui": True, "sumber_suara": "manusia"},
                    {"naskah": ("lulus", {}), "suara": ("butuh_rekam_ulang", {"baris_tersisa": ["t04.1", "t09.2"]})}),
    "gagal": ({"disetujui": True, "sumber_suara": "manusia"}, {"naskah": ("lulus", {}), "suara": ("gagal", {"alasan": "emosi belum terdengar"})}),
    "butuh_persetujuan_alasan": ({"disetujui": True, "sumber_suara": "elevenlabs"},
                                 {"naskah": ("lulus", {}), "suara": ("butuh_persetujuan", {"alasan": "kredit ElevenLabs kurang"})}),
    "berjalan": ({"disetujui": True, "sumber_suara": "manusia"},
                 {t: ("lulus", {}) for t in ("naskah", "suara", "dialog_ok", "adegan")}),
    "video_ok": ({"disetujui": True, "sumber_suara": "manusia"}, {t: ("lulus", {}) for t in status.TAHAP[:10]}),
    "siap_posting": ({"disetujui": True, "sumber_suara": "manusia"}, {t: ("lulus", {}) for t in status.TAHAP}),
}


def test_daftar_tahap_sama():
    assert _js(ROOT)["tahap"] == list(status.TAHAP)


@pytest.mark.parametrize("nama", KASUS)
def test_pemilik_js_sama_dengan_python(nama, tmp_path):
    naskah, tahap = KASUS[nama]
    _siapkan(tmp_path, naskah, tahap)
    py = notion_catatan.ringkas(tmp_path)["properti"]
    js = _js(tmp_path)
    assert (js["Status"], js["Tahap"], js["Butuh"], js["Episode"]) == (py["Status"], py["Tahap"], py["Butuh dari pemilik"], py["Episode"])


def test_semua_test_node_lulus():
    r = subprocess.run(["node", "--test", *map(str, sorted((ROOT / "kantor/test").glob("*.test.mjs")))], cwd=ROOT, capture_output=True, text=True)
    assert r.returncode == 0, r.stdout[-1500:]


def test_roster_sama_dengan_agent_repo():
    roster = json.loads((ROOT / "kantor/runtime/roster.json").read_text(encoding="utf-8"))
    repo = {p.stem for p in (ROOT / "agents").glob("*.md")}
    assert {a["agent"] for a in roster["agents"]} | {roster["ketua"]["agent"]} == repo
    assert len({a["label"] for a in roster["agents"]}) == len(roster["agents"])
