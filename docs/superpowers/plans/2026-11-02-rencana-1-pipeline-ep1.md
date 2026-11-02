# Rencana 1: Fondasi Plugin + Pipeline Produksi Ep.1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plugin `sobatambis-marketing` yang bisa dipasang, dan perintah `/sa-video videos/2026-W46/ep01` yang mengubah naskah Ep.1 menjadi `video.mp4`, `cover.png`, `caption.txt`, dan `qa.md` yang lulus QA.

**Architecture:** Plugin Claude Code (agents + skills + commands) di atas script Python deterministik (suara, validasi, QA, token) dan satu proyek Remotion (`template/`) yang merender `adegan.json` + `suara.wav`. Agent menulis file, script memvalidasi file, Remotion merender file. Setiap folder video punya `status.json` sebagai titik lanjut.

**Tech Stack:** Python 3.13 (pytest, edge-tts 7.3.1, faster-whisper 1.2.1, numpy, soundfile, requests, PyYAML, jsonschema), Node 22, Remotion 4.0.539 (React, TypeScript), ffmpeg 6.

**Spec:** `docs/specs/2026-11-02-sobatambis-marketing-design.md` · Cerita: `docs/cerita/story-bible.md`, `docs/cerita/arc-1.md`, `docs/cerita/ep01-rencana-sempurna.md` · Desain acuan: `docs/desain/ep1/`, sumber SVG `docs/desain/sumber/lib.js`

## Cakupan

Termasuk: kerangka plugin, katalog skill, skill brand/cerita, skema naskah + validator emosi, pipeline suara (TTS → STT → cocokkan → ukur emosi → rekam ulang), template Remotion (kertas, Arta, Mbis, Bu Ratna, caption beremosi, kartu penutup, cover), pembangun `adegan.json`, QA frame, pengukur token, agent dan perintah `/sa-video`, pilot Ep.1.

Tidak termasuk (Rencana 2): `/sa-minggu`, agent riset tren, Notion, Google Drive, Mbis Bereaksi, analis performa, Kak Bima versi baru.

## Global Constraints

- Format video: 720×1280, 30 fps, H.264 + AAC. Durasi = durasi `suara.wav` + 3 detik kartu penutup (toleransi ±0,5 detik).
- Palet terkunci: kertas `#F7EEDC`, tinta `#1E3A8A`, stabilo `#FBC531`, merah guru `#C2412D`, kulit `#F1C9A5`. Nilai lain hanya dari `docs/desain/sumber/lib.js` objek `P`.
- Font: dialog/catatan `Caveat` 700; caption/judul `Bricolage Grotesque` 800 dan `Plus Jakarta Sans` 700/800 (Google Fonts via `@remotion/google-fonts`).
- Area aman cover: y 160 sampai 1120 dari 1280.
- Naskah dan caption: tidak boleh mengandung tanda pisah panjang (`—`); Mbis maksimal 3 baris per episode; baris Mbis tidak boleh mengandung "Sobat Ambis", "daftar", atau "Rp".
- Emosi per episode: minimal 4 emosi berbeda, minimal satu baris intensitas ≥ 8, tidak ada rentang > 10 detik tanpa perubahan emosi.
- Emosi yang dikenal: `semangat`, `marah`, `tertekan`, `lelah`, `hancur`, `kaget`, `misterius`, `hangat`, `datar`.
- Suara: episode serial memakai ElevenLabs (`ELEVENLABS_API_KEY`). Kredit kurang → `status.json` berstatus `butuh_persetujuan`, script keluar dengan kode 3, tidak pindah ke edge-tts tanpa `--setuju-edge-tts`. Suara edge-tts: Arta `id-ID-GadisNeural`, Mbis `id-ID-ArdiNeural` dengan pitch `-10Hz`, Bu Ratna `id-ID-GadisNeural` dengan rate `-10%`.
- QA suara: kecocokan kata ≥ 0,97 per baris; maksimal 2 rekam ulang per baris.
- Model agent: Opus hanya untuk `animator`; lainnya `sonnet` atau `haiku` (lihat Task 11).
- Kloning suara tidak termasuk rencana ini.
- Semua script Python dijalankan dengan `python -m scripts.<modul>` dari root repo; semua path di `status.json` relatif terhadap folder video.

## Review Focus

1. **Kredit ElevenLabs habis di tengah episode** → baris yang sudah jadi disimpan, `status.json` = `butuh_persetujuan` dengan daftar baris tersisa, rerun tidak merekam ulang baris yang sudah lulus. (Task 4)
2. **Whisper salah dengar kata Indonesia sehari-hari / angka** ("lima puluh delapan" vs "58", "nggak" vs "enggak") → normalisasi angka dan varian ejaan sebelum dicocokkan, supaya tidak memicu rekam ulang palsu. (Task 5)
3. **Rerun setelah gagal di tengah** → setiap tahap membaca `status.json` dan melewati tahap yang sudah `lulus`; tidak menimpa file yang sudah lulus kecuali `--ulang <tahap>`. (Task 10)
4. **Teks caption panjang** (lebih dari 2 baris pada lebar 592 px) → caption dipecah otomatis menjadi beberapa layar, tidak pernah keluar kartu. (Task 7)
5. **Naskah tanpa jeda sunyi atau dengan jeda di akhir** → penyusun audio tetap menghasilkan durasi yang cocok dengan `timing.json`, dan sunyi benar-benar nol amplitudo. (Task 4)

