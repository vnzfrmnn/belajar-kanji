# PRD - Aplikasi Belajar Kanji (Tahap 1: No 1-200)

Versi 1.0 | Sumber data: kamus\_kanji\_JLPT\_N5-N3\_\_yanto先生\_\_baru.docx | Bahasa antarmuka: Indonesia

## 1. Ringkasan

Aplikasi web **Belajar Kanji** yang mobile-first dan bisa dipakai offline, untuk belajar dan menghafal kanji/kosakata dari file Word "N5/4 JFT漢字 (yanto先生)". Tahap 1 mencakup entri bernomor **1 sampai 200**, dibagi menjadi **4 blok (Mode Blok 50)** agar belajar dan menghafal lebih fokus dan efektif.

## 2. Tujuan dan Metrik Keberhasilan

**Tujuan**

- Pengguna dapat belajar 200 entri secara bertahap per blok 50.
- Menghafal lewat flashcard dan kuis yang ruang lingkupnya bisa dibatasi per blok.
- Dipakai nyaman di HP, termasuk tanpa internet.

**Metrik**

- 100% entri nomor 1-200 terekstrak tanpa ada yang hilang (lihat bagian 4).
- Halaman utama termuat di bawah 2 detik pada HP kelas menengah.
- Pengguna dapat menyelesaikan 1 sesi kuis blok (10 soal) tanpa panduan tambahan.

## 3. Pengguna dan Konteks

- Pengguna utama: pelajar bahasa Jepang berbahasa Indonesia (level N5/N4, persiapan JFT).
- Perangkat utama: HP layar 360-430px; tetap rapi di tablet dan desktop.
- Mode pemakaian: sesi singkat, sering tanpa koneksi stabil.

## 4. Sumber Data dan Aturan Ekstraksi (KRITIS)

File Word memiliki penomoran yang **tidak berurutan menurut posisi baris**. Seluruh pengambilan data dan pembagian blok harus berdasarkan **angka nomor**, bukan urutan baris.

### 4.1 Struktur file yang sudah diverifikasi

- Ada dua bagian: **daftar utama** (no 1 sampai sekitar 900) dan bagian **"SATUAN"** (kata bantu bilangan) yang penomorannya mulai lagi dari 1.
- Isinya campuran kanji tunggal dan kosakata/kata majemuk (mis. 一つ, 昼休み), bukan hanya satu huruf kanji.
- Semua nomor 1-200 ada di daftar utama (tidak ada yang hilang).

### 4.2 Aturan ekstraksi

1. Baca hanya bagian **sebelum** judul "SATUAN". Jangan campur dengan bagian SATUAN.
2. Nomor ada di awal baris. Pemisah bisa titik, tab, spasi, atau tidak ada sama sekali (contoh: "6.六", "144\[tab\]誕生日", "20.\[tab\]寝ます").
3. Di antara nomor 1-200 terselip entri bernomor besar (contoh: 804, 825, 889, 776, 869, 808, 828, 665, 666, 859). **Abaikan semuanya.** Sebaliknya nomor kecil bisa muncul jauh dari posisinya (contoh: 144 muncul setelah 45). Tetap ambil berdasarkan angkanya.
4. Urutkan hasil akhir ascending berdasarkan nomor.
5. **Duplikat nomor:**
   - **74** muncul dua kali (荷物 dan 動物). Simpan keduanya dengan id "74" dan "74b".
   - **30** muncul dua kali (週 dan 手洗い). 手洗い terletak di area nomor 290-an, maka **dikeluarkan** dari tahap 1 dan dicatat di laporan validasi.
