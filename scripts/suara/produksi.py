"""Tahap suara: sintesis per baris, dengar ulang, ukur emosi, rekam ulang, rakit."""
import argparse
import json
import os
import sys
from pathlib import Path

import yaml

from scripts import naskah as naskah_mod
from scripts import status
from scripts.suara import dengar, rakit
from scripts.suara.penyedia import SUARA_EDGE_BAWAAN, EdgeTTS, ElevenLabs, KreditKurang, perlu_karakter

AMBANG = 0.95  # 0.97 terlalu ketat untuk sapaan pendek di audio nyata (lihat ledger Task 6)
TAG_KUAT = {"marah": "[shouting]", "hancur": "[quietly]", "misterius": "[whispers]", "semangat": "[excited]", "lelah": "[tired]", "kaget": "[gasps]"}


def kode_keluar(keadaan: str) -> int:
    return {"lulus": 0, "butuh_persetujuan": 3}.get(keadaan, 1)


def _kuatkan(b: dict, level: int) -> dict:
    b = dict(b, _kuat=level)
    tag = TAG_KUAT.get(b["emosi"])
    if tag and tag not in b.get("tag", ""):
        b["tag"] = (b.get("tag", "") + " " + tag).strip()
    return b


def _sintesis_cocok(penyedia, b: dict, dir_: Path, maks_ulang: int, level_awal: int = 0) -> tuple[Path | None, list, int]:
    for percobaan in range(maks_ulang + 1):
        bb = _kuatkan(b, level_awal + percobaan) if (percobaan or level_awal) else b
        wav = penyedia.sintesis(bb, dir_ / f"{b['id']}_{level_awal + percobaan}.wav")
        kata = dengar.transkrip(wav)
        if dengar.kecocokan(b["teks"], " ".join(k["kata"] for k in kata)) >= AMBANG:
            return wav, kata, percobaan
    return None, [], maks_ulang


def jalankan(folder: Path, penyedia, setuju_edge_tts: bool = False, maks_ulang: int = 2) -> str:
    folder = Path(folder)
    n = naskah_mod.muat(folder / "naskah.json")
    lama = status.baca(folder)["tahap"].get("suara", {})
    lulus: dict = lama.get("detail", {})
    sisa = [b for b in n["baris"] if b["id"] not in lulus]

    if penyedia.nama == "edge" and not setuju_edge_tts:
        status.tandai(folder, "suara", "butuh_persetujuan", alasan="edge-tts butuh persetujuan pemilik",
                      baris_tersisa=[b["id"] for b in sisa], detail=lulus)
        return "butuh_persetujuan"
    kredit = penyedia.sisa_kredit()
    if kredit is not None and kredit < perlu_karakter(sisa):
        status.tandai(folder, "suara", "butuh_persetujuan", alasan=f"kredit {penyedia.nama} kurang",
                      sisa_kredit=kredit, dibutuhkan=perlu_karakter(sisa), baris_tersisa=[b["id"] for b in sisa], detail=lulus)
        return "butuh_persetujuan"

    dir_ = folder / "suara_baris"
    dir_.mkdir(exist_ok=True)
    status.tandai(folder, "suara", "berjalan", penyedia=penyedia.nama, detail=lulus)
    for b in sisa:
        try:
            wav, kata, ulang = _sintesis_cocok(penyedia, b, dir_, maks_ulang)
        except KreditKurang as e:
            status.tandai(folder, "suara", "butuh_persetujuan", alasan=str(e), detail=lulus,
                          baris_tersisa=[x["id"] for x in n["baris"] if x["id"] not in lulus])
            return "butuh_persetujuan"
        if wav is None:
            status.tandai(folder, "suara", "gagal", alasan=f"{b['id']}: kata tidak cocok setelah {maks_ulang} rekam ulang", detail=lulus)
            return "gagal"
        lulus[b["id"]] = {"wav": wav.relative_to(folder).as_posix(), "kata": kata, "rekam_ulang": ulang, "level": ulang}
        status.tandai(folder, "suara", "berjalan", penyedia=penyedia.nama, detail=lulus)

    for _ in range(maks_ulang + 1):
        ukuran = {b["id"]: dengar.ukur(folder / lulus[b["id"]]["wav"], len(b["teks"].split())) for b in n["baris"]}
        masalah = dengar.cek_emosi(ukuran, n)
        ids = {m.split(":")[0] for m in masalah}
        if not ids or _ == maks_ulang:
            break
        for b in n["baris"]:
            if b["id"] in ids:
                wav, kata, ulang = _sintesis_cocok(penyedia, b, dir_, 0, lulus[b["id"]]["level"] + 1)
                if wav:
                    lulus[b["id"]].update(wav=wav.relative_to(folder).as_posix(), kata=kata, level=lulus[b["id"]]["level"] + 1,
                                          rekam_ulang=lulus[b["id"]]["rekam_ulang"] + 1)
    peringatan = []
    if masalah and penyedia.nama == "edge":
        peringatan = masalah  # pemilik sudah menyetujui suara cadangan yang lebih datar
    elif masalah:
        status.tandai(folder, "suara", "gagal", alasan="emosi belum terdengar", masalah=masalah, detail=lulus, ukuran=ukuran)
        return "gagal"

    timing = rakit.gabung([(b["id"], folder / lulus[b["id"]]["wav"], b.get("jeda_sesudah", 0.25)) for b in n["baris"]], folder / "suara.wav")
    awal = {t["id"]: t["mulai"] for t in timing}
    transkrip = {i: [dict(k, mulai=round(k["mulai"] + awal[i], 3), selesai=round(k["selesai"] + awal[i], 3)) for k in d["kata"]] for i, d in lulus.items()}
    (folder / "transkrip.json").write_text(json.dumps(transkrip, ensure_ascii=False, indent=2), encoding="utf-8")
    status.tandai(folder, "suara", "lulus", penyedia=penyedia.nama, detail=lulus, ukuran=ukuran,
                  baris_lulus=list(lulus), rekam_ulang=sum(d["rekam_ulang"] for d in lulus.values()), peringatan=peringatan)
    return "lulus"


