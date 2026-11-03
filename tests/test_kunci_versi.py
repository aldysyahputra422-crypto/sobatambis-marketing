import subprocess
from pathlib import Path

from scripts import kunci_versi, pasang_otomatis
from scripts.katalog import muat

ROOT = Path(__file__).resolve().parents[1]
A, B = "a" * 40, "b" * 40
WAJIB = '''  fungsi: f
  pakai_saat: p
  cara_pasang: c
  lisensi: MIT
  catatan_lisensi: tidak boleh berubah
  butuh_key: null
  biaya: gratis
  ukuran: kecil
  status: direkomendasikan
'''
KAT = ('''- id: satu
  sumber: x
''' + WAJIB + '''  pasang: {jenis: git_skill, url: "https://github.com/o/satu"}
- id: dua
  sumber: x
''' + WAJIB + '''  pasang: {jenis: git_subskill, url: "https://github.com/o/dua", paths: [skills/a], skills: [a], pin: "%s"}
- id: tiga
  sumber: x
''' + WAJIB + '''  pasang: {jenis: npm, paket: ["gsap@3.15.0"]}
''') % A


def _ls(sha_per_url):
    def runner(cmd, **kw):
        sha = sha_per_url.get(cmd[2])
        return subprocess.CompletedProcess(cmd, 0 if sha else 2, f"{sha}\tHEAD\n" if sha else "", "" if sha else "gagal")
    return runner


def test_tulis_pin_menyisipkan_tanpa_mengubah_bagian_lain():
    baru = kunci_versi.tulis_pin(KAT, "satu", B)
    assert f'pasang: {{jenis: git_skill, url: "https://github.com/o/satu", pin: "{B}"}}' in baru
    assert baru.replace(f', pin: "{B}"', "") == KAT
    ganti = kunci_versi.tulis_pin(KAT, "dua", B)
    assert f'pin: "{B}"' in ganti and A not in ganti


def test_kunci_hanya_yang_belum_terkunci_kecuali_diminta_perbarui(tmp_path):
    sha = {"https://github.com/o/satu": B, "https://github.com/o/dua": B}
    k = tmp_path / "skill.yaml"
    k.write_text(KAT)
    assert kunci_versi.main(["--semua"], runner=_ls(sha), katalog=k) == 0
    teks = k.read_text()
    assert f'url: "https://github.com/o/satu", pin: "{B}"' in teks and f'pin: "{A}"' in teks  # dua tidak disentuh
    assert kunci_versi.main(["--perbarui"], runner=_ls(sha), katalog=k) == 0
    assert A not in k.read_text()


def test_repo_tak_terjangkau_dilaporkan_tanpa_merusak_katalog(tmp_path, capsys):
    k = tmp_path / "skill.yaml"
    k.write_text(KAT)
    assert kunci_versi.main(["--semua"], runner=_ls({}), katalog=k) == 1
    assert k.read_text() == KAT and "GAGAL" in capsys.readouterr().out


def test_status_tanpa_argumen_gagal_bila_ada_yang_belum(tmp_path):
    k = tmp_path / "skill.yaml"
    k.write_text(KAT)
    assert kunci_versi.main([], katalog=k) == 1


# ---- aturan pemasang: hanya yang terkunci


def test_pemasang_menolak_yang_belum_terkunci_dan_npx(tmp_path):
    e = muat_dari(KAT, "satu")
    h = pasang_otomatis.pasang_satu(e, skills_dir=tmp_path, runner=None, log=tmp_path / "t.md")
    assert h["status"] == "butuh_pemilik" and "kunci_versi" in h["alasan"]
    npx = type(e)(**{**e.__dict__, "id": "n", "pasang": {"jenis": "npx_skill", "repo": "a/b"}})
    assert "tidak bisa dikunci" in pasang_otomatis.alasan_tidak_boleh(npx)
    assert pasang_otomatis.alasan_tidak_boleh(npx, izin_tak_terkunci=True) is None


