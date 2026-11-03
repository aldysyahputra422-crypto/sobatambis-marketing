import json
import subprocess
from datetime import date
from pathlib import Path

from scripts import riset

HARI = date(2026, 11, 2)


def _topik(**ubah):
    t = {
        "id": "t01",
        "judul": "Kurang tidur sebelum ujian menurunkan daya ingat",
        "pilar": "edukasi_belajar",
        "temuan": "Remaja yang tidur kurang dari 7 jam mengingat materi lebih sedikit keesokan harinya.",
        "sudut_psikologi": "efek perencanaan berlebihan: target besar terasa produktif tapi menguras",
        "ide_episode": "Arta belajar 7 jam tanpa tidur lalu lupa rumus saat ujian.",
        "sumber": [
            {"url": "https://pubmed.ncbi.nlm.nih.gov/12345/", "judul": "Sleep and memory in adolescents", "tanggal": "2024-05-01", "jenis": "fakta"},
            {"url": "https://www.youtube.com/watch?v=abc", "judul": "Video viral belajar 12 jam", "tanggal": "2026-10-25", "jenis": "tren"},
        ],
    }
    t.update(ubah)
    return t


def test_tingkat_sumber_per_domain():
    a = riset.aturan()
    assert riset.tingkat("https://pubmed.ncbi.nlm.nih.gov/1/", a) == "A"
    assert riset.tingkat("https://www.kemdikbud.go.id/main/blog", a) == "A"
    assert riset.tingkat("https://unair.ac.id/berita", a) == "A"
    assert riset.tingkat("https://edukasi.kompas.com/read/x", a) == "B"
    assert riset.tingkat("https://www.youtube.com/watch?v=1", a) == "C"
    assert riset.tingkat("https://blogacak.example.com/x", a) is None


def test_topik_lengkap_lulus():
    assert riset.periksa_topik(_topik(), HARI) == []


def test_fakta_harus_dari_sumber_a_atau_b():
    s = [{"url": "https://www.tiktok.com/@x/video/1", "judul": "x", "tanggal": "2026-10-30", "jenis": "fakta"}]
    m = riset.periksa_topik(_topik(sumber=s), HARI)
    assert any("fakta" in x and "A/B" in x for x in m)


def test_sumber_tak_dikenal_ditolak():
    s = _topik()["sumber"] + [{"url": "https://blogacak.example.com/x", "judul": "x", "tanggal": "2026-10-30", "jenis": "fakta"}]
    assert any("tidak dikenal" in x for x in riset.periksa_topik(_topik(sumber=s), HARI))


def test_tren_basi_ditolak():
    s = [_topik()["sumber"][0], {"url": "https://www.youtube.com/watch?v=abc", "judul": "x", "tanggal": "2026-08-01", "jenis": "tren"}]
    assert any("basi" in x for x in riset.periksa_topik(_topik(sumber=s), HARI))


def test_field_wajib_pilar_dan_tanda_pisah():
    m = riset.periksa_topik(_topik(pilar="lain", sudut_psikologi="", ide_episode="Arta — belajar"), HARI)
    teks = " ".join(m)
    assert "pilar" in teks and "sudut_psikologi" in teks and "—" in teks


def test_cli_periksa_bank(tmp_path):
    p = tmp_path / "bank-topik.json"
    p.write_text(json.dumps({"minggu": "2026-W47", "dibuat": "2026-11-02", "topik": [_topik()]}))
    assert riset.main(["periksa", str(p), "--hari", "2026-11-02"]) == 0
    p.write_text(json.dumps({"minggu": "2026-W47", "dibuat": "2026-11-02", "topik": [_topik(pilar="x")]}))
    assert riset.main(["periksa", str(p), "--hari", "2026-11-02"]) == 1


def test_baca_menolak_situs_wajib_login():
    jalan = []
    r = riset.baca("https://www.instagram.com/p/abc", runner=lambda *a, **k: jalan.append(a))
    assert r["ok"] is False and "login" in r["alasan"] and jalan == []


def test_baca_lewat_agent_reach_dan_dipotong(monkeypatch):
    monkeypatch.setattr(riset, "cli_agent_reach", lambda: "/x/agent-reach")
    keluaran = json.dumps({"ok": True, "result": {"title": "Judul", "content": "a" * 20000}})
    jalan = []

    def runner(cmd, **kw):
        jalan.append(cmd)
        return subprocess.CompletedProcess(cmd, 0, keluaran, "")
    r = riset.baca("https://edukasi.kompas.com/read/x", runner=runner, maks=500)
    assert jalan == [["/x/agent-reach", "read", "https://edukasi.kompas.com/read/x"]]
    assert r["ok"] and len(r["isi"]) <= 520 and r["tingkat"] == "B"


def test_baca_tanpa_agent_reach_kode_3(monkeypatch):
    monkeypatch.setattr(riset, "cli_agent_reach", lambda: None)
    r = riset.baca("https://edukasi.kompas.com/read/x")
    assert r["ok"] is False and "--agent periset-tren" in r["alasan"] and r["kode"] == 3


def test_baris_notion_bank_topik():
    rows = riset.baris_notion({"minggu": "2026-W47", "dibuat": "2026-11-02", "topik": [_topik()]})
    r = rows[0]
    assert r["Topik"].startswith("Kurang tidur") and r["Pilar"] == "edukasi_belajar"
    assert r["Tingkat sumber"] == "A" and "pubmed" in r["Sumber"] and r["Minggu"] == "2026-W47"
