# Perombakan Serial Arta & Mbis: Cerita, Animasi, Suara

Tanggal: 2026-11-02 · Status: menunggu review pemilik · Menggantikan bagian produksi di `docs/specs/2026-11-02-sobatambis-marketing-design.md` (bagian 4 dan 5) dan Rencana 1 tahap `suara`, `adegan`, `render`, `qa_frame`.

## 1. Latar

Pilot Ep.1 (`docs/pilot-ep01.md`) lolos semua QA teknis, tetapi pemilik menilainya buruk:

- **Cerita membosankan.** Dinarasikan seperti diary ("Hari pertama…", "Hari ketujuh…"), hanya satu interaksi, tanpa lelucon, Mbis baru muncul di 5 detik terakhir.
- **Seperti slide PPT.** Setiap adegan satu pose diam dengan zoom pelan. Tidak ada aksi di dalam adegan.
- **Suara datar dan berlogat Inggris.** Akun ElevenLabs gratis hanya boleh memakai suara bawaan berbahasa Inggris; tag emosi tidak cukup.
- **QA tidak menilai keseruan.** Semua pemeriksaan bersifat teknis, jadi video yang membosankan tetap "lulus".

Perbandingan gaya yang dipakai untuk memutuskan arah: `docs/desain/perbandingan-gaya.html`.

## 2. Keputusan pemilik

| Topik | Keputusan |
|---|---|
| Gaya visual | Dasar **B (motion comic hidup)**: gaya jurnal yang tidak pernah diam. Momen besar memakai **A (kartun penuh)**: tokoh berakting seluruh badan, dengan potongan close-up. |
| Nada cerita | **Komedi dulu, lalu kena**: sekitar 70% awal komedi cepat, satu momen jujur yang mengena, lalu Mbis dan pertanyaan terbuka. |
| Suara | Per episode, sesudah naskah disetujui, pemilik memilih **suara manusia** (rekaman sendiri) atau **ElevenLabs berbayar** dengan suara Indonesia. Biaya paket berbayar disetujui. |
| Target | **7 episode per minggu** (1 per hari) untuk serial Arta & Mbis. |
| Pendekatan animasi | **Rig tokoh di Remotion + pustaka aksi siap pakai.** Bukan animator manusia per aksi, bukan video AI. |

Yang tetap: tokoh (Arta, Mbis, Bu Ratna, Kak Bima), palet terkunci, font, gaya gambar jurnal, Arc 1 sebagai kerangka cerita, format 720×1280 30 fps, `status.json` dan pengatur tahap, aturan Mbis (maksimal 3 baris, tanpa "Sobat Ambis", "daftar", "Rp"), tanpa tanda pisah panjang di naskah dan caption.

## 3. Cerita dan naskah

### Bentuk episode (45 sampai 60 detik)

| Waktu | Jenis beat | Isi |
|---|---|---|
| 0 sampai 2 dtk | `hook` | Langsung di tengah aksi: lelucon visual + satu kalimat. Tanpa pembukaan atau narasi. |
| sampai ±70% | `lucu`, `naik` | Beat komedi setiap 5 sampai 8 detik. Setiap beat punya aksi, punchline, SFX. |
| ±70% | `mengena` | Musik mati, gerak melambat, 3 sampai 5 detik jujur. Tepat satu per episode. |
| akhir | `penutup` | Mbis + pertanyaan terbuka, lalu kartu "Bersambung" + CTA. |

Mbis hadir sejak awal sebagai pengamat diam (mengintip, menggeleng, menutup mata dengan kaki). Lelucon visual Mbis tidak dihitung sebagai baris dialog.

### Format naskah beat (`naskah.json` versi 2)

