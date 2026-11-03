# Fase 1: Adegan Contoh "Tiga tempat?" → "TUJUH JAM!" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Satu adegan ±10 detik berkualitas final (rig Arta + aksi seluruh badan + lapisan "tidak pernah diam" + SFX + musik + mixing) untuk dinilai pemilik, plus alat audisi suara Indonesia dan QA gerak yang terkalibrasi.

**Architecture:** Rig tokoh adalah fungsi murni `pose → SVG`. Aksi adalah data pose kunci; perangkai mengubah daftar aksi bertanggal menjadi pose per frame. Lapisan kamera/properti/teks juga fungsi murni `waktu → transform`. Komposisi Remotion `AdeganV2` hanya merangkai fungsi-fungsi itu dari `adegan.json` v2. Audio: dialog → mix (musik + SFX + ducking) oleh Python. Episode v1 tidak disentuh sampai Fase 2.

**Tech Stack:** Remotion 4.0.539, React 19, TypeScript, vitest; Python 3.13 (numpy, soundfile, PyYAML, jsonschema, requests), ffmpeg (loudnorm).

**Spec:** `docs/superpowers/specs/2026-11-02-perombakan-serial-design.md` (bagian 4, 5, 6, 7, 9)

## Global Constraints

- 720×1280, 30 fps, H.264 + AAC. Palet hanya dari objek `P` di `template/src/sistem/gambar.ts`.
- Loudness akhir −14 LUFS ±1, puncak ≤ −1 dBTP. Ducking musik ±14 dB saat dialog. Musik mati di beat `mengena`.
- QA gerak: skor per jendela 0,5 detik dari sampel 10 fps; gagal bila > 1,5 detik berturut-turut di bawah ambang, kecuali rentang beat `mengena`.
- Setiap aset audio wajib punya `sumber` dan `lisensi` di katalog; tanpa itu `mix.py` menolak.
- Mbis maksimal 3 baris; tanpa tanda pisah panjang di teks layar.
- Kunci API tidak pernah ditulis ke file atau log.

## Review Focus

1. **Kunci ElevenLabs tanpa izin** (`voices_read`, `sound_generation`) → `audisi.py`/`aset.py` berhenti dengan pesan izin yang jelas dan kode 3, bukan traceback. (Task 6, 7)
2. **Transisi antar aksi** → tidak ada lompatan pose: selisih sudut sendi antar frame berurutan ≤ 25° di batas aksi. (Task 2)
3. **SFX/teks bertanda `pada_kata` yang tidak ditemukan di transkrip** → error yang menyebut kata dan beat, bukan diam-diam di detik 0. (Task 4)
4. **Ducking di dialog yang sangat pendek atau tumpang tindih** → musik tidak "memompa": attack 60 ms, release 300 ms, jendela dialog digabung bila jaraknya < 250 ms. (Task 6)
5. **Video yang diam karena tokoh hanya bernapas** → QA gerak menandainya walaupun kedip/napas ada (ambang di atas gerak bawaan). (Task 5)

---

## Struktur file

```
template/src/rig/pose.ts          # tipe Pose, SENDI_ARTA, interpolasiPose, easing
template/src/rig/arta.ts          # gambarArta(pose, opsi) -> string SVG (potongan berporos)
template/src/aksi/tipe.ts         # tipe Aksi, PoseKunci
template/src/aksi/arta.ts         # 5 aksi Arta
template/src/aksi/rangkai.ts      # rangkaiJalur(...) -> (frame) => Pose
template/src/lapisan/kamera.ts    # kameraPada(...)
template/src/lapisan/gerak.ts     # propertiPada(...), teksPada(...), transisiPada(...)
template/src/AdeganV2.tsx         # komposisi
template/src/data/adegan2.ts      # tipe adegan.json v2
schemas/adegan2.schema.json
scripts/waktu_kata.py             # pada_kata -> detik (dari transkrip)
scripts/mix.py                    # dialog + musik + sfx -> mix.wav
scripts/aset.py                   # bangun SFX dari katalog via ElevenLabs
scripts/musik_sintetis.py         # trek musik sementara buatan sendiri (lisensi jelas)
scripts/qa_gerak.py               # skor gerak + kalibrasi
scripts/suara/audisi.py           # audisi suara Indonesia
aset/sfx/katalog.yaml, aset/musik/katalog.yaml
videos/contoh-fase1/              # adegan contoh
```