def test_pemasang_mengambil_commit_persis_dan_menolak_hash_beda(tmp_path):
    e = muat_dari(KAT, "dua")
    jalan = []

    def runner(cmd, **kw):
        jalan.append(cmd)
        if cmd[:2] == ["git", "clone"]:
            d = Path(cmd[-1])
            (d / "skills/a").mkdir(parents=True)
            (d / "skills/a/SKILL.md").write_text("x")
        if "rev-parse" in cmd:
            return subprocess.CompletedProcess(cmd, 0, B + "\n", "")  # hash beda dari pin A
        return subprocess.CompletedProcess(cmd, 0, "", "")
    h = pasang_otomatis.pasang_satu(e, skills_dir=tmp_path / "s", runner=runner, log=tmp_path / "t.md", cache=tmp_path / "c")
    assert h["status"] == "gagal", "hash HEAD yang berbeda dari pin harus ditolak"
    assert ["git", "-C", str(tmp_path / "c/https-github-com-o-dua"), "fetch", "--depth", "1", "origin", A] in jalan
    assert any("--no-checkout" in c for c in jalan)


def test_uv_hanya_dipasang_bila_sha256_cocok(tmp_path, monkeypatch):
    import hashlib
    monkeypatch.setattr(pasang_otomatis, "UV_BIN", tmp_path / "bin")
    monkeypatch.setattr(pasang_otomatis.shutil, "which", lambda n: None)
    isi = b"zip-asli"
    e = next(x for x in muat(ROOT / "katalog/skill.yaml") if x.id == "agent-reach")
    e = type(e)(**{**e.__dict__, "pasang": {**e.pasang, "sha256": hashlib.sha256(isi).hexdigest()}})
    jalan = []

    def runner_dengan(isi_unduh):
        def runner(cmd, **kw):
            jalan.append(cmd)
            if cmd[0] == "curl":
                Path(cmd[cmd.index("-o") + 1]).write_bytes(isi_unduh)
            if cmd[:3] == ["uv", "tool", "install"]:
                (tmp_path / "bin").mkdir(exist_ok=True)
                (tmp_path / "bin/agent-reach").write_text("#!/bin/sh")
            return subprocess.CompletedProcess(cmd, 0, "", "")
        return runner
    palsu = pasang_otomatis.pasang_satu(e, skills_dir=tmp_path / "s", runner=runner_dengan(b"zip-DIBAJAK"), log=tmp_path / "t.md", cache=tmp_path / "c")
    assert palsu["status"] == "gagal" and not any(c[:3] == ["uv", "tool", "install"] for c in jalan)
    asli = pasang_otomatis.pasang_satu(e, skills_dir=tmp_path / "s", runner=runner_dengan(isi), log=tmp_path / "t.md", cache=tmp_path / "c")
    assert asli["status"] == "terpasang"
    assert ["uv", "tool", "install", str(tmp_path / "c/agent-reach.zip")] in jalan


def test_katalog_asli_semua_yang_bisa_dipasang_terkunci():
    """Setiap entri gratis yang bisa dipasang otomatis harus lolos aturan kunci (kecuali yang memang berbayar/tak bisa)."""
    for e in muat(ROOT / "katalog/skill.yaml"):
        j = (e.pasang or {}).get("jenis")
        if j in ("plugin", "setup", "unduh") or not j or e.butuh_key or (e.biaya or "").lower() != "gratis":
            continue
        assert pasang_otomatis.alasan_belum_terkunci(e) is None, (e.id, pasang_otomatis.alasan_belum_terkunci(e))


def muat_dari(teks, id_):
    import tempfile

    import yaml
    d = yaml.safe_load(teks)
    base = next(x for x in muat(ROOT / "katalog/skill.yaml") if x.id == "stop-slop")
    ent = next(x for x in d if x["id"] == id_)
    return type(base)(**{**base.__dict__, "id": id_, "pasang": ent["pasang"], "otomatis": True})
