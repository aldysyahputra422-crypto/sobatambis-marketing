"""Timeline adegan otomatis dari naskah beat (v2) + timing/transkrip suara.

python -m scripts.adegan2 <folder>  → adegan.sumber.json lalu adegan.json (via waktu_kata)
Kunci timing/transkrip per dialog: "<beat>.<n>" (n mulai 1).
"""
import json
import re
import sys
from pathlib import Path

import yaml

from scripts import naskah as naskah_mod
from scripts import waktu_kata
from scripts.suara.dengar import normalisasi

ROOT = Path(__file__).resolve().parents[1]
TPL = ROOT / "template/src"
LEAD, JEDA, EKOR, AWAL_AKSI = 0.25, 0.3, 0.8, 0.05
EKSPRESI = {"semangat": "ambis", "marah": "marah", "kaget": "kaget", "lelah": "datar", "hancur": "hancur",
            "misterius": "datar", "tertekan": "lirik", "hangat": "senyum", "datar": "datar"}
EKSPRESI_MBIS = {"misterius": "intip", "lelah": "datar", "datar": "datar"}
SFX_KONTAK = {"hentak": "hentak", "banting": "brak", "lompat": "gedebuk", "tabrak": "tabrak_kartun", "terduduk": "gedebuk", "muncul": "bel_mbis"}
SFX_MULAI = {"jalan": "langkah", "lari": "langkah"}
TINGGI = {"arta": 718, "ratna": 560, "mbis": 210}
KEPALA = {"arta": 452, "ratna": 452, "mbis": 104}  # telapak ke tengah kepala (skala 1)


class AsetTidakAda(Exception):
    pass


def _aksi_template() -> dict[str, dict[str, dict]]:
    """{tokoh: {aksi: {durasi, kontak, ulang}}} dibaca dari template/src/aksi/*.ts."""
    hasil: dict[str, dict[str, dict]] = {}
    pola = re.compile(r'nama:\s*"(\w+)",\s*tokoh:\s*"(\w+)",\s*durasi:\s*([\d.]+)([^\n]*)')
    for f in (TPL / "aksi").glob("*.ts"):
        for nama, tokoh, durasi, sisa in pola.findall(f.read_text(encoding="utf-8")):
            k = re.search(r"kontak:\s*([\d.]+)", sisa)
            hasil.setdefault(tokoh, {})[nama] = {"durasi": float(durasi), "kontak": float(k.group(1)) if k else None, "ulang": "ulang: true" in sisa}
    # aksi salinan (Ratna) memakai nilai Arta
    teks_ratna = (TPL / "aksi/ratna.ts").read_text(encoding="utf-8")
    for nama in re.findall(r"(\w+):\s*salin\(AKSI_ARTA\.(\w+)", teks_ratna):
        hasil.setdefault("ratna", {})[nama[0]] = hasil["arta"][nama[1]]
    for nama in re.findall(r"^const (\w+) = salin\(AKSI_ARTA\.(\w+)", teks_ratna, re.M):
        hasil["ratna"][nama[0]] = hasil["arta"][nama[1]]
    return hasil


def _aset_template() -> tuple[set[str], set[str]]:
    teks = (TPL / "dunia/latar.ts").read_text(encoding="utf-8")
    blok = lambda nama: teks.split(f"export const {nama}", 1)[1].split("\n};", 1)[0]
    return set(re.findall(r"^\s{2}(\w+):", blok("LATAR"), re.M)), set(re.findall(r"^\s{2}(\w+):", blok("PROPERTI"), re.M))


def _katalog(jenis: str) -> set[str]:
    return set(yaml.safe_load((ROOT / f"aset/{jenis}/katalog.yaml").read_text(encoding="utf-8")))


def periksa_aset(n: dict, aksi: dict) -> None:
    latar, properti = _aset_template()
    sfx, musik = _katalog("sfx"), _katalog("musik")
    hilang = []
    for b in n["beat"]:
        if b["latar"] not in latar:
            hilang.append(f"latar {b['latar']} ({b['id']})")
        for a in b["aksi"]:
            if a["aksi"] not in aksi.get(a["tokoh"], {}):
                hilang.append(f"aksi {a['aksi']} untuk {a['tokoh']} ({b['id']})")
            if a.get("benda") and a["benda"] not in properti:
                hilang.append(f"properti {a['benda']} ({b['id']})")
        for p in b.get("properti", []):
            if p not in properti:
                hilang.append(f"properti {p} ({b['id']})")
        for s in b.get("sfx", []):
            if s["nama"] not in sfx:
                hilang.append(f"sfx {s['nama']} ({b['id']})")
        if b.get("musik") and b["musik"] not in musik:
            hilang.append(f"musik {b['musik']} ({b['id']})")
    if hilang:
        raise AsetTidakAda("; ".join(hilang))


