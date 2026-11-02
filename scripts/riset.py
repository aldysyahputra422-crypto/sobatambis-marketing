"""Bank topik riset untuk agent periset-tren.

python -m scripts.riset periksa <bank-topik.json> [--hari YYYY-MM-DD] → 0 lulus, 1 ada masalah (dicetak per topik)
python -m scripts.riset baca <url> [--maks 6000]    → JSON {ok, tingkat, judul, isi} lewat agent-reach (dipotong, hemat token)
python -m scripts.riset notion <bank-topik.json>    → JSON baris untuk database Notion "Bank Topik Sobat Ambis"

Aturan sumber ada di config/sumber.yaml. Angka dan klaim fakta hanya boleh dari sumber tingkat A/B.
"""
import json
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

import yaml

ROOT = Path(__file__).resolve().parents[1]
SUMBER = ROOT / "config/sumber.yaml"
WAJIB = ("id", "judul", "pilar", "temuan", "sudut_psikologi", "ide_episode")
TEKS = ("judul", "temuan", "sudut_psikologi", "ide_episode")


def aturan(path: Path = SUMBER) -> dict:
    return yaml.safe_load(Path(path).read_text(encoding="utf-8"))


def _host(url: str) -> str:
    h = (urlparse(url).hostname or "").lower()
    return h[4:] if h.startswith("www.") else h


def _cocok(host: str, pola: str) -> bool:
    if pola.startswith("."):
        return host.endswith(pola)
    return host == pola or host.endswith("." + pola)


def tingkat(url: str, a: dict | None = None) -> str | None:
    a = a or aturan()
    host = _host(url)
    for t in ("A", "B", "C"):
        if any(_cocok(host, p) for p in a.get(t, [])):
            return t
    return None


def wajib_login(url: str, a: dict | None = None) -> bool:
    a = a or aturan()
    return any(_cocok(_host(url), p) for p in a.get("wajib_login", []))


def periksa_topik(t: dict, hari_ini: date | None = None, a: dict | None = None) -> list[str]:
    a, hari_ini = a or aturan(), hari_ini or date.today()
    m = [f"{k} kosong" for k in WAJIB if not str(t.get(k) or "").strip()]
    if t.get("pilar") and t["pilar"] not in a["pilar"]:
        m.append(f"pilar {t['pilar']!r} bukan salah satu dari {a['pilar']}")
    for k in TEKS:
        if "—" in str(t.get(k) or ""):
            m.append(f"{k} memakai tanda pisah panjang (—)")
    sumber = t.get("sumber") or []
    fakta = [s for s in sumber if s.get("jenis") == "fakta"]
    if not fakta:
        m.append("tidak ada sumber fakta (jenis: fakta)")
    for s in sumber:
        url, tk = s.get("url", ""), tingkat(s.get("url", ""), a)
        if tk is None:
            m.append(f"sumber tidak dikenal: {url} (tambahkan ke config/sumber.yaml hanya bila memang tepercaya)")
        elif s.get("jenis") == "fakta" and tk not in ("A", "B"):
            m.append(f"sumber fakta harus tingkat A/B, {url} tingkat {tk}")
        if s.get("jenis") not in ("fakta", "tren"):
            m.append(f"jenis sumber {s.get('jenis')!r} harus fakta atau tren: {url}")
        try:
            umur = (hari_ini - date.fromisoformat(str(s.get("tanggal")))).days
        except ValueError:
            m.append(f"tanggal sumber tidak valid: {url}")
            continue
        if s.get("jenis") == "tren" and umur > a.get("tren_maks_hari", 30):
            m.append(f"tren basi ({umur} hari): {url}")
    return m


def periksa_bank(bank: dict, hari_ini: date | None = None) -> dict[str, list[str]]:
    a = aturan()
    hasil = {t.get("id", f"#{i}"): periksa_topik(t, hari_ini, a) for i, t in enumerate(bank.get("topik", []))}
    if not hasil:
        hasil["bank"] = ["bank topik kosong"]
    return {k: v for k, v in hasil.items() if v}


def cli_agent_reach() -> str | None:
    p = shutil.which("agent-reach")
    lokal = Path.home() / ".local/bin/agent-reach"
    return p or (str(lokal) if lokal.exists() else None)


def baca(url: str, runner=subprocess.run, maks: int = 6000) -> dict:
    """Baca satu halaman lewat agent-reach (hanya kanal tanpa login). Isi dipotong `maks` karakter."""
    if wajib_login(url):
        return {"ok": False, "kode": 3, "alasan": "situs wajib login/cookie: jangan dibaca; ambil judul+tanggal dari web search saja"}
    cli = cli_agent_reach()
    if not cli:
        return {"ok": False, "kode": 3, "alasan": "agent-reach belum terpasang: python -m scripts.pasang_otomatis --agent periset-tren (atau pakai WebFetch)"}
    try:
        r = runner([cli, "read", url], capture_output=True, text=True, timeout=120)
        d = json.loads(r.stdout or "{}")
    except (OSError, subprocess.TimeoutExpired, ValueError) as x:
        return {"ok": False, "kode": 1, "alasan": f"agent-reach gagal: {x.__class__.__name__}"}
    if not d.get("ok"):
        return {"ok": False, "kode": 1, "alasan": ((d.get("error") or {}).get("hint") or "agent-reach gagal")}
    hasil = d.get("result")
    if isinstance(hasil, dict):
        judul = hasil.get("title", "")
        isi = hasil.get("content") or hasil.get("text") or hasil.get("transcript") or json.dumps(hasil, ensure_ascii=False)
    else:
        judul, isi = "", str(hasil)
    if len(isi) > maks:
        isi = isi[:maks] + " …[dipotong]"
    return {"ok": True, "kode": 0, "tingkat": tingkat(url), "judul": judul, "isi": isi}


def baris_notion(bank: dict) -> list[dict]:
    rows = []
    for t in bank.get("topik", []):
        sumber = t.get("sumber") or []
        tk = sorted({tingkat(s["url"]) or "?" for s in sumber if s.get("jenis") == "fakta"})
        rows.append({
            "Topik": t["judul"],
            "Pilar": t["pilar"],
            "Temuan": t["temuan"],
            "Sudut psikologi": t["sudut_psikologi"],
            "Ide episode": t["ide_episode"],
            "Sumber": "\n".join(s["url"] for s in sumber),
            "Tingkat sumber": tk[0] if tk else "",
            "Minggu": bank.get("minggu", ""),
            "Tanggal riset": bank.get("dibuat", ""),
            "Dipakai di": t.get("dipakai_di", ""),
        })
    return rows


def main(argv: list[str]) -> int:
    if len(argv) < 2 or argv[0] not in ("periksa", "baca", "notion"):
        print(__doc__)
        return 2
    if argv[0] == "baca":
        maks = int(argv[argv.index("--maks") + 1]) if "--maks" in argv else 6000
        r = baca(argv[1], maks=maks)
        print(json.dumps(r, ensure_ascii=False))
        return r["kode"]
    bank = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    if argv[0] == "notion":
        print(json.dumps(baris_notion(bank), ensure_ascii=False, indent=1))
        return 0
    hari = date.fromisoformat(argv[argv.index("--hari") + 1]) if "--hari" in argv else None
    masalah = periksa_bank(bank, hari)
    for k, v in masalah.items():
        for x in v:
            print(f"{k}: {x}")
    print("lulus" if not masalah else f"{sum(map(len, masalah.values()))} masalah")
    return 1 if masalah else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