---

## Struktur file

```
.claude-plugin/plugin.json            # manifest plugin
.claude-plugin/marketplace.json       # agar bisa dipasang dari repo ini
agents/*.md                           # Task 11
commands/sa-video.md                  # Task 11
skills/sa-brand/SKILL.md              # Task 2
skills/sa-cerita/SKILL.md             # Task 2 (menunjuk ke references/)
skills/sa-cerita/references/*.md      # salinan docs/cerita
skills/sa-katalog/SKILL.md            # Task 3
katalog/skill.yaml                    # Task 3
schemas/naskah.schema.json            # Task 4
schemas/adegan.schema.json            # Task 8
scripts/__init__.py
scripts/cek_plugin.py                 # Task 1
scripts/katalog.py                    # Task 3
scripts/naskah.py                     # Task 4  (muat + validasi naskah)
scripts/suara/__init__.py
scripts/suara/penyedia.py             # Task 5  (ElevenLabs, edge-tts, kredit)
scripts/suara/rakit.py                # Task 5  (gabung baris + jeda -> suara.wav, timing.json)
scripts/suara/dengar.py               # Task 6  (whisper, normalisasi, cocokkan, ukur emosi)
scripts/suara/produksi.py             # Task 6  (loop rekam ulang + status)
scripts/status.py                     # Task 4  (baca/tulis status.json)
scripts/adegan.py                     # Task 8
scripts/qa_frame.py                   # Task 9
scripts/token_meter.py                # Task 10
template/                             # Task 7 (proyek Remotion)
tests/...                             # per task
videos/2026-W46/ep01/naskah.json      # Task 12
requirements.txt, pyproject.toml      # Task 1
```

---

### Task 1: Kerangka plugin + pemeriksa plugin

**Files:**
- Create: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `pyproject.toml`, `requirements.txt`, `scripts/__init__.py`, `scripts/cek_plugin.py`, `README.md` (ganti isi), `.gitignore`
- Test: `tests/test_cek_plugin.py`

**Interfaces:**
- Produces: `cek_plugin.periksa(root: Path) -> list[str]` (daftar masalah, kosong = lulus). CLI: `python -m scripts.cek_plugin` keluar 0/1.

Isi yang dipatok:
- `plugin.json`: `{"name":"sobatambis-marketing","version":"0.1.0","description":"Tim marketing agentic Sobat Ambis: riset, naskah, suara, animasi, QA.","author":{"name":"Sobat Ambis"}}`
- `marketplace.json`: satu plugin bernama `sobatambis-marketing`, `source: "./"`.
- `.gitignore`: `node_modules/`, `template/out/`, `videos/**/*.wav`, `videos/**/*.mp4`, `videos/**/*.png`, `.venv/`, `__pycache__/`.
- `requirements.txt` (versi tepat): `edge-tts==7.3.1`, `faster-whisper==1.2.1`, `numpy`, `soundfile`, `requests`, `PyYAML`, `jsonschema`, `pytest`.
- README: cara pasang (`/plugin marketplace add aldysyahputra422-crypto/sobatambis-marketing` lalu `/plugin install sobatambis-marketing`), connector yang perlu disambungkan (Notion, Google Drive, Consensus, Elicit, SciSpace), secret `ELEVENLABS_API_KEY`, dan `pip install -r requirements.txt` + `npm ci --prefix template`.

`periksa` memeriksa: kedua JSON valid; setiap `agents/*.md` punya frontmatter `name`, `description`, `model` ∈ {`opus`,`sonnet`,`haiku`}; setiap `skills/*/SKILL.md` punya frontmatter `name`, `description`; setiap `commands/*.md` punya frontmatter `description`.

- [ ] **Step 1: Tulis test gagal**

```python
def test_plugin_kosong_lulus(tmp_path):        # hanya manifest valid
def test_agent_tanpa_model_gagal(tmp_path):     # agents/x.md tanpa model -> ["agents/x.md: model hilang"]
def test_agent_model_tidak_dikenal_gagal(tmp_path)  # model: gpt -> pesan berisi "model tidak dikenal"
def test_skill_tanpa_description_gagal(tmp_path)
def test_repo_ini_lulus():                      # periksa(Path(".")) == []
```

- [ ] **Step 2: Jalankan, pastikan gagal** — `pytest tests/test_cek_plugin.py -v` → FAIL (modul belum ada)
- [ ] **Step 3: Implementasikan `periksa` dan file-file di atas** (frontmatter dibaca dengan PyYAML dari blok `---` pertama)
- [ ] **Step 4: Jalankan** — `pytest tests/test_cek_plugin.py -v` → PASS
- [ ] **Step 5: Commit** — `git commit -m "feat: kerangka plugin dan pemeriksa plugin"`

---

### Task 2: Skill brand dan cerita

