# Adegan contoh Fase 1: "Tiga tempat?" → "TUJUH JAM!"

Video: `adegan.mp4` (11,4 detik, 720×1280, 30 fps, H.264 + AAC). Media tidak masuk git; bangun ulang dengan langkah di bawah.

## Isi adegan

| Detik | Yang terjadi |
|---|---|
| 0,0 | Notif WA berbunyi, kartu grup WA muncul. Bu Ratna di sofa melirik HP. |
| 0,3 sampai 1,9 | Arta jalan masuk dari kiri sambil senyum (langkah kaki terdengar). |
| 0,6 sampai 4,1 | Bu Ratna: "Ta... anaknya Bu Sinta sekarang les di tiga tempat, lho." Mbis mengintip dari balik sofa (2,2). Ekspresi Arta berubah: datar → kaget. |
| 4,4 | Potong ke close-up wajah Arta yang marah, desis, musik berganti tegang. "Tiga tempat?" |
| 5,85 | Transisi coretan pensil ke dinding sticky note; sticky "04.00", "5 jam", "0 HP", "Tryout" muncul satu per satu. |
| 6,7 | "OKE." Arta menghentak kaki, kamera menghentak, teks dicap. Arta mengambil sticky "7 JAM". |
| 8,56 | "TUJUH": sticky dibanting ke dinding (BRAK), tepi layar memerah, sticky lain berjatuhan. |
| 9,3 sampai 10,5 | Arta melompat dengan dua kepalan ke atas, mendarat (squash), lalu berdiri terengah. Mbis muncul lagi di pojok. |

## Yang final dan yang sementara

| Bagian | Status |
|---|---|
| Rig Arta, 5 aksi, kamera, properti, teks kinetik, transisi | Final untuk Fase 1 |
| Bu Ratna dan Mbis | Gambar lama (bust/statis) dengan kedip, mulut, dan masuk animasi. Rig penuh di Fase 2. |
| **Suara** | **Sementara**: klip pilot (Laura dan Sarah, logat Inggris). Diganti hasil audisi suara Indonesia begitu kunci API punya izin `voices_read`/`voices_write` di paket berbayar. |
| **Musik** | **Sementara**: dua trek buatan sendiri (`scripts/musik_sintetis.py`), lisensi milik sendiri. Diganti ElevenLabs Music/berlisensi di paket berbayar. |
| **SFX** | Dibuat lewat ElevenLabs Sound Effects di akun gratis: **lisensi nonkomersial**. Bangun ulang dengan `python -m scripts.aset sfx --ulang` sesudah upgrade, sebelum ada yang diposting. |

## QA

- Teknis: 720×1280, 30 fps, H.264 + AAC, 11,41 detik.
- Audio: −14,1 LUFS, puncak −1,1 dBTP.
- Gerak (`python -m scripts.qa_gerak`, ambang 1,5): **lulus**. Skor per 0,5 detik: median 4,1, min 0,54. Bagian paling tenang ada di detik 2 sampai 4 (Bu Ratna bicara).
- Kalibrasi ambang: pilot Ep.1 lama median 0,81 dan **gagal** dengan 7 rentang diam > 1,5 detik; adegan ini **lulus**. Ambang 1,5 dikunci di `config/qa.yaml`.

## Biaya

- Render penuh: 45 detik.
- Kredit ElevenLabs: 12 SFX (±8,5 detik audio). Suara memakai klip pilot, jadi tidak ada kredit TTS baru.
- Token Claude Fase 1 (rencana sampai adegan ini, satu sesi, Opus): output 110.895, cache tulis 155.949, cache baca 30,46 juta. Sebagian besar untuk membangun sistem (rig, aksi, lapisan, mixing, QA) yang dipakai ulang di setiap episode, bukan biaya per adegan.

## Bangun ulang

```bash
python videos/contoh-fase1/buat_dialog.py
python -m scripts.waktu_kata videos/contoh-fase1
python -m scripts.mix videos/contoh-fase1
mkdir -p template/public/aktif/contoh-fase1 && cp videos/contoh-fase1/{adegan.json,dialog.wav,mix.wav} template/public/aktif/contoh-fase1/
cd template && npx remotion render AdeganV2 ../videos/contoh-fase1/adegan.mp4 --props='{"adeganFile":"aktif/contoh-fase1/adegan.json","dialogFile":"aktif/contoh-fase1/dialog.wav","mixFile":"aktif/contoh-fase1/mix.wav"}'
python -m scripts.qa_gerak videos/contoh-fase1/adegan.mp4
```
