from pathlib import Path

from scripts.cek_plugin import periksa

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "skills/sa-brand/SKILL.md"
REF = ROOT / "skills/sa-cerita/references"


def test_brand_memuat_harga_resmi():
    teks = BRAND.read_text(encoding="utf-8")
    for harga in ("Rp550.000", "Rp750.000", "Rp990.000", "Rp95.000", "Rp110.000", "Rp130.000", "Rp175.000"):
        assert harga in teks


def test_brand_melarang_klaim_karangan():
    baris = [b for b in BRAND.read_text(encoding="utf-8").splitlines() if "500+" in b]
    assert baris and all("jangan" in b.lower() for b in baris)


def test_referensi_cerita_sama_dengan_docs():
    for nama in ("story-bible.md", "arc-1.md", "ep01-rencana-sempurna.md"):
        assert (REF / nama).read_text(encoding="utf-8") == (ROOT / "docs/cerita" / nama).read_text(encoding="utf-8")


def test_skill_cerita_menyuruh_baca_story_bible():
    teks = (ROOT / "skills/sa-cerita/SKILL.md").read_text(encoding="utf-8")
    assert "references/story-bible.md" in teks and "references/ep01-rencana-sempurna.md" in teks


def test_cek_plugin_lulus():
    assert periksa(ROOT) == []