```json
{
  "episode": "ep01", "judul": "Rencana Sempurna", "disetujui": false,
  "sumber_suara": null,
  "judul_berikut": "Ep.2: ...",
  "beat": [
    {
      "id": "t03", "jenis": "naik",
      "latar": "dinding_sticky",
      "kamera": [{"jenis": "lebar"}, {"jenis": "dekat", "tokoh": "arta", "mulai_kata": "OKE"}],
      "dialog": [
        {"penutur": "ratna", "teks": "Anaknya Bu Sinta les di tiga tempat, lho.", "arah": "ragu, lembut"},
        {"penutur": "arta", "teks": "Tiga tempat?", "arah": "kesal ditahan"},
        {"penutur": "arta", "teks": "OKE. Aku belajar TUJUH jam!", "arah": "teriak", "puncak": "TUJUH"}
      ],
      "aksi": [
        {"tokoh": "arta", "aksi": "hentak", "pada_kata": "OKE"},
        {"tokoh": "arta", "aksi": "banting", "benda": "sticky_7jam", "pada_kata": "TUJUH"},
        {"tokoh": "mbis", "aksi": "geleng", "pada": "akhir"}
      ],
      "properti": ["sticky_0400", "sticky_5jam"],
      "sfx": [{"nama": "brak", "pada_kata": "TUJUH"}],
      "musik": "tegang_naik",
      "punchline": "OKE. Aku belajar TUJUH jam!",
      "emosi": "marah", "intensitas": 9
    }
  ]
}
```

`sumber_suara` diisi `"manusia"` atau `"elevenlabs"` pada Approval 1. `pada_kata` mengikat aksi dan SFX ke waktu kata di audio sesudah suara jadi.

### Validator naskah (`python -m scripts.naskah periksa`)

Selain aturan yang sudah ada (emosi, Mbis, tanda pisah):

- beat pertama berjenis `hook` dan perkiraan durasinya ≤ 2 detik;
- tidak ada rentang > 8 detik tanpa beat `lucu` atau `hook` sebelum beat `mengena`;
- tepat satu beat `mengena`, letaknya di 55% sampai 85% durasi;
- beat terakhir `penutup`;
- setiap `aksi`, `properti`, `sfx`, `musik`, `latar` ada di pustaka (bila tidak: daftar aset yang harus dibuat animator);
- minimal 2 aksi seluruh badan (aksi bertanda `penuh` di pustaka) per episode.

Perkiraan durasi sebelum suara ada: 2,6 kata per detik + jeda. Sesudah suara: dari timing nyata.

Arc 1 (10 episode, `docs/cerita/arc-1.md`) ditulis ulang dalam format ini; isi dan pelajaran tiap episode tetap.

## 4. Animasi

### Rig tokoh

Setiap tokoh digambar ulang sebagai potongan SVG dengan titik putar per sendi, gaya jurnal tetap:

- **Arta, Bu Ratna**: kepala, leher, badan, lengan atas, lengan bawah, tangan, paha, betis, kaki. Arta: cepol + pensil sebagai bagian dengan gerak ikutan.
- **Mbis**: kepala, badan, 4 kaki, ekor (gerak ikutan).
- Ekspresi wajah ±12 per tokoh, bisa ditukar per frame: `datar, ambis, senyum, tawa, marah, panik, kaget, ngantuk, sok_yakin, terharu, hancur, lirik` (Mbis punya set sendiri).
- Mulut: 5 bentuk (tutup, kecil, sedang, lebar, "o"), dipilih dari amplitudo dan kelas bunyi audio.
- Gerak hidup bawaan: kedip acak 3 sampai 5 detik, napas, squash and stretch saat mendarat dan melompat, gerak ikutan cepol/pensil/ekor.

Antarmuka: `pose` = sudut per sendi + ekspresi + posisi akar. Komponen `<Tokoh id pose mulut />` menggambar satu frame dari satu pose. Rig tidak tahu apa pun tentang aksi.

### Pustaka aksi

Satu aksi = rangkaian pose kunci dengan waktu relatif dan easing, plus parameter. Disimpan sebagai data (`template/src/aksi/<nama>.ts`), diuji dengan render still per pose kunci.

