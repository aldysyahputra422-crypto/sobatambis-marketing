"""Buat prompt-chatgpt.md: prompt untuk ChatGPT (Thinking) agar menulis naskah episode dalam format yang bisa di-parse mekanis.

python -m scripts.senggang.prompt <folder> [--topik "teks"]
Dunia cerita dan aturan dibaca dari skills/sa-cerita; tag, latar, musik, sfx, aksi dibaca dari config/aset/template (tidak ditulis ulang di sini).
Tanpa LLM, tanpa API.
"""
import re
import sys
from pathlib import Path

from scripts import naskah as naskah_mod
from scripts.senggang import impor, tag

ROOT = Path(__file__).resolve().parents[2]
BIBLE = ROOT / "skills/sa-cerita/references/story-bible.md"

CONTOH_BEAT = """##BEAT t03 lucu
LATAR: ruang_tamu
MUSIK: tegang_naik
KAMERA: dekat arta dorong
AKSI: arta serahkan | pada_kata: simpan
SFX: tok | pada_kata: Seratus
PROPERTI: hp, kotak_kayu
PUNCHLINE: Ini cuma HP, Ta.
DIALOG:
ARTA: [excited, quickly] Ma, tolong simpan HP-ku. Seratus hari.
RATNA: [deadpan] [aksi: menghela] Ini cuma HP, Ta.
"""


def _bagian(teks: str, judul: str, tingkat: str = "##") -> str:
    """Ambil satu bagian markdown (dari judulnya sampai judul tingkat yang sama berikutnya)."""
    m = re.search(rf"^{tingkat} {re.escape(judul)}.*?(?=^{tingkat} |\Z)", teks, re.S | re.M)
    if not m:
        raise ValueError(f"bagian tidak ditemukan di story-bible: {judul}")
    return m.group(0).strip()


def _tabel_tag(kamus: dict) -> str:
    baris = ["| Tag | Jenis | Emosi (intensitas dasar) | Status ElevenLabs |", "|---|---|---|---|"]
    for nama, t in kamus["tag"].items():
        if t["jenis"] == "suara":
            jenis, emosi = "emosi", f"{t['emosi']} ({t['intensitas']})"
        else:
            jenis, emosi = "pengubah", f"geser intensitas {t['delta']:+d}"
        status = "terverifikasi" if t["terverifikasi"] == "dokumentasi" else "BELUM TERVERIFIKASI (pemilik menguji)"
        baris.append(f"| [{nama}] | {jenis} | {emosi} | {status} |")
    return "\n".join(baris)


