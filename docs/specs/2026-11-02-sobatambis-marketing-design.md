# Desain: Plugin Tim Marketing Agentic Sobat Ambis

Tanggal: 2 November 2026
Status: menunggu review pemilik

## 1. Tujuan

Plugin Claude Code yang menjalankan produksi konten Instagram Sobat Ambis hampir tanpa campur tangan manusia.
Pemilik hanya melakukan dua hal: **approve** dan **posting**.

- Target produksi: **14 video per minggu** (2 per hari).
- Format: video cerita animasi 9:16, 45 sampai 75 detik, voice-over narasi, caption muncul per kata, karakter kartun yang konsisten. Rujukan: tiga video contoh yang dikirim pemilik (gaya kartun 2D satir dan gaya diorama kertas).
- TikTok dengan talent manusia berada di luar cakupan versi ini.
- Akun yang dipakai: akun Claude Pro utama milik pemilik, khusus untuk marketing. Kuota Pro terbatas, jadi hemat token adalah syarat desain, bukan bonus.

### Kriteria berhasil

1. `/sa-minggu` menghasilkan 14 brief + naskah dalam satu batch untuk di-approve.
2. `/sa-video <folder>` menghasilkan MP4, cover, dan caption yang lulus QA tanpa intervensi manusia pada kasus normal.
3. Video ke-2 dan seterusnya memakai rata-rata token jauh lebih sedikit daripada video pertama, karena aset perpustakaan dipakai ulang. Angka acuan diukur dari video pilot.
4. Kalau kuota habis di tengah produksi, pekerjaan berlanjut dari tahap terakhir yang berhasil.

## 2. Keputusan yang sudah disepakati

| Topik | Keputusan |
|---|---|
| Lokasi | Repo `aldysyahputra422-crypto/sobatambis-marketing` (plugin + marketplace dalam satu repo) |
| Lisensi | Sobat Ambis diperlakukan sebagai project mata kuliah (nonkomersial). Status lisensi tiap repo tetap dicatat di katalog. Kalau status bisnis berubah, entri bertanda `noncommercial-only` wajib dicek ulang. |
| Suara | Bawaan **edge-tts** (gratis, suara `id-ID-ArdiNeural` / `id-ID-GadisNeural`). Pakai **ElevenLabs** otomatis kalau `ELEVENLABS_API_KEY` tersedia. Rekaman suara pemilik juga diterima sebagai input. |
| Verifikasi suara | **faster-whisper** lokal (gratis). ElevenLabs Scribe bila key tersedia. |
| Visual | Karakter dan latar digambar dengan kode (SVG/React di Remotion). Generator gambar berbayar (Higgsfield, Open-Generative-AI/MuAPI, Gemini) hanya opsional lewat katalog bila key tersedia. |
| Mesin render | **Remotion** sebagai satu-satunya mesin render. HyperFrames dicatat di katalog sebagai alternatif, tidak dipasang bawaan. |
| Model | Opus hanya untuk agent yang membangun aset dan animasi Remotion. Agent lain memakai Sonnet atau Haiku. |
| Jumlah agent | Sekitar 30, dibagi 5 divisi. Ditambah hanya bila ada pekerjaan nyata. |
| Approval | Dua titik: (1) batch 14 topik + naskah, (2) video jadi sebelum diposting. |

## 3. Struktur repo

```
sobatambis-marketing/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── agents/                 # ~30 definisi agent (frontmatter: name, description, model, tools)
├── commands/               # sa-minggu, sa-video, sa-riset, sa-pasang-skill, sa-status
├── skills/
│   ├── sa-brand/           # persona, produk, harga, aturan klaim, gaya bahasa
│   ├── sa-katalog/         # katalog skill + prosedur pasang
│   ├── sa-riset/           # daftar sumber tepercaya + format brief
│   ├── sa-naskah/          # struktur naskah, prinsip psikologi etis, anti-slop
│   ├── sa-suara/           # pipeline TTS -> STT -> diff -> patch
│   ├── sa-produksi/        # skema adegan.json, cara memakai template, QA frame
│   └── sa-jadwal/          # skema database Notion, pencatatan token
├── katalog/skill.yaml
├── template/               # proyek Remotion + perpustakaan aset
│   ├── src/karakter/       # komponen karakter berparameter
│   ├── src/latar/          # latar SVG berlapis
│   ├── src/properti/
│   ├── src/caption/        # caption per kata
│   └── src/Cerita.tsx      # komposisi utama, membaca adegan.json + suara
├── scripts/                # python/node: tts, stt, diff, splice, contact sheet, token meter
├── videos/                 # output per video (hanya teks/JSON di git; media ke Drive)
└── docs/
```

## 4. Organisasi agent

