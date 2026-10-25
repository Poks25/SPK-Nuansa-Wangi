# Catatan Perubahan — Pemulihan Password

Tanggal: 18 Oktober 2026

## Perubahan

- Halaman login menyediakan tautan **Lupa password?** untuk reset akun Admin atau Pimpinan dengan username, kode pemulihan, dan password baru.
- Backend membandingkan kode pemulihan dengan hash scrypt di `backend/.env`, membatasi percobaan menjadi lima kali per alamat IP per 15 menit, menyimpan password baru sebagai hash, dan mengakhiri semua sesi aktif.
- `backend/scripts/create-recovery-code.js` membuat kode acak dan menyimpan hanya hash ke `.env`. Kode teks biasa hanya ditampilkan saat dibuat.
- Panduan penggunaan ditambahkan ke `README.md`.

## Data dan batasan

- Tidak ada perubahan skema atau isi database.
- Aplikasi tidak mengirim email pemulihan. Kode perlu disimpan pemilik di tempat aman. Jika hilang, buat kode pengganti dari folder `backend`, lalu mulai ulang backend.
- Kode berlaku untuk Admin dan Pimpinan. Kode ini memberi hak reset password, jadi jangan membagikannya.

## Pemeriksaan

- `npm run check` di backend: lulus.
- `npm run build` di frontend: lulus (1.600 modul diproses).