def buat(episode: str, topik: str = "") -> str:
    kamus = tag.muat()
    bible = BIBLE.read_text(encoding="utf-8")
    aset = impor.daftar_aset()
    aksi = tag.aksi_tokoh()
    penuh = tag.aksi_penuh()
    rig = tag.ekspresi_rig()
    aksi_teks = "\n".join(
        f"- {t}: " + ", ".join(f"{a}{'*' if a in penuh else ''}" for a in sorted(aksi[t])) for t in ("arta", "ratna", "mbis"))
    mbis_larang = naskah_mod.DILARANG_MBIS.pattern
    return f"""# Tugas: tulis naskah episode {episode} serial animasi "Arta & Mbis"

Kamu penulis naskah komedi sketsa pendek (45 sampai 60 detik). Tulis SATU episode dalam format di bawah, tanpa basa-basi
sebelum atau sesudahnya. Naskah ini akan dibaca program, bukan manusia: format harus persis. Bahasa: Indonesia sehari-hari Surabaya, bukan baku.
{f'{chr(10)}TOPIK / ARAH EPISODE DARI PEMILIK: {topik}{chr(10)}' if topik else ''}
## 1. Dunia dan tokoh (dari story bible)

{_bagian(bible, "1. Premis")}

{_bagian(bible, "3. Karakter")}

{_bagian(bible, "4. Struktur episode")}

{_bagian(bible, "5. Aturan nada dan bahasa")}

## 2. Aturan keras (program akan menolak naskah yang melanggar, baris per baris)

- Mbis: MAKSIMAL 3 baris dialog dalam seluruh episode. Mbis tidak pernah menyebut brand ("Sobat Ambis"), kata "daftar", atau harga ("Rp"). Pola terlarang di dialog Mbis: `{mbis_larang}`.
- Dilarang memakai tanda pisah panjang (—) di mana pun. Pakai koma, titik, atau pecah kalimat.
- Beat pertama berjenis hook dan DIALOGNYA SELESAI DALAM 2 detik (maksimal 4 kata) atau tanpa dialog (beri `durasi=` di header, maksimal 2).
- Beat terakhir berjenis penutup. Tepat SATU beat berjenis mengena, terletak di sekitar 55% sampai 85% durasi, dan tidak lucu.
- Maksimal 8 detik berturut-turut tanpa beat lucu sebelum beat mengena. Minimal 3 beat; disarankan 7 sampai 9.
- Minimal 4 emosi berbeda di seluruh episode, dan minimal satu baris dengan intensitas 8 ke atas (mis. [gasps], [shouting], [crying]).
- Minimal 2 aksi seluruh badan di seluruh episode (aksi bertanda * di daftar aksi).
- Setiap baris dialog WAJIB punya tag ekspresi. Hanya pakai tag dari daftar; tag lain ditolak program.
- Durasi bicara dihitung program: kira-kira 2,6 kata per detik ditambah jeda 0,3 detik per baris.

## 3. Tag ekspresi (kosakata baku, tidak boleh menciptakan tag baru)

Tulis tag di depan teks baris: `[tense] teks` atau `[tense, slowly] teks`. Tag emosi pertama menentukan emosi dan ekspresi wajah animasi; pengubah (slowly, loudly, ...) hanya menggeser intensitas.
Tag boleh ditaruh di tengah kalimat bila nadanya berubah di sana. Satu baris = satu penutur.

{_tabel_tag(kamus)}

Tag yang bukan suara (tidak dikirim ke ElevenLabs), taruh di dalam teks dialog persis di depan kata yang bersangkutan:
- `[aksi: nama_aksi]` aksi tokoh penutur pada kata berikutnya, nama aksi dari daftar aksi di bawah.
- `[sfx: nama_sfx]` efek bunyi pada kata berikutnya.
- `[narasi: ...]` catatan untuk pemilik; dibuang dari dialog.

## 4. Uji lucu per beat (jalankan dalam pikiranmu sebelum menulis setiap beat lucu)

1. Apa ekspektasi yang dibalik? Satu kalimat. Tidak bisa dijawab berarti bukan lelucon.
2. Apakah sesuai sifat tokoh?
3. Apakah lebih besar dari beat lucu sebelumnya (eskalasi)?
4. Apakah kata kunci lucunya ada di akhir kalimat?
5. Apakah ada versi yang lebih pendek? Pakai yang lebih pendek.
6. Apakah orang tua penonton merasa dipahami, bukan ditertawakan?
Jangan menjelaskan lelucon, jangan tokoh menertawakan leluconnya sendiri, jangan "bukan X, tapi Y" lebih dari sekali, tidak ada kalimat motivasi umum.
Beat mengena tidak boleh berisi lelucon. Sisakan 0,3 sampai 0,5 detik sesudah punchline untuk reaksi.

## 5. FORMAT KELUARAN: dua lapis per beat

Setiap beat punya LAPIS A (dialog bertag) dan LAPIS B (arahan visual). Tanpa lapis B, animator terpaksa menebak, jadi lapis B wajib lengkap.
Gunakan blok bertanda persis seperti di bawah (bukan JSON, bukan tabel, bukan markdown tebal). Satu label per baris.

```
##EPISODE {episode} | Judul Episode
##JUDUL_BERIKUT Judul teaser episode berikutnya

##BEAT t01 hook
LATAR: <salah satu latar>
MUSIK: <salah satu musik>              (boleh kosong)
KAMERA: <lebar|dekat|sisipan> [arta|ratna|mbis] [diam|dorong|hentak|sapu|getar] [benda=..] [mulai_kata=..]   (boleh berulang)
AKSI: <tokoh> <nama_aksi> | pada_kata: <kata> | pada: <awal|akhir> | benda: <..> | ekspresi: <..>      (boleh berulang)
SFX: <nama_sfx> | pada_kata: <kata>    (boleh berulang)
PROPERTI: benda1, benda2
PUNCHLINE: kalimat atau kata lucunya
DIALOG:
NAMA: [tag] teks yang diucapkan
##BEAT t02 lucu
...
##AKHIR
```

- Id beat berurutan: t01, t02, t03 ... Jenis: hook, lucu, naik, mengena, penutup.
- LATAR dan PUNCHLINE wajib. PUNCHLINE kosong hanya untuk beat naik atau penutup tanpa lelucon.
- Beat tanpa dialog (aksi saja): tulis `DIALOG:` kosong dan tambahkan di header `emosi=<emosi>` dan `durasi=<detik>`, mis. `##BEAT t02 lucu emosi=kaget durasi=1.5`.
- Opsi header lain (opsional): `intensitas=<1-10>`. Tanpa opsi, emosi beat diambil dari baris dialog paling kuat.
- Penutur yang boleh: ARTA, RATNA, MBIS, BIMA.
- `pada_kata` memakai kata persis seperti tertulis di dialog beat itu.

### Daftar yang valid (di luar daftar ditolak)

- LATAR: {", ".join(sorted(aset["latar"]))}
- MUSIK: {", ".join(sorted(aset["musik"]))}
- SFX: {", ".join(sorted(aset["sfx"]))}
- Ekspresi wajah (untuk `ekspresi:` di AKSI): Arta dan Ratna: {", ".join(sorted(rig["orang"]))}; Mbis: {", ".join(sorted(rig["mbis"]))}
- Aksi per tokoh (* = aksi seluruh badan):
{aksi_teks}

### Contoh satu beat lengkap

```
{CONTOH_BEAT.strip()}
```

## 6. Sebelum mengirim, periksa sendiri

Hitung baris Mbis (maksimal 3), pastikan tidak ada tanda pisah panjang, setiap baris dialog bertag, hook pendek, tepat satu mengena,
dan semua nama latar/musik/sfx/aksi/tag persis dari daftar. Kirim hanya blok dari ##EPISODE sampai ##AKHIR.
Bila nanti kuberi daftar galat, perbaiki hanya baris yang disebut dan kirim ulang seluruh naskah.
"""


def main(argv: list[str]) -> int:
    pos = [a for i, a in enumerate(argv) if not a.startswith("--") and (i == 0 or argv[i - 1] != "--topik")]
    if not pos:
        print('pakai: python -m scripts.senggang.prompt <folder> [--topik "teks"]')
        return 2
    folder = Path(pos[0])
    topik = argv[argv.index("--topik") + 1] if "--topik" in argv else ""
    folder.mkdir(parents=True, exist_ok=True)
    p = folder / "prompt-chatgpt.md"
    p.write_text(buat(folder.name, topik), encoding="utf-8")
    print(p)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