6. Baris tanpa nomor adalah lanjutan baris sebelumnya (contoh: "Sepeda" melanjutkan no 87 駐輪場). Gabungkan ke arti entri sebelumnya.
7. Pisahkan tiap entri menjadi: nomor, kanji/kata Jepang, bacaan (daftar; pemisah 、 , / ), arti (teks Indonesia), dan baris asli (raw).
8. Arti kadang menempel ke bacaan tanpa spasi (contoh: "きゅうistirahat"). Pisahkan di titik pindah dari kana ke huruf Latin.
9. Jangan menerjemahkan ulang, menebak, atau mengarang bacaan dan arti. Bila arti kosong (contoh: no 81 場), isi null dan tandai "perlu dicek".
10. **Satu-satunya koreksi yang diizinkan:** no 143 日曜日, arti "Sabtu" diganti "Minggu", ditandai "dikoreksi" dengan raw asli tetap disimpan.
11. Bacaan **tidak** diberi label on'yomi/kun'yomi karena tidak ada di sumber. Tampilkan apa adanya.

### 4.3 Model data (kanji\_1\_200.json)

Setiap entri berisi:

- **id**: string ("1" sampai "200", plus "74b")
- **no**: angka nomor di Word
- **kanji**: kata/huruf Jepang
- **tipe**: "kanji" bila tepat 1 karakter kanji, selain itu "kosakata"
- **bacaan**: array bacaan
- **arti**: string atau null
- **blok**: 1-4, dihitung dari angka nomor (74b masuk blok 2)
- **catatan**: array penanda ("perlu dicek", "dikoreksi")
- **raw**: baris asli dari Word

### 4.4 Laporan validasi (wajib ditampilkan sebelum UI dibuat)

- Jumlah total entri (harus **201**: nomor 1-200 masing-masing sekali, ditambah 74b).
- Konfirmasi tidak ada nomor 1-200 yang hilang.
- Jumlah entri per blok (harus 50, 51, 50, 50) dan konfirmasi 74b berada di blok 2.
- Daftar entri yang ditandai (arti kosong, dikoreksi) dan yang dikeluarkan (手洗い "30").

## 5. Mode Blok 50 (Fitur Utama)

Tahap 1 dibagi menjadi 4 blok berdasarkan angka nomor:

- **Blok 1:** no 1-50 (50 entri)
- **Blok 2:** no 51-100 (51 entri, termasuk 74b)
- **Blok 3:** no 101-150 (50 entri)
- **Blok 4:** no 151-200 (50 entri)

**Pilihan di Beranda**

- Pilih satu blok (1-4) untuk belajar fokus di blok itu saja.
- "Semua Blok (1-200)" untuk review gabungan.
- Kartu tiap blok menampilkan: rentang nomor, jumlah entri, progres hafal (mis. 23/50), skor kuis terbaik, dan lencana "Lulus" bila skor kuis blok minimal 80%.

**Alur belajar dalam satu blok (4 langkah, boleh dilompati)**

1. **Kenalan:** telusuri entri blok secara berurutan (kanji, bacaan, arti) tanpa tekanan.
2. **Flashcard:** kartu hanya dari blok itu, dengan tombol "Hafal" dan "Belum". Kartu "Belum" muncul kembali lebih sering dalam sesi sampai ditandai hafal.
3. **Kuis blok:** soal dan pengecoh hanya dari blok itu; soal yang salah masuk daftar "Perlu diulang".
4. **Ujian blok:** seluruh entri blok diuji acak satu kali, lalu tampilkan skor dan daftar yang salah.

**Aturan tambahan**

- Semua blok terbuka sejak awal (tidak dikunci). Tampilkan saran "Selesaikan Blok 1 dulu" bila progres blok sebelumnya masih rendah.
- Ukuran blok disimpan sebagai konstanta (default 50) sehingga tahap 2 (201-400) otomatis menjadi blok 5-8.

## 6. Kebutuhan Fungsional

**F1. Beranda**

- Progres total, tombol "Lanjutkan" ke blok terakhir yang dipelajari, dan 4 kartu Blok 50.

**F2. Daftar Kanji**

- Menampilkan semua entri; pencarian berdasarkan kanji, bacaan, atau arti.
- Filter: blok, tipe (kanji/kosakata), status hafal.
- Ketuk entri untuk melihat detail (kanji besar, semua bacaan, arti, status hafal).

**F3. Flashcard**

- Depan: kanji. Belakang: bacaan dan arti. Animasi flip ringan.
- Geser atau tombol "Hafal" / "Belum". Opsi acak. Lingkup: satu blok atau semua blok.

