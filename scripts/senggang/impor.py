"""Tempelan ChatGPT (teks) → naskah.json versi 2, MEKANIS: tanpa LLM, galat dikembalikan per baris.

python -m scripts.senggang.impor <folder> [tempelan.txt] [--timpa]
  baca <folder>/tempelan.txt (atau berkas yang disebut), tulis <folder>/naskah.json.
  Kode keluar: 0 jadi, 1 ada galat (daftar per baris + <folder>/koreksi-chatgpt.md untuk ditempel ke ChatGPT),
  7 menolak menimpa naskah.json yang sudah disetujui (pakai --timpa bila memang disengaja).

Format tempelan (lihat scripts/senggang/prompt.py):
  ##EPISODE ep02 | Judul          ##JUDUL_BERIKUT teks
  ##BEAT t01 hook [emosi=..] [intensitas=..] [durasi=..]
  LATAR: / MUSIK: / PROPERTI: a, b / PUNCHLINE: / KAMERA: jenis [tokoh] [gerak] [benda=..] [mulai_kata=..]
  AKSI: tokoh nama [| pada_kata: x] [| pada: awal|akhir] [| benda: x] [| ekspresi: x]   (boleh berulang)
  SFX: nama [| pada_kata: x] [| pada: awal|akhir]                                       (boleh berulang)
  DIALOG:  lalu satu baris per ucapan:  NAMA: [tag, tag] teks   ([aksi: x] [sfx: x] [narasi: x] boleh disisipkan)
  ##AKHIR
"""
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import jsonschema
import yaml

from scripts import naskah as naskah_mod
from scripts.senggang import tag as tag_mod

ROOT = Path(__file__).resolve().parents[2]
PENUTUR = {"arta": "arta", "ratna": "ratna", "bu ratna": "ratna", "mbis": "mbis", "bima": "bima", "kak bima": "bima"}
JENIS = ("hook", "lucu", "naik", "mengena", "penutup")
GERAK = ("diam", "dorong", "hentak", "sapu", "getar")
KAMERA_JENIS = ("lebar", "dekat", "sisipan")
TOKOH_ANIMASI = ("arta", "ratna", "mbis")
LABEL = ("LATAR", "MUSIK", "PROPERTI", "PUNCHLINE", "KAMERA", "AKSI", "SFX", "DIALOG")
# Pesan periksa_beat yang sudah ditangkap per baris oleh parser (hindari galat ganda).
SUDAH_PER_BARIS = ("Mbis maksimal 3", "Mbis tidak boleh", "berisi tanda pisah panjang")


@dataclass
class Galat:
    baris: int | None
    pesan: str
    isi: str = ""

    def __str__(self) -> str:
        return f"baris {self.baris}: {self.pesan}" if self.baris else f"umum: {self.pesan}"


@dataclass
class Hasil:
    naskah: dict | None
    galat: list[Galat] = field(default_factory=list)
    peringatan: list[Galat] = field(default_factory=list)


def _daftar_aset() -> dict[str, set[str]]:
    panggung = yaml.safe_load((ROOT / "config/panggung.yaml").read_text(encoding="utf-8"))
    musik = yaml.safe_load((ROOT / "aset/musik/katalog.yaml").read_text(encoding="utf-8"))
    sfx = yaml.safe_load((ROOT / "aset/sfx/katalog.yaml").read_text(encoding="utf-8"))
    return {"latar": set(panggung["latar"]), "musik": set(musik), "sfx": set(sfx)}


def daftar_aset() -> dict[str, set[str]]:
    return _daftar_aset()


def _bersihkan_baris(mentah: str) -> str:
    s = mentah.strip()
    s = re.sub(r"^(?:[>\-*•]\s+)+", "", s)          # bullet / kutipan markdown
    s = s.replace("**", "").replace("__", "").replace("`", "")
    return s.strip()


def _pisah_kv(bagian: list[str]) -> dict[str, str]:
    kv = {}
    for b in bagian:
        k, _, v = b.partition(":")
        kv[k.strip().lower()] = v.strip()
    return kv


def _kata_pertama(teks: str) -> str:
    return re.sub(r"[.,!?;:]+$", "", teks.split()[0]) if teks.split() else ""


