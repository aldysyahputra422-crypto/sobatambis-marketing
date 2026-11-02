"""Hook SessionStart: siapkan dependensi, pasang skill otomatis, aktifkan mode hemat token, laporkan produksi aktif."""
import subprocess

from _umum import PROYEK, REPO, baca_masukan, keluar_json  # noqa: E402

import os

HEMAT_TOKEN = (
    "Mode hemat token aktif (caveman + ponytail). Komunikasi internal, log, dan laporan antar agent ditulis super ringkas: "
    "tanpa basa-basi, tanpa pengulangan, istilah teknis/perintah/galat tetap persis. Kode: solusi paling sederhana yang jalan, "
    "tanpa abstraksi yang tidak diminta. Pengecualian: naskah, caption, dan catatan Notion untuk pemilik tetap bahasa Indonesia wajar.\n"
    "Hemat konteks: tahap mekanis lewat satu `python -m scripts.tahap jalan <folder>` (latar), bukan agent per tahap; "
    "jangan membaca media, log render, atau file besar; buka skill hanya saat tugasnya muncul; "
    "satu episode per sesi, sarankan /clear sesudah titik persetujuan."
)


def siapkan() -> str:
    if os.environ.get("SA_LEWATI_SETUP"):
        return "dilewati"
    if (REPO / ".venv/bin/python").exists() and (REPO / "template/node_modules").exists():
        return "siap"
    r = subprocess.run(["bash", str(REPO / "scripts/setup.sh")], capture_output=True, text=True, timeout=900)
    return "dipasang" if r.returncode == 0 else f"gagal: {(r.stdout + r.stderr).strip().splitlines()[-1:]}"


def pasang() -> str:
    if os.environ.get("SA_LEWATI_PASANG"):
        return "dilewati"
    from scripts import pasang_otomatis
    from scripts.katalog import muat
    h = pasang_otomatis.pasang_semua(muat(REPO / "katalog/skill.yaml"))
    return ", ".join(f"{k}: {', '.join(v)}" for k, v in h.items() if v) or "tidak ada"


def produksi_aktif() -> list[str]:
    from scripts import notion_catatan
    baris = []
    for st in sorted(PROYEK.glob("videos/*/*/status.json")):
        if "beat" not in notion_catatan._naskah(st.parent):
            continue  # naskah versi lama (v1) tidak diproduksi dengan pipeline ini
        r = notion_catatan.ringkas(st.parent)["properti"]
        if r["Tahap"] != "selesai":
            baris.append(f"- {st.parent.relative_to(PROYEK)}: tahap {r['Tahap']} ({r['Status']}){' · ' + r['Butuh dari pemilik'] if r['Butuh dari pemilik'] else ''}")
    return baris


if __name__ == "__main__":
    baca_masukan()
    bagian = [HEMAT_TOKEN, f"Dependensi: {siapkan()}. Skill otomatis: {pasang()}."]
    aktif = produksi_aktif()
    if aktif:
        bagian.append("Produksi belum selesai:\n" + "\n".join(aktif))
    bagian.append("Catatan progres untuk pemilik dicatat ke Notion lewat agent penjadwal-notion (skill sa-jadwal).")
    keluar_json({"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "\n".join(bagian)}})
