"""Muat naskah.json, validasi skema, dan periksa aturan cerita/emosi."""
import json
import re
import sys
from pathlib import Path

import jsonschema

ROOT = Path(__file__).resolve().parents[1]
SKEMA = json.loads((ROOT / "schemas/naskah.schema.json").read_text(encoding="utf-8"))
SKEMA2 = json.loads((ROOT / "schemas/naskah2.schema.json").read_text(encoding="utf-8"))
JEDA_DIALOG = 0.3
DURASI_VISUAL = 1.5
KATA_PER_DETIK = 2.6
JEDA_BAWAAN = 0.25
DILARANG_MBIS = re.compile(r"sobat\s*ambis|daftar|\brp\b", re.IGNORECASE)


class NaskahTidakValid(Exception):
    pass


def muat(path: Path) -> dict:
    try:
        n = json.loads(Path(path).read_text(encoding="utf-8"))
        jsonschema.validate(n, SKEMA2 if "beat" in n else SKEMA)
    except (json.JSONDecodeError, jsonschema.ValidationError) as e:
        raise NaskahTidakValid(str(e).splitlines()[0]) from e
    return n


def perkiraan_durasi(baris: dict) -> float:
    return len(baris["teks"].split()) / KATA_PER_DETIK


def periksa_aturan(n: dict, durasi_per_baris: dict[str, float] | None = None) -> list[str]:
    baris = n["baris"]
    masalah: list[str] = []

    emosi = {b["emosi"] for b in baris}
    if len(emosi) < 4:
        masalah.append(f"minimal 4 emosi berbeda, baru {len(emosi)}")
    if not any(b["intensitas"] >= 8 for b in baris):
        masalah.append("butuh minimal satu puncak intensitas 8 ke atas")

    # Datar = emosi DAN intensitas sama berturut-turut lebih dari 10 detik.
    run, kunci_lalu, awal = 0.0, None, None
    for b in baris:
        dur = (durasi_per_baris or {}).get(b["id"], perkiraan_durasi(b)) + b.get("jeda_sesudah", JEDA_BAWAAN)
        kunci = (b["emosi"], b["intensitas"])
        if kunci == kunci_lalu:
            run += dur
        else:
            run, kunci_lalu, awal = dur, kunci, b["id"]
        if run > 10 and not any(m.startswith(f"datar lebih dari 10 detik mulai {awal}") for m in masalah):
            masalah.append(f"datar lebih dari 10 detik mulai {awal} ({kunci[0]} {kunci[1]})")

    mbis = [b for b in baris if b["penutur"] == "mbis"]
    if len(mbis) > 3:
        masalah.append(f"Mbis maksimal 3 baris, ada {len(mbis)}")
    for b in mbis:
        if DILARANG_MBIS.search(b["teks"]):
            masalah.append(f"{b['id']}: Mbis tidak boleh menyebut brand, daftar, atau harga")

    for b in baris:
        for medan in ("teks", "caption"):
            if "—" in b.get(medan, ""):
                masalah.append(f"{b['id']}: {medan} berisi tanda pisah panjang")
    return masalah


def aksi_penuh() -> set[str]:
    """Nama aksi seluruh badan, dibaca dari pustaka aksi di template."""
    nama = set()
    for f in (ROOT / "template/src/aksi").glob("*.ts"):
        nama |= set(re.findall(r'nama:\s*"(\w+)"[^}\n]*?penuh:\s*true', f.read_text(encoding="utf-8")))
    return nama


def perkiraan_durasi_beat(beat: dict) -> float:
    if not beat.get("dialog"):
        return float(beat.get("durasi", DURASI_VISUAL))
    bicara = sum(len(d["teks"].split()) / KATA_PER_DETIK + JEDA_DIALOG for d in beat["dialog"])
    return max(bicara, float(beat.get("durasi", 0)))


def periksa_beat(n: dict, durasi_beat: dict[str, float] | None = None) -> list[str]:
    beat = n["beat"]
    dur = [(durasi_beat or {}).get(b["id"], perkiraan_durasi_beat(b)) for b in beat]
    total = sum(dur)
    masalah: list[str] = []

    if beat[0]["jenis"] != "hook":
        masalah.append(f"{beat[0]['id']}: beat pertama harus hook")
    elif dur[0] > 2.0:
        masalah.append(f"{beat[0]['id']}: hook {dur[0]:.1f} dtk, maksimal 2 dtk")
    if beat[-1]["jenis"] != "penutup":
        masalah.append(f"{beat[-1]['id']}: beat terakhir harus penutup")

    mengena = [i for i, b in enumerate(beat) if b["jenis"] == "mengena"]
    if len(mengena) != 1:
        masalah.append(f"harus tepat satu beat mengena, ada {len(mengena)}")
    else:
        i = mengena[0]
        posisi = sum(dur[:i]) / total * 100
        if not 55 <= posisi <= 85:
            masalah.append(f"{beat[i]['id']}: mengena mulai di {posisi:.0f}% durasi, harus 55% sampai 85%")
        t, terakhir_lucu = 0.0, 0.0
        for b, d in zip(beat[:i], dur[:i]):
            if b["jenis"] in ("hook", "lucu"):
                terakhir_lucu = t
            t += d
            if t - terakhir_lucu > 8 and b["jenis"] not in ("hook", "lucu"):
                masalah.append(f"{b['id']}: lebih dari 8 detik tanpa beat lucu")
                break

    emosi = {b["emosi"] for b in beat}
    if len(emosi) < 4:
        masalah.append(f"minimal 4 emosi berbeda, baru {len(emosi)}")
    if not any(b["intensitas"] >= 8 for b in beat):
        masalah.append("butuh minimal satu puncak intensitas 8 ke atas")

    mbis = [(b["id"], d) for b in beat for d in b["dialog"] if d["penutur"] == "mbis"]
    if len(mbis) > 3:
        masalah.append(f"Mbis maksimal 3 baris, ada {len(mbis)}")
    for bid, d in mbis:
        if DILARANG_MBIS.search(d["teks"]):
            masalah.append(f"{bid}: Mbis tidak boleh menyebut brand, daftar, atau harga")

    penuh = aksi_penuh()
    jumlah_penuh = sum(1 for b in beat for a in b["aksi"] if a["aksi"] in penuh)
    if jumlah_penuh < 2:
        masalah.append(f"minimal 2 aksi seluruh badan per episode, ada {jumlah_penuh}")

    for b in beat:
        teks = [d["teks"] for d in b["dialog"]] + [b.get("punchline", "")]
        if any("—" in x for x in teks):
            masalah.append(f"{b['id']}: berisi tanda pisah panjang")
    return masalah


def main(argv: list[str]) -> int:
    return _cli(argv)


def _cli(argv: list[str]) -> int:
    if len(argv) != 2 or argv[0] != "periksa":
        print("pakai: python -m scripts.naskah periksa <folder-video>")
        return 2
    try:
        n = muat(Path(argv[1]) / "naskah.json")
    except (NaskahTidakValid, OSError) as e:
        print(f"naskah tidak valid: {e}")
        return 1
    masalah = periksa_beat(n) if "beat" in n else periksa_aturan(n)
    for m in masalah:
        print(m)
    if masalah:
        return 1
    if not n.get("disetujui", False):
        print("naskah valid, menunggu persetujuan pemilik")
        return 4
    print("lulus")
    return 0


if __name__ == "__main__":
    sys.exit(_cli(sys.argv[1:]))