class _Penguraian:
    def __init__(self, teks: str):
        self.galat: list[Galat] = []
        self.peringatan: list[Galat] = []
        self.baris_mentah = teks.splitlines()
        self.aset = daftar_aset()
        self.kamus = tag_mod.muat()
        self.beat: list[dict] = []
        self.baris_beat: dict[str, int] = {}
        self.baris_episode: int | None = None
        self.meta = {"episode": None, "judul": None, "judul_berikut": None}
        self.mbis_ke = 0

    def err(self, no: int | None, pesan: str) -> None:
        isi = self.baris_mentah[no - 1].strip() if no else ""
        self.galat.append(Galat(no, pesan, isi))

    def info(self, no: int | None, pesan: str) -> None:
        self.peringatan.append(Galat(no, pesan))

    # ---- dialog ----
    def dialog(self, no: int, penutur_mentah: str, sisa: str, b: dict) -> None:
        penutur = PENUTUR.get(penutur_mentah.strip().lower())
        if not penutur:
            self.err(no, f"penutur tidak dikenal: {penutur_mentah.strip().upper()}. Penutur: ARTA, RATNA, MBIS, BIMA")
            return
        suara, kata, non_suara = [], [], []
        bersih = []
        pos = 0
        for m in re.finditer(r"\[([^\]]*)\]", sisa):
            bersih.append(sisa[pos:m.start()])
            pos = m.end()
            isi = m.group(1).strip()
            jenis, _, nilai = isi.partition(":")
            if jenis.strip().lower() in tag_mod.AWALAN_NON_SUARA and _:
                non_suara.append((jenis.strip().lower(), nilai.strip(), len(" ".join(bersih).split())))
            else:
                suara.append(isi)
        bersih.append(sisa[pos:])
        teks = re.sub(r"\s+", " ", " ".join(bersih)).strip()
        kata = teks.split()

        if "—" in teks or any("—" in s for s in suara):
            self.err(no, "berisi tanda pisah panjang (—); ganti koma, titik, atau pecah kalimat")
        if not suara:
            self.err(no, "baris dialog tanpa tag ekspresi, contoh: [tense] atau [curious, slowly]")
            return
        if not teks:
            self.err(no, "baris dialog kosong (hanya tag)")
            return
        try:
            u = tag_mod.uraikan(", ".join(suara), self.kamus)
        except tag_mod.TagTidakDikenal as e:
            self.err(no, str(e))
            return
        for nama in re.split(r"\s*[,;]\s*", u["arah"]):
            t = self.kamus["tag"][nama]
            if t["terverifikasi"] == "belum":
                self.info(no, f"tag belum terverifikasi di ElevenLabs: {nama} (cadangan {t.get('cadangan', '-')}); pemilik menguji")
        ekspresi = u["ekspresi"]["mbis" if penutur == "mbis" else "orang"]
        d = {"penutur": penutur, "teks": teks, "arah": u["arah"], "tag": u["tag_audio"], "ekspresi": ekspresi}
        b["dialog"].append(d)
        b["_kekuatan"].append((u["intensitas"], u["emosi"]))

        if penutur == "mbis":
            self.mbis_ke += 1
            if self.mbis_ke > 3:
                self.err(no, f"Mbis maksimal 3 baris per episode (ini baris Mbis ke-{self.mbis_ke}); gabung atau pindahkan ke Arta")
            if naskah_mod.DILARANG_MBIS.search(teks):
                self.err(no, "Mbis tidak boleh menyebut brand (Sobat Ambis), daftar, atau harga (Rp)")

        for jenis, nilai, idx in non_suara:
            if jenis == "narasi":
                self.info(no, f"narasi dibuang dari dialog: {nilai}")
                continue
            kw = {"pada_kata": re.sub(r"[.,!?;:]+$", "", kata[idx])} if idx < len(kata) else {"pada": "akhir"}
            if jenis == "aksi":
                if penutur not in TOKOH_ANIMASI:
                    self.err(no, f"[aksi: {nilai}] tidak bisa dipakai oleh {penutur} (tidak ada di rig)")
                elif nilai not in tag_mod.aksi_tokoh()[penutur]:
                    self.err(no, f"aksi tidak dikenal untuk {penutur}: {nilai}. Aksi {penutur}: {', '.join(sorted(tag_mod.aksi_tokoh()[penutur]))}")
                else:
                    b["aksi"].append({"tokoh": penutur, "aksi": nilai, **kw})
            else:  # sfx
                if nilai not in self.aset["sfx"]:
                    self.err(no, f"sfx tidak dikenal: {nilai}. SFX: {', '.join(sorted(self.aset['sfx']))}")
                else:
                    b["sfx"].append({"nama": nilai, **kw})

    # ---- label ----
    def aksi(self, no: int, isi: str, b: dict) -> None:
        bagian = [x.strip() for x in isi.split("|")]
        kepala = bagian[0].split()
        if len(kepala) != 2:
            self.err(no, "AKSI harus berbentuk: AKSI: <tokoh> <nama_aksi> [| pada_kata: x]")
            return
        tokoh, nama = kepala[0].lower(), kepala[1]
        if tokoh not in TOKOH_ANIMASI:
            self.err(no, f"tokoh aksi tidak dikenal: {tokoh}. Tokoh: arta, ratna, mbis")
            return
        if nama not in tag_mod.aksi_tokoh()[tokoh]:
            self.err(no, f"aksi tidak dikenal untuk {tokoh}: {nama}. Aksi {tokoh}: {', '.join(sorted(tag_mod.aksi_tokoh()[tokoh]))}")
            return
        kv = _pisah_kv(bagian[1:])
        a = {"tokoh": tokoh, "aksi": nama}
        for k in ("pada_kata", "benda"):
            if k in kv:
                a[k] = kv[k]
        if "pada" in kv:
            if kv["pada"] not in ("awal", "akhir"):
                self.err(no, "pada harus awal atau akhir")
                return
            a["pada"] = kv["pada"]
        if "ekspresi" in kv:
            rig = tag_mod.ekspresi_rig()["mbis" if tokoh == "mbis" else "orang"]
            if kv["ekspresi"] not in rig:
                self.err(no, f"ekspresi tidak ada di rig {tokoh}: {kv['ekspresi']}. Ekspresi: {', '.join(sorted(rig))}")
                return
            a["ekspresi"] = kv["ekspresi"]
        sisa = set(kv) - {"pada_kata", "benda", "pada", "ekspresi"}
        if sisa:
            self.err(no, f"kunci AKSI tidak dikenal: {', '.join(sorted(sisa))}")
            return
        b["aksi"].append(a)

    def sfx(self, no: int, isi: str, b: dict) -> None:
        bagian = [x.strip() for x in isi.split("|")]
        nama = bagian[0]
        if nama not in self.aset["sfx"]:
            self.err(no, f"sfx tidak dikenal: {nama}. SFX: {', '.join(sorted(self.aset['sfx']))}")
            return
        kv = _pisah_kv(bagian[1:])
        s = {"nama": nama}
        if "pada_kata" in kv:
            s["pada_kata"] = kv["pada_kata"]
        if kv.get("pada") in ("awal", "akhir"):
            s["pada"] = kv["pada"]
        b["sfx"].append(s)

    def kamera(self, no: int, isi: str, b: dict) -> None:
        kata = isi.replace("|", " ").split()
        if not kata or kata[0].lower() not in KAMERA_JENIS:
            self.err(no, f"KAMERA harus diawali jenis: {', '.join(KAMERA_JENIS)}")
            return
        k = {"jenis": kata[0].lower()}
        for x in kata[1:]:
            xl = x.lower()
            if xl in TOKOH_ANIMASI:
                k["tokoh"] = xl
            elif xl in GERAK:
                k["gerak"] = xl
            elif "=" in x and x.split("=")[0] in ("benda", "mulai_kata"):
                k[x.split("=")[0]] = x.split("=", 1)[1]
            else:
                self.err(no, f"KAMERA: token tidak dikenal '{x}'. Gerak: {', '.join(GERAK)}; tokoh: arta, ratna, mbis; benda=..; mulai_kata=..")
                return
        b["kamera"].append(k)

    # ---- pembacaan utama ----
    def baca(self) -> None:
        b: dict | None = None
        bagian_dialog = False
        selesai = False
        mulai = False
        for no, mentah in enumerate(self.baris_mentah, 1):
            s = _bersihkan_baris(mentah)
            if not s or s.startswith("```") or selesai:
                continue
            if re.match(r"^#{1,3}\s*AKHIR\b", s, re.I):
                selesai = True
                continue
            m = re.match(r"^#{1,3}\s*EPISODE\s+(\S+)\s*[|:]\s*(.+)$", s, re.I)
            if m:
                self.meta["episode"], self.meta["judul"], self.baris_episode, mulai = m.group(1), m.group(2).strip(), no, True
                continue
            m = re.match(r"^#{1,3}\s*JUDUL[_ ]BERIKUT\s*[:|]?\s*(.+)$", s, re.I)
            if m:
                self.meta["judul_berikut"] = m.group(1).strip()
                continue
            m = re.match(r"^#{1,3}\s*BEAT\s+(\S+)\s+(\S+)(.*)$", s, re.I)
            if m:
                mulai, bagian_dialog = True, False
                b = self.beat_baru(no, m)
                continue
            if not mulai or b is None:
                continue  # obrolan ChatGPT sebelum blok pertama
            m = re.match(r"^([A-Za-z_ ]+?)\s*:\s*(.*)$", s)
            nama_label = m.group(1).strip().upper() if m else ""
            if nama_label in LABEL:
                isi = m.group(2).strip()
                bagian_dialog = nama_label == "DIALOG"
                if nama_label == "LATAR":
                    if isi not in self.aset["latar"]:
                        self.err(no, f"latar tidak dikenal: {isi}. Latar: {', '.join(sorted(self.aset['latar']))}")
                    b["latar"] = isi
                elif nama_label == "MUSIK":
                    if isi and isi not in self.aset["musik"]:
                        self.err(no, f"musik tidak dikenal: {isi}. Musik: {', '.join(sorted(self.aset['musik']))}")
                    elif isi:
                        b["musik"] = isi
                elif nama_label == "PROPERTI":
                    b["properti"] = [x.strip() for x in isi.split(",") if x.strip()]
                elif nama_label == "PUNCHLINE":
                    if "—" in isi:
                        self.err(no, "berisi tanda pisah panjang (—); ganti koma, titik, atau pecah kalimat")
                    b["punchline"] = isi
                elif nama_label == "KAMERA":
                    self.kamera(no, isi, b)
                elif nama_label == "AKSI":
                    self.aksi(no, isi, b)
                elif nama_label == "SFX":
                    self.sfx(no, isi, b)
                continue
            if bagian_dialog:
                if m and m.group(1).strip().lower() in PENUTUR or (m and m.group(1).strip().isupper()):
                    sebelum = len(self.galat)
                    self.dialog(no, m.group(1), m.group(2), b)
                    b["_ditolak"] += len(self.galat) > sebelum
                elif re.fullmatch(r"(\[\s*narasi\s*:[^\]]*\]\s*)+", s, re.I):
                    self.info(no, f"narasi dibuang dari dialog: {s}")
                else:
                    self.err(no, "baris di bagian DIALOG harus berbentuk NAMA: [tag] teks")
                continue
            self.err(no, f"baris tidak dikenal di luar DIALOG: '{s[:60]}'. Label: {', '.join(LABEL)}")
        if not self.meta["episode"]:
            self.err(None, "tidak ada baris ##EPISODE <id> | <judul>")
        if not self.beat:
            self.err(None, "tidak ada blok ##BEAT")

    def beat_baru(self, no: int, m: re.Match) -> dict:
        bid, jenis = m.group(1).lower(), m.group(2).lower()
        b = {"id": bid, "jenis": jenis, "latar": "", "dialog": [], "aksi": [], "kamera": [], "properti": [], "sfx": [],
             "punchline": "", "_kekuatan": [], "_baris": no, "_kv": {}, "_ditolak": 0}
        if not re.fullmatch(r"t\d{2}", bid):
            self.err(no, f"id beat harus t01, t02, dst, bukan '{bid}'")
        if bid in self.baris_beat:
            self.err(no, f"id beat ganda: {bid}")
        if jenis not in JENIS:
            self.err(no, f"jenis beat tidak dikenal: {jenis}. Jenis: {', '.join(JENIS)}")
        self.baris_beat.setdefault(bid, no)
        for kv in m.group(3).split():
            k, _, v = kv.partition("=")
            if k.lower() not in ("emosi", "intensitas", "durasi") or not v:
                self.err(no, f"opsi header beat tidak dikenal: '{kv}'. Opsi: emosi=, intensitas=, durasi=")
            else:
                b["_kv"][k.lower()] = v
        self.beat.append(b)
        return b

    def rakit(self) -> dict:
        beat = []
        for b in self.beat:
            kv = b.pop("_kv")
            kekuatan = b.pop("_kekuatan")
            no = b.pop("_baris")
            ditolak = b.pop("_ditolak")
            if kekuatan:
                inten, emosi = max(kekuatan, key=lambda x: x[0])  # seri: yang pertama
            else:
                inten, emosi = 3, "datar"
                if "emosi" not in kv and not ditolak:
                    self.err(no, f"{b['id']}: beat tanpa dialog wajib punya emosi=, contoh: ##BEAT {b['id']} {b['jenis']} emosi=kaget")
            if "emosi" in kv:
                emosi = kv["emosi"]
            try:
                if "intensitas" in kv:
                    inten = int(kv["intensitas"])
                if "durasi" in kv:
                    b["durasi"] = float(kv["durasi"])
            except ValueError:
                self.err(no, f"{b['id']}: intensitas harus bilangan bulat dan durasi angka")
            if not b["latar"]:
                self.err(no, f"{b['id']}: LATAR wajib diisi")
            if not b["punchline"] and b["jenis"] in ("hook", "lucu", "mengena"):
                self.err(no, f"{b['id']}: PUNCHLINE wajib untuk beat {b['jenis']}")
            b.update(emosi=emosi, intensitas=inten)
            for k in ("kamera", "properti", "sfx"):
                if not b[k]:
                    del b[k]
            beat.append(b)
        return {"episode": self.meta["episode"] or "", "judul": self.meta["judul"] or "", "disetujui": False,
                "sumber_suara": "manual", "jalur": "senggang", "judul_berikut": self.meta["judul_berikut"] or "", "beat": beat}


