# Laporan Pilot Ep.1 "Rencana Sempurna"

Tanggal: 2026-11-02 · Folder: `videos/2026-W46/ep01/` · Hasil: semua tahap `lulus`, menunggu Approval 2.

## Hasil

| File | Isi |
|---|---|
| `video.mp4` | 720×1280, 30 fps, H.264 + AAC, **48,7 detik** (suara 45,7 + kartu penutup 3) |
| `cover.png` | 720×1280, Arta pose pinggang, judul di area aman |
| `caption.txt` | draf caption dari `ep01-rencana-sempurna.md`, CTA "Komen INFO" |
| `qa.md`, `fakta.md`, `token.json`, `cek-frame.png` | bukti gerbang |

Media (`.mp4`, `.wav`, `.png`) tidak masuk git.

## Cara pilot dijalankan

Plugin belum terpasang sebagai plugin di sesi cloud ini, jadi agent `direktur-marketing` dan agent per tahap **tidak** dijalankan sebagai subagent. Saya menjalankan setiap tahap sendiri mengikuti `commands/sa-video.md` (perintah dan syarat lulus yang sama). Akibatnya pembagian model (Opus/Sonnet/Haiku) belum teruji: semua token di bawah adalah Opus.

## Pilihan voice ElevenLabs

Kunci API yang tersimpan hanya punya izin text-to-speech (tanpa `user_read`, `voices_read`, `models_read`), dan akunnya akun gratis: suara pustaka (library) ditolak lewat API (`402 paid_plan_required`). Jadi pilihan terbatas pada suara bawaan. Audisi: satu baris naskah per kandidat, `eleven_v3`, didengar ulang dengan faster-whisper.

| Tokoh | Kandidat (kecocokan kata, nada dasar) | Dipilih |
|---|---|---|
| Arta (siswi SMA) | Jessica 1,00 / 215 Hz · **Laura 1,00 / 271 Hz** | Laura `FGY2WhTYpPnrIDTdsKH5`: paling muda dan tinggi |
| Mbis (kucing, kering) | **Callum 1,00 / 124 Hz** · River 0,96 · Roger 0,97 / 92 Hz | Callum `N2lVS1w4EtoT3dr4eOWO`: serak, kering |
| Bu Ratna (ibu) | **Sarah 1,00 / 222 Hz** · Alice 0,97 · Jessica 0,75 | Sarah `EXAVITQu4vr4xnSDxMaL`: dewasa, tenang |
| Kak Bima | belum diaudisi | Roger (sementara, Rencana 2) |

Lily dan Matilda sudah tidak ada (`voice_not_found`). Semua suara bawaan ini aslinya berbahasa Inggris. Whisper mengenali kata-katanya dengan baik, tetapi logatnya perlu didengar pemilik.

## Waktu per tahap

| Tahap | Waktu | Catatan |
|---|---|---|
| naskah | instan | sudah disetujui (`disetujui: true`) |
| suara | 1 m 34 d + rerun 1 m | rerun tidak menyintesis ulang; gagal pertama adalah alarm palsu (lihat Masalah 2) |
| adegan | < 1 d | |
| render | 2 m 32 d | 1.461 frame |
| qa_frame | ±25 d | |
| kemasan | ±25 d | cover dirender dengan `npx remotion still Cover` |
| gerbang | ±1 m | |

Dari tahap naskah ditandai sampai `selesai`: sekitar 10 menit, termasuk memperbaiki 2 bug.

## Suara: rekam ulang dan kredit

- 12 baris, **7 rekam ulang**: b05 "Tiga tempat?" ×3, b06 "OKE. Aku belajar TUJUH jam!" ×2, b10 "Lima puluh... delapan." ×2. Total 19 klip.
- Kredit ElevenLabs (perkiraan dari jumlah karakter yang dikirim; saldo tidak bisa dibaca karena kunci tanpa `user_read`):
  - produksi: ±556 karakter sekali jalan + ±250 rekam ulang ≈ **800 karakter**
  - audisi voice: ≈ 450 karakter (sekali saja)