**Files:**
- Create: `skills/sa-brand/SKILL.md`, `skills/sa-cerita/SKILL.md`, `skills/sa-cerita/references/{story-bible,arc-1,ep01-rencana-sempurna}.md` (salinan dari `docs/cerita/`)
- Test: `tests/test_skill_isi.py`

**Interfaces:**
- Produces: skill `sa-brand` dan `sa-cerita` yang dirujuk agent di Task 11.

`sa-brand` memuat fakta dari website (tanpa angka karangan): les privat 1-on-1, mentor mahasiswa aktif PTN (UI, ITB, UGM, UNAIR, ITS), Surabaya ke rumah atau online; paket SD Rp550.000/8 sesi, SMP Rp750.000/12 sesi, SMA Rp990.000/12 sesi; satuan SD Rp95.000, SMP Rp110.000, SMA Rp130.000, lomba Rp175.000; bayar QRIS atau SeaBank; WA +62 899-3374-347; IG @mentoringsobatambis; web https://sobatambis.netlify.app. Aturan klaim: jangan pakai angka "500+ siswa", "95%", "4.9 Google" di konten baru. CTA baku: "Komen INFO untuk konsultasi gratis".

`sa-cerita` menyuruh agent membaca `references/story-bible.md` sebelum menulis, dan memakai `ep01-rencana-sempurna.md` sebagai contoh standar.

- [ ] **Step 1: Tulis test gagal** — `test_brand_memuat_harga_resmi` (string "Rp550.000", "Rp750.000", "Rp990.000" ada), `test_brand_melarang_klaim_karangan` (string "500+" hanya muncul di kalimat larangan), `test_referensi_cerita_sama_dengan_docs` (isi file references == isi docs/cerita), `test_cek_plugin_lulus`.
- [ ] **Step 2: Jalankan** → FAIL
- [ ] **Step 3: Tulis kedua skill dan salin referensi**
- [ ] **Step 4: Jalankan** `pytest tests/test_skill_isi.py tests/test_cek_plugin.py -v` → PASS
- [ ] **Step 5: Commit** — `feat: skill brand dan cerita`

---

### Task 3: Katalog skill + skill pencari-skill

**Files:**
- Create: `katalog/skill.yaml`, `scripts/katalog.py`, `skills/sa-katalog/SKILL.md`
- Test: `tests/test_katalog.py`

**Interfaces:**
- Produces: `katalog.muat(path: Path) -> list[Entri]`; `katalog.cari(entri: list[Entri], kebutuhan: str) -> list[Entri]` (urut skor kecocokan kata di `fungsi` + `pakai_saat`); `Entri` = dataclass dengan field `id, sumber, fungsi, pakai_saat, cara_pasang, lisensi, catatan_lisensi, butuh_key, biaya, ukuran, status`. CLI: `python -m scripts.katalog cari "<kebutuhan>"` mencetak id + cara_pasang.

Entri wajib (id): `agent-reach, open-generative-ai, karpathy-skills, ecc, youmind-opus-prompts, threejs, gsap, design-dna, motion-design-skill, genjutsu, hyperframes, onetake, gbro-collage-broll, claude-animation-base, lemo-opuscar, stop-slop, caveman, remotion-skills, edge-tts, faster-whisper, ffmpeg, elevenlabs, higgsfield`. Nilai yang dipatok spec: `ecc.status = "sebagian"` dengan catatan "jangan pasang utuh"; `agent-reach.catatan_lisensi` menyebut "jangan pakai fitur cookie login media sosial"; `karpathy-skills.lisensi = "tidak ada"` dan `cara_pasang` merujuk ke repo asli tanpa menyalin; `onetake.lisensi = "PolyForm-Noncommercial-1.0.0"`; `hyperframes.status = "alternatif"`; `status` ∈ {`direkomendasikan`,`opsional`,`alternatif`,`sebagian`,`rujukan`}.

`SKILL.md` sa-katalog berisi prosedur 5 langkah dari spec bagian 7 dan perintah CLI di atas.

- [ ] **Step 1: Tulis test gagal** — `test_semua_entri_wajib_ada`, `test_field_lengkap_dan_status_valid`, `test_cari_animasi_mengembalikan_motion_atau_gsap` (cari("animasi gerak easing") memuat `motion-design-skill` atau `gsap` di 3 teratas), `test_cari_suara_mengembalikan_elevenlabs_dan_edge_tts`.
- [ ] **Step 2: Jalankan** → FAIL
- [ ] **Step 3: Tulis katalog, `muat`, `cari`, skill**
- [ ] **Step 4: Jalankan** → PASS
- [ ] **Step 5: Commit** — `feat: katalog skill dan pencari skill`

---

### Task 4: Skema naskah, validator emosi, dan status

**Files:**
- Create: `schemas/naskah.schema.json`, `scripts/naskah.py`, `scripts/status.py`
- Test: `tests/test_naskah.py`, `tests/test_status.py`, `tests/data/naskah_ep01_contoh.json`

