# Prompt sesi baru: jalur senggang

Cara pakai: mulai sesi Claude Code baru di folder repo ini, lalu tempel SEMUA teks di dalam kotak di bawah sebagai pesan pertama. Jangan pakai sesi lama: konteksnya besar dan setiap giliran membaca ulang semuanya (82% biaya produksi episode pertama adalah cache-read).

Pengukuran: sebelum mulai, catat angka `/usage` (persen batas mingguan). Setelah selesai, catat lagi dan simpan dengan `python -m scripts.kapasitas catat ...`.

````text
Kamu bekerja di repo sobatambis-marketing (CLAUDE.md terbaca otomatis, ikuti semuanya). Tugas sesi ini: membangun JALUR SENGGANG, cabang alur produksi yang menghemat token Claude. Sesi ini harus pendek dan hemat token: baca hanya file yang disebut di sini, jangan menjelajah repo, jangan buka skill yang tidak dibutuhkan.

## Latar
Ada dua jalur per episode, dipilih pemilik saat memulai episode:
- `otomatis` (sudah ada): penulis-naskah, pembasmi-slop, pemeriksa-fakta menulis naskah; suara lewat ElevenLabs/manusia; sisanya mekanis.
- `senggang` (BARU): pemilik menulis naskah di ChatGPT (Thinking) memakai prompt yang kamu buat, dengan tag ekspresi di tiap baris dialog, misalnya "[tense] Tiba-tiba, mesin kasir mencetak struk dengan sendirinya", "[curious, slowly]", "[ominous]", "[confused]". Pemilik menempel hasilnya ke Claude. Claude mengubahnya jadi naskah.json secara MEKANIS (parser Python, bukan LLM), membuat lembar tempel ElevenLabs per tokoh. Pemilik menempel ke ElevenLabs sendiri, lalu mengirim audionya. Claude melanjutkan dengan tahap mekanis yang sudah ada (adegan, mix, render, QA, kemasan).
Tujuan: menghilangkan token penulisan naskah, cek fakta, revisi, dan retry suara dari jalur ini. Animasi, render, dan QA tetap di Claude.

## Keputusan yang sudah final (jangan dibuka lagi)
- Jangan memanggil API ElevenLabs sama sekali di sesi ini, dan jangan membuat render uji berbayar. Semua uji pakai fixture dan `tests/suara_palsu.py`.
- Jangan memilih atau mengubah gaya animasi. Itu diputuskan pemilik sesudah reset usage mingguan.
- Jangan mengubah `kantor/`.
- Parser, validasi, dan lembar tempel harus deterministik, tanpa LLM. Tag yang tidak dikenal DITOLAK dengan pesan jelas, tidak ditebak.
- Gerbang kualitas tetap berlaku tanpa LLM: skema `schemas/naskah2.schema.json`, `naskah.periksa_beat`, `DILARANG_MBIS`, tanpa tanda pisah panjang (—), dialog Mbis maksimal 3 baris. Approval 1 tetap milik pemilik (`disetujui: true`).
- Pakai TDD (pytest). Satu tugas, satu commit kecil, di branch `desain/spec-awal`.

## Yang dibangun, berurutan
1. `config/tag_ekspresi.yaml`: kosakata tag baku. Tiap tag memetakan ke `emosi` (enum skema: semangat, marah, tertekan, lelah, hancur, kaget, misterius, hangat, datar), intensitas bawaan, ekspresi karakter untuk animasi, dan tag ElevenLabs. Mulai dari tag usulan pemilik (tense, curious, slowly, ominous, confused) dan `TAG_KUAT` di `scripts/suara/produksi.py`. Baca juga `skills/sa-cerita/references/story-bible.md` bagian sistem emosi dan jangan bertentangan dengannya. Cek daftar ekspresi yang benar-benar ada di rig animasi sebelum menulis pemetaan ekspresi (cari di `template/` lewat Grep, jangan membaca seluruh direktori).
   Verifikasi daftar tag audio ElevenLabs v3 dari dokumentasi resminya dengan WebFetch (hanya membaca dokumentasi, bukan API). Tandai di YAML mana tag yang terverifikasi dan mana yang belum. Jangan mengklaim tag berfungsi: pemilik menguji setelah berlangganan.
