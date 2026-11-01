# Panduan Konfigurasi Login Vercel — SPK Nuansa Wangi

## 1. Penyebab Login Gagal di Vercel

Saat aplikasi frontend berjalan di Vercel ([spk-nuansa-wangi.vercel.app](https://spk-nuansa-wangi.vercel.app)):
1. Frontend memanggil endpoint `/api/auth/login`.
2. Vercel secara default hanya menampung berkas statis frontend (Vite/React).
3. Jika backend Express dan database MySQL belum di-deploy ke cloud, Vercel merespons dengan HTTP 405 atau mengalihkan request ke halaman utama (HTML).
4. Akibatnya, frontend tidak menerima format JSON dan menampilkan pesan:
   > *"Server API tidak terhubung. Backend belum aktif atau VITE_API_BASE_URL / proxy /api di Vercel belum diatur."*

---

## 2. Cara Menghubungkan Frontend Vercel ke Backend Online

Setelah backend di-deploy online (misalnya ke Render, Railway, atau VPS) dan database MySQL online aktif:

### Opsi A (Disarankan): Reverse Proxy via `vercel.json`
Salin isi `vercel.with-backend.example.json` ke `vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://nama-backend-anda.onrender.com/api/:path*"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/"
    }
  ]
}
```
*Keunggulan:* Request `/api` diteruskan secara same-origin sehingga cookie sesi `httpOnly` tetap aman dan berjalan tanpa isu cookie lintas-domain.

### Opsi B: Environment Variable `VITE_API_BASE_URL`
1. Buka Dashboard Vercel > Project Settings > Environment Variables.
2. Tambahkan variabel:
   - Nama: `VITE_API_BASE_URL`
   - Nilai: `https://nama-backend-anda.onrender.com`
3. Di backend `.env`:
   - `FRONTEND_ORIGIN=https://spk-nuansa-wangi.vercel.app`
   - `COOKIE_SAMESITE=none`
   - `COOKIE_SECURE=true`
4. Lakukan redeploy di Vercel agar Vite meng-compile nilai `VITE_API_BASE_URL`.

---

## 3. Checklist Akun & Database
- Pastikan akun login sudah terdaftar di database MySQL.
- Gunakan perintah `npm run auth:reset -- <username> <passwordBaru> ADMIN` di folder backend untuk membuat atau mereset password akun.
- Pastikan endpoint `GET /api/health` pada backend mengembalikan status `ok`.

