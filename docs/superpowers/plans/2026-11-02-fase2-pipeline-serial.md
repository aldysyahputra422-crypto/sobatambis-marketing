# Fase 2: Pipeline Serial Baru + Plugin Siap Pasang Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/sa-video <folder>` menjalankan pipeline baru (naskah beat → suara manusia/ElevenLabs → timeline otomatis → mix → render AdeganV2 → QA gerak) untuk Arta, Bu Ratna, dan Mbis yang semuanya ber-rig, dan plugin siap dipasang di akun utama pemilik. Berakhir di Approval 1 naskah Ep.1 versi baru.

**Architecture:** Naskah v2 berisi beat (spec bagian 3). `scripts/adegan2.py` mengubah beat + transkrip menjadi `adegan.sumber.json` lalu `waktu_kata` → `adegan.json` v2. Rig dan aksi digeneralisasi per tokoh (registry `TOKOH`). Suara punya dua jalur yang keluarannya sama (`dialog.wav`, `transkrip.json`, `timing.json`). Tahap baru di `status.TAHAP`.

**Tech Stack:** sama dengan Fase 1.

**Spec:** `docs/superpowers/specs/2026-11-02-perombakan-serial-design.md` (bagian 3, 4, 5, 7, 8, 9 Fase 2)

## Global Constraints

- Semua constraint Fase 1 (`docs/superpowers/plans/2026-11-02-fase1-adegan-contoh.md`) tetap berlaku.
- Kode keluar: 0 lulus, 1 gagal, 3 butuh persetujuan biaya/izin, 4 butuh persetujuan pemilik, 5 butuh rekam ulang.
- Mbis maksimal 3 baris dialog; tanpa "Sobat Ambis", "daftar", "Rp". Tanpa "—" di teks layar dan caption.
- Naskah v1 (`baris`) tetap bisa divalidasi; naskah v2 dikenali dari kunci `beat`.

## Review Focus

1. **Naskah tanpa hook atau beat `mengena` di luar 55–85%** → validator menyebut beat dan persentasenya. (Task 1)
2. **Rekaman manusia dengan baris hilang, ditukar urutan, atau diulang dua kali** → baris hilang terdaftar untuk rekam ulang; urutan ditukar tetap terpotong benar; ulangan memakai yang terakhir. (Task 6)
3. **Aksi yang tidak cocok dengan tokoh** (mis. `banting` untuk Mbis) → error menyebut tokoh dan aksi, bukan render gagal diam-diam. (Task 3)
4. **Beat tanpa dialog (lelucon visual)** → tetap dapat durasi (bawaan 1,5 detik atau `durasi` beat) dan muncul di timeline. (Task 5)
5. **Rerun sesudah rekam ulang sebagian** → baris lama yang lulus tidak diproses ulang. (Task 6)

---

### Task 1: Naskah v2 (beat) + validator

**Files:** Create `schemas/naskah2.schema.json`; Modify `scripts/naskah.py`; Test `tests/test_naskah2.py`, `tests/data/naskah2_contoh.json`

**Interfaces:**
- Produces: `naskah.muat(path) -> dict` menerima v1 atau v2 (v2 divalidasi `naskah2.schema.json`); `naskah.periksa_beat(n: dict, durasi_beat: dict[str,float] | None) -> list[str]`; `naskah.perkiraan_durasi_beat(beat) -> float` (dialog: kata/2,6 + jeda 0,3 per dialog; tanpa dialog: `beat.durasi` atau 1,5); CLI `python -m scripts.naskah periksa <folder>` kode 0/1/4 untuk v1 dan v2.
- Aturan v2 (spec bagian 3): beat pertama `hook` ≤ 2 dtk; tidak ada rentang > 8 dtk tanpa beat `lucu`/`hook` sebelum `mengena`; tepat satu `mengena` di 55–85% durasi; beat terakhir `penutup`; Mbis ≤ 3 dialog dan kata terlarang; ≥ 2 aksi `penuh` (daftar nama aksi penuh dibaca dari `template/src/aksi/*.ts` lewat regex `penuh: true`); tanpa "—"; emosi minimal 4 jenis dan satu intensitas ≥ 8.