---

### Task 1: Rig Arta

**Files:** Create `template/src/rig/pose.ts`, `template/src/rig/arta.ts`; Test `template/test/rig.test.ts`, `tests/test_rig_render.py`

**Interfaces:**
- Produces:
  - `type Sendi = "badan"|"kepala"|"lenganAtasKi"|"lenganBawahKi"|"lenganAtasKa"|"lenganBawahKa"|"pahaKi"|"betisKi"|"pahaKa"|"betisKa"` (derajat).
  - `type Pose = { x: number; y: number; skala: number; sx: number; sy: number; sendi: Record<Sendi, number>; ekspresi: string }` (`sx/sy` = squash-stretch, 1 = normal).
  - `POSE_DASAR: Pose`, `interpolasiPose(a: Pose, b: Pose, t: number): Pose` (ekspresi berganti di t ≥ 0,5), `easing: Record<"linear"|"masuk"|"keluar"|"masukKeluar"|"pantul"|"lentur", (t:number)=>number>`.
  - `gambarArta(pose: Pose, opsi: { mulut: 0|1|2|3|4; kedip: number; ikutan: number }): string` — SVG string; `ikutan` = sudut cepol/pensil (derajat) dari gerak ikutan.
  - `ikutanCepol(poseSebelum: Pose, pose: Pose, ikutanSebelum: number): number` — pegas teredam (k 0,25, redam 0,7) terhadap perubahan sudut kepala+badan.
- Ekspresi: semua ekspresi `artaHead` yang ada + `panik`, `tawa`. Mulut 0..4 dipetakan ke bentuk mulut berbeda.

- [ ] **Step 1: Test gagal** — `interpolasiPose(a,b,0.5).sendi.badan === (a+b)/2`; `easing.pantul(1) === 1`; `gambarArta(POSE_DASAR,{mulut:0,kedip:0,ikutan:0})` memuat `id="arta-lenganBawahKa"`; dua pose dengan `lenganAtasKa` beda 90° menghasilkan string berbeda; `ikutanCepol` kembali mendekati 0 (|x| < 1) setelah 30 langkah tanpa gerak. Python: render still `RigArta` (komposisi uji 720×1280, beberapa pose berjajar) → PNG tidak kosong (std > 10).
- [ ] **Step 2: Jalankan** `npm test --prefix template` dan `pytest tests/test_rig_render.py` → FAIL
- [ ] **Step 3: Implementasikan** — potongan digambar ulang dari `artaFull`/`artaHead` di `gambar.ts`; tiap segmen `<g id="arta-<sendi>" transform="rotate(sudut poros)">` bersarang (bahu → siku, pinggul → lutut).
- [ ] **Step 4: Jalankan** → PASS. Lihat PNG pose: tidak ada sambungan bolong di bahu/pinggul/siku/lutut pada sudut ±120°.
- [ ] **Step 5: Commit** — `feat: rig Arta per sendi dengan gerak ikutan`

### Task 2: Pustaka aksi + perangkai

**Files:** Create `template/src/aksi/tipe.ts`, `template/src/aksi/arta.ts`, `template/src/aksi/rangkai.ts`; Test `template/test/aksi.test.ts`

