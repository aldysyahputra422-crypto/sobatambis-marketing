import json
import shutil
import subprocess
import sys
from pathlib import Path

import jsonschema
import pytest

from scripts.adegan import AsetTidakAda, aset_tersedia, bangun

ROOT = Path(__file__).resolve().parents[1]
N = json.loads((ROOT / "tests/data/naskah_ep01_contoh.json").read_text(encoding="utf-8"))


def _timing():
    t, out = 0.0, []
    for b in N["baris"]:
        d = 0.4 * len(b["teks"].split())
        out.append({"id": b["id"], "mulai": round(t, 3), "selesai": round(t + d, 3), "akhir_jeda": round(t + d + b["jeda_sesudah"], 3)})
        t += d + b["jeda_sesudah"]
    return out


def _transkrip(timing):
    tm = {x["id"]: x for x in timing}
    tr = {}
    for b in N["baris"]:
        kata = b["teks"].split()
        tr[b["id"]] = [{"kata": k, "mulai": tm[b["id"]]["mulai"] + i * 0.4, "selesai": tm[b["id"]]["mulai"] + i * 0.4 + 0.35} for i, k in enumerate(kata)]
    return tr


def test_durasi_sama_timing():
    t = _timing()
    assert bangun(N, t, _transkrip(t))["durasi"] == t[-1]["akhir_jeda"]


def test_kata_caption_ikut_transkrip():
    t = _timing(); tr = _transkrip(t)
    a = bangun(N, t, tr)["adegan"][0]
    assert a["caption"]["kata"] == tr["b01"]


def test_kata_dibagi_rata_bila_tidak_cocok():
    t = _timing()
    a = {x["id"]: x for x in bangun(N, t, _transkrip(t))["adegan"]}["b10"]
    assert a["caption"]["teks"] == "58" and len(a["caption"]["kata"]) == 1
    assert a["caption"]["kata"][0]["mulai"] == a["mulai"] and a["caption"]["kata"][0]["selesai"] == a["selesai"]


def test_latar_tidak_ada_raise():
    n = json.loads(json.dumps(N)); n["baris"][0]["visual"]["latar"] = "kantin"
    t = _timing()
    with pytest.raises(AsetTidakAda, match="kantin"):
        bangun(n, t, _transkrip(t))


def test_properti_tidak_ada_raise():
    n = json.loads(json.dumps(N)); n["baris"][0]["visual"]["properti"] = ["piala_emas"]
    t = _timing()
    with pytest.raises(AsetTidakAda, match="piala_emas"):
        bangun(n, t, _transkrip(t))


def test_aset_tersedia_membaca_template():
    latar, properti = aset_tersedia()
    assert {"kamar", "dinding_sticky", "ruang_tamu", "meja_malam"} <= latar
    assert {"kertas_58", "sticky_7jam", "wa_grup"} <= properti


def test_hasil_valid_skema():
    t = _timing()
    a = bangun(N, t, _transkrip(t))
    jsonschema.validate(a, json.loads((ROOT / "schemas/adegan.schema.json").read_text()))
    assert a["episode"] == "ep01" and a["judul"] == "Rencana Sempurna"
    assert a["penutup"]["judul_berikut"].startswith("Ep.2")


def test_cli_menulis_file(tmp_path):
    shutil.copy(ROOT / "tests/data/naskah_ep01_contoh.json", tmp_path / "naskah.json")
    t = _timing()
    (tmp_path / "timing.json").write_text(json.dumps(t))
    (tmp_path / "transkrip.json").write_text(json.dumps(_transkrip(t)))
    r = subprocess.run([sys.executable, "-m", "scripts.adegan", str(tmp_path)], capture_output=True, cwd=ROOT)
    assert r.returncode == 0, r.stdout + r.stderr
    assert json.loads((tmp_path / "adegan.json").read_text())["durasi"] == t[-1]["akhir_jeda"]
