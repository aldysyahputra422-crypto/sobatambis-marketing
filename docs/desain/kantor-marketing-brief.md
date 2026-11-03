# Brief render: Kantor Departemen Marketing Sobat Ambis

Keputusan pemilik: Opsi A (per fungsi), label peran, Ketua = Direktur Marketing, Pemilik (Aldy) di kursi persetujuan, fork kantor-agent agar label mengikuti `agentType`.

## Gaya visual
- Isometrik 3D, potongan dinding (cutaway) seperti referensi Estel "Italian Smart Office".
- Lantai terbuka, dinding kaca untuk ruang tertutup, beton abu-abu terang, perabot kayu dan kain.
- Aksen warna: pilih satu dari dua opsi (lihat bagian Palet).
- Label teks dalam Bahasa Indonesia, huruf sans-serif tebal. Tanpa teks Italia, tanpa logo Estel.
- Tanpa orang nyata dan tanpa watermark. Rasio 16:9 untuk poster, dan versi persegi untuk unggahan.

## Denah (Opsi A: per fungsi)
Urutan alur produksi digambar sebagai garis lantai, dari lobi ke gerbang:
Lobi, Riset, Naskah, Studio Suara, Lantai Produksi, Kreatif, Gerbang.

| Zona | Referensi | Isi |
|---|---|---|
| Lobi dan pintu masuk | Reception waiting | Pintu tempat freelancer masuk. Papan status 7 tahap pipeline |
| Ruang Direktur | Executive sit/stand, kaca | Kursi Direktur Marketing. Pandangan ke seluruh lantai |
| Kursi Pemilik (Aldy) | Dekat lobi atau ruang direktur | Menyala saat produksi menunggu persetujuan (Approval 1, 2, 3) |
| Lantai Produksi | Sit/stand workstation | Animator, Storyboarder, Inspektur Frame. 4 meja tim. 4 meja cadangan freelancer. Kartu "+N" untuk freelancer di luar itu |
| Ruang Naskah | Acoustic partition | Penulis Naskah, Pembasmi Slop, Pemeriksa Fakta |
| Studio Suara | Phone booth | Sutradara Suara, QA Suara |
| Ruang Kreatif | Area lounge berpanel warna | Desainer Cover, Penulis Caption |
| Ruang Riset | Training | Periset Tren, Perencana Konten |
| Gudang Katalog | Lockers matrioska | Pencari Skill |
| Ruang Gerbang | Hybrid meeting | Penjaga Gerbang QA, Akuntan Token, Penjadwal Notion |
| Lounge | Cafeteria, leisure, baobab table | Tempat anggota yang sedang tidak bekerja: TV, kopi, meja permainan |

## Karakter
Setiap kursi diberi label peran. Total 17 kursi: 16 agent plus Direktur Marketing.
Kursi tim dan freelancer hanya meja, tanpa nama orang.

### Gaya karakter
- Chibi: kepala besar, badan kecil, tangan dan kaki pendek.
- Outline hitam tebal, isi warna pastel rata, sedikit bayangan.
- Ekspresi dari mata, mulut, dan alis. Bentuk rambut dan kacamata dibuat beda untuk tiap orang.
- Figur harus terbaca dari jarak jauh: bentuk siluet jelas, warna seragam kontras dengan lantai.
- Boleh mengambil karakter langsung dari gambar acuan (sketsa chibi, latar abu-abu netral): pembuatnya sudah memberi izin gratis untuk aset Sobat Ambis (lihat `aset/karakter/katalog.yaml`). Gambar asli tidak disimpan di repo publik. Karakter akhir dirender ulang dengan seragam per fungsi di bawah.

### Seragam per fungsi
| Fungsi | Warna seragam | Benda khas |
|---|---|---|
| Direktur Marketing | Biru tua #294D82, aksen kuning | Papan tulis kecil |
| Pemilik (Aldy) | Kemeja putih, dasi kuning | Cangkir kopi |
| Kreatif (Desainer Cover, Penulis Caption) | Oranye pastel | Palet cat, kamera |
| Produksi (Animator, Storyboarder, Inspektur Frame) | Biru tua | Tablet gambar, pensil |
| Naskah (Penulis Naskah, Pembasmi Slop, Pemeriksa Fakta) | Ungu pastel | Pulpen, buku catatan, kaca pembesar |
| Suara (Sutradara Suara, QA Suara) | Teal | Headphone, mikrofon kecil |
| Riset (Periset Tren, Perencana Konten) | Hijau pastel | Kaca pembesar, kalender |
| Gerbang (Penjaga Gerbang QA, Akuntan Token, Penjadwal Notion) | Kuning #FFC400 | Papan centang, kalkulator |
| Katalog (Pencari Skill) | Cokelat pastel | Rak kecil berisi kartu skill |
| Freelancer | Putih, kartu tanda "Freelancer" di leher | Tas kerja |

### Pose
- Bekerja: duduk di meja, mengetik atau membaca. Sesuai dengan aksi terakhir yang terbaca di transkrip.
- Santai: berdiri atau duduk di lounge, dengan gerakan kecil.
- Menunggu persetujuan: kursi pemilik menyala, dan karakter Aldy mengangkat tangan.

## Elemen khusus
- Garis lantai alur produksi, dari lobi ke gerbang.
- Papan status di lobi: 7 tahap, tahap yang sedang berjalan menyala.
- Kursi Pemilik menyala saat ada persetujuan yang ditunggu.
- Freelancer masuk lewat pintu saat empat meja tim penuh.

## Palet
- **Utama, palet merek dari logo:** biru tua #294D82 (tulisan logo) dan kuning #FFC400 (topi wisuda). Dipakai untuk papan, kursi, dan label.
- Warna pendukung dari referensi Estel (teal, oranye, hijau tua) hanya untuk perabot, di atas beton abu-abu. Jangan mendominasi.
- Palet serial untuk animasi (navy #1C2550, kuning #FFC861, krem #FFFCF5) boleh untuk nuansa yang selaras dengan serial.

## Hindari
- Teks Italia dan logo Estel dari referensi.
- Kursi yang terlihat seperti manusia nyata. Karakter dibuat gaya kartun sederhana sesuai serial.
- Terlalu banyak elemen kecil yang tidak terbaca di layar HP.