- Atribut: `nama`, `tokoh` yang didukung, `durasi` bawaan, `penuh` (seluruh badan, true/false), parameter (`benda`, `arah`, `kecepatan`), titik "kontak" (frame tempat SFX dan benda menempel).
- Awal Fase 1 (Arta): `diam_hidup`, `jalan`, `hentak`, `banting(benda)`, `lompat`.
- Target Fase 2 (±15): tambah `lari`, `tunjuk`, `lemas`, `kaget`, `tidur_berdiri`, `terduduk`, `menoleh`, `serahkan(benda)`; Mbis `ngintip`, `geleng`, `muncul`; Bu Ratna `lirik_hp`, `menghela`.
- Aksi baru dibuat animator sekali bila naskah membutuhkannya, lalu masuk pustaka.

Perangkai aksi: dari daftar aksi beat + waktu kata, hasilkan jalur pose per tokoh per frame dengan transisi halus antar aksi (blend 4 sampai 6 frame).

### Aturan "tidak pernah diam" (lapisan B)

Setiap adegan, di luar aksi tokoh, memakai:

- latar 3 lapis dengan parallax kamera;
- properti yang masuk/keluar dengan animasi (pop, jatuh, terlempar), bukan muncul diam;
- teks per kata dengan cap besar dan getar di kata `puncak`;
- kamera: `lebar`, `dekat` (close-up wajah besar), `sisipan` (benda), dengan gerak `hentak`, `sapu`, `getar`, `dorong`;
- transisi antar beat bergaya jurnal: halaman dibalik, coretan pensil menyapu, potong cepat.

### Timeline adegan (`adegan.json` versi 2)

Dibangun `python -m scripts.adegan` dari naskah beat + timing suara:

```json
{"durasi": 52.3, "fps": 30,
 "jalur": {
   "kamera": [{"mulai": 0, "selesai": 2.1, "jenis": "lebar", "gerak": "dorong"}],
   "tokoh": {"arta": [{"mulai": 0, "aksi": "lompat", "param": {}}]},
   "properti": [{"id": "sticky_7jam", "masuk": 14.2, "cara": "banting"}],
   "teks": [{"kata": "TUJUH", "mulai": 15.1, "selesai": 15.6, "gaya": "cap"}],
   "sfx": [{"nama": "brak", "pada": 15.12}],
   "musik": [{"trek": "tegang_naik", "mulai": 11.0, "selesai": 16.0}],
   "transisi": [{"pada": 16.0, "jenis": "halaman"}]
 },
 "penutup": {"judul_berikut": "..."}}
```

Remotion merender timeline ini; komposisi `Episode` menerima `adegan.json` + `suara.wav` + `mix.wav` (lihat bagian 6).

## 5. Suara

Approval 1 menanyakan pilihan suara. Pipeline berhenti dengan kode 4 sampai `disetujui: true` dan `sumber_suara` terisi.

### Jalur ElevenLabs (berbayar)

- **Prasyarat pemilik**: paket berbayar aktif dan kunci API baru dengan izin `text_to_speech`, `user_read`, `voices_read`, `voices_write`, `sound_generation` (dan `music_generation` bila musik dibuat di ElevenLabs). Disimpan sebagai `ELEVENLABS_API_KEY` di environment.
- **Audisi sekali per tokoh**: cari di pustaka suara dengan bahasa Indonesia dan ciri tokoh (Arta: perempuan remaja; Mbis: laki-laki, kering, rendah; Bu Ratna: perempuan dewasa; Kak Bima: laki-laki muda). 3 sampai 4 kandidat per tokoh, sampel dari dialog naskah asli, dikirim ke pemilik. Pilihan dikunci di `config/suara.yaml` (voice_id + pengaturan).
- **Sintesis sebagai percakapan** (text-to-dialogue `eleven_v3`) per beat, supaya ritme antar tokoh natural. Arah emosi dari `arah` dialog diubah ke tag audio.
- 2 sampai 3 versi per beat; pemilihan otomatis memakai kecocokan kata (≥ 0,95) dan ukuran emosi per penutur; pemilik bisa menukar versi di Approval 2.
- Saldo dibaca sebelum mulai; kurang → `butuh_persetujuan` (perilaku Rencana 1 tetap).

