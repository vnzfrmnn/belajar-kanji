# Belajar Kanji — Tahap 1 (No. 1–200)

Aplikasi belajar kanji JLPT N5/N4 (200 entri pertama) untuk persiapan JFT-Basic. Statis, gratis, mobile-first, bisa dipasang di HP sebagai PWA dan tetap jalan offline.

**Live:** https://flashcard-kanji-khusus-aderu.netlify.app

## Fitur
- **Flashcard** — geser kiri/kanan untuk lanjut/kembali, tap untuk flip, tombol Hafal/Belum Hafal
- **Kuis ketik** — jawaban diketik sendiri (arti, bacaan romaji, atau kana), tanpa pilihan ganda
- **Progres lokal** — status hafal, skor kuis terbaik, dan daftar review tersimpan di browser (localStorage)
- **Daftar 201 entri** — kanji/kosakata beserta bacaan, arti, dan pembagian 4 blok
- **PWA** — installable, offline via service worker

## Teknologi
Vanilla JavaScript (tanpa framework, tanpa build step), HTML, CSS, Service Worker.

## Struktur
```
index.html          # entry point
css/style.css       # styling mobile-first + tema gelap/terang
js/progress.js      # state progres (localStorage, prefix kanji.v1.)
js/quiz.js          # generator soal kuis + pemeriksa jawaban ketik
js/flashcards.js    # antrean flashcard (murni, headless)
js/views.js         # layar aplikasi
js/app.js           # bootstrap aplikasi
sw.js               # service worker precache
kanji_1_200.json    # data 201 entri
```

## Kredit
© 2026 Vanzy — Dibuat oleh [Vanzy](https://github.com/vnzfrmnn)

[Instagram](https://www.instagram.com/vnzfrmnn_/) · [TikTok](https://www.tiktok.com/@vnzfrmnn_) · [GitHub](https://github.com/vnzfrmnn)
