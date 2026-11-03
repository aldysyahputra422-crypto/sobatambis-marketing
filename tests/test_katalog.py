from pathlib import Path

from scripts.katalog import STATUS_VALID, cari, muat

ROOT = Path(__file__).resolve().parents[1]
WAJIB = {
    "agent-reach", "open-generative-ai", "karpathy-skills", "ecc", "youmind-opus-prompts", "threejs", "gsap",
    "design-dna", "motion-design-skill", "genjutsu", "hyperframes", "onetake", "gbro-collage-broll",
    "claude-animation-base", "lemo-opuscar", "stop-slop", "caveman", "remotion-skills", "edge-tts",
    "faster-whisper", "ffmpeg", "elevenlabs", "higgsfield", "voicestudio",
}


def _entri():
    return muat(ROOT / "katalog/skill.yaml")


def test_semua_entri_wajib_ada():
    assert WAJIB <= {e.id for e in _entri()}


def test_field_lengkap_dan_status_valid():
    for e in _entri():
        assert e.sumber and e.fungsi and e.pakai_saat and e.cara_pasang and e.lisensi, e.id
        assert e.status in STATUS_VALID, e.id


def test_nilai_yang_dipatok_spec():
    d = {e.id: e for e in _entri()}
    assert d["ecc"].status == "sebagian" and "jangan pasang utuh" in d["ecc"].catatan_lisensi
    assert "cookie" in d["agent-reach"].catatan_lisensi
    assert d["karpathy-skills"].lisensi == "tidak ada"
    assert d["onetake"].lisensi == "PolyForm-Noncommercial-1.0.0"
    assert d["hyperframes"].status == "alternatif"
    assert "Intel" in d["voicestudio"].catatan_lisensi


def test_cari_animasi_mengembalikan_motion_atau_gsap():
    top = [e.id for e in cari(_entri(), "animasi gerak easing")[:3]]
    assert "motion-design-skill" in top or "gsap" in top


def test_cari_suara_mengembalikan_elevenlabs_dan_edge_tts():
    top = [e.id for e in cari(_entri(), "suara voice over narasi")[:4]]
    assert "elevenlabs" in top and "edge-tts" in top


def test_cari_tanpa_kecocokan_kosong():
    assert cari(_entri(), "zzzz qqqq") == []