### Jalur suara manusia

- `python -m scripts.suara.lembar <folder>` menulis `lembar-rekaman.md`: dialog bernomor per tokoh dengan arahan emosi, contoh `[07] Arta · teriak kesal · OKE. Aku belajar TUJUH jam!`.
- Pemilik merekam satu file per tokoh (voice note, m4a, wav) ke `<folder>/rekaman/<tokoh>.*`. Satu orang boleh mengisi beberapa tokoh.
- `python -m scripts.suara.manusia <folder>`:
  1. konversi ke wav 44,1 kHz mono, kurangi noise, normalisasi;
  2. transkrip Whisper + penyelarasan ke teks naskah untuk memotong per baris;
  3. baris hilang atau kecocokan < 0,9 → status `butuh_rekam_ulang` dengan daftar nomor baris; pemilik merekam hanya baris itu ke `rekaman/ulang-<nomor>.*`;
  4. opsi efek ringan untuk Mbis (`config/suara.yaml: manusia.mbis_efek`), mati secara bawaan.
- Keluaran sama dengan jalur ElevenLabs: klip per baris, `timing.json`, `transkrip.json`.

### Bersama

- Perakitan dialog per beat dengan jeda dari naskah (kode `rakit.py` yang ada).
- Bentuk mulut dari audio per penutur.
- **Approval 2: trek dialog.** Pemilik mendengar `dialog.wav` sebelum animasi. Sistem menandai baris mencurigakan (misalnya teriakan yang lebih pelan dari baris tenang penutur yang sama), tetapi penilaian datar/tidak ada di pemilik.

## 6. Musik dan SFX

- **Pustaka SFX** `aset/sfx/`: 30 sampai 40 suara dibuat sekali (ElevenLabs Sound Effects, lisensi komersial paket berbayar), masing-masing dengan nama dan tag di `aset/sfx/katalog.yaml`. Contoh: `whoosh, tok, brak, pop, langkah, detak_jam, notif_wa, bel_mbis, tabrak_kartun, dengkur`.
- **Pustaka musik** `aset/musik/`: 5 sampai 6 trek per suasana (`ceria_konyol, tegang_naik, piano_sunyi, tema_mbis, penutup_bersambung`), dari sumber bebas royalti dengan lisensi komersial atau ElevenLabs Music. Setiap trek mencatat sumber dan lisensi di `aset/musik/katalog.yaml`. `tema_mbis` dan `penutup_bersambung` dipakai konsisten di semua episode.
- **Mixing** `python -m scripts.mix <folder>` → `mix.wav`: musik turun ±14 dB saat dialog (ducking) dan naik di jeda; SFX di titik kontak aksi; musik mati di beat `mengena`; loudness akhir −14 LUFS, puncak ≤ −1 dBTP.
- Keluaran tambahan `video-tanpa-musik.mp4` untuk dipakai dengan lagu tren di aplikasi. Lagu berhak cipta tidak dimasukkan ke file.

## 7. QA

| Area | Pemeriksaan | Gagal jika |
|---|---|---|
| Naskah | validator bagian 3 | aturan dilanggar |
| Suara | kecocokan kata, loudness, klip, baris hilang | sesuai ambang di bagian 5 |
| Gerak | skor gerak per jendela 0,5 detik (rata-rata selisih piksel antar frame, sampel 10 fps) | ada > 1,5 detik di bawah ambang, kecuali di beat `mengena` |
| Gerak | jumlah potongan kamera, aksi `penuh` | < 1 potongan per 6 detik rata-rata; < 2 aksi penuh |
| Audio | musik ada di luar beat `mengena`; SFX di titik kontak ±2 frame; −14 LUFS ±1 | salah satu tidak terpenuhi |
| Teknis | dari Rencana 1 (durasi, resolusi, frame kosong, audio ada) | sama |

