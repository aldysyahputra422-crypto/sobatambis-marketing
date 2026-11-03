---
description: "Periksa apakah plugin, hook, dan kantor live sudah siap di komputer ini setelah pemasangan"
---

Jalankan `python -m scripts.periksa_pasang` (hanya membaca, tidak mengubah apa pun) dan laporkan ke pemilik maksimal 6 baris:
- Jumlah siap, saran, dan gagal.
- Setiap item **GAGAL** beserta perintah perbaikannya (kolom `→`), karena itu menghalangi produksi.
- Item **SARAN** cukup disebut singkat; sebagian (skill katalog, kantor) menyusul otomatis saat sesi berikutnya dimulai.

Jangan menjalankan perintah perbaikan sendiri, terutama `bash scripts/aktifkan_otomatis.sh`: itu langkah pemilik. Jangan menampilkan nilai kunci API apa pun (skrip memang tidak mencetaknya).
