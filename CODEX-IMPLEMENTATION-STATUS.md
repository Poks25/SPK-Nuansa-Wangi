# Status Pengerjaan Codex — SPK Nuansa Wangi

Tanggal: 18 Oktober 2026

## Akses lokal

Frontend Vite aktif di http://127.0.0.1:5173/; halaman login merespons HTTP 200. Backend source proyek aktif di port 3002 dan health check http://localhost:3002/api/health mengembalikan status ok. Port 3001 sudah ditempati proses Node lain, jadi proses tersebut dibiarkan berjalan dan konfigurasi frontend/backend proyek ini diarahkan ke 3002.

Menaruh folder di htdocs saja tidak menjalankan Vite. Untuk menjalankan lagi setelah terminal ditutup:
1. Terminal pertama: masuk ke folder backend, lalu npm run dev.
2. Terminal kedua: masuk ke folder frontend, lalu npm run dev.
3. Buka http://localhost:5173/.

## Audit database dan perlindungan data

Pemeriksaan metadata dan agregat database spk_parfum menemukan tabel produk, transaksi, kriteria, bobot, akun, serta snapshot hasil SAW. Ada 8 produk, 18 transaksi, dan 30 baris rincian transaksi. Enam kriteria aktif memiliki bobot total 1,00. Dua snapshot FINAL masing-masing memiliki 8 hasil; nilai normalisasi dan skor cocok secara aritmetika dengan nilai mentah serta bobot saat ini.

Audit konsistensi transaksi menemukan nomor invoice unik, rincian merujuk produk/transaksi yang ada, kuantitas positif, serta total header/rincian konsisten. Tidak ada transaksi atau penjualan uji yang ditulis ke database.

Backup lokal sebelum perubahan kode/data lanjutan:
- database/backups/spk-parfum-before-codex-20261018.sql — skema dan data database.
- database/backups/backend-env-before-codex-20261018.bak — salinan konfigurasi lokal backend.

Folder backup database ditambahkan ke .gitignore. File .env tidak ditampilkan atau dimasukkan ke dokumentasi.

## Perubahan

- Branding login, judul tab, footer, metadata, dan README menggunakan “SPK Nuansa Wangi”; nama folder tidak diubah.
- Halaman produk diarahkan ke tabel products, bukan tabel inventaris lama items. Admin dapat tambah/ubah produk dan menonaktifkan produk; penonaktifan mempertahankan catatan transaksi.
- Halaman transaksi menampilkan riwayat dan formulir transaksi multi-produk. Backend memvalidasi input, mengambil harga dari katalog, membuat nomor invoice, lalu menyimpan header dan rincian dalam satu transaksi database. Proses ini tidak mengubah stok.
- Dashboard menggunakan ringkasan database: produk aktif, jumlah transaksi, unit terjual, omzet tercatat, dan peringkat dari snapshot FINAL terbaru.
- Halaman peringkat dan laporan cetak membaca snapshot SAW yang tersimpan. Akses baca tersedia untuk Admin dan Pimpinan.
- Pemeriksaan filter status produk diperbaiki. Pimpinan mendapatkan menu dashboard, peringkat, dan laporan.
- Backend proyek menggunakan port 3002 untuk menghindari konflik port 3001.

## Verifikasi

- Frontend npm run build: lulus (1.595 modul).
- Backend npm run check: lulus.
- Backend npm test: 9 lulus, 0 gagal. Tes transaksi memakai database mock, tidak menyentuh catatan penjualan live.
- Health API port 3002: ok.
- Frontend localhost: HTTP 200; judul halaman “SPK Nuansa Wangi — Best Seller Parfum”.
- Backup SQL terbuat dengan 10 definisi tabel dan 9 blok data.

## Pekerjaan yang masih terbuka

Perubahan lanjutan setelah audit: Admin kini dapat membuat snapshot SAW baru untuk periode tanggal tertentu. C5 mengikuti keputusan pengguna: jumlah pelanggan yang membeli produk dalam sedikitnya dua transaksi berbeda. C6 mengikuti keputusan pengguna: jumlah bulan dengan penjualan dibagi jumlah bulan kalender di dalam rentang periode (inklusif). Identitas pelanggan menggunakan nomor telepon yang dinormalisasi; jika kosong, nama non-generik digunakan. “Pelanggan Umum” tanpa nomor telepon dikecualikan dari hitungan pelanggan unik dan pembelian ulang.

