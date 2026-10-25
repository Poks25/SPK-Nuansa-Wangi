# Laporan Eksekusi — Phase 3

**Tanggal:** 18 Oktober 2026  
**Status:** Implementasi master data selesai; skema, akun aplikasi terbatas, dan koneksi database telah disiapkan pada MySQL XAMPP lokal.

## Hasil

- CRUD barang, kriteria, dan subkriteria melalui API berparameter; operasi tulis hanya untuk Admin.
- Pencarian daftar, status aktif, validasi input, penanganan kode/relasi duplikat, dan tampilan read-only untuk Pimpinan.
- Pengaturan bobot batch untuk seluruh kriteria aktif, dengan validasi bobot positif dan total 1,00 (100%).
- Skema InnoDB dan foreign key untuk `items`, `criteria`, `subcriteria`, dan `criterion_weights`.
- Database `spk_parfum` dibuat setelah pemeriksaan memastikan database tersebut belum ada. Akun `spk_app` hanya memiliki SELECT/INSERT/UPDATE/DELETE pada database proyek. Rahasia lokal disimpan di `backend/.env` yang diabaikan Git.
- Tidak ada seed kriteria, skor, barang, atau bobot yang belum divalidasi.

## Pemeriksaan

- `backend`: `npm run check` berhasil.
- Koneksi ke MySQL XAMPP dengan akun `spk_app` berhasil; tabel yang ditemukan: `criteria`, `criterion_weights`, `items`, `subcriteria`.
- Build frontend Vite berhasil (1.592 modul ditransformasi). Percobaan sandbox awal terkena `EPERM`; build berhasil setelah dijalankan dengan izin baca workspace.

## Batasan

- Akun Admin/Pimpinan tetap perlu dikonfigurasi sesuai README dan `.env.example`; password tidak dibuat atau dipilih otomatis.
- Kriteria dan bobot final harus diisi berdasarkan validasi penelitian/pemilik toko.
- Penilaian barang (Phase 4), perhitungan SAW dan ranking (Phase 5), serta laporan (Phase 6) belum dibuat.

**Gerbang:** Phase 3 selesai. Implementasi berhenti di sini; Phase 4 memerlukan persetujuan eksplisit.