def impor_teks(teks: str) -> Hasil:
    p = _Penguraian(teks)
    p.baca()
    n = p.rakit()
    if p.meta["episode"] and not n["judul_berikut"]:
        p.err(p.baris_episode, "##JUDUL_BERIKUT wajib diisi (judul teaser episode berikutnya)")
    # skema (kunci yang belum tertangkap parser)
    for e in jsonschema.Draft202012Validator(naskah_mod.SKEMA2).iter_errors(n):
        jalur = list(e.absolute_path)
        if jalur[:1] == ["beat"] and len(jalur) > 1:
            bid = n["beat"][jalur[1]]["id"]
            if not any(g.baris == p.baris_beat.get(bid) or f"{bid}:" in g.pesan for g in p.galat):
                p.err(p.baris_beat.get(bid), f"{bid}: {e.message}")
        elif e.validator == "minItems" and not any("##BEAT" in g.pesan for g in p.galat):
            p.err(None, "minimal 3 beat")
        elif e.validator not in ("required", "minItems"):
            p.err(None, e.message)
    if not p.galat:
        for m in naskah_mod.periksa_beat(n):
            if any(m.startswith(x) or x in m for x in SUDAH_PER_BARIS):
                continue
            bid = m.split(":", 1)[0] if re.match(r"^t\d{2}:", m) else None
            p.galat.append(Galat(p.baris_beat.get(bid), m))
    p.galat.sort(key=lambda g: (g.baris is None, g.baris or 0))
    return Hasil(None if p.galat else n, p.galat, p.peringatan)