Form transaksi baru juga menyediakan nama dan nomor telepon pelanggan opsional. Jika keduanya kosong, transaksi dicatat sebagai “Pelanggan Umum” dan tidak dianggap identitas pembeli dalam C4/C5.

Seluruh produk aktif masuk sebagai alternatif, termasuk produk tanpa penjualan (nilai kriteria nol). Jika skor akhir sama, nama produk menjadi pemecah seri. Setiap perhitungan baru menyimpan evaluasi dan semua hasil dalam satu transaksi database. Snapshot lama tidak dihitung ulang. Skema belum merekam bobot historis per snapshot; halaman menyebut bobot yang ditampilkan sebagai bobot aktif saat ini.

Menu penilaian barang mandiri masih belum tersedia; nilai C1–C6 dihitung langsung dari riwayat penjualan dan identitas pelanggan. Perlu validasi manual pemilik/penelitian untuk memastikan interpretasi identitas pelanggan tanpa nomor telepon dan rentang bulan inklusif sesuai metodologi penelitian.

Tabel transaksi saat ini tidak memiliki status batal/retur. Pembatalan memerlukan perubahan skema aditif dan aturan yang disepakati. Form transaksi baru belum mengurangi stok; alur transaksi historis tidak boleh mengubah stok secara otomatis tanpa aturan bisnis yang dikonfirmasi.

Integrasi API baca langsung ke database juga sudah diperiksa memakai sesi uji sementara: GET products, transactions, evaluations, evaluation results, dan dashboard summary semuanya HTTP 200. Respons berisi 8 produk, 18 transaksi, 2 snapshot SAW; snapshot terpilih memiliki 8 hasil. Sesi uji dihentikan setelah pemeriksaan dan tidak menulis data.

## Verifikasi fitur kalkulasi SAW

- `npm run check`: lulus.
- `npm test`: 13 lulus, 0 gagal, termasuk uji formula C5/C6 dengan data manual, endpoint akun, dan validasi password pendek.
- `npm run build`: lulus, 1.597 modul.
- Tes tidak menulis ke database live. Belum dibuat snapshot baru di database live; Admin dapat menyimpan hasil dari menu Perhitungan SAW setelah memilih periode yang benar.

## Pengelolaan akun dari aplikasi

- Sidebar Admin memuat menu Username & password untuk mengubah username/password akun Admin dan Pimpinan.
- Autentikasi sekarang memakai tabel `users` yang sudah ada. Hash password aktif disinkronkan dari konfigurasi sebelumnya; tidak ada tabel baru dan tidak ada data transaksi/SAW yang diubah.
- Endpoint pengaturan akun memerlukan peran Admin; daftar akun tidak mengirim hash password. Perubahan akun Admin meminta password Admin saat ini. Perubahan akun mengakhiri semua sesi agar kredensial baru harus dipakai saat masuk lagi.
- `backend/.env` tidak lagi menyimpan `AUTH_*` lama. `SESSION_SECRET` dan konfigurasi database tetap lokal; salinan sebelum perpindahan tersedia di `database/backups/backend-env-before-database-accounts-20261018.bak`.
- Pemeriksaan API lokal: login Admin HTTP 200; daftar akun menampilkan dua username dan peran tanpa hash password.
- Pemeriksaan akhir: `npm run check` lulus; `npm test` 13 lulus, 0 gagal; frontend build lulus (1.597 modul).

Password baru pada menu akun sekarang menerima panjang berapa pun selama tidak kosong (1–1.024 karakter). Form tetap meminta konfirmasi ulang password baru.

## Perbaikan akses menu Pimpinan — 18 Oktober 2026

- Menu Penilaian barang kini membuka matriks nilai mentah dan normalisasi C1–C6 dari transaksi pada rentang tanggal yang dipilih.
- Menu Perhitungan SAW pada akun Pimpinan kini menjalankan pratinjau baca-saja yang menunjukkan nilai, kontribusi bobot, dan ranking sementara. Pimpinan tidak dapat menyimpan snapshot atau mengubah data.
- Menu Pimpinan kini juga memuat Laporan. Hasil permanen tetap dibuat Admin; API POST `/api/evaluations` tetap menolak Pimpinan.
- API GET `/api/evaluations/preview` memakai data produk, transaksi, kriteria dan bobot yang sama dengan kalkulasi SAW, tanpa operasi tulis ke database. Kriteria tidak valid atau bobot yang belum 100% ditolak dengan pesan yang jelas.
- Verifikasi: frontend build lulus; backend syntax check lulus; 14 tes lulus termasuk pemeriksaan preview Pimpinan tanpa operasi tulis dan penolakan simpan snapshot.