**Interfaces:**
- Produces:
  - Format `naskah.json`: `{"episode": "ep01", "judul": str, "disetujui": bool (default false, diisi true setelah pemilik approve), "baris": [Baris]}`; `Baris` = `{"id": "b01", "penutur": "arta"|"mbis"|"ratna"|"bima", "teks": str, "emosi": <emosi>, "intensitas": 1..10, "tag": str (opsional, tag ElevenLabs), "jeda_sesudah": float detik (default 0.25), "visual": {"latar": str, "tokoh": [{"id": str, "ekspresi": str, "pose": str}], "properti": [str], "kamera": "diam"|"zoom_masuk"|"zoom_keluar"|"goyang"|"pantul", "catatan_merah": str|null}, "caption": str (opsional, default = teks)}`
  - `naskah.muat(path: Path) -> dict` (memvalidasi skema, raise `NaskahTidakValid`)
  - `naskah.periksa_aturan(n: dict, durasi_per_baris: dict[str, float] | None = None) -> list[str]` — aturan Global Constraints; tanpa durasi, perkiraan durasi = jumlah kata / 2,6 + jeda_sesudah.
  - CLI: `python -m scripts.naskah periksa <folder>` mencetak masalah, keluar 0 bila kosong, 1 bila ada masalah, 4 bila valid tapi `disetujui` masih false.
  - `status.baca(folder: Path) -> dict`, `status.tandai(folder: Path, tahap: str, keadaan: "lulus"|"gagal"|"butuh_persetujuan"|"berjalan", **info) -> None`, `status.sudah_lulus(folder, tahap) -> bool`. Tahap: `naskah, suara, adegan, render, qa_frame, kemasan, gerbang`.

- [ ] **Step 1: Tulis test gagal**

```python
def test_contoh_ep01_lulus():           # periksa_aturan(muat(contoh)) == []
def test_kurang_dari_4_emosi(): ...      # pesan berisi "minimal 4 emosi"
def test_tanpa_puncak():                 # semua intensitas <= 7 -> "puncak intensitas"
def test_datar_lebih_10_detik():         # 5 baris 'lelah' berurutan @ 3 dtk -> "datar"
def test_mbis_4_baris():                 # -> "Mbis maksimal 3"
def test_mbis_sebut_brand():             # teks Mbis "daftar Sobat Ambis" -> "Mbis tidak boleh"
def test_tanda_pisah_panjang():          # teks berisi "—" -> "tanda pisah"
def test_status_lanjut(tmp_path):        # tandai suara lulus -> sudah_lulus True, tahap lain False
def test_cli_belum_disetujui_kode_4(tmp_path)  # naskah valid, disetujui false -> exit 4
```

`tests/data/naskah_ep01_contoh.json` = Ep.1 dari `docs/cerita/ep01-rencana-sempurna.md` (13 baris; isi `visual` boleh ringkas).

- [ ] **Step 2: Jalankan** → FAIL
- [ ] **Step 3: Implementasikan skema, `muat`, `periksa_aturan`, `status`** (`status.json` ditulis atomik: tulis ke `.tmp` lalu rename)
- [ ] **Step 4: Jalankan** → PASS
- [ ] **Step 5: Commit** — `feat: skema naskah, validator emosi, status per video`

---

### Task 5: Penyedia suara + perakit audio

**Files:**
- Create: `scripts/suara/__init__.py`, `scripts/suara/penyedia.py`, `scripts/suara/rakit.py`
- Test: `tests/test_penyedia.py`, `tests/test_rakit.py`

**Interfaces:**
- Consumes: `Baris` (Task 4).
- Produces:
  - `class Penyedia(Protocol): nama: str; def sisa_kredit(self) -> int | None; def sintesis(self, baris: dict, keluar: Path) -> Path` (menulis WAV mono 44,1 kHz).
  - `ElevenLabs(api_key: str, suara: dict[str, str], model: str = "eleven_v3")` — `sisa_kredit` dari `GET https://api.elevenlabs.io/v1/user/subscription` (`character_limit - character_count`); `sintesis` memakai `POST /v1/text-to-speech/{voice_id}` dengan teks `f"{baris['tag']} {baris['teks']}"` bila tag ada, output diubah ke WAV dengan ffmpeg.
  - `EdgeTTS(suara: dict[str, dict])` — nilai suara dari Global Constraints; `sisa_kredit` → `None`.
  - `class KreditKurang(Exception)` berisi `dibutuhkan: int, sisa: int`.
  - `perlu_karakter(baris_list) -> int` = jumlah `len(tag + " " + teks)`.
  - `rakit.gabung(potongan: list[tuple[str, Path, float]], keluar: Path) -> list[dict]` — menyambung WAV per baris dengan sunyi `jeda_sesudah` (amplitudo nol), menulis `suara.wav`, mengembalikan timing `[{"id","mulai","selesai"}]` (detik, 3 desimal) yang juga disimpan ke `timing.json`.

- [ ] **Step 1: Tulis test gagal** — pakai `PenyediaPalsu` yang menghasilkan sinus 220 Hz sepanjang `0.4 * jumlah_kata` detik:

