---
name: sa-cerita
description: Dunia cerita serial Arta & Mbis (karakter, struktur episode, sistem emosi, alur Arc 1). Wajib dipakai sebelum menulis, menyunting, atau men-storyboard episode apa pun.
---

# Cerita Arta & Mbis

Sebelum menulis apa pun:
1. Baca `references/story-bible.md` sampai habis: karakter, aturan Mbis, struktur 6 bagian, sistem emosi, running gag.
2. Baca `references/arc-1.md` untuk tahu posisi episode dalam alur dan sumber kandidatnya.
3. Pakai `references/ep01-rencana-sempurna.md` sebagai contoh standar kualitas: setiap baris punya emosi dan intensitas, ada puncak ≥ 8, ada kontras sebelum puncak.

Hasil naskah ditulis sebagai `naskah.json` sesuai `schemas/naskah.schema.json`, lalu diperiksa dengan:

```
python -m scripts.naskah periksa <folder-video>
```

Kode keluar 0 = lulus, 1 = ada masalah (perbaiki), 4 = valid tapi belum disetujui pemilik.
