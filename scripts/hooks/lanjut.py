"""Hook Stop: produksi yang sedang berjalan tidak boleh berhenti sebelum titik persetujuan.

Penanda produksi aktif: .sa/aktif.json {"folder": ...} (ditulis `python -m scripts.tahap mulai <folder>`).
Boleh berhenti bila: tidak ada produksi aktif, butuh persetujuan/rekam ulang, gagal, selesai,
atau macet (tahap tidak maju setelah 2 kali dipaksa lanjut → dicatat "macet").
"""
import json
from datetime import datetime, timezone

from _umum import PROYEK, baca_masukan, keluar_json  # noqa: E402

PENANDA = PROYEK / ".sa/aktif.json"
MAKS_PAKSA = 2

if __name__ == "__main__":
    masukan = baca_masukan()
    if not PENANDA.exists():
        raise SystemExit(0)
    from scripts import notion_catatan
    data = json.loads(PENANDA.read_text())
    folder = PROYEK / data["folder"]
    r = notion_catatan.ringkas(folder)["properti"]
    if r["Status"] == "siap posting":
        PENANDA.unlink()
        raise SystemExit(0)
    if r["Status"] != "berjalan":
        raise SystemExit(0)
    paksa = data.get("paksa", 0) + 1 if data.get("tahap") == r["Tahap"] else 1
    if paksa > MAKS_PAKSA:
        with (folder / "catatan-notion.md").open("a", encoding="utf-8") as f:
            f.write(f"- {datetime.now(timezone.utc).isoformat(timespec='minutes')} · macet di tahap {r['Tahap']} setelah {MAKS_PAKSA} kali dilanjutkan otomatis; butuh bantuan pemilik\n")
        PENANDA.write_text(json.dumps({**data, "tahap": r["Tahap"], "paksa": 0, "macet": True}))
        raise SystemExit(0)
    PENANDA.write_text(json.dumps({**data, "tahap": r["Tahap"], "paksa": paksa}))
    keluar_json({"decision": "block", "reason": (
        f"Produksi {data['folder']} belum selesai: tahap berikutnya `{r['Tahap']}`. Lanjutkan /sa-video {data['folder']} "
        "(agent direktur-marketing) sampai titik persetujuan pemilik. Jangan berhenti atau bertanya selain di titik persetujuan.")})