```python
def test_gabung_durasi_sesuai_timing(tmp_path)   # durasi suara.wav == timing[-1]["selesai"] ± 0.01
def test_jeda_benar_benar_sunyi(tmp_path)        # sampel di rentang jeda semuanya 0
def test_jeda_terakhir_tetap_ditulis(tmp_path)   # Review Focus #5
def test_perlu_karakter_menghitung_tag()
def test_elevenlabs_sisa_kredit(monkeypatch)     # requests.get dipalsukan -> limit 10000, count 9600 -> 400
def test_edge_tts_sisa_kredit_none()
```

- [ ] **Step 2: Jalankan** → FAIL
- [ ] **Step 3: Implementasikan** (soundfile untuk baca/tulis; resample ke 44,1 kHz mono lewat ffmpeg bila perlu)
- [ ] **Step 4: Jalankan** → PASS
- [ ] **Step 5: Commit** — `feat: penyedia suara ElevenLabs/edge-tts dan perakit audio`

---

### Task 6: Dengar ulang, ukur emosi, dan loop rekam ulang

**Files:**
- Create: `scripts/suara/dengar.py`, `scripts/suara/produksi.py`
- Test: `tests/test_dengar.py`, `tests/test_produksi.py`

**Interfaces:**
- Consumes: `Penyedia`, `KreditKurang`, `perlu_karakter`, `rakit.gabung` (Task 5); `naskah.muat`, `status.*` (Task 4).
- Produces:
  - `dengar.normalisasi(teks: str) -> list[str]` — huruf kecil, buang tanda baca, angka → kata ("58" → "lima puluh delapan"), varian ("enggak"/"ngga"/"gak" → "nggak").
  - `dengar.kecocokan(diharapkan: str, terdengar: str) -> float` — rasio kata cocok (difflib SequenceMatcher pada token hasil normalisasi).
  - `dengar.transkrip(wav: Path) -> list[dict]` — faster-whisper model `small`, `language="id"`, `word_timestamps=True`; output `[{"kata","mulai","selesai"}]`.
  - `dengar.ukur(wav: Path) -> dict` — `{"rms_db": float, "pitch_hz": float | None, "kata_per_detik": float}` (pitch: autokorelasi numpy pada frame bersuara, median).
  - `dengar.cek_emosi(ukuran: dict[str, dict], naskah: dict) -> list[str]` — aturan: rata-rata `rms_db` baris `marah` ≥ rata-rata baris `tertekan`/`lelah` + 4 dB; `pitch_hz` baris intensitas ≥ 8 ber-emosi `marah`/`semangat`/`kaget` > median pitch penutur yang sama; `kata_per_detik` baris `lelah` < baris `semangat` penutur sama.
  - `produksi.jalankan(folder: Path, penyedia: Penyedia, setuju_edge_tts: bool = False, maks_ulang: int = 2) -> str` — mengembalikan keadaan akhir tahap `suara`. CLI: `python -m scripts.suara.produksi <folder> [--penyedia elevenlabs|edge] [--setuju-edge-tts]`, kode keluar 0 lulus, 1 gagal, 3 butuh persetujuan.

Alur `jalankan`: lewati baris yang sudah ada di `status["suara"]["baris_lulus"]`; sebelum sintesis cek `sisa_kredit` vs `perlu_karakter(sisa_baris)`; jika kurang → tandai `butuh_persetujuan` dengan `baris_tersisa` dan kembalikan. Setelah sintesis: transkrip per baris, `kecocokan ≥ 0.97` dan lolos `cek_emosi`, kalau tidak rekam ulang (tag diperkuat: tambah `[shouting]`/`[whispers]` sesuai emosi) maksimal `maks_ulang`; lalu `rakit.gabung`.

- [ ] **Step 1: Tulis test gagal**

```python
def test_normalisasi_angka_dan_varian()   # "Lima puluh delapan, enggak!" == normalisasi("58 nggak")  (Review Focus #2)
def test_kecocokan_sempurna_dan_rendah()
def test_ukur_sinus_220hz(tmp_path)        # pitch 220 ± 5, rms sesuai amplitudo
def test_cek_emosi_marah_kurang_keras()    # marah -20 dB, lelah -22 dB -> pesan "marah kurang keras"
def test_kredit_kurang_berhenti(tmp_path)  # PenyediaPalsu sisa_kredit=10 -> "butuh_persetujuan", kode 3 di CLI, tidak ada suara.wav (Review Focus #1)
def test_rerun_tidak_rekam_ulang_baris_lulus(tmp_path)  # hitung panggilan sintesis
def test_rekam_ulang_maks_dua_kali(tmp_path)            # PenyediaPalsu selalu salah -> 3 panggilan per baris, keadaan "gagal"
```

Transkrip dipalsukan di test (monkeypatch `dengar.transkrip`); satu test integrasi `@pytest.mark.lambat` memanggil faster-whisper sungguhan pada WAV edge-tts "halo, nama saya Arta".

- [ ] **Step 2: Jalankan** → FAIL
- [ ] **Step 3: Implementasikan `dengar` dan `produksi`**
- [ ] **Step 4: Jalankan** `pytest tests/test_dengar.py tests/test_produksi.py -v` → PASS; lalu `pytest -m lambat -v` → PASS
- [ ] **Step 5: Commit** — `feat: dengar ulang, ukur emosi, loop rekam ulang`

---

### Task 7: Template Remotion (dunia jurnal + tokoh + caption beremosi)

