---
name: sa-katalog
description: Cari dan pasang skill atau alat dari katalog Sobat Ambis sebelum mengerjakan tugas yang butuh kemampuan baru. Pakai daripada mengerjakan seadanya tanpa skill yang tepat.
---

# Katalog skill

Katalog: `katalog/skill.yaml`. Cari dengan:

```
python -m scripts.katalog cari "<kebutuhan tugas>"
```

Prosedur (wajib berurutan, tanpa bertanya ke pemilik kecuali langkah 4):
1. Cocokkan kebutuhan: `python -m scripts.katalog cari "<kebutuhan>"`; ambil hasil teratas yang relevan.
2. Pasang: `python -m scripts.pasang_otomatis --id <id>`. Script itu sendiri yang memutuskan boleh/tidak (gratis, tanpa key, lisensi MIT/Apache/BSD/ISC/LGPL, status direkomendasikan/opsional, ≤ 200 MB) dan memverifikasi file `SKILL.md` benar-benar ada.
3. Hasil `terpasang` atau `sudah_ada`: lanjutkan tugas memakai skill itu. Hasil `gagal`: ulangi sekali; masih gagal → langkah 4.
4. Hasil `butuh_pemilik` atau gagal dua kali: JANGAN pasang manual, JANGAN cari jalan lain, JANGAN mengerjakan seadanya diam-diam. Catat alasannya lewat penjadwal-notion (kolom "Butuh dari pemilik") dan pakai alternatif gratis dari katalog bila ada.
5. Sumber di luar katalog tidak dipasang. Usulkan penambahan ke katalog lewat catatan Notion.
6. Plugin (`pasang.jenis: plugin`, misalnya caveman dan ponytail) tidak dipasang lewat script: sudah aktif bawaan lewat `.claude/settings.json` (lihat `scripts/aktifkan_otomatis.sh`).

Skill bertanda `otomatis: true` dipasang sendiri oleh hook SessionStart setiap sesi dimulai.

Aturan lisensi:
- `status: sebagian` → pasang hanya bagian yang disebut di `catatan_lisensi`.
- `status: rujukan` → baca saja, jangan disalin ke repo ini.
- Lisensi nonkomersial: boleh selama `catatan_lisensi` mengizinkan; laporkan bila ragu.
