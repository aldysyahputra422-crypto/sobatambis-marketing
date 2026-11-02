# sobatambis-marketing

Plugin Claude Code: tim marketing agentic Sobat Ambis. Satu perintah mengubah naskah komedi berbentuk beat menjadi video Reels 9:16 dengan tokoh ber-rig (Arta, Bu Ratna, Mbis), suara manusia atau ElevenLabs, musik, SFX, dan QA gerak.

## Pasang di akun utama

Plugin ini menjalankan script Python dan proyek Remotion yang ada di repo, jadi kerjakan di dalam clone repo ini.

1. Clone dan buka Claude Code di foldernya:

   ```bash
   git clone https://github.com/aldysyahputra422-crypto/sobatambis-marketing
   cd sobatambis-marketing
   ```

2. Pasang plugin dari marketplace repo ini (di Claude Code):

   ```
   /plugin marketplace add aldysyahputra422-crypto/sobatambis-marketing
   /plugin install sobatambis-marketing@sobatambis
   ```

3. Dependensi (sekali):

   ```bash
   python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
   npm ci --prefix template
   ```

   Butuh Python 3.13, Node 22, dan ffmpeg 6.

4. Secret `ELEVENLABS_API_KEY` di environment (jangan ditempel di chat). Untuk jalur ElevenLabs penuh, buat kunci di paket **berbayar** dengan izin: `text_to_speech`, `voices_read`, `voices_write`, `sound_generation`, `user_read`, dan `music_generation`. Jalur rekaman manusia tidak butuh kunci untuk suara.

5. Sekali setelah upgrade ElevenLabs:

   ```bash
   .venv/bin/python -m scripts.suara.audisi arta ratna mbis   # pilih suara di audisi/audisi.md, catat voice_id di config/suara.yaml
   .venv/bin/python -m scripts.aset sfx --ulang                # SFX ulang dengan lisensi komersial
   ```

## Pakai

- `/sa-video videos/<minggu>/<episode>` — produksi satu episode. Berhenti di tiga titik persetujuan: naskah + pilihan suara, trek dialog, video final.
- `/sa-status videos/<minggu>/<episode>` — tahap, skor gerak, token.
- `/sa-pasang-skill "<kebutuhan>"` — cari dan pasang skill dari katalog.

### Dua jalur suara

- **Rekaman manusia** (`"sumber_suara": "manusia"`): plugin menulis `lembar-rekaman.md`. Rekam satu file per tokoh ke `rekaman/arta.m4a`, `rekaman/ratna.m4a`, `rekaman/mbis.m4a` (urutan bebas; salah ucap cukup diulang). Plugin membersihkan audio, memotong per baris, dan meminta rekam ulang hanya untuk baris yang hilang (`rekaman/ulang-t04.1.m4a`).
- **ElevenLabs** (`"sumber_suara": "elevenlabs"`): dialog dibuat per beat dengan suara yang dipilih saat audisi.

## Lisensi aset

`aset/sfx` dan `aset/musik` mencatat sumber dan lisensi setiap file. Musik saat ini buatan sendiri (sementara); SFX dibuat di akun gratis (nonkomersial) dan **wajib** dibangun ulang sesudah upgrade sebelum ada video yang diposting. Tahap `gerbang` menolak aset nonkomersial.

## Dokumen

Spec: `docs/superpowers/specs/2026-11-02-perombakan-serial-design.md` · Rencana: `docs/superpowers/plans/` · Cerita: `docs/cerita/` · Contoh adegan: `videos/contoh-fase1/`.
