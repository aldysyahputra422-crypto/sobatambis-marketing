---
description: "Produksi satu video Sobat Ambis dari naskah beat sampai siap posting. Argumen: folder video, misalnya videos/2026-W46/ep01-v2"
---

Pertama jalankan `python -m scripts.tahap mulai $ARGUMENTS` (menandai produksi aktif; hook Stop lalu melanjutkan otomatis sampai titik persetujuan). Lalu jalankan agent `direktur-marketing` untuk folder `$ARGUMENTS`. Direktur mengulang `python -m scripts.tahap berikutnya $ARGUMENTS` dan mendelegasikan setiap tahap, berurutan:

| Tahap | Agent | Perintah | Lulus jika |
|---|---|---|---|
| `naskah` | penulis-naskah → pembasmi-slop → pemeriksa-fakta | `python -m scripts.naskah periksa $ARGUMENTS` | kode 0. **kode 4 = Approval 1**: kirim naskah ke pemilik dan tanyakan sumber suara (`manusia` atau `elevenlabs`). Berhenti sampai pemilik setuju, lalu set `disetujui: true` dan `sumber_suara`. |
| `suara` | sutradara-suara | `python -m scripts.suara.produksi $ARGUMENTS` | kode 0. **kode 3**: izin/kredit ElevenLabs kurang, berhenti dan minta persetujuan pemilik. **kode 5**: kirim `lembar-rekaman.md` dan daftar baris yang perlu direkam ulang, berhenti. |
| `dialog_ok` | qa-suara | kirim `dialog.wav` ke pemilik (**Approval 2**) | pemilik menyetujui trek dialog |
| `adegan` | storyboarder (+ animator bila aset belum ada) | `python -m scripts.adegan2 $ARGUMENTS` | kode 0 |
| `mix` | sutradara-suara | `python -m scripts.mix $ARGUMENTS` | kode 0, `mix.wav` −14 LUFS |
| `render_draf` | animator | `python -m scripts.render $ARGUMENTS --draf` | `draf.mp4` ada |
| `qa_gerak` | inspektur-frame | `python -m scripts.qa_gerak $ARGUMENTS/draf.mp4 --kecuali <beat mengena>` | kode 0; maksimal 2 perbaikan |
| `render` | animator | `python -m scripts.render $ARGUMENTS` | `video.mp4` ada |
| `qa_final` | inspektur-frame | `python -m scripts.qa_final $ARGUMENTS` | kode 0 |
| `kemasan` | desainer-cover, penulis-caption → pembasmi-slop | `npx remotion still Cover ...`, menulis `caption.txt` | `cover.png` ada; caption memuat "INFO" dan tanpa "—" |
| `video_ok` | direktur-marketing | kirim `video.mp4`, `cover.png`, `caption.txt` ke pemilik (**Approval 3**) | pemilik menyetujui |
| `gerbang` | akuntan-token, penjaga-gerbang-qa | `python -m scripts.token_meter $ARGUMENTS`, menulis `qa.md` | semua butir checklist lulus, termasuk lisensi aset |

Setelah setiap tahap lulus, tandai dengan:

```
python -c "from scripts import status; status.tandai('$ARGUMENTS', '<tahap>', 'lulus')"
```

Untuk `mix` sertakan `lufs=<nilai>` dan untuk `qa_gerak` sertakan `skor_median=<nilai>` supaya angkanya tercatat di Notion.

Setiap tahap berubah dan setiap kali produksi berhenti, agent **penjadwal-notion** mencatat ke database Notion "Produksi Sobat Ambis" memakai `python -m scripts.notion_catatan $ARGUMENTS` (skill `sa-jadwal`). Tanpa konektor Notion, catatan masuk ke `$ARGUMENTS/catatan-notion.md`.

Tahap yang gagal 2 kali: tandai `gagal` beserta alasannya, laporkan ke pemilik, dan berhenti. Laporan ke pemilik memuat angka QA (skor gerak, LUFS, skor suara), bukan klaim "bagus".

Untuk mengulang tahap tertentu: `python -m scripts.tahap ulang $ARGUMENTS <tahap>`.
