---
description: "Rencana satu minggu: ukur kapasitas, riset topik, jadwal 7 hari, lalu catat ke Notion. Argumen: minggu ISO, misalnya 2026-W47"
---

Rencanakan minggu `$ARGUMENTS` (format `YYYY-Www`). Kerjakan berurutan, tulis hasil ke file, laporkan ringkas.

1. **Kapasitas**: `python -m scripts.kapasitas`. Bila `kapasitas_mingguan` null, sampaikan `cara_ukur` ke pemilik (sekali, singkat) lalu lanjut dengan target dari `config/jadwal.yaml`; jangan menebak angka.
2. **Jadwal**: `python -m scripts.jadwal_minggu susun $ARGUMENTS` → `videos/$ARGUMENTS/jadwal.json`. Hari tanpa kapasitas menjadi "turunan".
3. **Riset**: agent periset-tren → `videos/$ARGUMENTS/bank-topik.json`; harus lulus `python -m scripts.riset periksa videos/$ARGUMENTS/bank-topik.json`.
4. **Rencana**: agent perencana-konten memilih topik dari bank, menulis `videos/$ARGUMENTS/rencana.md`, dan mengisi field `judul` setiap hari di `jadwal.json` (serial: judul episode; turunan: format + episode sumber). Tandai topik terpakai di `bank-topik.json` (`dipakai_di`).
5. **Notion**: agent penjadwal-notion mencatat `python -m scripts.jadwal_minggu notion videos/$ARGUMENTS` ke database "Produksi Sobat Ambis" (Tahap `rencana`, Status `direncanakan`, Jadwal tayang) dan `python -m scripts.riset notion videos/$ARGUMENTS/bank-topik.json` ke "Bank Topik Sobat Ambis".
6. **Laporan ke pemilik** (chat, maksimal 5 baris): jumlah episode serial dan turunan, kapasitas terukur atau "belum diukur", jumlah topik lulus periksa, tautan Notion.

Produksi tiap episode tetap lewat `/sa-video videos/$ARGUMENTS/epNN`, dimulai pada tanggal `produksi` di `jadwal.json`.
