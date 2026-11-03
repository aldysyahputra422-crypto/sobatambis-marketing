---
description: "Nyalakan, cek, atau hentikan kantor live departemen marketing. Argumen: start (bawaan), status, stop, url, tailscale, tailscale-stop"
---

Jalankan `bash kantor/runtime/bin/kantor.sh $ARGUMENTS` (tanpa argumen = `start`) dan sampaikan URL-nya ke pemilik, satu baris.

Kantor membaca transkrip Claude Code di komputer ini, jadi hanya terisi bila dijalankan di mesin yang juga menjalankan Claude Code. Alamat bawaan `http://127.0.0.1:8788/kerja`. Data tambahan di `/kerja/api/state`: `roster` (kursi tetap tiap agent), `pemilik` (menunggu persetujuan atau tidak), `pipeline` (tahap produksi).

`tailscale` membuka kantor ke perangkat di tailnet pemilik lewat `tailscale serve` (HTTPS, hanya tailnet): jalankan hanya bila pemilik memintanya, dan sampaikan alamat yang dicetak. Jangan membuka kantor ke jaringan (`--bind 0.0.0.0`), memakai `tunnel` (URL publik), atau `tailscale funnel` (internet) tanpa izin eksplisit pemilik.
