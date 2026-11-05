import re
from pathlib import Path

from scripts import naskah as naskah_mod
from scripts.senggang import impor, prompt, tag

ROOT = Path(__file__).resolve().parents[1]


def test_prompt_membaca_kosakata_dari_yaml_bukan_salinan():
    p = prompt.buat("ep02")
    for nama, t in tag.muat()["tag"].items():
        assert f"[{nama}]" in p
        assert t["emosi"] in p if t["jenis"] == "suara" else True
    assert "BELUM TERVERIFIKASI" in p


def test_prompt_memuat_dunia_aturan_mbis_dan_format_dua_lapis():
    p = prompt.buat("ep02", topik="struk kasir")
    assert "Arta" in p and "Mbis" in p and "Bu Ratna" in p        # dunia + karakter dari story-bible
    assert "maksimal 3 baris" in p.lower() and "Sobat Ambis" in p          # aturan Mbis + kata terlarang
    assert "tanda pisah panjang" in p
    assert "LAPIS A" in p and "LAPIS B" in p                       # dialog bertag + arahan visual
    assert "struk kasir" in p and "ep02" in p
    assert "hook" in p and "2 detik" in p


def test_prompt_memuat_daftar_aset_valid():
    p = prompt.buat("ep02")
    for latar in impor.daftar_aset()["latar"]:
        assert latar in p
    for tokoh, aksi in tag.aksi_tokoh().items():
        assert all(a in p for a in aksi)


def test_ringkasan_komedi_sinkron_dengan_skill():
    skill = (ROOT / "skills/sa-komedi/SKILL.md").read_text(encoding="utf-8")
    assert "Apa ekspektasi yang dibalik" in skill and "ekspektasi yang dibalik" in prompt.buat("ep02")


def test_prompt_tidak_memuat_bagian_claude_only():
    p = prompt.buat("ep02")
    assert "humanizer" not in p and "stop-slop" not in p and "ElevenLabs v3 atau rekaman" not in p


def test_contoh_beat_lolos_parser_tanpa_galat_baris():
    teks = "##EPISODE ep99 | Contoh\n##JUDUL_BERIKUT Contoh berikut\n" + prompt.CONTOH_BEAT
    penguraian = impor._Penguraian(teks)
    penguraian.baca()
    assert penguraian.galat == [], [str(g) for g in penguraian.galat]
    b = penguraian.beat[0]
    assert b["dialog"] and b["aksi"] and b["punchline"]


def test_contoh_beat_hanya_memakai_tag_yang_ada():
    for grup in re.findall(r"\[([^\]:]+)\]", prompt.CONTOH_BEAT):
        for nama in grup.split(","):
            assert nama.strip() in tag.muat()["tag"]


def test_cli_menulis_berkas(tmp_path, capsys):
    folder = tmp_path / "ep03"
    folder.mkdir()
    assert prompt.main([str(folder), "--topik", "uang jajan"]) == 0
    isi = (folder / "prompt-chatgpt.md").read_text()
    assert "uang jajan" in isi and "ep03" in isi
