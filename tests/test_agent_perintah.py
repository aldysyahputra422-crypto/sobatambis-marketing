from pathlib import Path

import yaml

from scripts.cek_plugin import periksa

ROOT = Path(__file__).resolve().parents[1]
MODEL = {
    "direktur-marketing": "opus", "penulis-naskah": "sonnet", "pembasmi-slop": "sonnet", "pemeriksa-fakta": "sonnet",
    "storyboarder": "sonnet", "animator": "opus", "sutradara-suara": "haiku", "qa-suara": "haiku",
    "inspektur-frame": "sonnet", "desainer-cover": "sonnet", "penulis-caption": "sonnet",
    "penjaga-gerbang-qa": "sonnet", "pencari-skill": "haiku", "akuntan-token": "haiku", "penjadwal-notion": "haiku", "perencana-konten": "sonnet", "periset-tren": "sonnet",
}


def _fm(p: Path) -> dict:
    return yaml.safe_load(p.read_text(encoding="utf-8").split("---", 2)[1])


def test_semua_agent_ada_dan_model_sesuai():
    ada = {p.stem: _fm(p)["model"] for p in (ROOT / "agents").glob("*.md")}
    assert ada == MODEL


def test_hanya_animator_dan_direktur_opus():
    assert {n for n, m in MODEL.items() if m == "opus"} == {"animator", "direktur-marketing"}


def test_agent_menulis_ke_file_dan_punya_verifikasi():
    for p in (ROOT / "agents").glob("*.md"):
        teks = p.read_text(encoding="utf-8")
        assert "Tulis" in teks or "tulis" in teks, p.name
        assert "Verifikasi" in teks, p.name


TAHAP_V2 = ("naskah", "suara", "dialog_ok", "adegan", "mix", "render_draf", "qa_gerak", "render", "qa_final", "kemasan", "video_ok", "gerbang")


def test_sa_video_menyebut_semua_tahap():
    teks = (ROOT / "commands/sa-video.md").read_text(encoding="utf-8")
    posisi = [teks.index(f"| `{t}`") for t in TAHAP_V2]
    assert posisi == sorted(posisi)


def test_sa_video_menyebut_kode_5_rekam_ulang():
    teks = (ROOT / "commands/sa-video.md").read_text(encoding="utf-8")
    assert "kode 5" in teks and "lembar-rekaman.md" in teks


def test_agent_memakai_script_baru():
    baca = lambda n: (ROOT / f"agents/{n}.md").read_text(encoding="utf-8")
    assert "scripts.adegan2" in baca("storyboarder")
    assert "scripts.qa_gerak" in baca("inspektur-frame")
    assert "scripts.render" in baca("animator")
    assert "sumber_suara" in baca("sutradara-suara") and "lembar" in baca("sutradara-suara")
    assert "beat" in baca("penulis-naskah") and "naskah2.schema.json" in baca("penulis-naskah")


def test_versi_plugin():
    import json
    assert json.loads((ROOT / ".claude-plugin/plugin.json").read_text())["version"] == "0.2.0"


def test_sa_video_menyebut_kode_3_minta_persetujuan():
    teks = (ROOT / "commands/sa-video.md").read_text(encoding="utf-8")
    assert "kode 3" in teks and "persetujuan" in teks


def test_sa_video_menyebut_approval_naskah_kode_4():
    teks = (ROOT / "commands/sa-video.md").read_text(encoding="utf-8")
    assert "kode 4" in teks and "Approval 1" in teks


def test_cek_plugin_lulus():
    assert periksa(ROOT) == []


def test_notion_tercatat_di_alur():
    sa = (ROOT / "commands/sa-video.md").read_text(encoding="utf-8")
    assert "penjadwal-notion" in sa and "scripts.notion_catatan" in sa
    assert "penjadwal-notion" in (ROOT / "agents/direktur-marketing.md").read_text(encoding="utf-8")
    skill = (ROOT / "skills/sa-jadwal/SKILL.md").read_text(encoding="utf-8")
    for kolom in ("Episode", "Tahap", "Status", "Butuh dari pemilik", "Skor gerak (median)", "LUFS", "Token output"):
        assert kolom in skill
    agen = (ROOT / "agents/penjadwal-notion.md").read_text(encoding="utf-8")
    assert "catatan-notion.md" in agen and "config/notion.yaml" in agen


def test_setiap_agent_dibangun_dari_skill_terverifikasi():
    import re
    from scripts.katalog import muat
    kat = {e.id: e for e in muat(ROOT / "katalog/skill.yaml")}
    lokal = {p.parent.name for p in (ROOT / "skills").glob("*/SKILL.md")}
    for p in (ROOT / "agents").glob("*.md"):
        teks = p.read_text(encoding="utf-8")
        assert "## Skill dasar" in teks, p.name
        bagian = teks.split("## Skill dasar", 1)[1].split("\n## ", 1)[0]
        dipakai = set(re.findall(r"`([a-z0-9-]+)`", bagian))
        assert dipakai, p.name
        for s in dipakai:
            assert s in lokal or s in kat or any(s in (e.pasang or {}).get("skills", []) for e in kat.values()), f"{p.name}: {s}"
        assert any(s in lokal or (s in kat and (kat[s].otomatis or (kat[s].pasang or {}).get("jenis") == "plugin")) for s in dipakai), p.name


def test_skill_komedi_dan_perencana_konten_ada():
    assert (ROOT / "skills/sa-komedi/SKILL.md").exists()
    t = (ROOT / "agents/penulis-naskah.md").read_text(encoding="utf-8")
    assert "`sa-komedi`" in t and "`humanizer`" in t and "`claude-screenwriting`" in t


def test_pencari_skill_paham_alur_dan_hemat_token():
    t = (ROOT / "agents/pencari-skill.md").read_text(encoding="utf-8")
    for kunci in ("--agent", "katalog cari", "Aturan hemat token", "Jangan membuka atau membaca", "Peta kerja", "butuh pemilik"):
        assert kunci in t, kunci
    for agent in ("penulis-naskah", "storyboarder", "desainer-cover", "perencana-konten"):
        assert agent in t


def test_sa_minggu_merangkai_kapasitas_riset_rencana_notion():
    t = (ROOT / "commands/sa-minggu.md").read_text(encoding="utf-8")
    posisi = [t.index(k) for k in ("scripts.kapasitas", "scripts.jadwal_minggu susun", "periset-tren", "perencana-konten", "penjadwal-notion")]
    assert posisi == sorted(posisi)
    p = (ROOT / "agents/perencana-konten.md").read_text(encoding="utf-8")
    assert "jadwal.json" in p and "bank-topik.json" in p
    r = (ROOT / "agents/periset-tren.md").read_text(encoding="utf-8")
    assert "scripts.riset periksa" in r and "--agent periset-tren" in r and "cookie" in r
    assert "Bank Topik Sobat Ambis" in (ROOT / "skills/sa-jadwal/SKILL.md").read_text(encoding="utf-8")