def pesan_koreksi(galat: list[Galat]) -> str:
    baris = ["Tempelan naskahmu belum lulus pemeriksaan otomatis. Perbaiki HANYA baris di bawah, jangan ubah bagian lain,",
             "pertahankan format blok (##EPISODE, ##BEAT, LATAR:, DIALOG: dst), lalu kirim ulang SELURUH naskah.", ""]
    for g in galat:
        baris.append(f"- {g}" + (f"  → isi baris: `{g.isi[:140]}`" if g.isi else ""))
    return "\n".join(baris) + "\n"


def main(argv: list[str]) -> int:
    pos = [a for a in argv if not a.startswith("--")]
    timpa = "--timpa" in argv
    if not pos:
        print("pakai: python -m scripts.senggang.impor <folder> [tempelan.txt] [--timpa]")
        return 2
    folder = Path(pos[0])
    sumber = Path(pos[1]) if len(pos) > 1 else folder / "tempelan.txt"
    try:
        teks = sumber.read_text(encoding="utf-8")
    except OSError as e:
        print(f"tempelan tidak terbaca: {e}")
        return 1
    tujuan = folder / "naskah.json"
    if tujuan.exists() and not timpa:
        try:
            if json.loads(tujuan.read_text(encoding="utf-8")).get("disetujui"):
                print("naskah.json sudah disetujui pemilik; tidak ditimpa (pakai --timpa bila disengaja)")
                return 7
        except json.JSONDecodeError:
            pass
    h = impor_teks(teks)
    for p in h.peringatan:
        print(f"catatan {p}")
    koreksi = folder / "koreksi-chatgpt.md"
    if h.galat:
        for g in h.galat:
            print(g)
        koreksi.write_text(pesan_koreksi(h.galat), encoding="utf-8")
        print(f"{len(h.galat)} galat. Tempel isi {koreksi} ke ChatGPT, lalu simpan jawabannya sebagai tempelan.txt dan jalankan lagi.")
        return 1
    koreksi.unlink(missing_ok=True)
    tujuan.write_text(json.dumps(h.naskah, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"naskah.json dibuat ({len(h.naskah['beat'])} beat). Menunggu Approval 1 pemilik (disetujui: true).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
