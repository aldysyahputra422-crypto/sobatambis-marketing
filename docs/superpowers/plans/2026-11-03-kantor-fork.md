# Fork Kantor Agent untuk Departemen Marketing

Sumber: `humaedihume/kantor-agent` (MIT, commit ad92a7a). Keputusan desain: `docs/desain/kantor-marketing-brief.md`.

## Cakupan Fase 1 (data dan label, tampilan 3D belum diubah)
1. `kantor/`: salinan runtime Node (tanpa PHP dan parity), LICENSE MIT, NOTICE asal-usul.
2. `kantor/roster.json`: 16 agent repo + Direktur Marketing, masing-masing label peran, zona, fungsi, warna seragam, benda khas.
3. `kantor/runtime/lib/node/marketing.mjs`: `roster` (state per agentType dari transkrip), `pemilik` (menunggu persetujuan dari status.json produksi), `pipeline` (tahap sekarang). Ditambahkan sebagai field baru di `/kerja/api/state`; field lama (`team`, `freelancers`) tetap supaya tampilan lama jalan.
4. Ketua berlabel "Direktur Marketing" lewat `.claude/kantor-agent.json`.
5. Autostart dari hook SessionStart repo kita; plugin kantor-agent upstream dilepas dari `config/claude-settings.json` (hindari dua server). Perintah `/sa-kantor`.
6. Test: `node --test kantor/test` (fixture transkrip palsu) + parity logika `pemilik` terhadap `scripts/notion_catatan.py` + pytest yang menjalankan keduanya.

## Fase 2 (selesai)
Tampilan 3D baru di `kantor/runtime/public/assets/sa/` (tata.js denah murni, karakter.js, perabot.js, gabung.js, kantor3d.js, ui.js, demo.js) yang membaca `roster`, `pemilik`, `pipeline`. Diuji: 9 test denah/jalur/demo (Node), uji asap Chromium (render, draw call, gerak).

## Di luar cakupan
Tailscale (`tailscale serve`) dikerjakan setelah Fase 1, di mesin pemilik.

## Revisi Fase 2 (acuan visual)
Denah ditata ulang mengikuti poster Estel (kamera isometrik depan-kanan, lantai beton, ruang kaca belakang, lounge depan) dan karakter dirender dari lembar karakter (`watak.js`, 18 gaya rambut). Perabot memakai bahan standar tanpa outline; outline hanya untuk karakter.
