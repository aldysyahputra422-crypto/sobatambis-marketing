import json
from pathlib import Path

import jsonschema
import pytest

from scripts import naskah as naskah_mod
from scripts.senggang import impor

ROOT = Path(__file__).resolve().parents[1]
TEMPELAN = (ROOT / "tests/data/tempelan_chatgpt.txt").read_text(encoding="utf-8")


def _ubah(lama, baru, teks=TEMPELAN):
    assert lama in teks, lama
    return teks.replace(lama, baru, 1)


def _baris_ke(teks, potongan):
    return next(i for i, b in enumerate(teks.splitlines(), 1) if potongan in b)


def test_tempelan_contoh_menjadi_naskah_valid():
    h = impor.impor_teks(TEMPELAN)
    assert h.galat == [], [str(g) for g in h.galat]
    n = h.naskah
    jsonschema.validate(n, naskah_mod.SKEMA2)
    assert (n["episode"], n["judul"], n["judul_berikut"]) == ("ep02", "Struk dari Neraka Kasir", "Namaku di Mana-Mana")
    assert n["jalur"] == "senggang" and n["sumber_suara"] == "manual" and n["disetujui"] is False
    assert [b["id"] for b in n["beat"]] == [f"t0{i}" for i in range(1, 8)]
    assert naskah_mod.periksa_beat(n) == []


def test_dialog_membawa_tag_emosi_ekspresi_dan_teks_bersih():
    n = impor.impor_teks(TEMPELAN).naskah
    d = n["beat"][1]["dialog"][0]
    assert d["teks"] == "Tiba-tiba, mesin kasir mencetak struk dengan sendirinya."
    assert (d["arah"], d["tag"], d["penutur"]) == ("tense, slowly", "[tense] [slowly]", "arta")
    assert d["ekspresi"] == "lirik"
    assert n["beat"][1]["emosi"] == "tertekan" and n["beat"][1]["intensitas"] == 6


def test_tag_aksi_inline_masuk_aksi_bukan_dialog():
    n = impor.impor_teks(TEMPELAN).naskah
    t02 = n["beat"][1]
    assert "[" not in t02["dialog"][0]["teks"]
    assert {"tokoh": "arta", "aksi": "lompat", "pada_kata": "sendirinya"} in t02["aksi"]
    assert any(a["aksi"] == "banting" for a in n["beat"][3]["aksi"])


def test_beat_emosi_dari_baris_paling_kuat():
    n = impor.impor_teks(TEMPELAN).naskah
    assert (n["beat"][3]["emosi"], n["beat"][3]["intensitas"]) == ("marah", 9)
    assert n["beat"][2]["emosi"] == "misterius"  # ominous 7 mengalahkan confused 3


def test_narasi_dibuang_dengan_peringatan():
    h = impor.impor_teks(TEMPELAN)
    assert any("narasi" in p.pesan for p in h.peringatan)


def test_peringatan_tag_belum_terverifikasi():
    h = impor.impor_teks(TEMPELAN)
    assert any("belum terverifikasi" in p.pesan and "tense" in p.pesan for p in h.peringatan)


def test_tag_tak_dikenal_galat_per_baris_dengan_daftar():
    t = _ubah("[confused] Namaku", "[terrified] Namaku")
    h = impor.impor_teks(t)
    assert h.naskah is None
    g = [x for x in h.galat if "terrified" in x.pesan]
    assert len(g) == 1 and g[0].baris == _baris_ke(t, "[terrified]") and "tense" in g[0].pesan


def test_baris_tanpa_tag_ditolak():
    t = _ubah("ARTA: [sighs] Ternyata", "ARTA: Ternyata")
    g = impor.impor_teks(t).galat
    assert [x.baris for x in g] == [_baris_ke(t, "ARTA: Ternyata")] and "tanpa tag" in g[0].pesan


def test_mbis_lebih_dari_tiga_baris():
    t = _ubah("ARTA: [gasps] KUCINGNYA NGOMONG?!", "MBIS: [warm] Satu lagi.\nMBIS: [warm] Dan satu lagi.\nARTA: [gasps] KUCINGNYA NGOMONG?!")
    g = impor.impor_teks(t).galat
    mbis = [x for x in g if "Mbis maksimal 3" in x.pesan]
    assert mbis and mbis[0].baris == _baris_ke(t, "Dan satu lagi")  # Mbis ke-4


