# sobatambis-marketing

Plugin Claude Code: tim marketing agentic Sobat Ambis. Satu perintah mengubah naskah komedi berbentuk beat menjadi video Reels 9:16 dengan tokoh ber-rig (Arta, Bu Ratna, Mbis), suara manusia atau ElevenLabs, musik, SFX, dan QA gerak.

## Pasang di akun utama

Semua agent, skill, perintah, dan hook dimuat langsung dari folder repo (lewat `.claude/`). Tidak perlu merge dan tidak perlu `/plugin install`.

1. Clone branch kerja dan masuk ke foldernya:

   ```bash
   git clone -b desain/spec-awal https://github.com/aldysyahputra422-crypto/sobatambis-marketing
   cd sobatambis-marketing
   ```

2. Aktifkan otomasi (sekali per clone):

   ```bash
   bash scripts/aktifkan_otomatis.sh
   ```

   Ini memasang `.claude/settings.json`: hook SessionStart (dependensi + skill katalog terpasang sendiri + mode hemat token), hook Stop (produksi lanjut sendiri sampai titik persetujuan), hook PreToolUse (ElevenLabs diblokir sampai ada `.sa/izin-elevenlabs`), izin perintah pipeline supaya tidak berhenti minta izin, serta plugin **caveman** dan **ponytail** aktif bawaan.

3. Buka Claude Code di folder itu dan pilih **trust** saat ditanya. Dependensi terpasang sendiri pada sesi pertama (beberapa menit). Jangan memasang plugin `sobatambis-marketing` lewat `/plugin` di folder ini, supaya agent tidak dobel.

   Di Claude Code versi web: pilih repo ini (branch `desain/spec-awal`) saat membuat sesi dan isi script setup environment dengan `bash scripts/setup.sh && bash scripts/aktifkan_otomatis.sh`. Plugin marketplace tidak dimuat di sesi web, tetapi aturan hemat token tetap disuntikkan hook SessionStart.

   Butuh Python 3.13, Node 22, dan ffmpeg 6.

### Yang ada di dalam plugin
- **17 agent**: animator (Opus, hanya untuk aset baru dan perbaikan gerak); direktur-marketing, penulis-naskah, perencana-konten, periset-tren, pembasmi-slop, pemeriksa-fakta, storyboarder, inspektur-frame, desainer-cover, penulis-caption, penjaga-gerbang-qa (Sonnet); sutradara-suara, qa-suara, pencari-skill, akuntan-token, penjadwal-notion (Haiku). Setiap agent punya bagian "Skill dasar" berisi skill terverifikasi yang wajib dimuat.
- **6 skill di repo**: `sa-riset` (riset topik bersumber, tingkat sumber A/B/C), `sa-brand` (fakta resmi, harga, CTA), `sa-cerita` (story bible, Arc 1), `sa-komedi` (teknik komedi sketsa), `sa-katalog` (katalog + pemasangan otomatis), `sa-jadwal` (catatan produksi di Notion).
- **Skill luar yang terpasang sendiri** (dipilih per bidang, lisensi diperiksa): `humanizer` dan `stop-slop` (anti-slop naskah/caption), `claude-screenwriting` (struktur cerita + lint naskah), `marketingskills` (copywriting, copy-editing, content-strategy, social, marketing-psychology, marketing-ideas, video), `canvas-design` dan `skill-creator` (Anthropic resmi), skill Remotion resmi, `motion-design-skill`. Plugin hemat token: caveman, ponytail.
- **4 perintah**: `/sa-minggu`, `/sa-video`, `/sa-status`, `/sa-pasang-skill`.

### 13 repo wajib
Semua tercatat di `katalog/skill.yaml` (`wajib: true`) dan bisa diambil kapan saja dengan `python -m scripts.pasang_otomatis --wajib` atau satu per satu dengan `--id <id>`:
karpathy-skills (plugin, aktif bawaan), ECC / genjutsu / hyperframes / lemo-opuscar (plugin terdaftar + clone ke `rujukan/`), design-dna dan motion-design-skill (skill, otomatis), onetake (skill), ClaudeAnimationBase (`rujukan/`), three.js dan GSAP (npm ke template), youmind opus prompts (diunduh ke `rujukan/`). gbro-collage-broll di-skip karena wajib Gemini API berbayar. Mode `eksplorasi` di `config/kebijakan.yaml` membuat lisensi tidak membatasi selama belum komersial.