**Interfaces:**
- Consumes: `Pose`, `interpolasiPose`, `easing` (Task 1).
- Produces:
  - `type PoseKunci = { t: number; pose: Partial<Omit<Pose,"sendi">> & { sendi?: Partial<Record<Sendi, number>> }; easing?: keyof typeof easing }` (t = detik relatif).
  - `type Aksi = { nama: string; tokoh: "arta"; durasi: number; penuh: boolean; ulang?: boolean; kontak?: number; kunci: PoseKunci[] }`.
  - `AKSI_ARTA: Record<"diam_hidup"|"jalan"|"hentak"|"banting"|"lompat", Aksi>`; `banting.kontak` = detik benda menempel; `jalan` dan `diam_hidup` `ulang: true`.
  - `type EntriAksi = { mulai: number; aksi: string; param?: { dx?: number; benda?: string } }`.
  - `rangkaiJalur(entri: EntriAksi[], fps: number, awal: Pose): (frame: number) => Pose` — pose relatif aksi ditumpuk di atas posisi akhir aksi sebelumnya; blend 5 frame antar aksi.
  - `titikKontak(entri: EntriAksi[]): { aksi: string; detik: number }[]`.

- [ ] **Step 1: Test gagal** — `test_diam_hidup_bergerak` (pose frame 0 ≠ frame 45); `test_kontak_banting` (`titikKontak([{mulai:2,aksi:"banting"}])[0].detik === 2 + AKSI_ARTA.banting.kontak`); `test_tanpa_lompatan` (untuk urutan jalan→hentak→banting→lompat→diam_hidup, setiap sendi berubah ≤ 25° antar frame berurutan) (Review Focus #2); `test_jalan_berpindah` (`param.dx = 200` → x akhir = x awal + 200); `test_lompat_squash` (ada frame dengan `sy < 0.9` dan frame dengan `sy > 1.08`); `test_aksi_tak_dikenal_error`.
- [ ] **Step 2: Jalankan** → FAIL
- [ ] **Step 3: Implementasikan** — prinsip animasi: antisipasi sebelum aksi besar, overshoot lalu settle, squash saat mendarat. `diam_hidup`: napas badan ±1,5°, berat badan bergeser, lengan sedikit berayun.
- [ ] **Step 4: Jalankan** → PASS
- [ ] **Step 5: Commit** — `feat: pustaka aksi Arta dan perangkai jalur pose`

### Task 3: Lapisan kamera, properti, teks, transisi

**Files:** Create `template/src/lapisan/kamera.ts`, `template/src/lapisan/gerak.ts`; Test `template/test/lapisan.test.ts`

**Interfaces:**
- Produces:
  - `type EntriKamera = { mulai: number; selesai: number; jenis: "lebar"|"dekat"|"sisipan"; target?: { x: number; y: number }; gerak?: "diam"|"dorong"|"hentak"|"sapu"|"getar" }`.
  - `kameraPada(jalur: EntriKamera[], detik: number): { skala: number; x: number; y: number; rot: number }` — `lebar` skala 1; `dekat` skala 2,4 ke target; `sisipan` skala 3; `hentak` = lonjakan skala +12% lalu turun dalam 6 frame + getar 4 px; `dorong` = +6% linier; potongan antar entri tanpa blend.
  - `type EntriProperti = { id: string; masuk: number; cara: "pop"|"jatuh"|"banting"|"terlempar"; keluar?: number; caraKeluar?: "jatuh"|"terlempar" }`; `propertiPada(e, detik): { tampil: boolean; x: number; y: number; skala: number; sx: number; sy: number; rot: number }` relatif posisi diam.
  - `type EntriTeks = { kata: string; mulai: number; selesai: number; gaya: "biasa"|"cap" }`; `teksPada(jalur: EntriTeks[], detik): { kata: string; skala: number; rot: number; aktif: boolean }[]` — kata muncul pop 4 frame; `cap` masuk dari skala 3,2 + getar ±3° selama 0,3 detik; satu layar maks 2 baris (pakai `pecahCaption` yang ada).
  - `transisiPada(t: { pada: number; jenis: "halaman"|"coret"|"potong" }[], detik): { jenis: string; kemajuan: number } | null` — durasi 0,35 detik berpusat di `pada`.

- [ ] **Step 1: Test gagal** — `hentak` di detik mulai+0,1 skala > 1,08 dan di +0,5 kembali ≤ 1,02; `dekat` skala 2,4; `banting` properti: sebelum `masuk` tidak tampil, di `masuk` sx > 1,15, 0,3 detik sesudah = diam; `terlempar` keluar: 0,4 detik sesudah `keluar` posisi > 400 px dari asal; `cap` skala > 2 di frame pertama dan 1 di +0,3; transisi null di luar jendela.
- [ ] **Step 2–4:** jalankan → FAIL, implementasikan, jalankan → PASS
- [ ] **Step 5: Commit** — `feat: lapisan kamera, properti, teks kinetik, transisi`

### Task 4: adegan.json v2 + komposisi AdeganV2

**Files:** Create `schemas/adegan2.schema.json`, `template/src/data/adegan2.ts`, `template/src/AdeganV2.tsx`, `scripts/waktu_kata.py`; Modify `template/src/Root.tsx` (tambah komposisi `AdeganV2`), `template/src/dunia/latar.ts` (latar `dinding_sticky` 3 lapis + properti `hp_wa`, `sticky_7jam` sebagai benda lepas); Test `tests/test_waktu_kata.py`, `tests/test_adegan2_render.py`

**Interfaces:**
- Consumes: Task 1–3.
- Produces:
  - `adegan.json` v2 persis bentuk spec bagian 4 (`durasi`, `fps`, `jalur.{kamera,tokoh,properti,teks,sfx,musik,transisi}`), plus `latar` per rentang: `jalur.latar: [{mulai, latar}]` dan `jalur.dialog: [{penutur, mulai, selesai}]` untuk mulut.
  - Komposisi `AdeganV2` props `{ adeganFile: string; audioFile: string }`; `durationInFrames = ceil(durasi*fps)`.
  - `waktu_kata.sisipkan(adegan: dict, transkrip: dict[str, list[dict]]) -> dict` — mengganti setiap `{"pada_kata": "TUJUH", "baris": "b06"}` di jalur mana pun dengan `"pada": detik_mulai_kata`; kata tidak ditemukan → `KataTidakAda("TUJUH di b06")` (Review Focus #3). CLI `python -m scripts.waktu_kata <folder>` menulis `adegan.json` dari `adegan.sumber.json`.
  - Mulut dari amplitudo `audioFile` hanya untuk tokoh yang sedang bicara (`jalur.dialog`).

- [ ] **Step 1: Test gagal** — `test_sisipkan_kata`, `test_kata_tidak_ada_error`, `test_sumber_valid_skema`; render still `AdeganV2` di 3 frame dari `tests/data/adegan2_contoh.json` → PNG 720×1280 tidak kosong dan ketiganya berbeda.
- [ ] **Step 2–4:** FAIL → implementasi → PASS
- [ ] **Step 5: Commit** — `feat: adegan.json v2 dan komposisi AdeganV2`

### Task 5: QA gerak

**Files:** Create `scripts/qa_gerak.py`; Test `tests/test_qa_gerak.py`

**Interfaces:**
- Produces: `skor_gerak(video: Path, fps_sampel: int = 10) -> list[float]` (per jendela 0,5 detik: rata-rata |selisih piksel| grayscale 180×320 antar sampel berurutan); `periksa(video: Path, kecuali: list[tuple[float,float]], ambang: float) -> list[str]`; `gambar_grafik(skor, keluar: Path)` → `cek-gerak.png`; CLI `python -m scripts.qa_gerak <video> [--kecuali a-b ...] [--ambang X]` kode 0/1. Ambang bawaan disimpan di `config/qa.yaml: gerak.ambang`.

- [ ] **Step 1: Test gagal** — video uji ffmpeg: `testsrc` bergerak lulus; 3 detik gambar diam + kedip kecil (kotak 10×10 berkedip) gagal (Review Focus #5); diam yang berada di rentang `kecuali` lulus; `cek-gerak.png` dibuat.
- [ ] **Step 2–4:** FAIL → implementasi → PASS
- [ ] **Step 5: Kalibrasi** — jalankan pada `videos/2026-W46/ep01/video.mp4` (pilot lama) dan pada adegan contoh (Task 8). Tetapkan ambang di `config/qa.yaml` sehingga pilot **gagal** dan adegan contoh **lulus**; catat kedua angka di laporan Task 8.
- [ ] **Step 6: Commit** — `feat: QA gerak dengan grafik skor`

### Task 6: Aset audio + mixing

**Files:** Create `aset/sfx/katalog.yaml`, `aset/musik/katalog.yaml`, `scripts/aset.py`, `scripts/musik_sintetis.py`, `scripts/mix.py`; Test `tests/test_mix.py`, `tests/test_aset.py`

**Interfaces:**
- Katalog: `{nama: {prompt|resep, durasi, file, sumber, lisensi, tag}}`. SFX Fase 1 (±12): `whoosh, tok, brak, pop, langkah, hentak, notif_wa, bel_mbis, tabrak_kartun, getar_kertas, gedebuk, desis_marah`. Musik Fase 1: `ceria_konyol`, `tegang_naik`.
- `aset.bangun_sfx(nama: str, klien) -> Path` via `POST /v1/sound-generation` (`text`, `duration_seconds`, `prompt_influence 0.6`); `sumber: elevenlabs-sfx`, `lisensi` diisi dari paket akun (`gratis-nonkomersial` bila langganan tak terbaca). Izin kurang → pesan + kode 3 (Review Focus #1). File yang sudah ada dilewati kecuali `--ulang`.
- `musik_sintetis.buat(nama: str, detik: float, bpm: int) -> Path` — trek sementara buatan sendiri dengan numpy (pizzicato/marimba sintetis + bass + perkusi ringan), `sumber: dibuat-sendiri`, `lisensi: milik-sendiri`. Diganti trek ElevenLabs Music/berlisensi saat paket berbayar aktif.
- `mix.campur(dialog: Path, jalur_musik: list[dict], jalur_sfx: list[dict], keluar: Path, sunyi: list[tuple[float,float]]) -> dict` → `mix.wav` + ringkasan `{lufs, puncak_dbtp}`. Ducking −14 dB, attack 60 ms, release 300 ms, jendela dialog berjarak < 250 ms digabung (Review Focus #4); musik nol di rentang `sunyi`; loudnorm ffmpeg dua tahap ke −14 LUFS, TP −1. Aset tanpa `lisensi` → `AsetTanpaLisensi`.

- [ ] **Step 1: Test gagal** — `test_ducking_saat_dialog` (RMS musik di jendela dialog ≥ 12 dB lebih rendah dari di luar), `test_tidak_memompa` (dua dialog berjarak 200 ms: tidak ada naik-turun > 3 dB di celahnya), `test_sunyi_nol`, `test_sfx_di_titik` (onset SFX ±1 frame), `test_lufs` (−14 ±1), `test_aset_tanpa_lisensi_ditolak`, `test_izin_kurang_kode_3` (klien palsu 401 missing_permissions), `test_musik_sintetis_durasi_dan_tidak_hening`.
- [ ] **Step 2–4:** FAIL → implementasi → PASS
- [ ] **Step 5: Bangun aset** — `python -m scripts.aset sfx` dan `python -m scripts.musik_sintetis`; dengarkan via transkripsi/spektrum (SFX tidak hening, durasi sesuai).
- [ ] **Step 6: Commit** — `feat: pustaka SFX dan musik, mixing dengan ducking dan loudness`

### Task 7: Audisi suara Indonesia

**Files:** Create `scripts/suara/audisi.py`; Test `tests/test_audisi.py`

**Interfaces:**
- Produces: `cari(klien, tokoh: str, kriteria: dict) -> list[dict]` (`GET /v1/shared-voices` dengan `language=id`, `gender`, `age`, `sort=trending`, maks 4); `tambahkan(klien, kandidat) -> voice_id` (`POST /v1/voices/add/{public_owner_id}/{voice_id}`); `buat_sampel(klien, voice_id, teks: list[str], keluar: Path)`; CLI `python -m scripts.suara.audisi <tokoh...>` menulis `audisi/<tokoh>/<nama>.mp3` + `audisi/audisi.md` (nama, deskripsi, aksen, kecocokan Whisper, tautan file). Kriteria: Arta `female, young`; Bu Ratna `female, middle_aged`; Mbis `male, middle_aged` deskripsi "dry/deadpan/raspy"; Bima `male, young`. Teks sampel = dialog asli tokoh di Ep.1.
- Izin kurang (`voices_read`) → pesan "buat kunci baru dengan izin …" + kode 3 (Review Focus #1).

- [ ] **Step 1: Test gagal** — dengan klien palsu: filter bahasa id, maks 4 per tokoh, kode 3 saat 401 missing_permissions, `audisi.md` memuat setiap kandidat.
- [ ] **Step 2–4:** FAIL → implementasi → PASS
- [ ] **Step 5: Jalankan sungguhan bila kunci sudah berizin**; bila belum, catat sebagai prasyarat terbuka.
- [ ] **Step 6: Commit** — `feat: audisi suara Indonesia ElevenLabs`

### Task 8: Produksi adegan contoh

**Files:** Create `videos/contoh-fase1/adegan.sumber.json`, `videos/contoh-fase1/README.md` (laporan); dialog dari audisi bila tersedia, bila tidak dari klip pilot `b04/b05/b06` sebagai **suara sementara** (ditandai jelas di laporan).

Koreografi (±10 detik, latar ruang tamu → dinding sticky):
1. Lebar: Bu Ratna di sofa melirik HP, notif WA (`notif_wa`), dialog Ratna. Arta masuk dari kiri (`jalan`, `langkah`) di belakangnya. Mbis mengintip dari rak. Bu Ratna dan Mbis memakai gambar yang ada (`ratnaBust`, `mbis`) dengan mulut, kedip, dan gerak lapisan; rig mereka masuk Fase 2.
2. "Tiga tempat?": potong ke dekat wajah Arta, `desis_marah`, kamera `dorong`.
3. "OKE.": lebar, `hentak` (+SFX `hentak`, kamera `hentak`, sticky lain bergetar).
4. "Aku belajar TUJUH jam!": `banting(sticky_7jam)` di kata TUJUH (`brak`, teks cap, rona merah, sticky lain `jatuh`), lalu `lompat` dengan kepalan, mendarat `gedebuk`.
5. Ekor 1 detik: Arta terengah (`diam_hidup` cepat), transisi `coret` keluar.
Musik `tegang_naik` dari beat 2, `ceria_konyol` di beat 1.

- [ ] **Step 1:** Tulis `adegan.sumber.json`; `python -m scripts.waktu_kata videos/contoh-fase1` → `adegan.json`
- [ ] **Step 2:** `python -m scripts.mix videos/contoh-fase1` → `mix.wav` (−14 LUFS)
- [ ] **Step 3:** Render `AdeganV2` → `videos/contoh-fase1/adegan.mp4`
- [ ] **Step 4:** `python -m scripts.qa_gerak` (kalibrasi Task 5 Step 5) + `python -m scripts.qa_frame`-setara teknis (durasi, resolusi, audio)
- [ ] **Step 5:** Tonton lembar cuplikan tiap 0,25 detik; perbaiki sendi bolong, pose kaku, teks tertabrak. Maks 3 putaran.
- [ ] **Step 6:** Laporan `README.md`: apa yang final dan apa yang sementara (suara/musik), angka QA gerak pilot vs contoh, waktu render, token.
- [ ] **Step 7:** Commit (tanpa media) — `feat: adegan contoh Fase 1`; kirim video ke pemilik. **Berhenti: tunggu penilaian pemilik.**
