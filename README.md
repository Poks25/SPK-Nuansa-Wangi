# SPK Nuansa Wangi — Best Seller Parfum

Sistem pendukung keputusan untuk pemeringkatan produk parfum terlaris Toko Nuansa Wangi menggunakan SAW. Aplikasi memakai React + Vite, Node.js + Express, dan MySQL XAMPP.

## Menjalankan aplikasi lokal

Gunakan Node.js 22.12 atau lebih baru dan pastikan MySQL XAMPP berjalan.

1. Jalankan backend dari folder `backend` dengan `npm run dev` (API: `http://localhost:3002`).
2. Jalankan frontend dari folder `frontend` dengan `npm run dev` (umumnya `http://localhost:5173`).
3. Buka alamat frontend yang ditampilkan Vite. Folder `htdocs` sendiri tidak menjalankan Vite melalui Apache.

Konfigurasi rahasia dan koneksi database tetap di `backend/.env`. Jangan menimpa file lokal yang sudah ada atau membagikan isinya. `.env.example` adalah panduan saja. Akun aplikasi disimpan pada tabel `users`.

## Fitur yang tersedia

- Login dengan peran Admin dan Pimpinan.
- Dashboard ringkasan database, katalog produk, dan pencatatan transaksi penjualan.
- Pada transaksi baru, nama dan nomor pelanggan dapat dicatat untuk mendukung pengukuran pelanggan unik/pembelian ulang.
- Pengelolaan kriteria dan bobot, serta perhitungan SAW baru untuk rentang tanggal tertentu.
- Admin dapat mengubah username/password Admin dan Pimpinan lewat menu sidebar **Username & password**. Password di-hash; setelah perubahan, semua sesi diminta login ulang.
- Hasil ranking tersimpan, riwayat snapshot, dan laporan cetak.
- Pimpinan dapat membaca dashboard, ranking, dan laporan; transaksi dan perhitungan baru hanya untuk Admin.

Username akun harus 3–60 karakter. Password baru boleh pendek, tetapi tidak boleh kosong. Mengubah akun Admin meminta password Admin saat ini; hanya Admin yang bisa mengubah kedua akun.

### Jika lupa password

Halaman login menyediakan **Lupa password?** untuk Admin atau Pimpinan. Pemulihan lokal memakai kode pemulihan server karena aplikasi ini belum memakai email. Siapkan kode satu kali dari folder `backend` dengan `npm run auth:recovery-code`, simpan kodenya di tempat aman di luar folder proyek, lalu mulai ulang backend. Kode ditampilkan hanya saat dibuat; server hanya menyimpan hash-nya. Masukkan username akun, kode pemulihan, dan password baru di halaman login. Kode berlaku untuk kedua role dan tetap dapat dipakai kembali; jaga kerahasiaannya. Jika kode hilang, buat kode baru dengan perintah yang sama saat backend berhenti, lalu mulai ulang backend.

## Aturan perhitungan

Kriteria C1–C4 mengikuti nilai transaksi pada rentang tanggal: unit terjual, jumlah transaksi yang memuat produk, omzet, dan pelanggan unik. C5 menghitung pelanggan yang membeli produk pada sedikitnya dua transaksi berbeda. C6 adalah jumlah bulan dengan penjualan dibagi jumlah bulan kalender pada rentang perhitungan (inklusif).

Identitas pelanggan memakai nomor telepon setelah normalisasi digit. Jika nomor telepon kosong, nama pelanggan digunakan setelah normalisasi; nama generik “Pelanggan Umum” tanpa telepon tidak dihitung sebagai pelanggan unik atau pembeli ulang. Produk aktif tetap menjadi alternatif walaupun tidak ada penjualan selama periode. Jika skor sama, urutan nama produk menjadi pemecah seri.

Snapshot lama tidak dihitung ulang. Skema saat ini tidak menyimpan salinan bobot pada setiap snapshot; halaman hasil menampilkan bobot aktif sekarang dan memberi label demikian. Hasil lama tetap menyimpan nilai mentah, normalisasi, skor, dan urutan yang sudah tercatat.

## Perlindungan data dan batasan

- Database live tidak dihapus atau di-reset. Backup audit tersimpan pada `database/backups/` dan diabaikan Git.
- Perhitungan baru hanya menambah satu snapshot evaluasi dan hasilnya dalam transaksi database atomik. Tidak mengubah riwayat penjualan maupun stok.
- Pencatatan transaksi baru memakai harga katalog; pengurangan stok belum diterapkan.
- Tabel transaksi belum memiliki mekanisme batal/retur.
- Sebelum perubahan skema, buat backup database baru dan gunakan migrasi aditif yang ditinjau.

## Pemeriksaan

Di backend jalankan `npm run check` dan `npm test`. Di frontend jalankan `npm run build`.