**Files:**
- Create: `template/package.json`, `template/tsconfig.json`, `template/remotion.config.ts`, `template/src/index.ts`, `template/src/Root.tsx`, `template/src/sistem/palet.ts`, `template/src/sistem/filter.tsx`, `template/src/dunia/Kertas.tsx`, `template/src/dunia/latar/*.tsx` (`kamar`, `ruang_tamu`, `meja_malam`, `dinding_sticky`), `template/src/tokoh/Arta.tsx`, `template/src/tokoh/Mbis.tsx`, `template/src/tokoh/Ratna.tsx`, `template/src/teks/Caption.tsx`, `template/src/teks/CatatanMerah.tsx`, `template/src/Episode.tsx`, `template/src/KartuPenutup.tsx`, `template/src/Cover.tsx`, `template/src/efek/emosi.ts`
- Test: `template/test/render.test.ts` (vitest) + `tests/test_template_render.py`

**Interfaces:**
- Consumes: `adegan.json` (skema Task 8), `suara.wav`.
- Produces:
  - Komposisi `Episode` (720×1280, 30 fps), props `{adeganUrl: string, suaraUrl: string}`; `calculateMetadata` membaca `adegan.durasi` → `durationInFrames = ceil((durasi + 3) * 30)`.
  - Still `Cover`, props `{episode: string, judul1: string, judul2: string, tokoh: "arta"|"mbis"|"ratna", ekspresi: string, pose: string, sub: string}`.
  - `<Arta ekspresi pose miringPensil bicara />`, `<Mbis ekspresi skala />`, `<Ratna ekspresi />` — komponen dipindah dari `docs/desain/sumber/lib.js` (fungsi `artaHead`, `artaFull`, `artaBust`, `mbis`, `ratnaBust`, `eyes`, `mouth`), ekspresi: `datar, ambis, kaget, senyum, lirik, marah, hancur`; pose Arta: `pinggang, tunjuk, lemas, bust`.
  - `efekEmosi(emosi, intensitas, frameLokal) -> {goyang: {x,y}, rona: "merah"|"gelap"|null, skalaCaption: number}` di `efek/emosi.ts`.
  - `<Caption teks emosi kataAktif />` — pecah otomatis ke maksimal 2 baris per layar pada lebar 592 px (ukur dengan `measureText` dari `@remotion/layout-utils`), kata kunci intensitas ≥ 8 ber-emosi `marah` tampil merah, kapital, skala 1,8, bergetar.
  - Gerak hidup: kedip setiap 3–5 detik, napas (skala dada ±1,5%), mulut terbuka-tutup saat `bicara` mengikuti amplitudo (`useAudioData` + `visualizeAudio`), garis tinta bergetar dengan mengganti `seed` filter tiap 4 frame.

Versi dipatok: `remotion`, `@remotion/cli`, `@remotion/google-fonts`, `@remotion/layout-utils`, `@remotion/media-utils` semuanya `4.0.539`; `react`/`react-dom` sesuai peer Remotion.