Ambang skor gerak dikalibrasi di Fase 1: pilot Ep.1 lama harus gagal, adegan contoh yang disetujui pemilik harus lulus.

`qa.md` tidak lagi menulis "semua lulus" sebagai kesimpulan. Isinya: angka gerak per detik (grafik kecil di `cek-gerak.png`), daftar beat dengan waktu, temuan, lalu permintaan agar pemilik menonton.

## 8. Alur produksi dan persetujuan

Tahap di `scripts/tahap.py` menjadi:

`naskah → [Approval 1: naskah + sumber_suara] → suara → [Approval 2: trek dialog] → adegan → mix → render_draf → qa_gerak → render → qa_final → kemasan → [Approval 3: video final] → gerbang`

- `render_draf`: 360×640, cepat, untuk QA gerak dan pemeriksaan agent sebelum render penuh.
- `qa_gerak`: baris "Gerak" dan "Audio" tabel QA (pada draf dan `mix.wav`). `qa_final`: baris "Teknis" pada `video.mp4`.
- Kode keluar: 0 lulus, 3 butuh persetujuan biaya, 4 butuh persetujuan pemilik, 5 butuh rekam ulang (jalur manusia).
- Menandai tahap "lulus" ulang tanpa info tidak menghapus detail (perbaikan pilot, sudah ada).

Target 7 episode per minggu dipenuhi lewat perencanaan mingguan (Fase 3): satu sesi menulis 7 naskah untuk disetujui sekaligus, rekaman manusia dikumpulkan sekali seminggu bila jalur manusia dipilih.

## 9. Tahapan kerja

| Fase | Isi | Selesai bila |
|---|---|---|
| **1. Adegan contoh** | rig Arta, aksi `diam_hidup, jalan, hentak, banting, lompat`, lapisan B untuk satu adegan, ±12 SFX, 2 trek musik, audisi suara Indonesia ElevenLabs (Arta, Bu Ratna), adegan "Tiga tempat?" → "TUJUH JAM!" (±10 detik) berkualitas final, kalibrasi ambang QA gerak | **pemilik menyetujui adegan contoh** |
| **2. Ep.1 ulang** | naskah beat + validator, `adegan.json` v2 + perangkai aksi, rig Bu Ratna dan Mbis, ±15 aksi, jalur suara manusia, pustaka SFX/musik lengkap, mixing, QA baru, Ep.1 ditulis ulang dan diproduksi | pemilik menyetujui Ep.1 |
| **3. Produksi Arc 1** | 9 naskah Arc 1 berikutnya, perencanaan mingguan, ukur waktu dan token per episode | 7 episode per minggu berjalan 2 minggu berturut-turut |

Satu rencana implementasi per fase. Rencana Fase 2 baru ditulis sesudah Fase 1 disetujui.

## 10. Risiko

- **Rig terlihat kaku seperti boneka.** Mitigasi: gerak ikutan, squash and stretch, easing per aksi; adegan contoh Fase 1 adalah gerbang sebelum investasi lebih besar.
- **Suara Indonesia di pustaka ElevenLabs kurang ekspresif.** Mitigasi: audisi dengan dialog asli sebelum dikunci; jalur suara manusia selalu tersedia.
- **Biaya token per episode naik** (koreografi lebih rinci). Mitigasi: pustaka aksi dan aset dipakai ulang; ukur di Fase 1 dan 2 sebelum menjanjikan 7 per minggu.
- **Lisensi musik/SFX.** Setiap aset mencatat sumber dan lisensi; tanpa catatan lisensi, aset tidak boleh dipakai (dicek QA).

## 11. Di luar cakupan

Video AI, animator manusia, kloning suara, lagu tren di dalam file video, konten turunan (klip pendek Mbis), Notion/Drive, analis performa.

## 12. Yang perlu disiapkan pemilik

1. Paket ElevenLabs berbayar dan kunci API baru dengan izin di bagian 5.
2. Untuk episode jalur manusia: rekaman per tokoh sesuai lembar rekaman.
3. Menonton dan menyetujui adegan contoh Fase 1.
