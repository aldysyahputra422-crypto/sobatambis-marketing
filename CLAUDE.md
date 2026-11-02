# sobatambis-marketing: catatan untuk Claude

Plugin Claude Code yang memproduksi serial animasi Reels "Arta & Mbis" untuk Sobat Ambis (les privat Surabaya). Bahasa kerja: Indonesia.

## Keadaan sekarang (2026-11-02)
- Pipeline serial v2 selesai dan teruji: naskah beat → suara (manusia / ElevenLabs) → timeline otomatis → mix → render AdeganV2 → QA gerak → kemasan. Lihat `commands/sa-video.md` dan `README.md`.
- Ep.1 versi baru: `videos/2026-W46/ep01-v2/naskah.json` **sudah disetujui pemilik**; tahap berikutnya `suara`, `sumber_suara` masih kosong.
- **Belum dikerjakan, sengaja ditunda sampai pemilik berlangganan ElevenLabs**: semua yang ada di `docs/lanjutan-elevenlabs.md`.

## Aturan dari pemilik
- Jangan memanggil API ElevenLabs (audisi, SFX, musik, TTS) tanpa izin pemilik di sesi itu. Kredit dan langganan adalah keputusan pemilik.
- Jangan membuat contoh/render uji yang memakai layanan berbayar tanpa bertanya.
- Laporan ke pemilik memuat angka QA (skor gerak, LUFS, skor suara), bukan klaim "bagus". Pemilik yang menonton dan menilai.
- Tiga titik persetujuan pemilik: naskah + sumber suara, trek dialog, video final.
- Catatan dan laporan progres untuk pemilik masuk ke **Notion** (database "Produksi Sobat Ambis", skill `sa-jadwal`, agent `penjadwal-notion`). Chat hanya untuk ringkasan singkat + tautan Notion.

## Otomasi (aktif setelah `bash scripts/aktifkan_otomatis.sh`)
- SessionStart: dependensi + skill katalog `otomatis: true` terpasang sendiri; mode hemat token (caveman + ponytail) aktif.
- Stop: produksi dengan penanda `.sa/aktif.json` tidak boleh berhenti sebelum titik persetujuan; macet 2 kali → catat ke Notion.
- PreToolUse: semua perintah ElevenLabs ditolak sampai pemilik membuat `.sa/izin-elevenlabs`.
- Mode eksplorasi (`config/kebijakan.yaml`): 13 repo wajib pemilik bisa diambil kapan saja (`python -m scripts.pasang_otomatis --wajib`), lisensi tidak membatasi; yang berbayar di-skip. Ganti ke `komersial` saat mulai menghasilkan uang.
- Kemampuan yang kurang dipasang pencari-skill lewat `scripts/pasang_otomatis.py` tanpa bertanya, hanya bila lolos aturan ketatnya; selain itu catat ke Notion.

## Kerja
- Python: `.venv/bin/python -m scripts.<modul>` dari root repo. Test: `.venv/bin/python -m pytest -q` (tambah `-m lambat` untuk test render) dan `npm test --prefix template`.
- Spec: `docs/superpowers/specs/2026-11-02-perombakan-serial-design.md`. Rencana: `docs/superpowers/plans/`.
- Naskah wajib lewat `sa-komedi` (uji lucu per beat), `screenwriting-lint`, lalu `humanizer` + `stop-slop` sebelum disimpan. Caption: `copywriting` + `humanizer` + `stop-slop`.
- Naskah dan caption tanpa tanda pisah panjang (—). Dialog Mbis maksimal 3 baris, tanpa "Sobat Ambis", "daftar", "Rp".
