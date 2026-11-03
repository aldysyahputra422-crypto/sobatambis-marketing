---
description: "Produksi satu video Sobat Ambis dari naskah beat sampai siap posting. Argumen: folder video, misalnya videos/2026-W46/ep01-v2"
---

Pertama jalankan `python -m scripts.tahap mulai $ARGUMENTS` (menandai produksi aktif; hook Stop lalu melanjutkan otomatis sampai titik persetujuan). Lalu jalankan agent `direktur-marketing` untuk folder `$ARGUMENTS`.

**Hemat token:** tahap bertanda *mekanis* tidak didelegasikan ke agent. Direktur menjalankan semuanya sekaligus dengan `python -m scripts.tahap jalan $ARGUMENTS` (Bash `run_in_background: true`). Script itu berhenti sendiri di tahap kreatif, titik persetujuan, saat butuh izin, atau saat gagal. Agent di kolom "Agent" untuk tahap mekanis hanya dipanggil bila tahap itu **gagal** (lihat field `perbaiki` di keluaran JSON).

| Tahap | Agent | Perintah | Lulus jika |
|---|---|---|---|
| `naskah` | penulis-naskah → pembasmi-slop → pemeriksa-fakta | `python -m scripts.naskah periksa $ARGUMENTS` | kode 0. **kode 4 = Approval 1**: kirim naskah ke pemilik dan tanyakan sumber suara (`manusia` atau `elevenlabs`). Berhenti sampai pemilik setuju, lalu set `disetujui: true` dan `sumber_suara`. |
| `suara` | *mekanis*; gagal → sutradara-suara | `python -m scripts.suara.produksi $ARGUMENTS` | kode 0. **kode 3**: izin/kredit ElevenLabs kurang, berhenti dan minta persetujuan pemilik (`tahap jalan` juga berhenti dengan kode 3 bila `.sa/izin-elevenlabs` belum ada). **kode 5**: kirim `lembar-rekaman.md` dan daftar baris yang perlu direkam ulang, berhenti. |
| `dialog_ok` | qa-suara | kirim `dialog.wav` ke pemilik (**Approval 2**) | pemilik menyetujui trek dialog |
| `adegan` | *mekanis*; gagal → animator (aset) / storyboarder | `python -m scripts.adegan2 $ARGUMENTS` | kode 0 |
| `mix` | *mekanis*; gagal → sutradara-suara | `python -m scripts.mix $ARGUMENTS` | `mix.wav` −14 ±1 LUFS, puncak ≤ −1 dBTP |
| `render_draf` | *mekanis*; gagal → animator | `python -m scripts.render $ARGUMENTS --draf` | `draf.mp4` ada |
| `qa_gerak` | *mekanis*; gagal → animator | `python -m scripts.qa_gerak $ARGUMENTS/draf.mp4 --kecuali <beat mengena>` | kode 0; maksimal 2 perbaikan (render draf diulang otomatis sebelum cek ulang) |
| `render` | *mekanis*; gagal → animator | `python -m scripts.render $ARGUMENTS` | `video.mp4` ada |
| `qa_final` | *mekanis*; gagal → inspektur-frame | `python -m scripts.qa_final $ARGUMENTS` | kode 0 |
| `kemasan` | desainer-cover, penulis-caption → pembasmi-slop | `npx remotion still Cover ...`, menulis `caption.txt` | `cover.png` ada; caption memuat "INFO" dan tanpa "—" |
| `video_ok` | direktur-marketing | kirim `video.mp4`, `cover.png`, `caption.txt` ke pemilik (**Approval 3**) | pemilik menyetujui |
| `gerbang` | akuntan-token, penjaga-gerbang-qa | `python -m scripts.token_meter $ARGUMENTS`, menulis `qa.md` | semua butir checklist lulus, termasuk lisensi aset |

`tahap jalan` menandai sendiri tahap mekanis yang lulus beserta angkanya (`lufs`, `skor_median`). Tahap kreatif ditandai direktur setelah verifikasi:

```
python -c "from scripts import status; status.tandai('$ARGUMENTS', '<tahap>', 'lulus')"
```

Setiap kali produksi **berhenti**, agent **penjadwal-notion** mencatat sekali ke database Notion "Produksi Sobat Ambis" memakai `python -m scripts.notion_catatan $ARGUMENTS` (skill `sa-jadwal`). Tanpa konektor Notion, catatan masuk ke `$ARGUMENTS/catatan-notion.md`.

Tahap yang gagal 2 kali: `tahap jalan` menolak mencoba lagi dan mengembalikan alasan "lapor ke pemilik"; laporkan dan berhenti. Laporan ke pemilik memuat angka QA (skor gerak, LUFS, skor suara), bukan klaim "bagus".

Sesudah titik persetujuan, lanjutkan di sesi baru (`/clear`, lalu `/sa-video $ARGUMENTS`): semua keadaan ada di `status.json`, jadi konteks lama tidak perlu dibawa.

Untuk mengulang tahap tertentu: `python -m scripts.tahap ulang $ARGUMENTS <tahap>`. `token.json` memuat `per_tahap` (token dan `setara_input` per tahap) untuk melihat tahap mana yang paling berat.
