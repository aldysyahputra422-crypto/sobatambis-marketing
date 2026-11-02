---
description: "Produksi satu video Sobat Ambis dari naskah sampai siap posting. Argumen: folder video, misalnya videos/2026-W46/ep01"
---

Jalankan agent `direktur-marketing` untuk folder `$ARGUMENTS`. Direktur mengulang `python -m scripts.tahap berikutnya $ARGUMENTS` dan mendelegasikan setiap tahap berikut, berurutan:

| Tahap | Agent | Perintah | Lulus jika |
|---|---|---|---|
| `naskah` | penulis-naskah → pembasmi-slop → pemeriksa-fakta | `python -m scripts.naskah periksa $ARGUMENTS` | kode 0. **kode 4 = Approval 1**: kirim naskah ke pemilik, berhenti sampai pemilik setuju, lalu set `disetujui: true` |
| `suara` | sutradara-suara → qa-suara | `python -m scripts.suara.produksi $ARGUMENTS` | kode 0. **kode 3** = butuh persetujuan pemilik (kredit habis atau edge-tts): berhenti dan tanya |
| `adegan` | storyboarder (+ animator bila aset belum ada) | `python -m scripts.adegan $ARGUMENTS` | kode 0 |
| `render` | animator | `npx remotion render Episode ...` di `template/` (lihat agent animator) | kode 0, `video.mp4` ada |
| `qa_frame` | inspektur-frame | `python -m scripts.qa_frame $ARGUMENTS` | kode 0; maksimal 2 perbaikan |
| `kemasan` | desainer-cover, penulis-caption → pembasmi-slop | `npx remotion still Cover ...`, menulis `caption.txt` | `cover.png` ada; caption memuat "INFO" dan tanpa "—" |
| `gerbang` | akuntan-token, penjaga-gerbang-qa | `python -m scripts.token_meter $ARGUMENTS`, menulis `qa.md` | semua butir checklist lulus |

Setelah setiap tahap lulus, tandai dengan:

```
python -c "from scripts import status; status.tandai('$ARGUMENTS', '<tahap>', 'lulus')"
```

Tahap yang gagal 2 kali: tandai `gagal` beserta alasannya, laporkan ke pemilik, dan berhenti.

Saat semua lulus (Approval 2): kirim `video.mp4`, `cover.png`, `caption.txt`, dan ringkasan `qa.md` ke pemilik untuk ditonton dan diposting.

Untuk mengulang tahap tertentu: `python -m scripts.tahap ulang $ARGUMENTS <tahap>`.
