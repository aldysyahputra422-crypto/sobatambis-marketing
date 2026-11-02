# sobatambis-marketing

Plugin Claude Code: tim marketing agentic Sobat Ambis. Dari naskah sampai video Reels siap tayang.

## Pasang di akun Claude

```
/plugin marketplace add aldysyahputra422-crypto/sobatambis-marketing
/plugin install sobatambis-marketing
```

## Siapkan sekali per akun

1. **Connector** (claude.ai → Settings → Connectors): Notion, Google Drive, Consensus, Elicit, SciSpace.
2. **Secret** di pengaturan environment cloud (menu environment di judul sesi → Edit → Network secrets / environment variable): `ELEVENLABS_API_KEY`. Jangan tempel key di chat.
3. **Dependensi** di root repo:

```
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
npm ci --prefix template
```

## Pakai

- `/sa-video videos/2026-W46/ep01` — produksi satu video dari naskah sampai QA.
- `/sa-status videos/2026-W46/ep01` — lihat tahap dan token.
- `/sa-pasang-skill "<kebutuhan>"` — cari dan pasang skill dari katalog.

Dokumen: desain di `docs/specs/`, cerita di `docs/cerita/`, rencana di `docs/superpowers/plans/`.
