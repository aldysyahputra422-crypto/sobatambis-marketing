# QA Ep.1 Rencana Sempurna

## Frame

- [x] semua pemeriksaan frame lulus (`python -m scripts.qa_frame` kode 0)

Lembar cuplikan: cek-frame.png

## Gerbang

- [x] Naskah disetujui: `naskah.json` `disetujui: true`, `python -m scripts.naskah periksa` kode 0
- [x] Fakta terverifikasi: `fakta.md`
- [x] Suara lulus: ElevenLabs eleven_v3, 12 baris, 7 rekam ulang (b05 x3, b06 x2, b10 x2), peringatan: tidak ada
- [x] Frame lulus: `video.mp4` 720x1280, 30 fps, H.264 + AAC, 48,7 detik (suara 45,7 + kartu penutup 3)
- [x] Cover ada: `cover.png` 720x1280, judul tidak tertabrak pensil
- [x] Caption memuat INFO dan tanpa tanda pisah panjang: `caption.txt`
- [x] Token tercatat: `token.json`

## Token

Rentang 2026-11-02 06:24:40+00:00 sampai 2026-11-02 06:34:03.129900+00:00 (sejak tahap naskah ditandai).

| Model | input | output | cache tulis | cache baca |
|---|---|---|---|---|
| claude-opus-5-5 | 68 | 17,866 | 35,241 | 6,030,361 |
| total | 68 | 17,866 | 35,241 | 6,030,361 |