| Divisi | Agent | Model |
|---|---|---|
| Pimpinan | direktur-marketing (orkestrator) | Opus |
| Strategi | analis-pasar, pemburu-tren, verifikator-sumber, perencana-kalender | Sonnet |
| Kreatif | penulis-hook, penulis-naskah, editor-psikologi, pembasmi-slop, pemeriksa-fakta, penulis-caption, copywriter-cover | Sonnet |
| Produksi | art-director, storyboarder, desainer-karakter, desainer-latar, animator, pemoles-gerak, sutradara-suara, qa-suara, penyelaras-caption, mixer-audio, renderer, inspektur-frame, desainer-cover | Opus: desainer-karakter, desainer-latar, animator, pemoles-gerak. Lainnya Sonnet/Haiku. |
| Distribusi | penjadwal-notion, pengemas-posting, penulis-alur-dm, pengolah-ulang, analis-performa | Haiku/Sonnet |
| Operasional | pencari-skill, akuntan-token, pustakawan-aset, penjaga-gerbang-qa | Haiku/Sonnet |

Aturan kerja agent:
- Setiap agent menerima path folder video dan membaca file yang dibutuhkan saja, bukan seluruh percakapan.
- Setiap agent menulis hasilnya ke file, bukan hanya membalas teks. Agent berikutnya membaca file itu.
- Agent tidak memanggil agent lain secara bebas. Hanya direktur-marketing yang membagi tugas.

## 5. Alur per video

| Tahap | Agent | Output | Lulus jika |
|---|---|---|---|
| 1 Riset | pemburu-tren, verifikator-sumber | `brief.md` | Minimal 2 sumber dengan link, tidak ada klaim tanpa sumber |
| 2 Naskah | penulis-hook → penulis-naskah → editor-psikologi → pembasmi-slop → pemeriksa-fakta | `naskah.md` | 120 sampai 170 kata, hook di 3 detik pertama, lolos daftar pola slop, semua angka bersumber |
| Approval 1 | pemilik | status `disetujui` | |
| 3 Suara | sutradara-suara, qa-suara | `suara.wav`, `transkrip.json` | Kecocokan transkrip dengan naskah minimal 97% kata; kalimat yang gagal direkam ulang per kalimat (maks 2 kali) |
| 4 Storyboard | storyboarder (+ desainer bila aset belum ada) | `adegan.json` | Semua aset yang dirujuk ada di perpustakaan |
| 5 Render | animator, renderer | `video.mp4` | Render sukses, durasi sesuai suara ±0,5 detik |
| 6 QA frame | inspektur-frame | `cek-frame.png`, catatan | Tidak ada frame kosong, caption tidak keluar layar, karakter tidak terpotong |
| 7 Kemasan | desainer-cover, penulis-caption | `cover.png`, `caption.txt` | Caption ada CTA dan hashtag; label "Cerita fiksi" bila fiktif |
| 8 Gerbang | penjaga-gerbang-qa, pengemas-posting, penjadwal-notion | `qa.md`, upload Drive, baris Notion | Semua tahap lulus |
| Approval 2 | pemilik | posting manual | |

`status.json` di tiap folder mencatat tahap terakhir yang lulus beserta jumlah percobaan. Produksi selalu dilanjutkan dari sini.

## 6. Template video

- Komposisi Remotion 720×1280, 30fps. Durasi mengikuti panjang `suara.wav`.
- `adegan.json` berisi daftar adegan. Tiap adegan: rentang waktu (dari transkrip), id latar, daftar karakter (id, ekspresi, pose, posisi), properti, gerakan kamera, transisi.
- Karakter: komponen SVG berparameter (warna kulit, rambut, pakaian, aksesori), minimal 5 ekspresi (senang, sedih, kaget, kesal, mikir), mulut bergerak mengikuti amplitudo suara, sedikit gerak idle.
- Latar awal (6): kamar belajar, ruang kelas, ruang tamu, ruang ujian, kampus, jalan kota.
- Caption: satu sampai tiga kata aktif sekaligus, posisi tengah bawah, gaya mengikuti video rujukan.
- Kartu penutup: logo, CTA "Komen INFO", handle Instagram.
- Aset baru dibuat sekali oleh agent Opus lalu disimpan di perpustakaan untuk dipakai ulang.

## 7. Katalog skill

`katalog/skill.yaml`, satu entri per sumber: `id`, `sumber`, `fungsi`, `pakai_saat`, `cara_pasang`, `lisensi`, `catatan_lisensi`, `butuh_key`, `biaya`, `ukuran`, `status`.

Isi awal: Agent-Reach, Open-Generative-AI, andrej-karpathy-skills, ECC (pilihan sebagian), youmind opus-5-5-prompts (rujukan baca), three.js, GSAP, design-dna, motion-design-skill, genjutsu, hyperframes, onetake, gbro-collage-broll, ClaudeAnimationBase, lemo-opuscar, stop-slop, caveman, skill Remotion, edge-tts, faster-whisper, ffmpeg, Higgsfield.

Prosedur pencari-skill:
1. Cocokkan kebutuhan tugas dengan kolom `pakai_saat`.
2. Cek apakah sudah terpasang.
3. Bila belum: pasang sesuai `cara_pasang`, lalu verifikasi file skill ada.
4. Bila `butuh_key` tidak terpenuhi: pakai alternatif gratis yang tercatat dan laporkan.
5. Sumber di luar katalog tidak dipasang tanpa izin pemilik.

