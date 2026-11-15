# iC — React + Express + MySQL + Tailwind CSS

MVP media sosial internal untuk UJK Junior Web Programmer.

## Prasyarat
- Node.js >= 20.19 (disarankan 22 LTS) dan npm
- MySQL 8+ (atau MariaDB 10.6+)

## Menjalankan
```bash
# 1) Backend
cd server
cp .env.example .env        # isi DB_USER / DB_PASSWORD sesuai MySQL Anda
npm install
npm run db:init             # membuat database + 5 tabel
npm run dev                 # http://localhost:3000

# 2) Frontend (terminal baru)
cd client
npm install
npm run dev                 # http://localhost:5173  <- buka ini
```

## Produksi (satu server)
```bash
cd client && npm run build
cd ../server && NODE_ENV=production CLIENT_ORIGIN=https://domain-anda.com npm start
```
Express menyajikan hasil build React. Wajib lewat HTTPS (cookie sesi `Secure`).

## Keamanan
- Password di-hash **argon2id**; login memakai perbandingan hash + respons seragam (anti user enumeration)
- Sesi: token acak 256-bit di cookie `HttpOnly` + `SameSite=Lax`; di DB hanya hash SHA-256-nya; token baru tiap login/registrasi; logout menghapus sesi di server; ganti password mengeluarkan perangkat lain
- Semua query memakai **prepared statement** (`mysql2 execute`), input divalidasi **zod**
- CSRF: cek header `Origin` pada semua request yang mengubah data
- `helmet` (CSP, HSTS, dll), rate limit login/registrasi, batas body JSON 10 KB
- Upload: maks 2 MB, tipe dicek dari **isi file** (magic bytes: JPG/PNG/WEBP/GIF), nama acak UUID, SVG ditolak, file statis dikirim dengan CSP `sandbox` + `nosniff`
- Otorisasi: hapus postingan dicek di server (hanya pemilik), tombol hanya tampil untuk pemilik

## Pemetaan ke rubrik
| Rubrik | Lokasi |
|---|---|
| 1 Struktur DB | `server/schema.sql` (users, posts, likes, comments + FK CASCADE, UNIQUE likes) |
| 2 Registrasi & auto-login | `server/src/routes/auth.js`, `client/src/pages/Register.jsx` |
| 3 Guard & logout | `client/src/App.jsx` (Protected/Guest), `server/src/http.js` |
| 4 Profil & password | `server/src/routes/profile.js`, `client/src/pages/Profile.jsx` |
| 5 CRUD status | `server/src/routes/posts.js`, `client/src/pages/Feed.jsx` |
| 6 Like toggle & komentar gambar | `posts.js`, `Comments.jsx`, `PostCard.jsx` |
| 7 Keamanan | lihat daftar di atas |
