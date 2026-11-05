# Catatan untuk pemilik: jalur senggang (2026-11-05)

Konektor Notion belum terautentikasi di sesi ini, jadi catatan ini disimpan di berkas (skill sa-jadwal: tanpa konektor, catatan masuk `catatan-notion.md`). Salin ke database "Produksi Sobat Ambis" bila perlu.

## Jadi
- `/sa-senggang <folder>` → prompt ChatGPT, impor tempelan, lint, Approval 1, lembar ElevenLabs, potong audio lokal.
- Tahap `naskah` jalur senggang tanpa penulis-naskah, pembasmi-slop, pemeriksa-fakta. Jalur otomatis tidak berubah (279 test lama tetap lulus).
- Saran jalur di `scripts.jadwal_minggu` (`--sibuk Senin,Rabu`), hanya saran.

## Belum teruji (butuh kamu)
1. **Tag audio ElevenLabs.** Dokumentasi resmi memuat: curious, excited, whispers, sighs, sarcastic, crying, happy, sad, angry, annoyed, surprised, laughs, short/long pause. TIDAK memuat: tense, ominous, confused, slowly, tired, quietly, frustrated, warm, gasps, deadpan, loudly, softly, quickly. `shouting` hanya disebut sebagai contoh. Semuanya bertanda `terverifikasi: belum` di `config/tag_ekspresi.yaml`, lengkap dengan `cadangan` yang terverifikasi. Dukungan bahasa Indonesia untuk tag tidak disebut dokumentasi. Uji setelah berlangganan, lalu ubah YAML.
2. **Pemotongan audio nyata.** Teruji hanya dengan audio sintetis dan transkrip palsu (satu file panjang per tokoh, mp3 dan wav). Belum dicoba dengan Whisper pada suara ElevenLabs asli, termasuk kemungkinan v3 mengucapkan nama tag.
3. **Ekspresi per baris.** `naskah.json` kini membawa `ekspresi` per dialog, tetapi `scripts/adegan2.py` belum membacanya (masih memetakan dari emosi beat). Tidak diubah karena animasi di luar lingkup sesi ini.
4. **Perilaku ChatGPT.** Parser toleran pada gaya umum (pagar kode, tebal, bullet), tetapi belum diuji dengan keluaran ChatGPT sungguhan. Bila format sering meleset, kirim galat per baris dari `koreksi-chatgpt.md`.
5. **/usage** sebelum dan sesudah sesi tidak bisa diukur dari container cloud ini; ukur dengan `python -m scripts.kapasitas` di mesinmu.

## Keputusan yang masih milikmu
- Gaya animasi (tidak disentuh), `kantor/` (tidak disentuh), `disetujui: true` dan pemilihan jalur per episode.
