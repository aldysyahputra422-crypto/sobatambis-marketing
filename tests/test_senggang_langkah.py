import json
from pathlib import Path

from scripts import tahap
from scripts.senggang import langkah

ROOT = Path(__file__).resolve().parents[1]
TEMPELAN = (ROOT / "tests/data/tempelan_chatgpt.txt").read_text(encoding="utf-8")


def test_langkah_pertama_membuat_prompt_dan_berhenti_untuk_chatgpt(tmp_path):
    h = langkah.maju(tmp_path, topik="struk kasir")
    assert h["kode"] == 6 and (tmp_path / "prompt-chatgpt.md").exists()
    assert "struk kasir" in (tmp_path / "prompt-chatgpt.md").read_text()
    assert "ChatGPT" in h["instruksi"] and "tempelan.txt" in h["instruksi"]
    assert tahap.jalur_folder(tmp_path) == "senggang"


def test_prompt_tidak_ditimpa_pada_panggilan_berikutnya(tmp_path):
    langkah.maju(tmp_path, topik="satu")
    langkah.maju(tmp_path, topik="dua")
    assert "satu" in (tmp_path / "prompt-chatgpt.md").read_text()


def test_tempelan_salah_instruksi_koreksi(tmp_path):
    langkah.maju(tmp_path)
    (tmp_path / "tempelan.txt").write_text(TEMPELAN.replace("[confused]", "[terrified]"), encoding="utf-8")
    h = langkah.maju(tmp_path)
    assert h["kode"] == 6 and "koreksi-chatgpt.md" in h["instruksi"]


def test_tempelan_benar_approval_1_dan_lembar_tempel(tmp_path):
    langkah.maju(tmp_path)
    (tmp_path / "tempelan.txt").write_text(TEMPELAN, encoding="utf-8")
    h = langkah.maju(tmp_path)
    assert h["kode"] == 4 and "disetujui" in h["instruksi"] and "lembar-elevenlabs.md" in h["instruksi"]


def test_setelah_approval_minta_audio(tmp_path):
    langkah.maju(tmp_path)
    (tmp_path / "tempelan.txt").write_text(TEMPELAN, encoding="utf-8")
    langkah.maju(tmp_path)
    n = json.loads((tmp_path / "naskah.json").read_text())
    n["disetujui"] = True
    (tmp_path / "naskah.json").write_text(json.dumps(n))
    h = langkah.maju(tmp_path)
    assert h["kode"] == 5 and "rekaman/" in h["instruksi"] and "arta" in h["instruksi"]


def test_cli_keluar_satu_baris_json(tmp_path, capsys):
    assert langkah.main([str(tmp_path)]) == 6
    assert json.loads(capsys.readouterr().out.strip().splitlines()[-1])["berhenti_di"] == "naskah"


def test_dokumen_alur_menyebut_jalur_senggang():
    baca = lambda p: (ROOT / p).read_text(encoding="utf-8")
    sa, d, cmd = baca("commands/sa-video.md"), baca("agents/direktur-marketing.md"), baca("commands/sa-senggang.md")
    assert "jalur senggang" in sa.lower() and "kode 6" in sa and "/sa-senggang" in sa
    assert "TIDAK didelegasikan" in d and "kode 6" in d
    assert "scripts.senggang.langkah" in cmd and "tempelan.txt" in cmd and "sumber_suara" in cmd
    assert cmd.startswith("---\ndescription:")