2. `scripts/senggang/prompt.py`: membuat `prompt-chatgpt.md` untuk ChatGPT Thinking. Isinya: ringkasan dunia cerita dan karakter dari sa-cerita, aturan Mbis dan kata terlarang, kosakata tag dari YAML (dibaca, bukan ditulis ulang), uji lucu per beat versi ringkas dari skill sa-komedi, dan FORMAT KELUARAN DUA LAPIS per beat: (a) baris dialog dengan tag, (b) arahan visual: latar, aksi, properti, musik, kamera. Tanpa lapis (b), storyboarder harus menebak dan token terbuang. Sertakan satu contoh beat lengkap dan bentuk keluaran yang mudah di-parse (tentukan format yang paling tahan terhadap kebiasaan ChatGPT: blok bertanda jelas, bukan JSON panjang). Tag yang berupa aksi atau narasi harus ditandai supaya tidak ikut ke lembar ElevenLabs.
3. `scripts/senggang/impor.py`: tempelan ChatGPT (berkas teks) menjadi `naskah.json` sesuai skema naskah2, lalu jalankan `naskah.periksa_beat`. Tambahkan field `jalur: "senggang"` dan `sumber_suara: "manual"` (perbarui skema dan test yang terkait). Kembalikan daftar galat per baris, bukan satu galat umum, supaya pemilik bisa memperbaiki tempelan lewat ChatGPT dengan satu pesan koreksi.
4. `scripts/senggang/lembar_tempel.py`: lembar ElevenLabs per tokoh berisi hanya baris yang diucapkan dengan tag audio, nomor baris dari `daftar_dialog`, siap salin. Aksi dan SFX tidak ikut.
5. Impor audio: pakai ulang jalur manusia (`scripts/suara/manusia.py`: potong per baris, bersihkan, rakit dialog.wav). Periksa dulu apakah satu file panjang per tokoh dari ElevenLabs bisa dipotong per baris oleh `dengar.transkrip` (lokal) dan `waktu_kata.py`. Kalau belum bisa, tambahkan pemotongan berbasis transkrip lokal. Tanpa API.
6. Cabang di alur: `scripts/tahap.py`, `commands/sa-video.md`, dan `agents/direktur-marketing.md`. Di jalur senggang, tahap `naskah` TIDAK memanggil penulis-naskah, pembasmi-slop, atau pemeriksa-fakta; hanya impor, lint Python, lalu Approval 1. Jalur otomatis tidak boleh berubah perilakunya (test lama harus tetap lulus). Tambahkan perintah `/sa-senggang <folder>` yang menjalankan langkah 2 sampai 5 berurutan dan berhenti di titik yang butuh pemilik.
7. Saran jalur di `scripts/jadwal_minggu.py` (saran saja, pemilik tetap memilih): batas mingguan menipis berarti sarankan senggang; pemilik sibuk berarti otomatis.
8. Dokumentasi singkat di README.md dan satu baris di CLAUDE.md.

## Selesai bila
- `.venv/bin/python -m pytest -q` lulus (tambahkan `-m lambat` sekali di akhir) dan `npm test --prefix template`.
- Ada satu uji ujung ke ujung dengan fixture: tempelan ChatGPT contoh, naskah.json valid, lembar tempel, audio palsu, dialog.wav. Tanpa layanan berbayar.
- Tempelan yang salah (tag tidak dikenal, Mbis lebih dari 3 baris, kata terlarang) menghasilkan galat per baris yang bisa dibaca.

## Laporan akhir
Singkat, berisi angka (jumlah test, galat yang ditangkap), apa yang belum teruji (terutama tag ElevenLabs dan pemotongan audio nyata), dan selisih `/usage` sebelum dan sesudah sesi. Catatan untuk pemilik masuk ke Notion lewat skill sa-jadwal bila konektor tersedia; bila tidak, ke `catatan-notion.md`. Di chat cukup ringkasan dan tautan.
````