def _sama(a: str, b: str) -> bool:
    return "".join(normalisasi(a)) == "".join(normalisasi(b))


def bangun(n: dict, timing: list[dict], transkrip: dict) -> dict:
    aksi_info = _aksi_template()
    periksa_aset(n, aksi_info)
    pg = yaml.safe_load((ROOT / "config/panggung.yaml").read_text(encoding="utf-8"))
    t_by = {t["id"]: t for t in timing}
    beat = n["beat"]

    # Rentang waktu setiap beat
    mulai, akhir_dialog = [], []
    for i, b in enumerate(beat):
        ids = [f"{b['id']}.{k}" for k in range(1, len(b["dialog"]) + 1)]
        if ids:
            mulai.append(0.0 if i == 0 else t_by[ids[0]]["mulai"] - LEAD - (1.5 if b["jenis"] == "mengena" else 0))
            akhir_dialog.append(t_by[ids[-1]]["selesai"])
        else:
            if i == 0:
                mulai.append(0.0)
            elif akhir_dialog[i - 1] is not None:
                mulai.append(akhir_dialog[i - 1] + JEDA)
            else:
                mulai.append(mulai[i - 1] + beat[i - 1].get("durasi", naskah_mod.DURASI_VISUAL))
            akhir_dialog.append(None)
    last = beat[-1]
    durasi = round((akhir_dialog[-1] + EKOR) if akhir_dialog[-1] is not None else mulai[-1] + last.get("durasi", naskah_mod.DURASI_VISUAL), 3)
    selesai = mulai[1:] + [durasi]
    R = lambda x: round(x, 3)

    def waktu_kata(b, kata: str) -> tuple[float, str]:
        for k in range(1, len(b["dialog"]) + 1):
            kunci = f"{b['id']}.{k}"
            for w in transkrip.get(kunci, []):
                if _sama(w["kata"], kata):
                    return w["mulai"], kunci
        raise waktu_kata_mod.KataTidakAda(f"{kata} di {b['id']}")

    # Latar, transisi, sunyi, rona, musik
    jalur_latar, transisi, sunyi, rona, musik = [], [], [], [], []
    for i, b in enumerate(beat):
        if not jalur_latar or jalur_latar[-1]["latar"] != b["latar"]:
            jalur_latar.append({"mulai": R(mulai[i]), "latar": b["latar"]})
            if i:
                transisi.append({"pada": R(mulai[i]), "jenis": "coret"})
        if b["jenis"] == "mengena":
            sunyi.append({"mulai": R(mulai[i]), "selesai": R(selesai[i])})
        if b["emosi"] == "marah" and b["intensitas"] >= 8:
            rona.append({"mulai": R(mulai[i]), "selesai": R(selesai[i]), "warna": "merah"})
        if b["emosi"] == "hancur" and b["intensitas"] >= 8:
            rona.append({"mulai": R(mulai[i]), "selesai": R(selesai[i]), "warna": "gelap"})
        trek = b.get("musik") if b["jenis"] != "mengena" else None
        if trek:
            if musik and musik[-1]["trek"] == trek and abs(musik[-1]["selesai"] - mulai[i]) < 0.01:
                musik[-1]["selesai"] = R(selesai[i])
            else:
                musik.append({"trek": trek, "mulai": R(mulai[i]), "selesai": R(selesai[i])})

    # Dialog, teks
    dialog, teks, layar = [], [], 0
    for b in beat:
        for k, d in enumerate(b["dialog"], 1):
            kunci = f"{b['id']}.{k}"
            t = t_by[kunci]
            dialog.append({"penutur": d["penutur"], "mulai": t["mulai"], "selesai": t["selesai"], "baris": kunci})
            kata_n = d["teks"].split()
            tr = transkrip.get(kunci, [])
            if len(tr) == len(kata_n):
                waktu = [(w["mulai"], w["selesai"]) for w in tr]
            else:
                lang = (t["selesai"] - t["mulai"]) / len(kata_n)
                waktu = [(t["mulai"] + i * lang, t["mulai"] + (i + 1) * lang) for i in range(len(kata_n))]
            for w, (a0, a1) in zip(kata_n, waktu):
                cap = bool(d.get("puncak")) and _sama(w, d["puncak"])
                teks.append({"kata": w, "mulai": R(a0), "selesai": R(a1), "gaya": "cap" if cap else "biasa", "layar": layar})
            layar += 1

    # Tokoh: siapa tampil di beat mana, posisi per latar, aksi
    tokoh_beat = [{d["penutur"] for d in b["dialog"] if d["penutur"] in TINGGI} | {a["tokoh"] for a in b["aksi"]} for b in beat]
    jalur_tokoh, properti, sfx = {}, [], []
    for b, i in zip(beat, range(len(beat))):
        for s in b.get("sfx", []):
            if "pada_kata" in s:
                pada, _ = waktu_kata(b, s["pada_kata"])
            else:
                pada = {"akhir": selesai[i] - 0.4}.get(s.get("pada"), mulai[i] + AWAL_AKSI)
            sfx.append({"nama": s["nama"], "pada": R(pada)})
        for j, p in enumerate(b.get("properti", [])):
            prev = beat[i - 1].get("properti", []) if i and beat[i - 1]["latar"] == b["latar"] else []
            if p in prev:
                continue
            akhir_latar = next((mulai[x] for x in range(i + 1, len(beat)) if beat[x]["latar"] != b["latar"]), None)
            e = {"id": p, "masuk": R(mulai[i] + 0.1 * j), "cara": "pop", "pusat": pg["pusat"][p]}
            if akhir_latar is not None:
                e.update(keluar=R(akhir_latar), caraKeluar="jatuh")
            properti.append(e)
    if teks and any(x["gaya"] == "cap" for x in teks):
        sfx += [{"nama": "pop", "pada": x["mulai"], "volume_db": -8} for x in teks if x["gaya"] == "cap"]
    sfx += [{"nama": "whoosh", "pada": R(max(0, t["pada"] - 0.15))} for t in transisi]

    for id_ in TINGGI:
        idx = [i for i in range(len(beat)) if id_ in tokoh_beat[i]]
        if not idx:
            continue
        skala = pg["skala"][id_]
        pos = lambda i: pg["latar"][beat[i]["latar"]][id_]
        entri, tampil, lapis = [], [], []
        sebelum = None
        for i in idx:
            b = beat[i]
            ekspresi_bawaan = (EKSPRESI_MBIS.get(b["emosi"], "senang") if id_ == "mbis" else EKSPRESI[b["emosi"]])
            baru_segmen = sebelum is None or sebelum != i - 1 or beat[i - 1]["latar"] != b["latar"]
            if baru_segmen:
                p = pos(i)
                entri.append({"mulai": R(mulai[i]), "aksi": "diam_hidup", "ekspresi": ekspresi_bawaan, "param": {"pindah": {"x": p["x"], "y": p["y"]}}})
                if tampil and abs(tampil[-1]["selesai"] - mulai[i]) < 0.01:
                    tampil[-1]["selesai"] = R(selesai[i])
                else:
                    tampil.append({"mulai": R(mulai[i]), "selesai": R(selesai[i])})
                ly = p.get("lapis", "depan")
                if not lapis or lapis[-1]["lapis"] != ly:
                    lapis.append({"mulai": R(mulai[i]), "lapis": ly})
            else:
                tampil[-1]["selesai"] = R(selesai[i])
                entri.append({"mulai": R(mulai[i]), "aksi": "diam_hidup", "ekspresi": ekspresi_bawaan})
            for a in [x for x in b["aksi"] if x["tokoh"] == id_]:
                info = aksi_info[id_][a["aksi"]]
                kontak = info["kontak"] or 0.0
                if "pada_kata" in a:
                    t_kata, _ = waktu_kata(b, a["pada_kata"])
                    t0 = t_kata - kontak
                elif a.get("pada") == "akhir":
                    t0 = selesai[i] - info["durasi"]
                else:
                    t0 = mulai[i] + AWAL_AKSI
                t0 = max(mulai[i], t0)
                e = {"mulai": R(t0), "aksi": a["aksi"], "ekspresi": a.get("ekspresi", ekspresi_bawaan)}
                if "dx" in a:
                    e["param"] = {"dx": a["dx"]}
                entri.append(e)
                if info["kontak"] is not None and a["aksi"] in SFX_KONTAK and not any(s["nama"] == SFX_KONTAK[a["aksi"]] for s in b.get("sfx", [])):
                    sfx.append({"nama": SFX_KONTAK[a["aksi"]], "pada": R(t0 + kontak)})
                if a["aksi"] in SFX_MULAI:
                    sfx.append({"nama": SFX_MULAI[a["aksi"]], "pada": R(t0), "volume_db": -6})
                if not info["ulang"]:
                    nxt = t0 + info["durasi"]
                    if nxt + 0.3 < selesai[i] and not any(x["tokoh"] == id_ and x is not a and "pada_kata" in x for x in b["aksi"][b["aksi"].index(a) + 1:]):
                        entri.append({"mulai": R(nxt), "aksi": "diam_hidup", "ekspresi": e["ekspresi"]})
                if a.get("benda"):
                    pr = {"id": a["benda"], "pusat": pg["pusat"][a["benda"]], "pegang": {"tokoh": id_, "mulai": R(mulai[i])}}
                    if a["aksi"] == "banting":
                        pr.update(masuk=R(t0 + kontak), cara="banting")
                        akhir_latar = next((mulai[x] for x in range(i + 1, len(beat)) if beat[x]["latar"] != b["latar"]), None)
                        if akhir_latar is not None:
                            pr.update(keluar=R(akhir_latar), caraKeluar="jatuh")
                    else:
                        pr.update(masuk=R(durasi + 99), cara="pop")
                        pr["pegang"]["selesai"] = R(selesai[i])
                    properti.append(pr)
            sebelum = i
        entri.sort(key=lambda x: x["mulai"])
        p0 = pos(idx[0])
        jalur_tokoh[id_] = {"awal": {"x": p0["x"], "y": p0["y"], "skala": skala, "ekspresi": entri[0]["ekspresi"]},
                            "aksi": entri, "tampil": tampil, "lapis": lapis if len(lapis) > 1 else lapis[0]["lapis"]}

    # Kamera
    kamera = []
    for i, b in enumerate(beat):
        a0, a1 = R(mulai[i]), R(selesai[i])
        utama = (b["dialog"][0]["penutur"] if b["dialog"] else (b["aksi"][0]["tokoh"] if b["aksi"] else "arta"))
        def target(id_):
            p = pg["latar"][b["latar"]].get(id_, {"x": 360, "y": 1000})
            return {"x": p["x"], "y": round(p["y"] - KEPALA.get(id_, 452) * pg["skala"].get(id_, 0.9))}
        if b.get("kamera"):
            titik = [a0]
            for k in b["kamera"][1:]:
                titik.append(waktu_kata(b, k["mulai_kata"])[0] if "mulai_kata" in k else a0)
            for k, (t0, t1) in zip(b["kamera"], zip(titik, titik[1:] + [a1])):
                e = {"mulai": R(t0), "selesai": R(t1), "jenis": k["jenis"], "gerak": k.get("gerak", "dorong")}
                if k["jenis"] != "lebar":
                    e["target"] = pg["pusat"][k["benda"]] if k.get("benda") else target(k.get("tokoh", utama))
                kamera.append(e)
        elif b["jenis"] == "naik" and b["dialog"]:
            t_d = next((t_by[f"{b['id']}.{k}"]["mulai"] for k, d in enumerate(b["dialog"], 1) if d.get("puncak")), t_by[f"{b['id']}.1"]["mulai"])
            if t_d - a0 > 0.4:
                kamera.append({"mulai": a0, "selesai": R(t_d), "jenis": "lebar", "gerak": "dorong"})
            else:
                t_d = a0
            kamera.append({"mulai": R(t_d), "selesai": a1, "jenis": "dekat", "target": target(utama), "gerak": "hentak"})
        elif b["jenis"] == "mengena":
            benda = next((p for p in b.get("properti", []) if p in pg["pusat"]), None)
            e = {"mulai": a0, "selesai": a1, "jenis": "sisipan" if benda else "dekat", "gerak": "diam"}
            e["target"] = pg["pusat"][benda] if benda else target("arta")
            kamera.append(e)
        else:
            kamera.append({"mulai": a0, "selesai": a1, "jenis": "lebar", "gerak": {"lucu": "hentak", "hook": "dorong", "penutup": "dorong"}.get(b["jenis"], "dorong")})

    return {"durasi": durasi, "fps": 30, "jalur": {
        "latar": jalur_latar, "kamera": kamera, "tokoh": jalur_tokoh, "properti": properti, "teks": teks,
        "dialog": [{k: v for k, v in d.items() if k != "baris"} for d in dialog],
        "sfx": sorted(sfx, key=lambda x: x["pada"]), "musik": musik, "transisi": transisi, "rona": rona, "sunyi": sunyi}}


waktu_kata_mod = waktu_kata


def jalankan(folder: Path) -> Path:
    folder = Path(folder)
    n = naskah_mod.muat(folder / "naskah.json")
    timing = json.loads((folder / "timing.json").read_text(encoding="utf-8"))
    transkrip = json.loads((folder / "transkrip.json").read_text(encoding="utf-8"))
    (folder / "adegan.sumber.json").write_text(json.dumps(bangun(n, timing, transkrip), ensure_ascii=False, indent=2), encoding="utf-8")
    return waktu_kata.jalankan(folder)


if __name__ == "__main__":
    try:
        print(jalankan(Path(sys.argv[1])))
    except AsetTidakAda as e:
        print(f"aset belum ada (minta animator membuatnya): {e}")
        sys.exit(1)
