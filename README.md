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
- **16 agent**: direktur-marketing dan animator (Opus); penulis-naskah, perencana-konten, pembasmi-slop, pemeriksa-fakta, storyboarder, inspektur-frame, desainer-cover, penulis-caption, penjaga-gerbang-qa (Sonnet); sutradara-suara, qa-suara, pencari-skill, akuntan-token, penjadwal-notion (Haiku). Setiap agent punya bagian "Skill dasar" berisi skill terverifikasi yang wajib dimuat.
- **5 skill di repo**: `sa-brand` (fakta resmi, harga, CTA), `sa-cerita` (story bible, Arc 1), `sa-komedi` (teknik komedi sketsa), `sa-katalog` (katalog + pemasangan otomatis), `sa-jadwal` (catatan produksi di Notion).
- **Skill luar yang terpasang sendiri** (dipilih per bidang, lisensi diperiksa): `humanizer` dan `stop-slop` (anti-slop naskah/caption), `claude-screenwriting` (struktur cerita + lint naskah), `marketingskills` (copywriting, copy-editing, content-strategy, social, marketing-psychology, marketing-ideas, video), `canvas-design` dan `skill-creator` (Anthropic resmi), skill Remotion resmi, `motion-design-skill`. Plugin hemat token: caveman, ponytail.
- **3 perintah**: `/sa-video`, `/sa-status`, `/sa-pasang-skill`.

### 13 repo wajib
Semua tercatat di `katalog/skill.yaml` (`wajib: true`) dan bisa diambil kapan saja dengan `python -m scripts.pasang_otomatis --wajib` atau satu per satu dengan `--id <id>`:
karpathy-skills (plugin, aktif bawaan), ECC / genjutsu / hyperframes / lemo-opuscar (plugin terdaftar + clone ke `rujukan/`), design-dna dan motion-design-skill (skill, otomatis), onetake (skill), ClaudeAnimationBase (`rujukan/`), three.js dan GSAP (npm ke template), youmind opus prompts (diunduh ke `rujukan/`). gbro-collage-broll di-skip karena wajib Gemini API berbayar. Mode `eksplorasi` di `config/kebijakan.yaml` membuat lisensi tidak membatasi selama belum komersial.

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
