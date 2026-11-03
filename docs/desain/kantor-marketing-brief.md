# Brief render: Kantor Departemen Marketing Sobat Ambis

Keputusan pemilik: Opsi A (per fungsi), label peran, Ketua = Direktur Marketing, Pemilik (Aldy) di kursi persetujuan, fork kantor-agent agar label mengikuti `agentType`.

## Gaya visual
- Isometrik 3D dari sisi depan-kanan, elevasi sekitar 35 derajat, potongan dinding (cutaway) seperti poster "Italian Smart Office".
- Perabot dan bangunan bergaya render bersih (bahan halus tanpa outline); lantai beton abu-abu terang bergaris panel, karpet gelap di lobi, area percakapan, dan area santai.
- Dinding belakang abu-abu dengan jendela besar berbingkai hitam di atas lantai produksi dan sisi kanan; ruang kerja belakang berdinding kaca.
- Karakter bergaya Chibi (outline tebal, warna pastel) dari lembar karakter teman pemilik; hanya karakter yang beroutline.
- Label zona seperti callout poster: kotak bergaris tipis hijau tua dengan garis penunjuk ke lantai. Latar halaman berpola jalan kota putih.
- Label teks Bahasa Indonesia; tanpa teks Italia dan tanpa logo Estel.

## Denah (Opsi A: per fungsi, susunan mengikuti poster acuan)
Lantai 36 x 19 m. Kiri ke kanan di barisan belakang: Ruang Riset ("Training", kaca), Ruang Naskah ("Acoustic partition", kaca), Lantai Produksi ("Personal workstation" dan "Sit/stand", terbuka, jendela besar), Studio Suara (kapsul telepon), Ruang Direktur ("Executive", kaca, kayu gelap), Ruang Gerbang ("Hybrid meeting", kaca), Ruang Kreatif ("Coffice", kios oranye). Lorong utama di depannya.
Di tengah: Gudang Katalog (dinding loker warna-warni, "Lockers matrioska"), blok dapur tinggi dengan pulau dan bangku, rak buku teal, meja baobab di kanan.
Di depan: Lobi ("Reception", kursi oranye di atas karpet gelap, meja resepsionis putih, papan status), area percakapan (kursi tamu teal bersandaran tinggi dan kursi oranye di atas karpet bundar gelap), meja kolaborasi dengan kursi hijau, area santai (sofa L teal di atas karpet gelap, meja bundar putih, pouf hijau, foosball).

| Zona | Acuan poster | Agent |
|---|---|---|
| Lobi | Reception waiting area | Kursi Pemilik (Aldy), papan status pipeline |
| Ruang Direktur | Executive sit/stand | Direktur Marketing |
| Ruang Riset | Training | Periset Tren, Perencana Konten |
| Ruang Naskah | Acoustic partition | Penulis Naskah, Pembasmi Slop, Pemeriksa Fakta |
| Lantai Produksi | Personal workstation, sit/stand | Animator, Storyboarder, Inspektur Frame + 4 meja cadangan freelancer |
| Studio Suara | Phone booth | Sutradara Suara, QA Suara |
| Ruang Kreatif | Coffice | Desainer Cover, Penulis Caption |
| Ruang Gerbang | Hybrid meeting | Penjaga Gerbang QA, Akuntan Token, Penjadwal Notion |
| Gudang Katalog | Lockers matrioska | Pencari Skill |
| Lounge | Lounge conversation, cafeteria, leisure area, baobab | Tempat anggota yang sedang tidak bekerja |

Koordinat dan jalur jalan ada di `kantor/runtime/public/assets/sa/tata.js` dan dijaga test (tidak menembus meja, benda besar, atau kaca selain lewat pintu).

## Karakter
17 kursi: Direktur Marketing, 16 agent, dan Pemilik (Aldy). Setiap kursi punya desain sendiri (rambut, baju, ekspresi) sebagai personal branding agent. 16 desain diambil dari lembar karakter chibi teman pemilik (izin: `aset/karakter/katalog.yaml`); dua desain baru (Pemilik dan Pencari Skill) dibuat dengan gaya yang sama. Data di `kantor/runtime/public/assets/sa/watak.js`; lihat semuanya di `/kerja?galeri`.