**F4. Kuis pilihan ganda**

- Jenis soal: kanji→arti, kanji→bacaan, arti→kanji.
- 10 soal per sesi; 4 pilihan, tiga pengecoh diambil dari entri lain dalam lingkup yang sama; tidak boleh ada dua pilihan dengan arti yang sama.
- Akhir sesi: skor, daftar jawaban salah, tombol "Ulangi yang salah".
- Entri dengan arti null tidak dipakai di soal jenis kanji→arti dan arti→kanji.

**F5. Suara**

- Tombol putar bacaan memakai Web Speech API (bahasa ja-JP) bila browser mendukung; bila tidak, tombol disembunyikan.

**F6. Progres**

- Status hafal, skor kuis per blok, daftar "Perlu diulang", dan blok terakhir dipelajari disimpan di localStorage per entri dan dihitung per blok serta total.
- Tombol reset progres dengan konfirmasi.

**F7. Tampilan**

- Mode gelap/terang dan navigasi bawah (Beranda, Daftar, Kartu, Kuis).

## 7. Kebutuhan Non-Fungsional

- **Responsif:** mobile-first 360-430px; tombol sentuh minimal 44px; tidak ada scroll horizontal.
- **Offline:** PWA (manifest + service worker); seluruh data dan aset di-cache.
- **Performa:** data JSON statis (sekitar 200 entri), tanpa panggilan jaringan saat dipakai.
- **Aksesibilitas:** kontras tinggi, kanji berukuran besar, label tombol jelas.
- **Privasi:** tidak ada akun dan tidak ada pengiriman data; semua tersimpan lokal.

## 8. Spesifikasi Teknis

- HTML + CSS + JavaScript murni (tanpa framework).
- Data terpisah dari kode: kanji\_1\_200.json.
- Font Noto Sans JP untuk tulisan Jepang.
- Struktur kode modular (data, penyimpanan progres, logika kuis, UI) agar tahap 2 cukup menambah file data baru.

## 9. Desain

Bersih dan sederhana; kanji besar dan jelas; kontras tinggi; animasi flip ringan; palet netral dengan satu warna aksen.

## 10. Kriteria Penerimaan

1. Laporan validasi menunjukkan 201 entri, tidak ada nomor 1-200 yang hilang, dan distribusi blok 50/51/50/50.
2. Tidak ada entri dari bagian "SATUAN" maupun nomor di atas 200 yang masuk ke data.
3. 手洗い ("30") tidak ada di data; 荷物 (74) dan 動物 (74b) keduanya ada.
4. Entri 143 日曜日 berarti "Minggu", bertanda "dikoreksi", dengan raw asli tersimpan.
5. Pengguna bisa memilih Blok 1-4 atau Semua Blok, dan flashcard serta kuis hanya memakai entri blok terpilih.
6. Progres hafal dan skor kuis tetap ada setelah aplikasi ditutup dan dibuka kembali.
7. Aplikasi dapat dibuka dan dipakai penuh saat offline setelah kunjungan pertama.
8. Tampilan nyaman di layar 360px tanpa teks terpotong atau scroll horizontal.

## 11. Di Luar Lingkup Tahap 1

- Entri nomor 201 ke atas dan bagian SATUAN.
- Urutan goresan (stroke order), contoh kalimat, dan label on'yomi/kun'yomi (tidak ada di sumber).
- Akun pengguna, sinkronisasi antar perangkat, dan backend.

## 12. Catatan Risiko Data

- Format baris di Word tidak seragam (spasi full-width, tab, tanpa titik, arti menempel ke bacaan); parser harus toleran dan semua baris yang meragukan ditandai, bukan ditebak.
- Beberapa arti di sumber mungkin keliru; aplikasi hanya mengoreksi yang tercantum di bagian 4.2 poin 10, sisanya ditampilkan apa adanya.

## 13. Tahap 2 (Rencana)

Entri 201-400 menjadi blok 5-8 dengan menambah file data baru tanpa mengubah logika aplikasi.
