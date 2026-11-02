# Lanjutan khusus ElevenLabs (dikerjakan di akun utama)

Ditunda sampai pemilik berlangganan ElevenLabs. Kerjakan berurutan, minta izin pemilik sebelum memakai kredit.

## 0. Prasyarat pemilik
- Paket ElevenLabs berbayar (Starter atau lebih tinggi: lisensi komersial + suara pustaka lewat API).
- Kunci API baru sebagai secret `ELEVENLABS_API_KEY` dengan izin: `text_to_speech`, `voices_read`, `voices_write`, `sound_generation`, `user_read`, `music_generation`.

## 1. Audisi suara Indonesia
- `python -m scripts.suara.audisi arta ratna mbis` → `audisi/<tokoh>/*.mp3` + `audisi/audisi.md` (tidak menambah suara ke akun).
- Pemilik mendengar dan memilih satu per tokoh; tulis `voice_id` di `config/suara.yaml` (ganti `ISI_VOICE_ID_*`).
- Catatan dari pilot: suara bawaan ElevenLabs berlogat Inggris dan terdengar datar; pilih suara pustaka berbahasa Indonesia. Uji juga mode dialog (`text-to-dialogue`) dengan satu beat Ep.1 sebelum produksi penuh.

## 2. SFX berlisensi komersial
- `python -m scripts.aset sfx --ulang` membangun ulang 12 SFX di `aset/sfx/` (yang sekarang dibuat di akun gratis = nonkomersial). Periksa kolom `lisensi` di `aset/sfx/katalog.yaml` berubah menjadi `elevenlabs-<paket>-komersial`.
- Tambah SFX yang belum ada bila naskah membutuhkannya (contoh dari spec: `alarm` untuk gag jam 04.00).

## 3. Musik
- Belum ada script ElevenLabs Music. Buat `python -m scripts.aset musik` (endpoint `POST /v1/music`) dengan prompt per trek di `aset/musik/katalog.yaml`: `ceria_konyol`, `tegang_naik`, `tema_mbis`, `piano_sunyi`, `penutup_bersambung`. Simpan `sumber` dan `lisensi`, hapus `sementara: true`.
- Ikuti pola `scripts/aset.py` (klien yang bisa dipalsukan untuk test, kode keluar 3 bila izin kurang) dan tambahkan test di `tests/test_mix.py`/`tests/test_aset.py`.

## 4. Produksi Ep.1
- Isi `"sumber_suara": "elevenlabs"` (atau `"manusia"` bila pemilik memilih rekaman sendiri) di `videos/2026-W46/ep01-v2/naskah.json`, lalu `/sa-video videos/2026-W46/ep01-v2`.
- Klien `scripts/suara/v2.py` baru diuji dengan respons palsu; periksa format respons `text-to-dialogue` yang sebenarnya pada percobaan pertama.

## Tidak butuh ElevenLabs (bisa kapan saja)
- Jalur rekaman manusia: `"sumber_suara": "manusia"` → `/sa-video` menulis `lembar-rekaman.md`; rekam `rekaman/arta.m4a`, `rekaman/ratna.m4a`, `rekaman/mbis.m4a`.