Catatan khusus:
- ECC tidak dipasang utuh (1.068 skill, 385 agent) karena membebani konteks. Hanya bagian yang relevan yang dipilih.
- Agent-Reach hanya dipakai untuk fungsi baca web dan transkrip video. Fungsi yang memakai cookie login media sosial tidak dipakai karena berisiko akun diblokir.
- andrej-karpathy-skills tidak punya file lisensi, jadi dirujuk dari sumber aslinya, tidak disalin.

## 8. Connector

Connector melekat pada akun Claude, bukan plugin. Di akun utama pemilik perlu menyambungkan: **Notion**, **Google Drive**, **Consensus**, **Elicit**, **SciSpace**. Web search bawaan dipakai untuk berita dan tren.

## 9. Hemat token

- Agent ringan memakai Haiku atau Sonnet.
- Agent hanya membaca file yang dibutuhkan tahapnya.
- Gaya caveman dipakai untuk komunikasi antar agent dan log, tidak untuk naskah atau caption.
- Pemeriksaan frame memakai satu lembar cuplikan per video, bukan puluhan gambar terpisah.
- akuntan-token membaca log sesi Claude Code (`~/.claude/projects/*.jsonl`) dan mencatat token per video ke Notion.

## 10. Penanganan error

- Maksimal 2 percobaan ulang per tahap. Setelah itu status "Butuh bantuan" + alasan di Notion, lalu lanjut ke video berikutnya.
- Kuota habis: hentikan dengan rapi, `status.json` sudah tersimpan, lanjut di sesi berikutnya.
- Key API hilang atau tidak valid: turun ke alternatif gratis dan catat.

## 11. Pengujian

- Script suara, diff, dan token meter: tes otomatis (pytest).
- Template: render uji dari `adegan.json` contoh.
- Seluruh alur: satu video pilot dari riset sampai kemasan. Token pilot diukur dan dipakai untuk jadwal Notion.

## 12. Di luar cakupan versi ini

- Posting otomatis ke Instagram (butuh Meta API dan akun bisnis terverifikasi).
- Produksi TikTok dengan talent manusia.
- Balas komentar/DM otomatis (alurnya ditulis, eksekusinya lewat ManyChat oleh pemilik).

## 13. Identitas visual (disetujui pemilik, 2 November 2026)

- **Gaya:** "jurnal premium". Dunia buku tulis: kertas krem bertekstur, garis biru, margin merah, lubang binder, cahaya lampu hangat, vignette tipis. Garis tinta rapi dengan sedikit getaran tangan, isian bergaya cat air lembut.
- **Palet terkunci:** kertas `#F7EEDC`, tinta `#1E3A8A`, stabilo `#FBC531`, merah guru `#C2412D`, kulit `#F1C9A5`. Warna lain hanya untuk pakaian tokoh pendukung dan dibuat redup.
- **Tipografi:** dialog dan catatan memakai tulisan tangan (Caveat). Caption, judul, dan kartu penutup memakai font brand (Bricolage Grotesque, Plus Jakarta Sans) di atas kartu krem.
- **Ciri khas berulang:** catatan merah guru, stabilo yang digoreskan, pensil di cepol Arta, Mbis mengintip dari pinggir halaman.
- **Cover:** judul dan tokoh berada di area aman 3:4 (y 160 sampai 1120 dari 1280) supaya utuh di grid profil.
- **Rujukan tayang:** `docs/desain/ep1/` (frame kunci, kartu penutup, cover, grid profil). Sumber SVG di `docs/desain/sumber/` menjadi dasar komponen template Remotion.

## 14. Cerita dan format (disetujui pemilik)

- **Pemeran tetap:** Arta (tokoh utama), Mbis (kucing stabilo, suara hati), Bu Ratna (ibu), Kak Bima (mentor, mulai Ep.10).
- **Format:** serial + edukasi. Setiap episode serial membawa satu pelajaran yang sejalan dengan cara Sobat Ambis mengajar.
- **Komposisi mingguan:** 10 episode serial Arta + 4 video Mbis Bereaksi.
- **Struktur episode, aturan nada, dan running gag:** `docs/cerita/story-bible.md`.
- **Alur Arc 1 (Ep.1 sampai 10):** `docs/cerita/arc-1.md`.
- **Naskah acuan:** `docs/cerita/ep01-rencana-sempurna.md`. Penulis-naskah memakai naskah ini sebagai contoh standar kualitas.
- Agent tim kreatif wajib membaca story bible sebelum menulis. Pemeriksa-fakta wajib memverifikasi setiap sumber kandidat di `arc-1.md` sebelum episode diproduksi.

## 15. Keputusan terbuka

- Tidak ada untuk tahap desain. Pertanyaan teknis dijawab di rencana implementasi.