- [ ] **Step 1: Tulis test gagal**
  - `template/test/render.test.ts`: `efekEmosi("marah", 9, 3).goyang.x !== 0`; `efekEmosi("lelah", 3, 3)` → goyang 0 dan rona `null`; `pecahCaption("Hari pertama. Aku bikin rencana yang nggak mungkin gagal.")` → ≤ 2 baris per layar dan setiap baris ≤ 592 px (Review Focus #4).
  - `tests/test_template_render.py`: `npx remotion still Cover out/cover.png --props=tests/data/cover_props.json` sukses; PNG 720×1280; simpangan baku piksel > 10 (tidak kosong); warna piksel latar di (360, 40) dalam jarak 12 dari `#F7EEDC`.
- [ ] **Step 2: Jalankan** `npm test --prefix template` dan `pytest tests/test_template_render.py -v` → FAIL
- [ ] **Step 3: Scaffold proyek, pindahkan sistem desain ke komponen, buat komposisi**
- [ ] **Step 4: Jalankan kedua test** → PASS. Render manual frame 26 detik dan 43 detik Ep.1 contoh, bandingkan secara visual dengan `docs/desain/ep1/emo-marah.png` dan `emo-hancur.png`.
- [ ] **Step 5: Commit** — `feat: template Remotion dunia jurnal, tokoh, caption beremosi`

---

### Task 8: Pembangun adegan.json

**Files:**
- Create: `schemas/adegan.schema.json`, `scripts/adegan.py`
- Test: `tests/test_adegan.py`

**Interfaces:**
- Consumes: `naskah.muat` (Task 4), `timing.json` + `transkrip.json` (Task 5/6).
- Produces: `adegan.bangun(naskah: dict, timing: list[dict], transkrip: dict[str, list[dict]]) -> dict` dan CLI `python -m scripts.adegan <folder>` menulis `adegan.json`:
  `{"durasi": float, "adegan": [{"id","mulai","selesai","penutur","emosi","intensitas","visual",<dari naskah>,"caption":{"teks","kata":[{"kata","mulai","selesai"}]}}], "penutup": {"judul_berikut": str}}`.
  Waktu kata diambil dari transkrip; bila jumlah kata transkrip ≠ kata caption, waktu dibagi rata dalam rentang baris. `latar` yang tidak ada di `template/src/dunia/latar/` → raise `AsetTidakAda(latar)` (storyboarder/animator harus membuatnya dulu).

- [ ] **Step 1: Tulis test gagal** — `test_durasi_sama_timing`, `test_kata_caption_ikut_transkrip`, `test_kata_dibagi_rata_bila_tidak_cocok`, `test_latar_tidak_ada_raise`, `test_hasil_valid_skema`.
- [ ] **Step 2: Jalankan** → FAIL
- [ ] **Step 3: Implementasikan**
- [ ] **Step 4: Jalankan** → PASS
- [ ] **Step 5: Commit** — `feat: pembangun adegan.json dari naskah dan transkrip`

---

### Task 9: QA frame

**Files:**
- Create: `scripts/qa_frame.py`
- Test: `tests/test_qa_frame.py`

**Interfaces:**
- Consumes: `video.mp4`, `adegan.json`.
- Produces: `qa_frame.periksa(folder: Path) -> list[str]` dan CLI menulis `cek-frame.png` (grid cuplikan setiap 2 detik, 4 kolom, lebar sel 180 px) + bagian "Frame" di `qa.md`.
  Aturan: durasi video = `adegan.durasi + 3` ± 0,5 detik; resolusi 720×1280; tidak ada frame (sampel tiap 1 detik) dengan simpangan baku piksel < 4 (kosong); frame di tengah setiap adegan intensitas ≥ 8 berbeda dari frame 0,5 detik sebelumnya (rata-rata selisih piksel > 6) supaya puncak emosi terlihat; ada audio dan tidak hening total.

- [ ] **Step 1: Tulis test gagal** — buat video uji dengan ffmpeg (`color=c=0xF7EEDC` + `testsrc`) dan audio sinus: `test_video_baik_lulus`, `test_durasi_salah`, `test_frame_kosong_terdeteksi`, `test_tanpa_audio_gagal`, `test_cek_frame_png_dibuat`.
- [ ] **Step 2: Jalankan** → FAIL
- [ ] **Step 3: Implementasikan** (ffmpeg untuk ekstrak frame, numpy untuk statistik)
- [ ] **Step 4: Jalankan** → PASS
- [ ] **Step 5: Commit** — `feat: QA frame dan lembar cuplikan`

---

### Task 10: Pengukur token + pengatur tahap

**Files:**
- Create: `scripts/token_meter.py`, `scripts/tahap.py`
- Test: `tests/test_token_meter.py`, `tests/test_tahap.py`, `tests/data/sesi_contoh.jsonl`

**Interfaces:**
- Consumes: `status.*` (Task 4).
- Produces:
  - `token_meter.hitung(jsonl_paths: list[Path], mulai: datetime, selesai: datetime) -> dict` — jumlahkan `message.usage.{input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens}` dari entri `type == "assistant"` dalam rentang waktu, per `message.model`. CLI `python -m scripts.token_meter <folder>` membaca waktu `mulai`/`selesai` dari `status.json` dan menulis `token.json`.
  - CLI: `python -m scripts.tahap berikutnya <folder>` mencetak nama tahap atau `selesai`; `python -m scripts.tahap ulang <folder> <tahap>`.
  - `tahap.berikutnya(folder: Path) -> str | None` — tahap pertama dalam urutan `naskah, suara, adegan, render, qa_frame, kemasan, gerbang` yang belum `lulus`; `None` bila semua lulus. `tahap.ulang(folder, nama)` mereset tahap itu dan semua tahap sesudahnya (Review Focus #3).

- [ ] **Step 1: Tulis test gagal** — `test_hitung_per_model`, `test_di_luar_rentang_diabaikan`, `test_berikutnya_urut`, `test_ulang_mereset_tahap_sesudahnya`, `test_semua_lulus_none`.
- [ ] **Step 2: Jalankan** → FAIL
- [ ] **Step 3: Implementasikan**
- [ ] **Step 4: Jalankan** → PASS
- [ ] **Step 5: Commit** — `feat: pengukur token dan pengatur tahap`

---

### Task 11: Agent dan perintah /sa-video

**Files:**
- Create: `agents/direktur-marketing.md` (opus), `agents/penulis-naskah.md` (sonnet), `agents/pembasmi-slop.md` (sonnet), `agents/pemeriksa-fakta.md` (sonnet), `agents/storyboarder.md` (sonnet), `agents/animator.md` (opus), `agents/sutradara-suara.md` (haiku), `agents/qa-suara.md` (haiku), `agents/inspektur-frame.md` (sonnet), `agents/desainer-cover.md` (sonnet), `agents/penulis-caption.md` (sonnet), `agents/penjaga-gerbang-qa.md` (sonnet), `agents/pencari-skill.md` (haiku), `agents/akuntan-token.md` (haiku), `commands/sa-video.md`, `commands/sa-pasang-skill.md`, `commands/sa-status.md`
- Test: `tests/test_agent_perintah.py`

**Interfaces:**
- Consumes: semua script Task 3 sampai 10, skill Task 2 dan 3.
- Produces: `/sa-video <folder>` — direktur-marketing memanggil `python -m scripts.tahap berikutnya <folder>` berulang dan mendelegasikan setiap tahap:
  | Tahap | Agent | Perintah/alat | Lulus jika |
  |---|---|---|---|
  | naskah | penulis-naskah → pembasmi-slop → pemeriksa-fakta | menulis `naskah.json`, `python -m scripts.naskah periksa` | kode 0. Kode 4 → **Approval 1**: kirim naskah ke pemilik, berhenti sampai pemilik setuju, lalu set `disetujui: true` |
  | suara | sutradara-suara (+ qa-suara) | `python -m scripts.suara.produksi` | kode 0; kode 3 → berhenti, tanya pemilik |
  | adegan | storyboarder (+ animator bila `AsetTidakAda`) | `python -m scripts.adegan` | kode 0 |
  | render | animator | `npx remotion render Episode videos/.../video.mp4 --props=...` di `template/` | kode 0 |
  | qa_frame | inspektur-frame | `python -m scripts.qa_frame` | daftar kosong; maks 2 perbaikan |
  | kemasan | desainer-cover, penulis-caption | `npx remotion still Cover`, menulis `caption.txt` | file ada, caption memuat "INFO" dan tanpa "—" |
  | gerbang | penjaga-gerbang-qa, akuntan-token | menulis `qa.md`, `python -m scripts.token_meter` | semua tahap lulus |
  `/sa-status <folder>` mencetak `status.json` dan `token.json`. `/sa-pasang-skill "<kebutuhan>"` menjalankan pencari-skill.

Setiap file agent: frontmatter `name`, `description` (kapan dipakai), `model`, `tools`; isi: tugas tunggal, file yang dibaca, file yang ditulis, perintah verifikasi, aturan "tulis hasil ke file, jangan hanya membalas teks", rujukan ke `sa-brand`/`sa-cerita`/`sa-katalog`. `pembasmi-slop` memakai skill stop-slop dari katalog (pasang lewat pencari-skill bila belum ada). Agent komunikasi internal memakai gaya ringkas (caveman) untuk log, tidak untuk naskah/caption.

- [ ] **Step 1: Tulis test gagal** — `test_semua_agent_ada_dan_model_sesuai` (dict nama→model persis seperti daftar di atas), `test_hanya_animator_dan_direktur_opus`, `test_sa_video_menyebut_semua_tahap` (7 nama tahap muncul berurutan), `test_sa_video_menyebut_kode_3_minta_persetujuan`, `test_sa_video_menyebut_approval_naskah_kode_4`, `test_cek_plugin_lulus`.
- [ ] **Step 2: Jalankan** → FAIL
- [ ] **Step 3: Tulis agent dan perintah**
- [ ] **Step 4: Jalankan** → PASS
- [ ] **Step 5: Commit** — `feat: agent produksi dan perintah /sa-video`

Catatan: spec menyebut Opus hanya untuk agent pembuat aset/animasi; direktur-marketing memakai Opus sebagai orkestrator (spec bagian 4). Desainer-karakter, desainer-latar, dan pemoles-gerak digabung ke `animator` di rencana ini; dipisah di Rencana 2 bila beban kerjanya terbukti besar.

---

### Task 12: Pilot Ep.1 dari awal sampai akhir

**Files:**
- Create: `videos/2026-W46/ep01/naskah.json` (dari `docs/cerita/ep01-rencana-sempurna.md`, `disetujui: true` karena pemilik sudah menyetujui naskah ini di percakapan desain), `docs/pilot-ep01.md` (laporan)
- Modify: tidak ada kode, kecuali perbaikan yang ditemukan pilot (masing-masing dengan test di task pemiliknya)

**Interfaces:**
- Consumes: seluruh plugin.

- [ ] **Step 1:** Pastikan secret `ELEVENLABS_API_KEY` tersedia (`python -c "import os;print(bool(os.getenv('ELEVENLABS_API_KEY')))"` → `True`). Bila `False`: berhenti dan tanya pemilik apakah boleh pilot dengan edge-tts.
- [ ] **Step 2:** Jalankan `/sa-video videos/2026-W46/ep01`. Expected: semua tahap `lulus` di `status.json`, atau berhenti di `butuh_persetujuan` dengan pesan yang jelas.
- [ ] **Step 3:** Verifikasi hasil: `python -m scripts.qa_frame videos/2026-W46/ep01` → tidak ada masalah; `ffprobe` durasi 55–61 detik; tonton frame detik 26 (marah) dan 42 (hancur) di `cek-frame.png`.
- [ ] **Step 4:** Tulis `docs/pilot-ep01.md`: token per model (`token.json`), waktu per tahap, jumlah rekam ulang, kredit ElevenLabs terpakai, masalah yang ditemukan, dan perkiraan kapasitas video per minggu di kuota Pro dari angka nyata.
- [ ] **Step 5:** Kirim `video.mp4`, `cover.png`, `caption.txt` ke pemilik untuk Approval 2. Commit laporan dan naskah (media tidak masuk git) — `feat: pilot Ep.1 dan laporan token`.
