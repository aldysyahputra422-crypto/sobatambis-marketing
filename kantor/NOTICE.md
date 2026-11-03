# Asal-usul

Folder ini adalah fork dari [humaedihume/kantor-agent](https://github.com/humaedihume/kantor-agent)
(commit `ad92a7a`), lisensi MIT (lihat `LICENSE`). Pustaka three.js di `runtime/public/assets/vendor/three`
punya lisensinya sendiri (lihat `THIRD_PARTY_NOTICES.md` dan `runtime/public/assets/vendor/three/LICENSE`).

Perubahan untuk Sobat Ambis:
- Hanya runtime Node (PHP dan skrip parity dibuang).
- `roster.json` dan `runtime/lib/node/marketing.mjs`: label peran per `agentType`, kursi pemilik (menunggu persetujuan), papan tahap produksi.
- Field baru `roster`, `pemilik`, `pipeline` di `/kerja/api/state`; field asli tetap ada.