| Kursi | Posisi di lembar | Ciri yang dipertahankan |
|---|---|---|
| Direktur Marketing | baris 4 kolom 2 | jambul hitam, dasi oranye |
| Sutradara Suara | baris 1 kolom 1 | rambut magenta keriting, senyum bergigi, gaun oranye |
| Animator | baris 1 kolom 2 | rambut biru runcing dengan petir, mata bulat terkejut, jaket ungu |
| Storyboarder | baris 1 kolom 3 | rambut panjang dengan pita merah, blus teal |
| Pembasmi Slop | baris 1 kolom 4 | mulut menganga dengan cairan oranye, lengan lavender |
| Perencana Konten | baris 2 kolom 1 | rambut oranye berkepang dengan jepit X, jaket biru, bot cokelat |
| Penulis Caption | baris 2 kolom 2 | rambut pirang, mata X, sweater hijau bergaris, celana pendek |
| QA Suara | baris 2 kolom 3 | bob putih berponi rata, rok ungu |
| Penulis Naskah | baris 2 kolom 4 | rambut bergelombang, kacamata bulat, rok bertali |
| Desainer Cover | baris 3 kolom 1 | rambut keriting kuning-oranye, kaus biru |
| Penjaga Gerbang QA | baris 3 kolom 2 | rambut zaitun dengan jambul, mata sipit, rompi magenta |
| Periset Tren | baris 3 kolom 3 | rambut panjang dengan topi jamur, celemek biru berkantong oranye |
| Penjadwal Notion | baris 3 kolom 4 | rambut perak belah tengah, pipi merah muda, celana biru muda |
| Pemeriksa Fakta | baris 4 kolom 1 | rambut afro oranye, kacamata ungu besar, gigi dirapatkan, syal |
| Inspektur Frame | baris 4 kolom 3 | mata putih kosong, sweater hijau berhati |
| Akuntan Token | baris 4 kolom 4 | poni hitam panjang, mata X, atasan lavender berbalut putih |
| Pencari Skill | desain baru | kupluk biru berpom-pom kuning, cardigan oranye |
| Pemilik (Aldy) | desain baru | rambut hitam rapi, kemeja putih, rompi biru, dasi kuning |

Freelancer memakai desain sederhana berkartu pengenal. Benda khas peran tetap ada di meja masing-masing (bukan di pakaian).

### Pose
- Bekerja: duduk di meja, mengetik. Santai: duduk atau berdiri di lounge dengan gerakan kecil. Berjalan antara meja dan lounge lewat celah meja, pintu, dan lorong.
- Menunggu persetujuan: kursi pemilik menyala merah dan Aldy mengangkat tangan.

## Elemen khusus
- Garis lantai alur produksi, dari lobi ke gerbang.
- Papan status di lobi: 12 tahap pipeline, tahap yang sedang berjalan menyala; zona tempat tahap itu bekerja diberi bingkai kuning.
- Kursi Pemilik menyala saat ada persetujuan yang ditunggu.
- Freelancer masuk lewat pintu saat empat meja tim penuh.
- Layar besar di dinding belakang Lantai Produksi (6,2 x 1,9 m): tahap, agent yang bekerja, permintaan untuk Aldy.
- Hologram di area terbuka tengah (x -1, z 1): merah saat Aldy ditunggu, kuning saat bekerja, teal saat sepi; terdaftar sebagai rintangan jalur jalan.
- Tema Malam: gelap dengan garis neon di dinding belakang, dasar kaca, dan tepi lantai; hologram dan layar menjadi sumber cahaya.
- Bar bawah: mode kamera (Semua, Meja, Jelajah, Fokus, Tim) dan chip agent. Ide ini dari tampilan "Daylight Lab" yang ditemukan pemilik; tata letak, karakter, dan warna tetap milik kita.

## Palet
- **Utama, palet merek dari logo:** biru tua #294D82 (tulisan logo) dan kuning #FFC400 (topi wisuda). Dipakai untuk papan, kursi, dan label.
- Warna pendukung dari referensi Estel (teal, oranye, hijau tua) hanya untuk perabot, di atas beton abu-abu. Jangan mendominasi.
- Palet serial untuk animasi (navy #1C2550, kuning #FFC861, krem #FFFCF5) boleh untuk nuansa yang selaras dengan serial.

## Hindari
- Teks Italia dan logo Estel dari referensi.
- Karakter yang terlihat seperti manusia nyata. Karakter tetap chibi sesuai lembar, tanpa mengubah rambut, baju, dan ekspresi yang sudah jadi identitas agent.
- Terlalu banyak elemen kecil yang tidak terbaca di layar HP.
