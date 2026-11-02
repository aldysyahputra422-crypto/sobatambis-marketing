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

3. Dependensi (sekali; aman diulang):

   ```bash
   bash scripts/setup.sh
   ```

   Butuh Python 3.13, Node 22, dan ffmpeg 6. Di Claude Code versi web, isi script setup environment dengan `bash scripts/setup.sh` supaya dependensi terpasang otomatis tiap sesi.

### Yang ada di dalam plugin
- **15 agent**: direktur-marketing dan animator (Opus); penulis-naskah, pembasmi-slop, pemeriksa-fakta, storyboarder, inspektur-frame, desainer-cover, penulis-caption, penjaga-gerbang-qa (Sonnet); sutradara-suara, qa-suara, pencari-skill, akuntan-token, penjadwal-notion (Haiku).
- **4 skill**: `sa-brand` (fakta resmi, harga, CTA), `sa-cerita` (story bible, Arc 1), `sa-katalog` (katalog skill tambahan), `sa-jadwal` (catatan produksi di Notion).
- **3 perintah**: `/sa-video`, `/sa-status`, `/sa-pasang-skill`.

### Konektor
- **Wajib: Notion.** Semua catatan produksi untukmu masuk ke database Notion "Produksi Sobat Ambis": tahap, status, apa yang ditunggu darimu, angka QA, token. Sambungkan di claude.ai → Settings → Connectors → Notion. Database dibuat otomatis saat episode pertama (kamu hanya ditanya halaman induknya). Tanpa Notion, catatan jatuh ke `catatan-notion.md` di folder episode.
- **Opsional, untuk pemeriksa-fakta** bila naskah memuat klaim ilmiah (Ep.1 tidak): salah satu dari Consensus, Elicit, atau SciSpace.
- **Google Drive**: belum dipakai (unggah otomatis masuk rencana berikutnya).
- ElevenLabs bukan konektor: dipakai lewat secret `ELEVENLABS_API_KEY` (lihat `docs/lanjutan-elevenlabs.md`).

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