### Konektor
- **Wajib: Notion.** Semua catatan produksi untukmu masuk ke database Notion "Produksi Sobat Ambis": tahap, status, apa yang ditunggu darimu, angka QA, token. Sambungkan di claude.ai → Settings → Connectors → Notion. Database dibuat otomatis saat episode pertama (kamu hanya ditanya halaman induknya). Tanpa Notion, catatan jatuh ke `catatan-notion.md` di folder episode.
- **Disarankan, untuk periset-tren dan pemeriksa-fakta**: Consensus (pencarian makalah, paling hemat) atau Elicit. SciSpace sebagai cadangan. Tanpa ini, riset ilmiah jatuh ke web search biasa ke PubMed/doi.org/`.ac.id`.
- **Tren terbaru**: tidak butuh konektor. Web search bawaan + Agent-Reach (CLI, dipasang otomatis lewat `uv tool` saat periset-tren mulai; hanya kanal tanpa login: web, YouTube, GitHub). Instagram/TikTok/X tidak dibuka sama sekali supaya akun tidak diblokir.
- **Google Drive**: belum dipakai (unggah otomatis masuk rencana berikutnya).
- ElevenLabs bukan konektor: dipakai lewat secret `ELEVENLABS_API_KEY` (lihat `docs/lanjutan-elevenlabs.md`).

## Pakai

- `/sa-minggu 2026-W47` — rencana satu minggu: ukur kapasitas, riset topik (bank topik bersumber), jadwal 7 hari, lalu catat ke Notion.
- `/sa-video videos/<minggu>/<episode>` — produksi satu episode. Berhenti di tiga titik persetujuan: naskah + pilihan suara, trek dialog, video final.
- `/sa-status videos/<minggu>/<episode>` — tahap, skor gerak, token.
- `/sa-pasang-skill "<kebutuhan>"` — cari dan pasang skill dari katalog.

### Berapa episode per minggu muat di Claude Pro?

Batas Pro tidak diumumkan dalam token, jadi plugin **mengukur**, bukan menebak:
1. Sebelum satu episode penuh, buka `/usage` dan catat persen batas mingguan.
2. Sesudah episode selesai, catat lagi, lalu jalankan:
   `python -m scripts.kapasitas catat videos/<minggu>/<ep> --jendela mingguan --awal 12 --akhir 25`
3. `python -m scripts.kapasitas` menghitung kapasitas = (100 − cadangan 15%) ÷ persen per episode. `/sa-minggu` memakai angka ini: hari yang tidak muat diisi konten turunan yang hemat token.

Data yang sudah ada (pilot v1, pipeline lama): 17.866 token output, 6,0 juta token cache read dalam satu episode. Pipeline v2 belum diukur.

### Hemat token: yang sudah diatur
Ukuran pilot: ~82% biaya ada di konteks yang dibaca ulang setiap langkah (cache read), hanya ~12% di output. Jadi yang dipangkas adalah jumlah langkah, bukan cuma panjang tulisan:
- Tahap mekanis (suara, adegan, mix, render, QA) jalan dalam **satu** perintah `python -m scripts.tahap jalan`; agent spesialis hanya dipanggil saat tahap itu gagal.
- Direktur memakai Sonnet; Opus hanya untuk animator saat membuat aset baru.
- Skill dibuka saat tugasnya muncul. Yang tetap wajib: `sa-komedi`, `humanizer`, `stop-slop` untuk naskah dan caption.
- Notion dicatat sekali setiap produksi berhenti, bukan setiap tahap.
- `token.json` memuat `per_tahap`, supaya pemangkasan berikutnya berdasarkan data.

**Yang perlu kamu lakukan sekali di akun utama:** buka `/plugin` di folder repo ini, lalu nonaktifkan untuk proyek ini plugin yang tidak dipakai (misalnya small-business, figma, cloudflare, brightdata, digital-venture-superpowers). Daftar skill dan tool setiap plugin aktif ikut terbaca di setiap langkah. Lalu satu episode per sesi: sesudah titik persetujuan, `/clear` dan lanjutkan dengan `/sa-video <folder>`.

### Dua jalur suara

- **Rekaman manusia** (`"sumber_suara": "manusia"`): plugin menulis `lembar-rekaman.md`. Rekam satu file per tokoh ke `rekaman/arta.m4a`, `rekaman/ratna.m4a`, `rekaman/mbis.m4a` (urutan bebas; salah ucap cukup diulang). Plugin membersihkan audio, memotong per baris, dan meminta rekam ulang hanya untuk baris yang hilang (`rekaman/ulang-t04.1.m4a`).
- **ElevenLabs** (`"sumber_suara": "elevenlabs"`): dialog dibuat per beat dengan suara yang dipilih saat audisi.

## Lisensi aset

`aset/sfx` dan `aset/musik` mencatat sumber dan lisensi setiap file. Musik saat ini buatan sendiri (sementara); SFX dibuat di akun gratis (nonkomersial) dan **wajib** dibangun ulang sesudah upgrade sebelum ada video yang diposting. Tahap `gerbang` menolak aset nonkomersial.

## Dokumen

Spec: `docs/superpowers/specs/2026-11-02-perombakan-serial-design.md` · Rencana: `docs/superpowers/plans/` · Cerita: `docs/cerita/` · Contoh adegan: `videos/contoh-fase1/`.
