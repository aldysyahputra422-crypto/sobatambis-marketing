---
name: sa-jadwal
description: Skema database Notion "Produksi Sobat Ambis" dan cara mencatat progres, persetujuan, angka QA, dan token setiap episode ke Notion. Pakai setiap kali menulis atau membaca catatan produksi di Notion.
---

# sa-jadwal: catatan produksi di Notion

Pemilik membaca progres produksi di Notion, bukan di chat. Satu baris per episode, diperbarui setiap tahap berubah.

## Database "Produksi Sobat Ambis"

| Kolom | Tipe Notion | Isi |
|---|---|---|
| Episode | Title | `ep01 · Rencana Sempurna` |
| Folder | Text | `videos/2026-W46/ep01-v2` (kunci pencocokan baris) |
| Tahap | Select | naskah, suara, dialog_ok, adegan, mix, render_draf, qa_gerak, render, qa_final, kemasan, video_ok, gerbang, selesai |
| Status | Select | berjalan, butuh persetujuan, butuh rekam ulang, gagal, siap posting |
| Butuh dari pemilik | Text | kalimat tindakan untuk pemilik, kosong bila tidak ada |
| Sumber suara | Select | manusia, elevenlabs |
| Skor gerak (median) | Number | dari QA gerak |
| LUFS | Number | dari mix |
| Token output | Number | dari token.json |
| Jadwal tayang | Date | diisi pemilik |
| Tautan video | URL | bila video diunggah |
| Diperbarui | Text | waktu UTC catatan terakhir |

## Aturan
- Nilai SELALU diambil dari `python -m scripts.notion_catatan <folder>` (JSON `properti` + `log`). Jangan mengarang angka.
- Baris dicocokkan lewat kolom Folder; perbarui baris yang ada, buat baru bila belum ada.
- Tambahkan `log` sebagai satu poin di badan halaman episode (riwayat, jangan dihapus).
- `database_id` disimpan di `config/notion.yaml`. Bila kosong: cari database bernama "Produksi Sobat Ambis"; bila tidak ada, tanya pemilik halaman induknya, buat database dengan skema di atas, lalu simpan id-nya.
- Status "butuh persetujuan", "butuh rekam ulang", atau "gagal" juga disampaikan singkat di chat, dengan tautan halaman Notion.
