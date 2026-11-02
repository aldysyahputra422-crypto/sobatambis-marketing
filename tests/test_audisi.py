from scripts.suara import audisi


class _Klien:
    def __init__(self, gagal=False):
        self.gagal = gagal
        self.ditambah = []

    def cari(self, params):
        if self.gagal:
            raise audisi.IzinKurang("voices_read")
        suara = [{"voice_id": f"v{i}", "public_owner_id": f"o{i}", "name": f"Suara {i}", "language": "id" if i != 2 else "en",
                  "accent": "jakarta", "description": "warm", "gender": params.get("gender"), "age": params.get("age")} for i in range(7)]
        return suara

    def tambah(self, owner, voice_id, nama):
        self.ditambah.append(voice_id)
        return f"akun-{voice_id}"

    def tts(self, voice_id, teks):
        return b"ID3" + teks.encode()


def test_filter_bahasa_dan_maks_4():
    hasil = audisi.cari(_Klien(), "arta")
    assert len(hasil) == 4
    assert all(s["language"] == "id" for s in hasil)


def test_izin_kurang_kode_3(tmp_path, capsys):
    assert audisi.main(["arta"], klien=_Klien(gagal=True), folder=tmp_path) == 3
    assert "voices_read" in capsys.readouterr().out


def test_sampel_dan_laporan(tmp_path):
    assert audisi.main(["arta", "ratna"], klien=_Klien(), folder=tmp_path) == 0
    md = (tmp_path / "audisi.md").read_text()
    for nama in ["Suara 0", "Suara 1", "Suara 3", "Suara 4"]:
        assert nama in md
    assert len(list((tmp_path / "arta").glob("*.mp3"))) == 4
    assert "OKE. Aku belajar TUJUH jam!" in md
