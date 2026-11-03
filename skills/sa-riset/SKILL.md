---
name: sa-riset
description: Cara meriset topik konten Sobat Ambis dari sumber tepercaya - tingkat sumber A/B/C, Agent-Reach tanpa login, konektor penelitian (Consensus, Elicit, SciSpace), skema bank-topik.json, dan batas hemat token. Pakai setiap kali mencari topik, tren, atau fakta untuk episode dan caption.
---

# sa-riset: riset topik bersumber

## Tingkat sumber (`config/sumber.yaml`, diperiksa `scripts/riset.py`)
| Tingkat | Contoh | Boleh untuk |
|---|---|---|
| A resmi/ilmiah | `.go.id`, `.ac.id`, `snpmb.id`, PubMed, doi.org, Consensus, Elicit, WHO, UNICEF, OECD | fakta, angka, kebijakan |
| B media kredibel | Kompas, Tempo, Antara, detik, The Conversation, Jawa Pos, Suara Surabaya | fakta (lebih baik dikonfirmasi satu sumber A) |
| C tren | YouTube, TikTok, Instagram, X, Reddit, Google Trends | hanya bukti "sedang ramai", tidak untuk fakta |
Domain di luar daftar ditolak validator. Tambahkan ke `config/sumber.yaml` hanya bila memang punya redaksi atau lembaga yang jelas.

## Alat, urut dari yang paling murah
1. **WebSearch**: tren dan berita terbaru (judul + tanggal sudah cukup untuk tingkat C).
2. **Konektor penelitian** (bila pemilik menyambungkannya di claude.ai → Settings → Connectors): Consensus `search` untuk pertanyaan ilmiah ("does sleep deprivation affect memory in adolescents"), Elicit `search_papers`, SciSpace `search-papers`. Kutip URL makalah dari hasil tool, jangan dibuat ulang.
3. **Agent-Reach** lewat `python -m scripts.riset baca <url>`: isi artikel atau subtitle YouTube, dipotong 6.000 karakter. Situs wajib login langsung ditolak (kode 3) dan memang tidak boleh dibuka.
4. **WebFetch**: cadangan bila Agent-Reach belum terpasang atau gagal.

## Skema `videos/<minggu>/bank-topik.json`
```json
{"minggu": "2026-W47", "dibuat": "2026-11-09", "topik": [
  {"id": "t01", "judul": "...", "pilar": "relate_siswa | relate_ortu | edukasi_belajar",
   "temuan": "satu kalimat fakta, angka hanya bila ada di sumber A/B",
   "sudut_psikologi": "mekanisme yang membuat penonton merasa dipahami (mis. planning fallacy, efek sorotan)",
   "ide_episode": "satu kalimat situasi Arta & Mbis",
   "sumber": [{"url": "...", "judul": "...", "tanggal": "YYYY-MM-DD", "jenis": "fakta | tren"}],
   "dipakai_di": ""}]}
```
Periksa: `python -m scripts.riset periksa <file>` harus kode 0.

## Topik yang dicari
- Kalender: ujian sekolah, PTS/PAS, pengumuman dan jadwal SNBP/SNBT, libur, tahun ajaran baru.
- Kebiasaan belajar: tidur, menunda, sistem kebut semalam, HP saat belajar, catatan, latihan soal.
- Hubungan siswa dan orang tua: tekanan nilai, grup WA wali murid, membandingkan dengan anak lain.
- Surabaya: sekolah, acara, cuaca atau kebiasaan lokal yang bisa menjadi detail spesifik.

## Jangan
- Login, cookie, atau scraping akun pribadi. Menyebut nama akun atau siswa nyata.
- Topik duka, kekerasan, atau kesehatan mental berat sebagai bahan komedi.
- Angka yang hanya ada di sumber tingkat C.
- Lebih dari 12 pencarian dan 8 halaman dibaca per sesi riset.
