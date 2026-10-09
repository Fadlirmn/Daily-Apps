# Arunika — Daily Apps

Aplikasi terpadu untuk mengelola **tugas harian, kebiasaan, dan keuangan pribadi** dalam satu tempat. Mobile-first (bottom-nav + FAB) dan adaptif desktop (sidebar).

> Detail audit desain, temuan, dan roadmap improvement: lihat [`prd.md`](./prd.md). Prinsip: **jangan ubah fungsi awal** — semua usulan bersifat aditif.

## Fitur

- **Hari Ini** — ringkasan uang hari ini (terbelanja, sisa aman, progress budget Rp 180.000), tugas hari ini (toggle selesai), kebiasaan, transaksi terbaru.
- **Aktivitas** — progres harian + segmented view Tugas / Jadwal / Kebiasaan.
- **Keuangan** — total saldo, segmented view Transaksi / Anggaran / Target tabungan.
- **Laporan** — arus kas bersih, pemasukan vs pengeluaran, tren pengeluaran, pengeluaran terbesar.
- **QuickAdd** — bottom-sheet tambah transaksi (Pengeluaran / Pemasukan / Transfer, kategori, dompet, tanggal) + snackbar konfirmasi + Urungkan.

## Tech Stack

- React 19 + React DOM 19
- Vite 8 + `@vitejs/plugin-react`
- Tailwind CSS v4 (`@tailwindcss/vite`)
- TypeScript 5.7, pnpm 10, Node 22 (lihat `mise.toml`)

## Struktur Proyek

```
├── src/
│   ├── App.tsx        # Seluruh UI (Today, Activity, Finance, Report, QuickAdd)
│   ├── main.tsx       # Entrypoint React, mount #root
│   ├── index.css      # Tailwind v4 + design token (@theme)
│   └── vite-env.d.ts
├── index.html         # Shell Vite (placeholder Figma Make)
├── vite.config.ts     # React + Tailwind + plugin Figma Make, alias @ → src
├── package.json       # Scripts: dev, build, preview, format
├── mise.toml          # Toolchain Node 22 + pnpm 10.34.3
├── make/              # Konfigurasi Figma Make (site.json, dev.json, scripts)
├── prd.md             # Audit desain + daftar improvement
├── Dockerfile         # Multi-stage build → nginx
└── docker-compose.yml # Jalankan via compose
```

## Quickstart (lokal)

Prasyarat: Node 22 + pnpm 10 (atau gunakan `mise install`).

```bash
pnpm install
pnpm dev
```

Buka `http://localhost:8443` (atau sesuai `$PORT`). Hot reload aktif.

### Scripts

| Script         | Perintah        | Keterangan                    |
|----------------|-----------------|-------------------------------|
| `pnpm dev`     | `vite`          | Dev server (`$PORT`, default 8443) |
| `pnpm build`   | `vite build`    | Build produksi ke `dist/`     |
| `pnpm preview` | `vite preview`  | Preview hasil build           |
| `pnpm format`  | `oxfmt`         | Format kode                   |

## Docker

### Setup environment (wajib sebelum compose up)

Backend ( `api/server.js` ) menolak start tanpa `JWT_SECRET` dan `POSTGRES_PASSWORD` di-set eksplisit — tidak ada default rahasia yang ter-commit di repo.

```bash
cp .env.example .env
# isi POSTGRES_PASSWORD dan JWT_SECRET, misal:
#   openssl rand -hex 24   # untuk POSTGRES_PASSWORD
#   openssl rand -hex 32   # untuk JWT_SECRET
```

### Via Docker Compose (disarankan)

```bash
docker compose up --build -d
```

Pada first boot, `db/schema.sql` otomatis dijalankan untuk membuat tabel-tabel yang dibutuhkan (lihat `docker-entrypoint-initdb.d`).

Buka `http://localhost:8099`.

### Via Docker CLI

```bash
docker build -t daily-apps .
docker run -d -p 8099:80 --name daily-apps daily-apps
```

Image memakai multi-stage build: `node:22-alpine` untuk build → `nginx:alpine` untuk serve `dist/` dengan fallback SPA (`try_files $uri /index.html`).

> Catatan: `vite.config.ts` mengimpor `./.figma/make/site.json` yang hanya ada di environment Figma Make. Dockerfile otomatis memakai `make/site.json` sebagai fallback bila file tersebut tidak ada, jadi `docker build` tetap berhasil di luar Figma Make. Port host default `8099` dipakai karena `8080` umumnya sudah terisi di mesin dev — ubah mapping port bila perlu (mis. `"8080:80"`).

## Konfigurasi

- `PORT` — port dev server Vite (default `8443`).
- `FIGMA_PUBLIC_URL` — base path build (default `/`).
- `FIGMA_DEV_SERVER_HOST` — host dev server (default `0.0.0.0`).

## Catatan

- Semua data saat ini masih **mock/hardcoded** di `src/App.tsx` (state lokal React, tanpa backend/persistensi).
- Jangan ubah fungsi awal yang terdaftar di `prd.md` §3 tanpa persetujuan — improvement harus aditif.
