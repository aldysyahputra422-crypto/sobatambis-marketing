---
description: "Jalur SENGGANG satu episode: naskah ditulis pemilik di ChatGPT, suara dibuat pemilik di ElevenLabs, sisanya mekanis. Argumen: folder video, misalnya videos/2026-W47/ep02"
---

Jalur hemat token: tanpa penulis-naskah, pembasmi-slop, pemeriksa-fakta, dan tanpa retry suara. Claude hanya menjalankan script dan berhenti di titik yang butuh pemilik.

Jalankan sekali (Bash biasa untuk langkah awal; `run_in_background: true` bila sudah sampai render):

```
python -m scripts.senggang.langkah $ARGUMENTS [--topik "arah episode dari pemilik"]
```

Keluaran satu baris JSON dengan `kode`, `berhenti_di`, dan `instruksi`. Sampaikan `instruksi` ke pemilik apa adanya (maksimal 5 baris), jangan menulis naskah sendiri. Lalu berhenti. Tiap kali pemilik selesai, jalankan perintah yang sama lagi; script melanjutkan dari `status.json`.

| Kode | Arti | Pemilik melakukan |
|---|---|---|
| 6 | belum ada `tempelan.txt`, atau salah (galat per baris di `alasan`, teks koreksi di `koreksi-chatgpt.md`) | tempel `prompt-chatgpt.md` atau `koreksi-chatgpt.md` ke ChatGPT, simpan jawabannya sebagai `tempelan.txt` |
| 4 | **Approval 1**: naskah.json lulus skema + `periksa_beat` + kata terlarang | baca, set `disetujui: true`, tempel `lembar-elevenlabs.md` per tokoh ke ElevenLabs |
| 5 | audio belum lengkap | taruh `rekaman/<tokoh>.mp3`; satu baris saja: `rekaman/ulang-<nomor>.mp3` |
| 0 di `dialog_ok` | dialog.wav jadi | dengarkan (**Approval 2**) |

Sesudah Approval 2 gunakan `/sa-video $ARGUMENTS`: tahap `adegan` sampai `qa_final` sama dengan jalur otomatis, lalu `kemasan` dan seterusnya. `tahap jalan` mengenali jalur dari `naskah.json` (`jalur: "senggang"`).

Aturan: tidak ada panggilan API ElevenLabs di jalur ini (`sumber_suara: "manual"`). Tag audio ElevenLabs bertanda `terverifikasi: belum` di `config/tag_ekspresi.yaml` belum terbukti; pemilik yang menguji. Catat progres ke Notion saat berhenti seperti `/sa-video` (`scripts.notion_catatan`).
