---
name: sa-katalog
description: Cari dan pasang skill atau alat dari katalog Sobat Ambis sebelum mengerjakan tugas yang butuh kemampuan baru. Pakai daripada mengerjakan seadanya tanpa skill yang tepat.
---

# Katalog skill

Katalog: `katalog/skill.yaml`. Cari dengan:

```
python -m scripts.katalog cari "<kebutuhan tugas>"
```

Prosedur (wajib berurutan):
1. Cocokkan kebutuhan tugas dengan katalog lewat perintah di atas.
2. Cek apakah sudah terpasang (`ls ~/.claude/skills`, daftar plugin, atau `pip show`/`npm ls`).
3. Bila belum: pasang sesuai `cara_pasang`, lalu pastikan file skill atau paketnya benar-benar ada.
4. Bila `butuh_key` tidak tersedia di environment: pakai alternatif gratis di katalog dan laporkan ke direktur-marketing. Jangan berpura-pura alat itu jalan.
5. Sumber di luar katalog tidak dipasang tanpa izin pemilik.

Aturan lisensi:
- `status: sebagian` → pasang hanya bagian yang disebut di `catatan_lisensi`.
- `status: rujukan` → baca saja, jangan disalin ke repo ini.
- Lisensi nonkomersial: boleh selama `catatan_lisensi` mengizinkan; laporkan bila ragu.
