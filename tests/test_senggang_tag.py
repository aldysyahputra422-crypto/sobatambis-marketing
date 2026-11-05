import re
from pathlib import Path

import pytest

from scripts.senggang import tag
from scripts.suara.produksi import TAG_KUAT

ROOT = Path(__file__).resolve().parents[1]
EMOSI = {"semangat", "marah", "tertekan", "lelah", "hancur", "kaget", "misterius", "hangat", "datar"}


def _rig(fungsi):
    """Nama ekspresi dari kode rig, supaya YAML tidak menyimpang dari animasi."""
    kode = (ROOT / "template/src/sistem/gambar.ts").read_text(encoding="utf-8")
    awal = kode.index(f"function {fungsi}")
    return set(re.findall(r"case '(\w+)'", kode[awal:awal + 4000]))


def test_tag_usulan_pemilik_ada():
    k = tag.muat()
    for nama in ("tense", "curious", "slowly", "ominous", "confused"):
        assert nama in k["tag"]


def test_setiap_tag_valid_terhadap_skema_dan_rig():
    k = tag.muat()
    orang = _rig("eyesInner")
    assert orang, "daftar ekspresi rig tidak terbaca"
    for nama, t in k["tag"].items():
        assert t["jenis"] in ("suara", "pengubah"), nama
        assert t["terverifikasi"] in ("dokumentasi", "belum"), nama
        assert re.fullmatch(r"\[[^\]]+\]", t["elevenlabs"]), nama
        if t["jenis"] == "suara":
            assert t["emosi"] in EMOSI, nama
            assert 1 <= t["intensitas"] <= 10, nama
            assert t["ekspresi"]["orang"] in orang, nama
            assert t["ekspresi"]["mbis"] in {"senang", "intip", "datar", "tutup"}, nama
        else:
            assert isinstance(t["delta"], int), nama


def test_tag_kuat_lama_tercakup():
    dipakai = {t["elevenlabs"] for t in tag.muat()["tag"].values()}
    assert set(TAG_KUAT.values()) <= dipakai


def test_tag_belum_terverifikasi_punya_cadangan_atau_alasan():
    for nama, t in tag.muat()["tag"].items():
        if t["terverifikasi"] == "belum":
            assert t.get("cadangan"), f"{nama} belum terverifikasi dan tanpa cadangan"


def test_uraikan_menggabung_tag_dan_pengubah():
    h = tag.uraikan("tense, slowly")
    assert h["emosi"] == "tertekan" and h["tag_audio"] == "[tense] [slowly]" and h["arah"] == "tense, slowly"
    assert h["intensitas"] == tag.muat()["tag"]["tense"]["intensitas"]


def test_uraikan_pengubah_menggeser_intensitas_dan_dijepit():
    dasar = tag.uraikan("shouting")["intensitas"]
    assert tag.uraikan("shouting, loudly")["intensitas"] == min(10, dasar + 2)


def test_uraikan_tag_tak_dikenal_ditolak_dengan_daftar():
    with pytest.raises(tag.TagTidakDikenal) as e:
        tag.uraikan("tense, terrified")
    assert "terrified" in str(e.value) and "tense" in str(e.value)


def test_uraikan_tanpa_tag_emosi_ditolak():
    with pytest.raises(tag.TagTidakDikenal):
        tag.uraikan("slowly")


def test_uraikan_huruf_besar_dan_spasi_toleran():
    assert tag.uraikan("  Tense ,SLOWLY ")["tag_audio"] == "[tense] [slowly]"


def test_aksi_tokoh_dibaca_dari_template():
    a = tag.aksi_tokoh()
    assert "banting" in a["arta"] and "ngintip" in a["mbis"] and "menghela" in a["ratna"]