- Kuota akun gratis 10.000 karakter/bulan ≈ **12 episode/bulan** dengan pola rekam ulang yang sama.

## Token

`token.json` mencatat sejak tahap naskah ditandai (06:24:40): Opus, input 68, output 17.866, cache tulis 35.241, cache baca 6.030.361.

Seluruh sesi pilot (audisi voice, 4 perbaikan, produksi, laporan; 98 panggilan API): output 37.775, cache tulis 216.964, cache baca 11.052.179.

Hampir semua beban ada di **cache baca**: setiap panggilan membawa ±170 ribu token konteks, karena sesi ini memuat banyak plugin dan connector di luar sobatambis-marketing. Jumlah panggilan, bukan panjang output, yang menentukan biaya.

### Perkiraan kapasitas kuota Pro

Batas Pro tidak diumumkan dalam token, jadi angka per minggu belum bisa dihitung dari data ini. Cara mengukurnya: jalankan satu `/sa-video` bersih (tanpa debugging) di sesi yang hanya memuat plugin ini, lalu lihat persentase pemakaian di `/usage` sebelum dan sesudah. Perkiraan kasar: produksi bersih ±25–30 panggilan. Dengan konteks yang lebih kecil (±40 ribu token), biayanya turun sekitar 4×.

## Masalah yang ditemukan dan diperbaiki (masing-masing dengan test)

1. **Kunci tanpa izin `user_read`** membuat `sisa_kredit()` crash dengan 401. Sekarang mengembalikan `None` (kredit tidak diketahui); kuota tetap dijaga lewat galat 401/402 saat sintesis. `tests/test_penyedia.py`.
2. **Alarm palsu "marah kurang keras"**: acuan baris tenang mencampur Bu Ratna (voice lebih keras, −12,2 dB) dengan Arta. Sekarang dibandingkan per penutur; marah Arta ±6 dB di atas lelah Arta. `tests/test_dengar.py`.
3. **`status.tandai()` menghapus detail tahap.** Ini terjadi saat direktur menandai `lulus` setelah script selesai, padahal begitulah alur `/sa-video`. Detail baris suara hilang, dan rerun berikutnya akan merekam ulang semua baris (kredit terbuang). Sekarang menandai ulang keadaan yang sama tanpa info akan mempertahankan detail. Detail Ep.1 dipulihkan dari `suara_baris/`, `timing.json`, dan `transkrip.json` tanpa memanggil API. `tests/test_status.py`.
4. Permintaan pemilik:
   - **Kaki Arta tertutup caption**: pose penuh dipindah ke skala 0,78, y 648. Geometri caption dan tokoh disatukan di `template/src/tata.ts`, dengan test bahwa kaki dan bayangan ada di atas caption dua baris dan pensil cepol tidak menabrak papan "100 HARI" (papan dinaikkan 40 px). `template/test/tata.test.ts`.
   - **Sticky note di "Tiga tempat?"**: properti baru `sticky_3tempat` ("les di / 3 TEMPAT?!", tinta merah) di b05.

## Masalah terbuka

- **Lisensi ElevenLabs akun gratis.** Setahu saya, paket gratis tidak memberi lisensi komersial dan mewajibkan atribusi. Ini video marketing, jadi cek syaratnya sebelum posting. Paket Starter memberi lisensi komersial dan membuka suara pustaka (termasuk suara berlogat Indonesia).
- **Durasi 48,7 detik**, bukan 55–61 detik seperti di rencana. Baris dibacakan lebih cepat daripada tabel waktu naskah. Kalau perlu lebih panjang, perpanjang `jeda_sesudah` atau tambah baris di naskah; jangan diisi diam di akhir.
- Di b02 (dinding sticky), pensil cepol Arta menyentuh sticky "Tryout tiap hari". Ini sudah ada sebelum pilot.
- Draf caption "Ep.2 besok" diganti "Ep.2 menyusul" karena jadwal tayang belum ditetapkan.
- `npx eslint src` di `template/` gagal karena `@ts-nocheck` dan satu variabel tak terpakai. Ini sudah ada sebelum pilot.
