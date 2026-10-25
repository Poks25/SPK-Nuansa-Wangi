# AGENTS.md — Kontrak Kerja Proyek SPK Best Seller Parfum

## Misi

Bangun Sistem Pendukung Keputusan untuk pemeringkatan produk parfum terlaris Toko Nuansa Wangi berbasis web menggunakan SAW dan pengembangan RAD. Jangan mengembalikan scope ke prioritas pengadaan bahan baku/perlengkapan tanpa persetujuan eksplisit pengguna.

## Sumber kebenaran

1. `SOT/PRD.md` — masalah, pengguna, kebutuhan, aturan produk, algoritma, batasan.
2. `SOT/UI-GUIDELINE.md` — identitas visual, komponen, layout, interaksi, aksesibilitas.
3. `SOT/IMPLEMENTATION_PLAN.md` — fase, keluaran, kriteria penerimaan, dan gerbang persetujuan.

Jika ada pertentangan atau keputusan riset belum tersedia, jangan menebak; jelaskan dan minta keputusan pengguna. Laporan fase lama adalah catatan historis, bukan bukti bahwa source code saat ini masih tersedia.

## Gerbang persetujuan

- Jangan memulai fase implementasi tanpa persetujuan eksplisit untuk fase itu.
- Persetujuan satu fase tidak otomatis menyetujui fase berikutnya.
- Setelah fase selesai, laporkan file, fungsi, pemeriksaan dan hasil, masalah tersisa, serta kriteria penerimaan, lalu berhenti.
- Database live tidak boleh dihapus/reset. Perubahan skema harus berupa migrasi aditif yang ditinjau, didahului backup yang dapat dipulihkan.

## Stack

- Frontend: React + Vite, JavaScript, React Router, Tailwind CSS, Lucide React.
- Backend: Node.js + Express.js, JavaScript ESM, REST API.
- Database: MySQL melalui `mysql2` dan query berparameter.
- SAW di backend sebagai service terpisah dengan unit test.
- Jangan mengganti ke PHP, Next.js, MongoDB, atau framework lain tanpa persetujuan.

## Aturan implementasi

- Implementasikan hanya fitur dari PRD dan fase yang disetujui.
- Pisahkan UI, route/controller, service/aturan bisnis, dan akses data.
- Validasi input di backend; lindungi semua endpoint sesuai role.
- Hash password; simpan rahasia di environment backend; `.env` tidak boleh dikomit.
- Gunakan parameterized query; jangan masukkan input pengguna langsung ke SQL.
- Tangani loading, empty, success, validation, dan error dalam Bahasa Indonesia.
- Jangan tampilkan data dummy sebagai fakta; beri label `DEMO`.
- Jangan klaim hasil SAW valid sebelum cocok dengan perhitungan manual.
- Jangan menentukan kriteria/bobot penelitian berdasarkan tebakan.

## UI/UX

Ikuti SOT: Midnight Navy + Champagne Gold, gaya operasional yang bersih dan analitis. Utamakan keterbacaan tabel, kriteria, bobot, perhitungan, dan ranking. UI responsif, fokus keyboard jelas, label form terbaca, status tidak dibedakan dengan warna saja. Tidak ada dark mode atau halaman marketing tanpa persetujuan.
