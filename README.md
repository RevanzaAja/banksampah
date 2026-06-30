# Bank Sampah Mandiri (BSM)

Sistem informasi manajemen Bank Sampah Mandiri (BSM) berbasis web full-stack.

## Teknologi
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Express.js, Sequelize ORM
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Vercel

## Cara Menjalankan Lokal

1. Buat file `.env` di folder `backend/` dan `frontend/` sesuai contoh.
2. Jalankan perintah instalasi di root folder:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. Jalankan server (Frontend + Backend akan berjalan bersamaan):
   ```bash
   npm run dev
   ```

## Struktur Proyek
- `frontend/`: React + Vite SPA
- `backend/`: Express.js API