def test_kata_terlarang_mbis_per_baris():
    t = _ubah("Kasirnya cuma mengingatkan.", "Daftar di Sobat Ambis sekarang.")
    g = [x for x in impor.impor_teks(t).galat if "Mbis tidak boleh" in x.pesan]
    assert len(g) == 1 and g[0].baris == _baris_ke(t, "Daftar di Sobat")


def test_tanda_pisah_panjang_per_baris():
    t = _ubah("Ternyata total belanjaku nol.", "Ternyata total belanjaku — nol.")
    g = [x for x in impor.impor_teks(t).galat if "tanda pisah panjang" in x.pesan]
    assert len(g) == 1 and g[0].baris == _baris_ke(t, "belanjaku —")


def test_semua_galat_dikembalikan_sekaligus():
    t = _ubah("[confused]", "[terrified]")
    t = _ubah("ARTA: [sighs]", "ARTA:", t)
    t = _ubah("LATAR: ruang_tamu", "LATAR: planet_mars", t)
    g = impor.impor_teks(t).galat
    assert len(g) >= 3 and len({x.baris for x in g}) >= 3


def test_aturan_cerita_dipetakan_ke_beat():
    t = _ubah("##BEAT t01 hook", "##BEAT t01 lucu")
    g = impor.impor_teks(t).galat
    assert any("beat pertama harus hook" in x.pesan and x.baris == _baris_ke(t, "##BEAT t01") for x in g)


def test_hook_kepanjangan_ditangkap_gerbang_periksa_beat():
    t = _ubah("ARTA: [curious] Kok kasirnya hidup?", "ARTA: [curious] Tiba-tiba mesin kasir mencetak struk sendiri")
    assert any("hook" in x.pesan for x in impor.impor_teks(t).galat)


def test_aksi_tak_dikenal_dan_penutur_tak_dikenal():
    t = _ubah("AKSI: arta lemas", "AKSI: arta terbang")
    t = _ubah("MBIS: [ominous, slowly]", "KUCING: [ominous]", t)
    pesan = " ".join(x.pesan for x in impor.impor_teks(t).galat)
    assert "terbang" in pesan and "KUCING" in pesan


def test_toleran_gaya_chatgpt():
    t = "```\n" + TEMPELAN.replace("DIALOG:", "**DIALOG:**").replace("ARTA:", "- **ARTA:**").replace("##BEAT t01", "## BEAT t01") + "\n```"
    h = impor.impor_teks(t)
    assert h.galat == [], [str(g) for g in h.galat]
    assert h.naskah["beat"][0]["dialog"][0]["teks"] == "Kok kasirnya hidup?"


def test_cli_menulis_naskah_dan_koreksi(tmp_path, capsys):
    (tmp_path / "tempelan.txt").write_text(TEMPELAN, encoding="utf-8")
    assert impor.main([str(tmp_path)]) == 0
    assert json.loads((tmp_path / "naskah.json").read_text())["jalur"] == "senggang"
    salah = _ubah("[confused]", "[terrified]")
    (tmp_path / "tempelan.txt").write_text(salah, encoding="utf-8")
    assert impor.main([str(tmp_path)]) == 1
    out = capsys.readouterr().out
    assert f"baris {_baris_ke(salah, '[terrified]')}" in out
    koreksi = (tmp_path / "koreksi-chatgpt.md").read_text()
    assert "terrified" in koreksi and "[terrified] Namaku" in koreksi


def test_cli_tidak_menimpa_naskah_yang_sudah_disetujui(tmp_path):
    (tmp_path / "tempelan.txt").write_text(TEMPELAN, encoding="utf-8")
    assert impor.main([str(tmp_path)]) == 0
    n = json.loads((tmp_path / "naskah.json").read_text())
    n["disetujui"] = True
    (tmp_path / "naskah.json").write_text(json.dumps(n))
    assert impor.main([str(tmp_path)]) == 7
    assert json.loads((tmp_path / "naskah.json").read_text())["disetujui"] is True
    assert impor.main([str(tmp_path), "--timpa"]) == 0


def test_skema_menerima_jalur_dan_sumber_manual():
    n = impor.impor_teks(TEMPELAN).naskah
    jsonschema.validate(n, naskah_mod.SKEMA2)
    n["sumber_suara"] = "robot"
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(n, naskah_mod.SKEMA2)