- [ ] Test gagal: `test_v2_contoh_lulus`, `test_tanpa_hook`, `test_mengena_di_luar_rentang` (pesan memuat persen), `test_dua_mengena`, `test_celah_tanpa_lucu`, `test_mbis_lebih_dari_3`, `test_aksi_penuh_kurang`, `test_tanda_pisah`, `test_v1_tetap_valid`, `test_beat_visual_tanpa_dialog_berdurasi` (Review Focus #4) → FAIL → implementasi → PASS → commit `feat: naskah beat v2 dan validator`

### Task 2: Rig Bu Ratna dan Mbis + registry tokoh

**Files:** Create `template/src/rig/ratna.ts`, `template/src/rig/mbis.ts`, `template/src/rig/tokoh.ts`; Modify `template/src/uji/RigArta.tsx` → `RigTokoh` (props `{tokoh, variasi}`); Test `template/test/rig2.test.ts`, `tests/test_rig_render.py`

**Interfaces:**
- `gambarRatna(pose: Pose, opsi: OpsiGambar): string` — skeleton sama dengan Arta (Sendi sama), hijab + batik + rok panjang; ekspresi dari `eyes/mouth` yang ada.
- `gambarMbis(pose: Pose, opsi: OpsiGambar): string` — memakai `Pose`: `badan` (miring badan), `kepala`, `lenganAtasKi/Ka` = kaki depan, `pahaKi/Ka` = kaki belakang, `betisKa` = sudut ekor; ekspresi `senang|intip|datar|geleng`.
- `TOKOH: Record<"arta"|"ratna"|"mbis", { gambar(pose, opsi): string; tangan?(pose, sisi): {x,y,sudut}; tinggi: number }>`.
- `ikutanCepol` dipakai untuk Arta (pensil), Ratna (ujung hijab), Mbis (ekor) lewat `ikutan`.

- [ ] Test gagal: setiap tokoh memuat segmen per sendi; ekspresi beda → SVG beda; `TOKOH.ratna.tangan` ada; render `RigTokoh` per tokoh tidak kosong → FAIL → implementasi → lihat PNG ekstrem → PASS → commit `feat: rig Bu Ratna dan Mbis`

### Task 3: Pustaka aksi per tokoh (±15 Arta + Ratna + Mbis)

**Files:** Modify `template/src/aksi/arta.ts`, `template/src/aksi/tipe.ts`, `template/src/aksi/rangkai.ts`; Create `template/src/aksi/ratna.ts`, `template/src/aksi/mbis.ts`, `template/src/aksi/index.ts`; Test `template/test/aksi.test.ts`

**Interfaces:**
- `Aksi.tokoh: "arta"|"ratna"|"mbis"`; `AKSI: Record<tokoh, Record<string, Aksi>>`; `rangkaiJalur(entri, fps, awal, tokoh = "arta")`; `titikKontak(entri, tokoh = "arta")`. Aksi tidak dikenal untuk tokoh → `Error("aksi '<nama>' tidak tersedia untuk <tokoh>")` (Review Focus #3).
- Arta tambahan: `lari`, `tunjuk`, `lemas`, `kaget`, `tidur_berdiri`, `terduduk`, `menoleh`, `serahkan`, `tabrak` (kepala membentur, jatuh duduk). Ratna: `diam_hidup`, `lirik_hp`, `menghela`, `jalan`, `serahkan`. Mbis: `diam_hidup`, `ngintip`, `geleng`, `muncul`, `tutup_mata`.

- [ ] Test gagal: setiap aksi setiap tokoh tersampel tanpa NaN dan durasi > 0; batas 25°/frame di peralihan untuk urutan acak 6 aksi per tokoh (benih tetap); `banting` untuk mbis error; `lari` berpindah lebih cepat dari `jalan`; `tabrak` punya kontak; `menoleh` mengubah `kepala` ≥ 20° → FAIL → implementasi → PASS → commit `feat: pustaka aksi per tokoh`

### Task 4: AdeganV2 multi-tokoh ber-rig

**Files:** Modify `template/src/AdeganV2.tsx`, `template/src/data/adegan2.ts`, `schemas/adegan2.schema.json`, `tests/data/adegan2_contoh.json`, `videos/contoh-fase1/adegan.sumber.json`; Test `tests/test_adegan2_render.py`

**Interfaces:**
- `jalur.tokoh: Record<"arta"|"ratna"|"mbis", { awal: {x,y,skala,ekspresi}; aksi: EntriAksi[]; tampil?: Rentang[]; lapis?: "depan"|"belakang" }>` — semua tokoh ber-rig; `lapis: "belakang"` digambar sebelum `latar.depan` (Ratna di balik sofa). Bentuk statis Fase 1 dihapus; `contoh-fase1` dimigrasi.
- Benda `pegang` boleh dari tokoh mana pun (`pegang.tokoh`).

- [ ] Test gagal: render 3 frame `adegan2_contoh.json` (sudah dimigrasi, Ratna dan Mbis ber-aksi) → FAIL (skema lama) → implementasi → PASS; render ulang adegan contoh Fase 1, QA gerak masih lulus → commit `feat: AdeganV2 dengan semua tokoh ber-rig`

### Task 5: Pembangun timeline dari naskah beat

**Files:** Create `scripts/adegan2.py`; Test `tests/test_adegan2.py`

**Interfaces:**
- Consumes: naskah v2, `timing.json` (`[{id, mulai, selesai}]` per dialog `"<beat>.<n>"`), `transkrip.json` (kunci sama).
- Produces: `bangun(naskah: dict, timing: list[dict], transkrip: dict) -> dict` (adegan.sumber v2 dengan penanda kata) dan CLI `python -m scripts.adegan2 <folder>` → `adegan.sumber.json` lalu `adegan.json` (via `waktu_kata`).
- Aturan: beat mulai = dialog pertama − 0,25 (beat pertama 0), selesai = beat berikutnya mulai; beat tanpa dialog memakai `durasi` (bawaan 1,5). Kamera dari `beat.kamera` (bawaan: `hook` lebar+dorong, `naik` dekat+dorong pada dialog `puncak`, `mengena` sisipan diam, `lucu` lebar+hentak di punchline). Teks: satu `layar` per dialog, kata `puncak` bergaya `cap`. Aksi: `pada_kata` → `mulai_kata` dengan `geser = -kontak`. SFX: dari beat + `gedebuk`/`hentak`/`brak` otomatis di titik kontak aksi bila beat tidak menyebutnya. Musik: per beat, trek sama digabung. `sunyi` = rentang beat `mengena`. `rona` merah untuk emosi `marah` intensitas ≥ 8, gelap untuk `hancur` ≥ 8. Transisi `coret` saat latar berganti, `potong` selain itu. Posisi tokoh: `config/panggung.yaml` per latar (x,y,skala per tokoh, lapis).

- [ ] Test gagal: `test_durasi_ikut_timing`, `test_beat_visual_dapat_durasi`, `test_kamera_bawaan_per_jenis`, `test_teks_cap_di_puncak`, `test_sunyi_di_mengena`, `test_sfx_kontak_otomatis`, `test_transisi_saat_latar_berganti`, `test_hasil_valid_skema` → FAIL → implementasi → PASS → commit `feat: timeline adegan otomatis dari naskah beat`

### Task 6: Suara v2 — jalur ElevenLabs (dialog per beat) dan jalur manusia

**Files:** Create `scripts/suara/v2.py`, `scripts/suara/lembar.py`, `scripts/suara/manusia.py`; Test `tests/test_suara_v2.py`, `tests/test_manusia.py`

**Interfaces:**
- Keluaran kedua jalur: `<folder>/suara_baris/<beat>.<n>.wav`, `dialog.wav`, `timing.json`, `transkrip.json`, status tahap `suara` dengan `detail[<beat>.<n>]` (lulus disimpan; rerun melewati yang lulus — Review Focus #5).
- `v2.jalankan(folder, penyedia)` — ElevenLabs: per beat, `POST /v1/text-to-dialogue` (`inputs: [{text, voice_id}]`, model `eleven_v3`) bila beat punya > 1 dialog, selain itu TTS biasa; arah → tag audio (`teriak`→`[shouting]`, `bisik`→`[whispers]`, `ragu`→`[hesitant]`, `capek`→`[tired]`, `kaget`→`[gasps]`, `tertawa`→`[laughs]`); dialog-mode dipotong per baris lewat Whisper. 2 versi per beat, pilih kecocokan tertinggi (≥ 0,95). Kredit/izin → kode 3.
- `lembar.tulis(folder)` → `lembar-rekaman.md` (nomor `[<beat>.<n>] Tokoh · arah · teks`, dikelompokkan per tokoh).
- `manusia.jalankan(folder)` — baca `rekaman/<tokoh>.*` (+ `rekaman/ulang-<beat>.<n>.*`), ffmpeg `afftdn` + `loudnorm`, Whisper, penyelarasan teks: setiap baris naskah dicari sebagai jendela kata dengan kecocokan tertinggi (≥ 0,9) di transkrip tokoh itu; kemunculan terakhir menang (ulangan); urutan bebas. Hilang → `butuh_rekam_ulang` + daftar, kode 5 (Review Focus #2). Opsi `config/suara.yaml: manusia.mbis_efek` (pitch −2 semitone + sedikit reverb), mati bawaan.
- `python -m scripts.suara.produksi <folder>` memilih jalur dari `naskah.sumber_suara` untuk naskah v2.

- [ ] Test gagal (Whisper dipalsukan untuk test cepat): `test_lembar_bernomor_per_tokoh`, `test_manusia_potong_urutan_ditukar`, `test_manusia_baris_hilang_kode_5`, `test_manusia_ulangan_pakai_terakhir`, `test_rerun_lewati_lulus`, `test_elevenlabs_dialog_mode_dipakai_untuk_beat_multi`, `test_tag_dari_arah`, `test_izin_kurang_kode_3` → FAIL → implementasi → PASS → commit `feat: suara v2 jalur ElevenLabs dialog dan rekaman manusia`

### Task 7: Pipeline, agent, perintah, plugin siap pasang

**Files:** Modify `scripts/status.py` (TAHAP v2), `scripts/tahap.py`, `commands/sa-video.md`, `commands/sa-status.md`, agents `penulis-naskah`, `storyboarder`, `animator`, `sutradara-suara`, `qa-suara`, `inspektur-frame`, `direktur-marketing`, `penjaga-gerbang-qa`; `.claude-plugin/plugin.json` (versi 0.2.0), `.claude-plugin/marketplace.json`, `README.md`; Create `scripts/render.py`; Test `tests/test_agent_perintah.py`, `tests/test_tahap.py`, `tests/test_render.py`

**Interfaces:**
- `status.TAHAP = ("naskah","suara","dialog_ok","adegan","mix","render_draf","qa_gerak","render","qa_final","kemasan","video_ok","gerbang")`; `dialog_ok` dan `video_ok` = Approval 2 dan 3 (kode 4 sampai pemilik menandai lulus).
- `python -m scripts.render <folder> [--draf]` — salin `adegan.json`, `dialog.wav`, `mix.wav` ke `template/public/aktif/<folder-id>/`, render `AdeganV2` (`--draf`: `--scale=0.5`) ke `draf.mp4` / `video.mp4`, lalu tambah 3 detik kartu penutup (komposisi `KartuPenutup` dirender terpisah dan disambung ffmpeg).
- `/sa-video` memakai tahap baru dan menyebut kode 0/1/3/4/5; `/sa-status` mencetak tahap + skor gerak bila ada.
- README: cara pasang di akun utama (clone repo, `/plugin marketplace add`, `/plugin install`, secret `ELEVENLABS_API_KEY` dengan izin lengkap, dependensi), alur satu episode, dan dua jalur suara.

- [ ] Test gagal: tahap urut v2; `/sa-video` menyebut 12 tahap berurutan dan kode 3/4/5; agent storyboarder menyebut `scripts.adegan2`; inspektur-frame menyebut `scripts.qa_gerak`; `cek_plugin` lulus; plugin.json versi 0.2.0; `render.py` menyusun perintah yang benar (fungsi `perintah_render(folder, draf) -> list[str]` diuji tanpa render) → FAIL → implementasi → PASS → commit `feat: pipeline serial v2 dan plugin siap pasang`

### Task 8: Naskah Ep.1 versi baru

**Files:** Create `videos/2026-W46/ep01-v2/naskah.json` (versi 2, `disetujui: false`, `sumber_suara: null`), `config/panggung.yaml` sudah dari Task 5.

- [ ] Tulis Ep.1 sesuai contoh spec bagian 3 (hook alarm 04.00 + tabrak pintu; HP diserahkan ke Mama; "Tiga tempat?" → TUJUH JAM; montase tidur berdiri + mata digambar; "58" sunyi; Mbis + "KUCINGNYA NGOMONG?!"), 45 sampai 60 detik perkiraan.
- [ ] `python -m scripts.naskah periksa videos/2026-W46/ep01-v2` → kode 4 (hanya karena belum disetujui).
- [ ] Commit `feat: naskah Ep.1 versi beat`. **Berhenti: Approval 1 (naskah + pilihan suara).**
