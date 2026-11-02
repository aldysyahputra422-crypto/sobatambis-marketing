"""Pengatur tahap produksi per folder video.

python -m scripts.tahap mulai|berikutnya <folder>
python -m scripts.tahap ulang <folder> <tahap>
python -m scripts.tahap jalan <folder>   → jalankan SEMUA tahap mekanis berurutan dalam satu panggilan (hemat token),
    berhenti di tahap kreatif/persetujuan, saat gagal, atau saat butuh izin. Keluaran satu baris JSON.
    Kode: 0 berhenti normal, 1 gagal (lihat "perbaiki"), 3 butuh izin/kredit, 4 butuh Approval 1, 5 rekam ulang.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from scripts import status

ROOT = Path(__file__).resolve().parents[1]
IZIN_ELEVENLABS = ROOT / ".sa/izin-elevenlabs"
MEKANIS = ("suara", "adegan", "mix", "render_draf", "qa_gerak", "render", "qa_final")
MAKS_GAGAL = 2
# Tahap cek yang diulang sesudah perbaikan: render ulang dulu supaya yang dicek hasil perbaikan.
GANTUNG = {"qa_gerak": "render_draf", "qa_final": "render"}
PEGANG = {
    "naskah": "penulis-naskah → pembasmi-slop → pemeriksa-fakta, lalu Approval 1 pemilik",
    "dialog_ok": "pemilik (Approval 2: dengarkan dialog.wav)",
    "kemasan": "desainer-cover + penulis-caption → pembasmi-slop",
    "video_ok": "pemilik (Approval 3: video.mp4, cover.png, caption.txt)",
    "gerbang": "akuntan-token + penjaga-gerbang-qa",
}
PERBAIKI = {
    "suara": "sutradara-suara",
    "adegan": "animator (aset belum ada) atau storyboarder",
    "mix": "sutradara-suara (aset/lisensi SFX, musik)",
    "render_draf": "animator",
    "qa_gerak": "animator: tambah gerak di rentang yang disebut, lalu jalankan ulang (render draf diulang otomatis)",
    "render": "animator",
    "qa_final": "inspektur-frame lalu animator",
}


class Gagal(Exception):
    def __init__(self, alasan: str, **info):
        super().__init__(alasan)
        self.info = info


class Berhenti(Exception):
    def __init__(self, kode: int, alasan: str):
        super().__init__(alasan)
        self.kode = kode


def _json(p: Path) -> dict:
    return json.loads(Path(p).read_text(encoding="utf-8"))


def _suara(folder: Path):
    if _json(folder / "naskah.json").get("sumber_suara") == "elevenlabs" and not IZIN_ELEVENLABS.exists():
        raise Berhenti(3, "ElevenLabs butuh izin pemilik di sesi ini: tanya dulu, lalu buat .sa/izin-elevenlabs")
    from scripts.suara import produksi
    k = produksi.main([str(folder)])
    info = status.baca(folder)["tahap"].get("suara", {})
    if k == 0:
        return None  # script sudah menandai lulus beserta detailnya
    if k in (3, 4, 5):
        raise Berhenti(k, info.get("alasan") or ", ".join(info.get("baris_tersisa", [])) or f"kode {k}")
    raise Gagal(info.get("alasan") or f"kode {k}")


def _adegan(folder: Path):
    from scripts import adegan2
    adegan2.jalankan(folder)
    return {}


def _mix(folder: Path):
    from scripts import mix
    r = mix.jalankan(folder)
    info = {"lufs": round(float(r["lufs"]), 2), "puncak_dbtp": round(float(r["puncak_dbtp"]), 2)}
    if abs(info["lufs"] + 14) > 1 or info["puncak_dbtp"] > -1:
        raise Gagal(f"mix di luar spec: {info['lufs']} LUFS, {info['puncak_dbtp']} dBTP (harus -14 ±1, ≤ -1)", **info)
    return info


def _render(draf: bool):
    def f(folder: Path):
        from scripts import render
        keluar = render.jalankan(folder, draf)
        if not Path(keluar).exists():
            raise Gagal(f"{Path(keluar).name} tidak terbentuk")
        return {}
    return f


def _qa_gerak(folder: Path):
    import numpy as np

    from scripts import qa_gerak as q
    video = folder / "draf.mp4"
    kecuali = [(x["mulai"], x["selesai"]) for x in _json(folder / "adegan.json")["jalur"].get("sunyi", [])]
    ambang = q.ambang_bawaan()
    skor = q.skor_gerak(video)
    q.gambar_grafik(skor, ambang, folder / "cek-gerak.png")
    info = {"skor_median": round(float(np.median(skor)), 2), "skor_min": round(float(min(skor)), 2)}
    masalah = q.periksa(video, kecuali, ambang, skor)
    if masalah:
        raise Gagal("; ".join(masalah[:3]), **info)
    return info


def _qa_final(folder: Path):
    from scripts import qa_final
    masalah = qa_final.periksa(folder / "video.mp4", _json(folder / "adegan.json")["durasi"] + 3)
    if masalah:
        raise Gagal("; ".join(masalah[:3]))
    return {}


LANGKAH = {"suara": _suara, "adegan": _adegan, "mix": _mix, "render_draf": _render(True),
           "qa_gerak": _qa_gerak, "render": _render(False), "qa_final": _qa_final}


def berikutnya(folder: Path) -> str | None:
    data = status.baca(folder)
    if "mulai" not in data:
        data["mulai"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        status.tulis(folder, data)
    for t in status.TAHAP:
        if data["tahap"].get(t, {}).get("keadaan") != "lulus":
            return t
    if "selesai" not in data:
        data["selesai"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        status.tulis(folder, data)
    return None


def ulang(folder: Path, nama: str) -> None:
    if nama not in status.TAHAP:
        raise ValueError(f"tahap tidak dikenal: {nama}")
    data = status.baca(folder)
    for t in status.TAHAP[status.TAHAP.index(nama):]:
        data["tahap"].pop(t, None)
    data.pop("selesai", None)
    status.tulis(folder, data)


def jalan(folder: Path, langkah: dict | None = None) -> dict:
    folder, langkah = Path(folder), langkah or LANGKAH
    lulus: list[str] = []
    while True:
        t = berikutnya(folder)
        if t is None:
            return {"kode": 0, "lulus": lulus, "berhenti_di": "selesai"}
        if t not in langkah:
            return {"kode": 0, "lulus": lulus, "berhenti_di": t, "pegang": PEGANG.get(t, "")}
        lama = status.baca(folder)["tahap"].get(t, {})
        gagal_lalu = lama.get("percobaan", 0) if lama.get("keadaan") == "gagal" else 0
        if gagal_lalu >= MAKS_GAGAL:
            return {"kode": 1, "lulus": lulus, "berhenti_di": t,
                    "alasan": f"gagal {gagal_lalu} kali, lapor ke pemilik: {lama.get('alasan', '')}"}
        try:
            if gagal_lalu and t in GANTUNG:
                langkah[GANTUNG[t]](folder)
            info = langkah[t](folder)
        except Berhenti as b:
            if status.baca(folder)["tahap"].get(t, {}).get("keadaan") in (None, "berjalan", "lulus"):
                status.tandai(folder, t, "butuh_persetujuan", alasan=str(b))
            return {"kode": b.kode, "lulus": lulus, "berhenti_di": t, "alasan": str(b)}
        except Exception as x:  # noqa: BLE001 - semua kegagalan tahap dicatat, bukan dilempar
            alasan = (str(x) or x.__class__.__name__)[:300]
            n = gagal_lalu + 1
            status.tandai(folder, t, "gagal", alasan=alasan, percobaan=n, **getattr(x, "info", {}))
            return {"kode": 1, "lulus": lulus, "berhenti_di": t, "alasan": alasan, "percobaan": n,
                    "perbaiki": PERBAIKI.get(t, "")}
        if info is not None:
            status.tandai(folder, t, "lulus", **info)
        elif not status.sudah_lulus(folder, t):
            status.tandai(folder, t, "lulus")
        lulus.append(t)


if __name__ == "__main__":
    perintah, folder = sys.argv[1], Path(sys.argv[2])
    if perintah == "berikutnya":
        print(berikutnya(folder) or "selesai")
    elif perintah == "mulai":
        # tandai produksi aktif agar hook Stop melanjutkan otomatis sampai titik persetujuan
        penanda = Path(".sa/aktif.json")
        penanda.parent.mkdir(exist_ok=True)
        penanda.write_text(json.dumps({"folder": folder.as_posix()}))
        print(berikutnya(folder) or "selesai")
    elif perintah == "jalan":
        h = jalan(folder)
        print(json.dumps(h, ensure_ascii=False))
        sys.exit(h["kode"])
    elif perintah == "ulang":
        ulang(folder, sys.argv[3])
        print(f"tahap {sys.argv[3]} dan sesudahnya direset")
    else:
        sys.exit("pakai: python -m scripts.tahap mulai|berikutnya|jalan|ulang <folder> [tahap]")
