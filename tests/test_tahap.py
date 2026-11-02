from scripts import status, tahap


def test_berikutnya_urut(tmp_path):
    assert tahap.berikutnya(tmp_path) == "naskah"
    status.tandai(tmp_path, "naskah", "lulus")
    assert tahap.berikutnya(tmp_path) == "suara"


def test_berikutnya_mencatat_waktu_mulai_sekali(tmp_path):
    tahap.berikutnya(tmp_path)
    awal = status.baca(tmp_path)["mulai"]
    tahap.berikutnya(tmp_path)
    assert status.baca(tmp_path)["mulai"] == awal


def test_ulang_mereset_tahap_sesudahnya(tmp_path):
    for t in ("naskah", "suara", "adegan", "render"):
        status.tandai(tmp_path, t, "lulus")
    tahap.ulang(tmp_path, "adegan")
    assert status.sudah_lulus(tmp_path, "suara")
    assert not status.sudah_lulus(tmp_path, "adegan") and not status.sudah_lulus(tmp_path, "render")
    assert tahap.berikutnya(tmp_path) == "adegan"


def test_semua_lulus_none(tmp_path):
    for t in status.TAHAP:
        status.tandai(tmp_path, t, "lulus")
    assert tahap.berikutnya(tmp_path) is None
