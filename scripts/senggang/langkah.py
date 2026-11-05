"""/sa-senggang: jalankan langkah jalur senggang berurutan dan berhenti di titik yang butuh pemilik.

python -m scripts.senggang.langkah <folder> [--topik "teks"]
  1. tandai jalur senggang  2. buat prompt-chatgpt.md bila belum ada  3. tahap jalan (impor, lint, Approval 1,
  lembar ElevenLabs, potong audio, lalu tahap mekanis). Keluaran satu baris JSON + "instruksi" untuk pemilik.
Kode: 0 berhenti normal, 1 gagal, 4 Approval 1, 5 butuh audio, 6 butuh tempelan ChatGPT. Tanpa LLM, tanpa API.
"""
import json
import sys
from pathlib import Path

from scripts import status, tahap
from scripts.senggang import prompt


def _instruksi(h: dict, folder: Path) -> str:
    kode, di = h["kode"], h.get("berhenti_di")
    if kode == 6 and (folder / "koreksi-chatgpt.md").exists():
        return f"Tempelan salah ({h.get('alasan', '')[:200]}). Tempel isi {folder}/koreksi-chatgpt.md ke ChatGPT, simpan jawabannya sebagai {folder}/tempelan.txt, jalankan /sa-senggang lagi."
    if kode == 6:
        return (f"Buka {folder}/prompt-chatgpt.md, tempel ke ChatGPT (Thinking), simpan jawabannya sebagai {folder}/tempelan.txt "
                "(atau tempel ke chat dan minta Claude menyimpannya persis apa adanya), lalu jalankan /sa-senggang lagi.")
    if kode == 4:
        return (f"Baca {folder}/naskah.json. Bila setuju, ubah `disetujui` menjadi true. Lalu buka {folder}/lembar-elevenlabs.md: "
                "tempel blok tiap tokoh ke ElevenLabs (Eleven v3), unduh satu file per tokoh ke rekaman/<tokoh>.mp3, jalankan /sa-senggang lagi.")
    if kode == 5:
        sisa = status.baca(folder)["tahap"].get("suara", {}).get("baris_tersisa", [])
        return (f"Audio belum lengkap. Taruh rekaman/<tokoh>.mp3 (arta, ratna, mbis) dari {folder}/lembar-elevenlabs.md. "
                f"Baris yang belum terbaca: {', '.join(sisa) or 'semua'}. Satu baris saja: rekaman/ulang-<nomor>.mp3, lalu /sa-senggang lagi.")
    if kode == 0 and di == "dialog_ok":
        return f"Dengarkan {folder}/dialog.wav (Approval 2). Bila setuju, jalankan /sa-senggang lagi."
    if kode == 1:
        return f"Tahap {di} gagal: {h.get('alasan', '')}. Perbaikan: {h.get('perbaiki', '')}"
    return f"Berhenti di {di}: {h.get('pegang', '')}"


def maju(folder: Path, topik: str = "") -> dict:
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    tahap.set_jalur(folder, "senggang")
    if not (folder / "prompt-chatgpt.md").exists():
        prompt.main([str(folder)] + (["--topik", topik] if topik else []))
    h = tahap.jalan(folder)
    h["instruksi"] = _instruksi(h, folder)
    return h


def main(argv: list[str]) -> int:
    pos = [a for i, a in enumerate(argv) if not a.startswith("--") and (i == 0 or argv[i - 1] != "--topik")]
    if not pos:
        print('pakai: python -m scripts.senggang.langkah <folder> [--topik "teks"]')
        return 2
    topik = argv[argv.index("--topik") + 1] if "--topik" in argv else ""
    h = maju(Path(pos[0]), topik)
    print(json.dumps(h, ensure_ascii=False))
    return h["kode"]


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