def _penyedia(nama: str):
    if nama == "edge":
        return EdgeTTS(SUARA_EDGE_BAWAAN)
    kunci = os.environ.get("ELEVENLABS_API_KEY")
    if not kunci:
        raise SystemExit("ELEVENLABS_API_KEY belum ada di environment")
    suara = yaml.safe_load((Path(__file__).resolve().parents[2] / "config/suara.yaml").read_text(encoding="utf-8"))["elevenlabs"]
    if any(not v or v.startswith("ISI_") for v in suara.values()):
        raise SystemExit("isi voice_id ElevenLabs di config/suara.yaml")
    return ElevenLabs(kunci, suara)


def main(argv: list[str]) -> int:
    """Naskah v2 (beat): pilih jalur dari naskah.sumber_suara. Naskah v1: jalur lama."""
    folder = Path(argv[0])
    n = naskah_mod.muat(folder / "naskah.json")
    if "beat" not in n:
        return -1
    pilihan = n.get("sumber_suara")
    if pilihan == "manusia":
        from scripts.suara import lembar, manusia
        lembar.tulis(folder)
        k = manusia.jalankan(folder)
    elif pilihan == "elevenlabs":
        from scripts.suara import v2
        kunci = os.environ.get("ELEVENLABS_API_KEY")
        if not kunci:
            print("ELEVENLABS_API_KEY belum ada di environment")
            return 3
        suara = yaml.safe_load((Path(__file__).resolve().parents[2] / "config/suara.yaml").read_text(encoding="utf-8"))["elevenlabs"]
        k = v2.jalankan(folder, v2.KlienElevenLabsV2(kunci), suara)
    else:
        print("Pilih sumber suara di naskah.json: \"sumber_suara\": \"manusia\" atau \"elevenlabs\" (Approval 1)")
        return 4
    from scripts.suara.v2 import kode_keluar as kk
    st = status.baca(folder)["tahap"]["suara"]
    print(k, st.get("alasan", ""), ", ".join(st.get("baris_tersisa", [])))
    return kk(k)


if __name__ == "__main__":
    kode = main(sys.argv[1:2])
    if kode >= 0:
        sys.exit(kode)
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--penyedia", choices=["elevenlabs", "edge"], default="elevenlabs")
    ap.add_argument("--setuju-edge-tts", action="store_true")
    a = ap.parse_args()
    keadaan = jalankan(Path(a.folder), _penyedia(a.penyedia), setuju_edge_tts=a.setuju_edge_tts)
    print(keadaan, json.dumps(status.baca(Path(a.folder))["tahap"]["suara"].get("alasan", ""), ensure_ascii=False))
    sys.exit(kode_keluar(keadaan))
