# Laporan Eksekusi — Phase 2: Authentication & Role Access

**Tanggal:** 13 Oktober 2026  
**Status:** selesai; berhenti sebelum Phase 3 sesuai gerbang persetujuan.

## Hasil

- Login Admin/Pimpinan menggunakan username dan password yang diverifikasi di backend.
- Password disimpan dalam bentuk hash scrypt; utilitas lokal meminta password tanpa menampilkannya.
- Sesi memakai cookie HttpOnly, SameSite Strict, Secure saat production, masa berlaku delapan jam, dan logout mencabut sesi aktif.
- Dashboard memeriksa sesi melalui API sebelum tampil. Menu Admin dan Pimpinan berbeda; dashboard Pimpinan tetap baca saja.
- Middleware autentikasi dan pembatasan role tersedia untuk endpoint terlindungi.
- Data pada dashboard masih ilustrasi berlabel `DEMO`.
- Akun dan hash dikonfigurasi melalui environment. Database XAMPP/MariaDB belum digunakan.

## File yang dibuat/diubah

- Backend: `src/routes/authRoutes.js`, `src/services/authService.js`, `src/middleware/auth.js`, `src/server.js`, `src/config/database.js`, `scripts/create-password-hash.js`, `test/auth.test.js`, `test/auth-api.test.js`, `package.json`, `.env.example`, dan `package-lock.json`.
- Frontend: `src/auth/AuthContext.jsx`, `src/main.jsx`, `src/App.jsx`, `src/styles.css`, dan `package-lock.json`.
- Root: `.gitignore`, `README.md`, dan `SOT/IMPLEMENTATION_PLAN.md`.

## Pemeriksaan

- Node.js tersedia: `v24.21.0`.
- `backend: npm run check` — lulus.
- `backend: npm test` — **6 lulus, 0 gagal**. Mencakup login valid/tidak valid, cookie, sesi, logout/pencabutan, konfigurasi hash, middleware role, dan health API.
- `frontend: npm run build` — lulus; Vite menghasilkan bundle production.
- Instalasi dependency backend dan frontend — berhasil; npm melaporkan 0 kerentanan pada kedua instalasi.
- XAMPP MySQL/MariaDB tersedia di port `3306`, tetapi aplikasi belum membuka koneksi ke sana.

## Kriteria penerimaan Phase 2

- [x] Kredensial memakai hash; tidak ada akun atau password default yang ditanam di kode.
- [x] Login gagal mengembalikan pesan aman dan tidak mengungkap apakah username atau password yang salah.
- [x] Sesi diproteksi cookie HttpOnly; dashboard mengharuskan autentikasi.
- [x] Logout menghapus cookie dan mencabut sesi aktif di backend.
- [x] Role Admin/Pimpinan dibaca dari sesi backend; navigasi disesuaikan dengan peran.
- [x] Pemeriksaan sintaks, tes backend, dan production build frontend lulus.

## Setup pertama kali

Belum ada `backend/.env` agar secret dan hash tetap dibuat pemilik secara lokal. Ikuti instruksi autentikasi di `README.md`, siapkan secret dan dua hash, lalu jalankan backend dan frontend.

## Batasan

- Akun dikonfigurasi melalui environment dan belum bisa dikelola dari aplikasi.
- Sesi disimpan di memori proses. Restart backend mengeluarkan semua sesi; konfigurasi ini untuk fondasi aplikasi satu proses.
- Dashboard masih data DEMO.
- Integrasi database, skema user/master data, CRUD, SAW, ranking nyata, dan laporan belum dibuat.

## Gerbang akhir

Phase 2 selesai. Hentikan implementasi dan tunggu persetujuan eksplisit sebelum memulai Phase 3.

## Verifikasi ulang setelah scope diselaraskan — 18 Oktober 2026

- Autentikasi memakai hash scrypt, sesi bertanda tangan, cookie HttpOnly/SameSite Strict, logout yang mencabut sesi, dan role backend.
- Tes API memverifikasi login Pimpinan berhasil, tetapi permintaan tulis `POST /api/items` ditolak dengan HTTP 403 (`FORBIDDEN`).
- `npm run check` — lulus.
- `npm test` — 6 lulus, 0 gagal.
- Tes berjalan memakai konfigurasi uji dalam test; database live dan `backend/.env` tidak diakses atau diubah.
- Phase 2 memenuhi pemeriksaan autentikasi/role pada baseline ini. Endpoint/master data yang masih memakai model inventaris lama belum diselaraskan dengan model parfum/penjualan; itu berada di fase berikutnya.
