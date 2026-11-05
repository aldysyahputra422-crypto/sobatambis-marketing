import json
from pathlib import Path

from scripts import status, tahap

ROOT = Path(__file__).resolve().parents[1]
TEMPELAN = (ROOT / "tests/data/tempelan_chatgpt.txt").read_text(encoding="utf-8")


def test_jalur_bawaan_otomatis(tmp_path):
    assert tahap.jalur_folder(tmp_path) == "otomatis"


def test_jalur_dari_status_dan_naskah(tmp_path):
    tahap.set_jalur(tmp_path, "senggang")
    assert tahap.jalur_folder(tmp_path) == "senggang"
    (tmp_path / "naskah.json").write_text(json.dumps({"jalur": "otomatis"}))
    assert tahap.jalur_folder(tmp_path) == "otomatis"  # naskah.json yang menentukan


def test_otomatis_tidak_berubah_berhenti_di_naskah_untuk_penulis(tmp_path):
    h = tahap.jalan(tmp_path)
    assert h["kode"] == 0 and h["berhenti_di"] == "naskah" and "penulis-naskah" in h["pegang"]


def test_senggang_tanpa_tempelan_minta_pemilik(tmp_path):
    tahap.set_jalur(tmp_path, "senggang")
    h = tahap.jalan(tmp_path)
    assert h["kode"] == 6 and h["berhenti_di"] == "naskah" and "tempelan.txt" in h["alasan"]


def test_senggang_tempelan_salah_kembalikan_galat_per_baris(tmp_path):
    tahap.set_jalur(tmp_path, "senggang")
    (tmp_path / "tempelan.txt").write_text(TEMPELAN.replace("[confused]", "[terrified]"), encoding="utf-8")
    h = tahap.jalan(tmp_path)
    assert h["kode"] == 6 and "terrified" in h["alasan"] and "baris" in h["alasan"]
    assert (tmp_path / "koreksi-chatgpt.md").exists()


def test_senggang_tempelan_benar_berhenti_di_approval_1_tanpa_agent_naskah(tmp_path):
    tahap.set_jalur(tmp_path, "senggang")
    (tmp_path / "tempelan.txt").write_text(TEMPELAN, encoding="utf-8")
    h = tahap.jalan(tmp_path)
    assert h["kode"] == 4 and h["berhenti_di"] == "naskah" and "Approval 1" in h["alasan"]
    assert json.loads((tmp_path / "naskah.json").read_text())["disetujui"] is False
    assert (tmp_path / "lembar-elevenlabs.md").exists()  # pemilik bisa menyiapkan suara sambil meninjau
    assert "penulis-naskah" not in json.dumps(h)


def test_senggang_sesudah_approval_lanjut_ke_suara_dan_minta_audio(tmp_path):
    tahap.set_jalur(tmp_path, "senggang")
    (tmp_path / "tempelan.txt").write_text(TEMPELAN, encoding="utf-8")
    tahap.jalan(tmp_path)
    n = json.loads((tmp_path / "naskah.json").read_text())
    n["disetujui"] = True
    (tmp_path / "naskah.json").write_text(json.dumps(n))
    h = tahap.jalan(tmp_path)
    assert h["kode"] == 5 and h["berhenti_di"] == "suara" and "naskah" in h["lulus"]
    assert status.sudah_lulus(tmp_path, "naskah")
