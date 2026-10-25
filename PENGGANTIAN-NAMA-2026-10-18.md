# Catatan Penggantian Nama — 18 Oktober 2026

- Folder proyek dipindahkan dari `C:\xampp\htdocs\SPK-Parfum-Phase1` ke `C:\xampp\htdocs\SPK Nuansa Wangi`. Tidak ada source aplikasi yang dihapus.
- Backup database terbaru: `database/backups/spk-parfum-before-rename-20261018.sql`.
- Database `SPKNuansaWangi` dibuat dari backup. Verifikasi menunjukkan 10 tabel dan 105 baris, sama dengan database `spk_parfum`. Database lama dipertahankan sebagai cadangan; tidak ada tabel lama yang dihapus.
- `backend/.env` dan default di `.env.example`/`src/config/database.js` diarahkan ke database baru. Akun aplikasi mendapat hak pada database baru saja.
- `index.html` di folder proyek mengarahkan alamat Apache ke dashboard aplikasi pada port 5173. `Buka-SPK-Nuansa-Wangi.bat` menjalankan backend/frontend yang belum aktif dan membuka alamat tersebut.
- Pemeriksaan lokal: Apache route HTTP 200, dashboard Vite HTTP 200, API health `ok`, koneksi akun aplikasi ke database baru berhasil.

Setelah komputer dinyalakan, hidupkan Apache dan MySQL di XAMPP, lalu jalankan `Buka-SPK-Nuansa-Wangi.bat`. Alamat awalnya `http://localhost/SPK%20Nuansa%20Wangi/`; halaman meneruskan browser ke aplikasi pada port 5173.

- Identitas visual diperbarui memakai logo kiriman pengguna (`frontend/public/spk-nuansa-wangi-logo.png`), favicon aplikasi, dan palet terang cyan/biru muda untuk login serta workspace. Build frontend berhasil.

- 2026-10-18: Logo diganti dengan crop botol parfum agar mengisi kotak logo 52×52; ditambahkan pemilih tema biru muda/biru tua dengan preferensi tersimpan di browser untuk halaman masuk dan workspace.

- 2026-10-18: Ditambahkan menu Pengaturan khusus Admin: unggah/ganti/pulihkan logo (PNG/JPG/WebP, maksimal 1,5 MB), pilih tema biru muda/biru tua, dan akses cepat ke akun, bobot SAW, serta laporan. Logo dan tema disimpan di localStorage browser, tanpa perubahan database. File halaman: frontend/src/SettingsPage.jsx.
