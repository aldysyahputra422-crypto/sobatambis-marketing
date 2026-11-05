import json
from pathlib import Path

from scripts.senggang import impor, lembar_tempel

ROOT = Path(__file__).resolve().parents[1]
TEMPELAN = (ROOT / "tests/data/tempelan_chatgpt.txt").read_text(encoding="utf-8")


def _folder(tmp_path):
    n = impor.impor_teks(TEMPELAN).naskah
    (tmp_path / "naskah.json").write_text(json.dumps(n, ensure_ascii=False))
    return tmp_path


def test_lembar_per_tokoh_hanya_baris_ucapan_bertag(tmp_path):
    teks = lembar_tempel.tulis(_folder(tmp_path)).read_text(encoding="utf-8")
    assert "## Arta" in teks and "## Mbis" in teks
    assert "## Bu Ratna" not in teks  # tidak berdialog di contoh ini
    assert "[tense] [slowly] Tiba-tiba, mesin kasir mencetak struk dengan sendirinya." in teks
    assert "[ominous] [slowly] Struknya bertuliskan namamu." in teks
    assert "[warm] Kasirnya cuma mengingatkan." in teks


def test_aksi_sfx_narasi_dan_arahan_visual_tidak_ikut(tmp_path):
    teks = lembar_tempel.tulis(_folder(tmp_path)).read_text(encoding="utf-8")
    for terlarang in ("[aksi", "[sfx", "[narasi", "lompat", "tabrak_kartun", "LATAR", "tegang_naik", "menatap struk"):
        assert terlarang not in teks, terlarang


def test_blok_salin_tiap_tokoh_tidak_bercampur_penutur(tmp_path):
    teks = lembar_tempel.tulis(_folder(tmp_path)).read_text(encoding="utf-8")
    blok = {}
    for bagian in teks.split("\n## ")[1:]:
        nama = bagian.split("\n", 1)[0].strip()
        if "```text" not in bagian:
            continue
        blok[nama] = bagian.split("```text\n", 1)[1].split("```", 1)[0]
    assert "Struknya bertuliskan" not in blok["Arta"] and "Kok kasirnya hidup" not in blok["Mbis"]
    assert blok["Arta"].count("\n\n") == 6  # 7 baris Arta, dipisah baris kosong


def test_nomor_baris_dari_daftar_dialog(tmp_path):
    teks = lembar_tempel.tulis(_folder(tmp_path)).read_text(encoding="utf-8")
    assert "t01.1" in teks and "t03.1" in teks and "t03.2" in teks and "t07.2" in teks
    assert "ulang-t03.1" in teks  # cara kirim ulang satu baris


def test_catatan_tag_belum_terverifikasi_dengan_cadangan(tmp_path):
    teks = lembar_tempel.tulis(_folder(tmp_path)).read_text(encoding="utf-8")
    assert "belum terverifikasi" in teks.lower() and "tense" in teks and "[whispers]" in teks
