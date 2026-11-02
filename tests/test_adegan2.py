import copy
import json
from pathlib import Path

import jsonschema
import pytest

from scripts import adegan2

ROOT = Path(__file__).resolve().parents[1]
NASKAH = json.loads((ROOT / "tests/data/naskah2_contoh.json").read_text())
SKEMA = json.loads((ROOT / "schemas/adegan2.schema.json").read_text())


def susun(n, kata=0.35):
    """Timing/transkrip sintetis dengan tata letak yang sama seperti tahap suara."""
    timing, transkrip, t = [], {}, 0.0
    for b in n["beat"]:
        if not b["dialog"]:
            t += b.get("durasi", 1.5)
            continue
        t += 0.25 + (1.5 if b["jenis"] == "mengena" else 0)
        for i, d in enumerate(b["dialog"], 1):
            k = f"{b['id']}.{i}"
            w = []
            for x in d["teks"].split():
                w.append({"kata": x, "mulai": round(t, 3), "selesai": round(t + kata, 3)})
                t += kata
            timing.append({"id": k, "mulai": w[0]["mulai"], "selesai": w[-1]["selesai"]})
            transkrip[k] = w
            t += 0.3
    return timing, transkrip


def bangun(n=None):
    n = n or copy.deepcopy(NASKAH)
    timing, transkrip = susun(n)
    return adegan2.bangun(n, timing, transkrip), timing, transkrip


def _kata(transkrip, kunci, kata):
    return next(w["mulai"] for w in transkrip[kunci] if w["kata"].strip(".,!?").upper() == kata)


def test_durasi_ikut_timing():
    a, timing, _ = bangun()
    assert a["durasi"] == pytest.approx(timing[-1]["selesai"] + 0.8, abs=0.01)


def test_beat_visual_dapat_durasi():
    a, timing, _ = bangun()
    tabrak = next(x for x in a["jalur"]["tokoh"]["arta"]["aksi"] if x["aksi"] == "tabrak")
    akhir_t01 = next(t["selesai"] for t in timing if t["id"] == "t01.1")
    assert tabrak["mulai"] == pytest.approx(akhir_t01 + 0.3 + 0.05, abs=0.01)


def test_kamera_bawaan_per_jenis():
    a, timing, tr = bangun()
    k = a["jalur"]["kamera"]
    assert k[0]["jenis"] == "lebar" and k[0]["gerak"] == "dorong" and k[0]["mulai"] == 0
    dekat = [x for x in k if x["jenis"] == "dekat"]
    t_puncak = next(t["mulai"] for t in timing if t["id"] == "t04.1")
    assert any(x["mulai"] <= t_puncak < x["selesai"] for x in dekat)


def test_teks_cap_di_puncak():
    a, _, _ = bangun()
    tujuh = next(x for x in a["jalur"]["teks"] if x["kata"] == "TUJUH")
    assert tujuh["gaya"] == "cap"
    layar = sorted({x["layar"] for x in a["jalur"]["teks"]})
    assert layar == list(range(len(layar))) and len(layar) == sum(len(b["dialog"]) for b in NASKAH["beat"])


def test_sunyi_di_mengena():
    a, timing, _ = bangun()
    s = a["jalur"]["sunyi"][0]
    t7 = next(t for t in timing if t["id"] == "t07.1")
    assert s["mulai"] <= t7["mulai"] and s["selesai"] >= t7["selesai"]
    for m in a["jalur"]["musik"]:
        assert m["selesai"] <= s["mulai"] + 0.01 or m["mulai"] >= s["selesai"] - 0.01


def test_sfx_kontak_otomatis():
    a, _, tr = bangun()
    brak = next(x for x in a["jalur"]["sfx"] if x["nama"] == "brak")
    assert brak["pada"] == pytest.approx(_kata(tr, "t04.1", "TUJUH"), abs=0.01)
    assert any(x["nama"] == "tabrak_kartun" for x in a["jalur"]["sfx"])


def test_transisi_saat_latar_berganti():
    a, timing, _ = bangun()
    t03 = next(t["mulai"] for t in timing if t["id"] == "t03.1") - 0.25
    assert any(x["jenis"] == "coret" and abs(x["pada"] - t03) < 0.01 for x in a["jalur"]["transisi"])


def test_lapis_berubah_per_latar():
    a, _, _ = bangun()
    lapis = a["jalur"]["tokoh"]["arta"]["lapis"]
    assert isinstance(lapis, list) and {x["lapis"] for x in lapis} == {"depan", "belakang"}


def test_aset_tidak_ada():
    n = copy.deepcopy(NASKAH)
    n["beat"][1]["aksi"][0]["aksi"] = "terbang"
    n["beat"][1]["sfx"] = [{"nama": "ledakan_nuklir"}]
    with pytest.raises(adegan2.AsetTidakAda, match="terbang") as e:
        bangun(n)
    assert "ledakan_nuklir" in str(e.value)


def test_hasil_valid_skema():
    a, _, _ = bangun()
    jsonschema.validate(a, SKEMA)


def test_benda_dipegang_dilepas_akhir_beat():
    a, timing, _ = bangun()
    hp = next(p for p in a["jalur"]["properti"] if p["id"] == "hp")
    akhir_t03 = next(t["mulai"] for t in timing if t["id"] == "t04.1") - 0.25
    assert hp["pegang"]["selesai"] == pytest.approx(akhir_t03, abs=0.01)


def test_benda_banting_keluar_saat_latar_berganti():
    a, timing, _ = bangun()
    s = next(p for p in a["jalur"]["properti"] if p["id"] == "sticky_7jam_b")
    assert s["keluar"] == pytest.approx(next(x["mulai"] for x in a["jalur"]["latar"] if x["latar"] == "meja_malam"), abs=0.01)


def test_target_dekat_di_kepala():
    a, _, _ = bangun()
    import yaml
    pg = yaml.safe_load((ROOT / "config/panggung.yaml").read_text())
    k = next(x for x in a["jalur"]["kamera"] if x["jenis"] == "dekat" and x["mulai"] > 10)
    p = pg["latar"]["meja_malam"]["arta"]
    assert k["target"]["y"] == pytest.approx(p["y"] - 452 * pg["skala"]["arta"], abs=2)