## Kode produk otomatis — 18 Oktober 2026

- Form tambah produk menampilkan kode NW berikutnya secara otomatis dan tidak mengizinkan kode tersebut diedit manual.
- Backend menghitung ulang urutan kode dalam transaksi database dengan penguncian baca, lalu menyimpan kode final NW-###. Nomor produk nonaktif tetap dihitung agar kode tidak terpakai ulang.
- Katalog yang diaudit berakhir di NW-008, jadi kode pratinjau produk baru berikutnya adalah NW-009. Tidak ada produk yang ditambahkan dalam pekerjaan ini.
- Verifikasi: frontend build dan backend syntax check lulus; 15 tes backend lulus. Tes urutan kode memakai database mock.

## Perapihan dashboard, harga, dan rentang penilaian — 18 Oktober 2026

- Urutan menu Admin disusun menjadi fitur kerja, Laporan, Username & password, lalu Pengaturan. Menu Pimpinan dipilih berdasarkan alamat fitur sehingga tidak ikut bergeser saat susunan Admin berubah.
- Harga produk kini ditampilkan sebagai rupiah tanpa desimal dan dengan pemisah ribuan Indonesia (contoh `Rp 75.000`). Form menerima angka seperti `35.000` lalu mengirim nilai numerik ke API.
- Dashboard kini menyediakan pilihan semua data, per tanggal, dan per bulan. Filter memengaruhi jumlah transaksi, unit terjual, omzet, serta snapshot FINAL yang rentangnya mencakup periode pilihan. Produk aktif dan kesiapan kriteria tetap merupakan ringkasan katalog saat ini.
- Halaman Penilaian barang/Perhitungan SAW membaca tanggal transaksi pertama dan terakhir sebagai rentang awal. Halaman memberi tahu jumlah transaksi yang tersedia dan menandai bila rentang pilihan tidak memuat transaksi.
- API ringkasan dashboard memakai parameter tanggal tervalidasi dan query berparameter. API rentang penilaian hanya membaca data. Tidak ada perubahan skema, transaksi, atau snapshot database.
- Verifikasi: `npm run check` lulus; 16 tes backend lulus; frontend production build lulus (1.599 modul). Tes filter tanggal menggunakan database mock dan memeriksa bahwa data katalog/kriteria tidak ikut terfilter.

## Transaksi demo dan laporan operasional — 18 Oktober 2026

- Sebelum penambahan data, backup penuh database MariaDB (struktur dan data) dibuat di `database/backups/spknuansawangi-before-demo-transactions-20261018.sql`.
- Ditambahkan 24 transaksi sintetis bertanggal Januari–Desember 2025, dengan 89 baris produk. Invoice memakai awalan `DEMO-NW-` dan catatan `DEMO:`; nama pelanggan juga jelas berlabel demo. Ini contoh untuk demonstrasi, bukan catatan pembelian aktual.
- Nilai keranjang berada pada rentang Rp500.000–Rp3.975.000 dan dihitung memakai harga katalog saat ini. Produk katalog dan stok tidak diubah; data lama tidak dihapus.
- Menu Laporan kini menarik ringkasan, tren bulanan, kinerja produk, dan rincian transaksi dari database. Periode dapat difilter; tombol cetak membuka dialog browser untuk mencetak atau menyimpan PDF. Ekspor CSV berformat kompatibel Excel tersedia terpisah untuk produk dan transaksi. Ringkasan JPG menampilkan maksimal 12 produk teratas.
- API laporan dibatasi ke role Admin/Pimpinan dan menggunakan filter tanggal tervalidasi. Data transaksi DEMO ditandai pada halaman laporan dan tetap dapat dibedakan dari transaksi tersimpan.
- Verifikasi data: 24 transaksi, 12 bulan berbeda, 89 baris produk, 235 unit; omzet demo Rp20.175.000, nilai transaksi minimum Rp500.000 dan maksimum Rp3.975.000. Query laporan diuji baca-saja terhadap rentang demo. Pemeriksaan sintaks backend dan frontend production build lulus (1.600 modul). Tidak ada perubahan skema database.
- `MulaiUlang-SPK-Nuansa-Wangi.bat` disediakan untuk memuat ulang API lalu membuka Laporan; skrip PowerShell memverifikasi identitas API dan proses Node sebelum menghentikan backend.
