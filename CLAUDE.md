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

## Kerja
- Python: `.venv/bin/python -m scripts.<modul>` dari root repo. Test: `.venv/bin/python -m pytest -q` (tambah `-m lambat` untuk test render) dan `npm test --prefix template`.
- Spec: `docs/superpowers/specs/2026-11-02-perombakan-serial-design.md`. Rencana: `docs/superpowers/plans/`.
- Naskah dan caption tanpa tanda pisah panjang (—). Dialog Mbis maksimal 3 baris, tanpa "Sobat Ambis", "daftar", "Rp".
