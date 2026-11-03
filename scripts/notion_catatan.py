"""Ringkasan satu episode untuk dicatat ke Notion (database "Produksi Sobat Ambis").

python -m scripts.notion_catatan <folder>  → JSON {"properti": {...}, "log": "..."}
Agent penjadwal-notion meneruskan JSON ini ke Notion; angka dihitung di sini supaya selalu sesuai file.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from scripts import status

PERSETUJUAN = {
    "naskah": "Setujui naskah.json (Approval 1).",
    "dialog_ok": "Dengarkan dialog.wav lalu setujui trek dialog (Approval 2).",
    "video_ok": "Tonton video.mp4, cover.png, caption.txt lalu setujui (Approval 3).",
}


def _naskah(folder: Path) -> dict:
    try:
        return json.loads((folder / "naskah.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def ringkas(folder: Path) -> dict:
    folder = Path(folder)
    n = _naskah(folder)
    st = status.baca(folder)
    tahap = st.get("tahap", {})
    berikut = next((t for t in status.TAHAP if tahap.get(t, {}).get("keadaan") != "lulus"), None)
    info = tahap.get(berikut, {}) if berikut else {}
    keadaan = info.get("keadaan")
    butuh = ""
    if berikut is None:
        status_teks = "siap posting"
    elif keadaan == "butuh_rekam_ulang":
        status_teks = "butuh rekam ulang"
        butuh = f"Rekam ulang baris: {', '.join(info.get('baris_tersisa', []))} (lihat lembar-rekaman.md)."
    elif keadaan == "butuh_persetujuan":
        status_teks = "butuh persetujuan"
        butuh = info.get("alasan", "Butuh persetujuan pemilik.")
    elif keadaan == "gagal":
        status_teks = "gagal"
        butuh = f"Tahap {berikut} gagal: {info.get('alasan', 'lihat status.json')}"
    elif berikut == "naskah" and not n.get("disetujui"):
        status_teks, butuh = "butuh persetujuan", PERSETUJUAN["naskah"]
    elif berikut == "suara" and not n.get("sumber_suara"):
        status_teks, butuh = "butuh persetujuan", "Pilih sumber suara: rekaman sendiri (manusia) atau ElevenLabs."
    elif berikut in ("dialog_ok", "video_ok"):
        status_teks, butuh = "butuh persetujuan", PERSETUJUAN[berikut]
    else:
        status_teks = "berjalan"

    token = None
    try:
        token = json.loads((folder / "token.json").read_text(encoding="utf-8"))["per_model"]["total"]["output_tokens"]
    except (OSError, ValueError, KeyError):
        pass
    sekarang = datetime.now(timezone.utc).isoformat(timespec="minutes")
    properti = {
        "Episode": f"{n.get('episode', folder.name)} · {n.get('judul', '')}".strip(" ·"),
        "Folder": folder.as_posix(),
        "Tahap": berikut or "selesai",
        "Status": status_teks,
        "Butuh dari pemilik": butuh,
        "Sumber suara": n.get("sumber_suara") or "",
        "Skor gerak (median)": tahap.get("qa_gerak", {}).get("skor_median"),
        "LUFS": tahap.get("mix", {}).get("lufs"),
        "Token output": token,
        "Diperbarui": sekarang,
    }
    lulus = [t for t in status.TAHAP if tahap.get(t, {}).get("keadaan") == "lulus"]
    log = f"{sekarang} · lulus sampai: {lulus[-1] if lulus else '-'} · sekarang: {berikut or 'selesai'} ({status_teks})"
    if butuh:
        log += f" · {butuh}"
    return {"properti": properti, "log": log}


if __name__ == "__main__":
    print(json.dumps(ringkas(Path(sys.argv[1])), ensure_ascii=False, indent=2))
