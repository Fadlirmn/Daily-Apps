# PRD — Arunika: Aktivitas & Keuangan Harian
> Hasil audit kode desain saat ini + daftar fitur & improvement. Prinsip utama: **jangan ubah fungsi awal** — semua usulan bersifat perbaikan aditif / kompatibel.

## 1. Ringkasan Produk

**Nama:** Arunika — Aktivitas & keuangan (tertera di desktop sidebar: `Arunika` / `Aktivitas & keuangan`).
**Deskripsi (dari `make/site.json`):** *"An integrated app for managing daily tasks and personal finances, helping users track their routines and budgets in one place for better financial discipline."*
**Pengguna contoh:** Raka — sapaan `Selamat pagi, Raka`, tanggal contoh `Senin, 28 September`.
**Bahasa & lokal:** Indonesia (`id-ID`), mata uang Rupiah (`Rp`, format `toLocaleString("id-ID")`).
**Platform:** Mobile-first (bottom-nav + FAB) + adaptif desktop (sidebar ≥64rem, kartu app-shell ≥48rem).
**Status saat ini:** Prototipe UI fungsional — semua data mock/hardcoded, state lokal React, tanpa backend/persistensi.

## 2. Stack & Inventaris Kode (aktual, hasil cek)

| File | Isi / Peran |
|---|---|
| `src/App.tsx` (±996 baris) | Seluruh UI dalam 1 file monolit: `Icon`, `Action`, `Today`, `Activity`, `Finance`, `Report`, `QuickAdd`, `App`, `NavItem`. Data `tasks[3]`, `transactions[3]` hardcoded di level modul. |
| `src/index.css` (±197 baris) | Tailwind v4 (`@import "tailwindcss"`) + `@theme` design token + custom class (`.bg-money-card`, `.bg-balance-card`, `.fab`, `.sheet`, `.scroll-area`, `.money`, `.material-symbols-rounded`). Font Roboto + Material Symbols Rounded via Google Fonts. |
| `src/main.tsx` | Entry React 19 `StrictMode`, import `index.css`, mount `#root`. |
| `index.html` | Shell Vite dengan placeholder Figma Make (`<!-- figma:lang -->`, `figma:title`, `figma:head-start/end`, `figma:body-start/end`). |
| `vite.config.ts` | React + Tailwind plugin, alias `@` → `src`, plugin `figmaSiteConfiguration` (title/deskripsi/OG/robots dari `site.json`), `figmaErrorOverlayReplay`, `figmaReactRefreshBoundaryFallback`, `figmaMakeKitPlugin`. Dev server `$PORT` default 8443. |
| `package.json` | `react@19`, `react-dom@19`, `tailwindcss@4`, `@tailwindcss/vite@4`, `vite@8`, `typescript@5.7`. Tanpa router, store, form, chart, test lib. |
| `make/site.json` | Deskripsi produk, `robots.index: false`, `accessibility.addBypassLinks: false`. |
| `make/dev.json` | Watch `package.json` + `pnpm-lock.yaml` untuk install ulang. |

**State global saat ini (`App`):**

```ts
active: "today" | "activity" | "finance" | "report" // default "today"
sheetOpen: boolean // default false
spent: number // default 94000
completed: number[] // default [1]
saved: boolean // toast 2800ms
```

Tidak ada `localStorage`, context, reducer, API, atau routing URL.

## 3. Fungsi Awal — DIBEKUKAN (dilarang diubah)

Daftar ini adalah kontrak. Improvement tidak boleh menghilangkan/mengganti perilaku di bawah:

1. **4 tab utama:** Hari Ini (`today`), Aktivitas (`activity`), Keuangan (`finance`), Laporan (`report`).
2. **Navigasi mobile:** bottom-nav 5 kolom = 2 tab + FAB `+` tengah (`-mt-8`, `size-16`, `rounded-large`) + 2 tab. Active = pill `bg-primary-container` + ikon filled + label. `lg:hidden`.
3. **Navigasi desktop:** sidebar `lg:flex` 16rem berisi logo `all_inclusive` + `Arunika`, 4 nav pill, CTA `Tambah transaksi`, kartu `Tersimpan offline`. Konten max `64rem` center.
4. **Kartu Uang Hari Ini (Today):** label `UANG HARI INI`, `Sudah dibelanjakan Rp {spent}`, `SISA AMAN HARI INI Rp {180000 - spent}`, `{percent}% terpakai` dengan `percent = min(100, round(spent/180000*100))`, progressbar, hint `Kamu bisa belanja Rp 86.000 lagi tanpa khawatir.`
5. **Tugas hari ini:** 3 item tetap (`Review proposal klien 09.30 Kerja priority`, `Bayar tagihan internet 12.00 Keuangan finance`, `Beli kebutuhan dapur 18.00 Pribadi`), toggle lingkaran check → coret `line-through opacity-60`, counter `{completed.length}/3`, ikon `flag` merah & `payments` hijau.
6. **Kebiasaan (Today):** 3 kartu grid — `Minum air 6/8 gelas 75%`, `Olahraga 12 hari done`, `Membaca 20 menit done`. Selesai = lingkaran `bg-tertiary` + ikon `check`.
7. **Transaksi terbaru (Today):** hanya 2 item pertama + ikon di `bg-surface-container-high`.
8. **Activity:** kartu `PROGRES HARI INI {completed.length} dari 3` + bar, segmented `Tugas/Jadwal/Kebiasaan`, list tugas sama, jadwal 3 slot (09.30/12.00/18.00 + garis timeline), habit 3 baris dengan bar `w-3/4` / `w-full`.
9. **Finance:** `TOTAL SALDO Rp 8.452.000`, `+Rp 1.124.000 bulan ini`, segmented `Transaksi/Anggaran/Target`; tab Transaksi = 3 transaksi + kartu `ANGGARAN BULANAN Rp 2.840.000 tersisa` bar `w-2/5` + `42% dari Rp 4.900.000 terpakai`; tab Anggaran = 4 kategori (Makanan 1.280.000/1.800.000 `w-3/4 bg-warning`, Transportasi 420.000/900.000 `w-1/2 bg-primary`, Belanja 360.000/1.200.000 `w-1/3 bg-tertiary`, Lainnya 0/1.000.000 `w-0`); tab Target = 3 target (Laptop baru 8,5/15jt Des 2025 `w-3/5`, Liburan Jepang 4,2/12jt Apr 2026 `w-1/3`, Dana darurat 18/30jt Fleksibel `w-3/5`).
10. **Report:** segmented `Minggu/Bulan/Tahun` (default `Bulan`), `ARUS KAS BERSIH +Rp 3.240.000`, Pemasukan 8.450.000 / Pengeluaran 5.210.000, `Tren pengeluaran 12% lebih hemat`, bar chart 5 batang (Mei `h-20`, Jun `h-28`, Jul `h-24`, Agu `h-32`, Sep `h-24` highlight `bg-primary`), Top-3 (Makanan 1.860.000 36%, Rumah & tagihan 1.420.000 27%, Transportasi 780.000 15%).
11. **QuickAdd sheet:** dialog `absolute inset-0 z-50 bg-scrim`, sheet `rounded-t-sheet` + handle + animasi `slide-up 240ms`; tipe `Pengeluaran/Pemasukan/Transfer` (default Pengeluaran aktif); nominal `contentEditable` default `68.000` via `useRef(68000)`; chip kategori 4 (`Makanan` default, `Transport`, `Belanja`, `Lainnya`); kartu Dompet `Jago Pocket` + Tanggal `Hari ini`; tombol `Simpan transaksi` → `spent += amount`, tutup sheet, snackbar `Transaksi berhasil disimpan` + aksi `Urungkan`.
12. **Visual:** dark M3-like, kartu gradient + border 12–18% opacity, segmented `rounded-full bg-surface-container p-1`, FAB shadow, snackbar `bg-inverse-surface`, font tabular untuk angka (`.money`).

## 4. Spesifikasi Per Layar (Given/When/Then — sesuai kode)

### 4.1 Hari Ini (`Today`)
- **Header:** `Senin, 28 September` (`text-body-sm text-on-surface-variant`) + `Selamat pagi, Raka` (`text-headline`) + avatar `R` (`size-12 rounded-full bg-primary-container`).
- **Kartu uang:** `rounded-extra bg-money-card p-5`, ikon `account_balance_wallet`, tombol `arrow_outward`; sisa + persen + bar `h-2 bg-outline-variant` → isi `bg-tertiary`; hint ikon `tips_and_updates text-warning`.
- **Tugas:** judul `Tugas hari ini` + counter; `Lihat semua`; list `rounded-large bg-surface-container`, divider `border-outline-variant`; tiap baris toggle.
- **Kebiasaan:** judul + `2 dari 3 selesai`; grid-3 kartu `rounded-large bg-surface-container p-3 text-center`.
- **Transaksi:** judul + `Lihat semua`; `transactions.slice(0,2)`; nominal `text-expense`.

### 4.2 Aktivitas (`Activity`, segmented lokal `view`)
- Header `Aktivitas` + `Atur ritme harianmu` + tombol `calendar_month`.
- Kartu progres `rounded-extra bg-money-card` + ikon `task_alt filled text-icon-lg` + bar `bg-primary`.
- Segmented 3: `Tugas(check_circle) / Jadwal(calendar_today) / Kebiasaan(autorenew)` — aktif `bg-primary-container text-primary`.
- View Tugas: subtitle `{3 - completed.length} tugas masih perlu diselesaikan` + tombol `tune` + chevron kanan per baris.
- View Jadwal: `Jadwal hari ini` + `Senin, 28 September` + `Tambah`; kartu `rounded-large` + kolom waktu (`money text-primary`) + garis `w-0.5 bg-outline-variant`.
- View Kebiasaan: `Tambah`; baris ikon `bg-tertiary-container` + bar `h-1.5 bg-tertiary`.

### 4.3 Keuangan (`Finance`, segmented lokal)
- Header `Keuangan` + tombol `search`.
- Kartu saldo `rounded-extra bg-balance-card p-5` + `TOTAL SALDO` + `Rp 8.452.000` (`text-display`) + `trending_up +Rp 1.124.000 bulan ini` (`text-tertiary`).
- Tab Transaksi: grup `Hari ini` + `Pengeluaran Rp {spent}` + tombol `tune`; nominal income `text-income` / expense `text-expense`; kartu anggaran ringkas + ikon `donut_large` di `bg-warning-container`.
- Tab Anggaran & Target: sesuai daftar beku §3.9.

### 4.4 Laporan (`Report`, `period` lokal)
- Header `Laporan` + `Ringkasan September 2025` + tombol `ios_share`.
- Segmented `Minggu/Bulan/Tahun`.
- Kartu arus kas `bg-balance-card` + 2 mini-kartu `bg-surface-translucent` (income `south_west`, expense `north_east`).
- Kartu tren: `trending_down text-tertiary` + chart flex `h-32 items-end` batang `max-w-8 rounded-t-medium`.
- Top-3 list + `Rincian`.

### 4.5 QuickAdd + Snackbar + Navigasi
- Backdrop `Action` full-screen menutup sheet; tombol `close`; tipe 3 pill; input nominal `Rp` + `contentEditable` (`inputMode=numeric`, parse `replace(/\D/g,"")`); chip kategori border aktif `border-primary bg-primary-container`; 2 kartu dompet/tanggal `bg-surface`; tombol simpan `rounded-full bg-primary py-4`.
- Snackbar: `absolute bottom-28 z-40 bg-inverse-surface` + ikon `check_circle text-tertiary` + `Urungkan text-primary`.
- `NavItem`: kolom ikon (`h-8 w-16 rounded-full`, aktif `bg-primary-container`) + label `text-label-sm` + `sr-only id`.

## 5. Design System (token aktual `src/index.css`)

**Warna (`@theme`):** `background #121212`, `surface #1c1b1f`, `surface-container #211f26`, `surface-container-high #2b2930`, `surface-translucent rgb(255 255 255/8%)`, `primary #bfa9ff`, `on-primary #2a0f6b`, `primary-container #4a3a8f`, `secondary #ccc2dc`, `tertiary #7fd6c2`, `on-tertiary #00382f`, `tertiary-container rgb(127 214 194/14%)`, `on-surface #e6e1e5`, `on-surface-variant #cac4d0`, `outline #938f99`, `outline-variant #49454f`, `income #7ddc9a`, `expense #ff8a80`, `warning #ffd54f`, `warning-container rgb(255 213 79/12%)`, `nav rgb(28 27 31/96%)`, `scrim rgb(0 0 0/65%)`, `inverse-surface #e6e1e5`, `inverse-on-surface #313033`. Root page `background #0b0b0c`.

**Radius:** `medium .75rem`, `large 1rem`, `extra 1.5rem`, `sheet 1.75rem`. **Layout:** `max-width-mobile 30rem`, `max-width-desktop 90rem`, `sidebar 16rem`.

**Tipografi:** `label-sm .6875rem/1rem`, `label .875rem/1.25rem`, `body-sm .875rem/1.25rem`, `body 1rem/1.5rem`, `title 1.125rem/1.5rem`, `headline 1.625rem/2rem`, `display 2rem/2.5rem`, `money 2.25rem/2.75rem`, `icon-xs 1rem`, `icon-sm 1.25rem`, `icon-lg 2rem`. Angka pakai `.money { tabular-nums, tracking -0.025em }`.

**Ikon:** Material Symbols Rounded (`FILL 0..1`), helper `.icon-filled { FILL 1 }`. Font: Roboto 400/500/600.

**Efek:** `.bg-money-card` (radial ungu 18% + linear `#29233a→#201e26` + border ungu 12%), `.bg-balance-card` (radial teal 16% + linear `#27223b→#201e26`), `.fab` shadow `0 .5rem 1.75rem rgb(0 0 0/42%)`, `.app-shell` shadow `0 0 5rem rgb(0 0 0/40%)`, `.sheet` animasi `slide-up 240ms cubic-bezier(.2,0,0,1)`, `.pb-safe` pakai `env(safe-area-inset-bottom)`, `.scroll-area { height: calc(100vh-6.25rem); scrollbar-width: none }`, `prefers-reduced-motion` mematikan transisi/animasi.

**Responsif:** `<48rem` full-bleed; `≥48rem` app-shell kartu `radius 1.75rem` + margin `1rem`; `≥64rem` grid `sidebar 16rem + 1fr`, `desktop-content` header/main `min(100%,64rem)` center, main `height calc(100vh-7.5rem)`.

## 6. Model Data (mock sekarang → usulan aditif)

**Mock sekarang (TS implisit):**

```ts
tasks = [{ id, title, time: "09.30", tag, priority?: boolean, finance?: boolean }] // 3 item
transactions = [{ icon, title, place, amount: "-Rp 68.000"|"+Rp 1.500.000", tone: "expense"|"income" }] // 3 item
// sisanya inline di JSX: budgets[4], goals[3], schedules[3], habits Today[3], habits Activity[3], reportBars[5], topSpend[3]
```

**Usulan tipe aditif (belum dipakai, tidak mengubah fungsi):**

```ts
type Task = { id: string; title: string; time: string; tag: string; priority?: boolean; finance?: boolean; done: boolean };
type Transaction = { id: string; type: "expense"|"income"|"transfer"; amount: number; category: string; wallet: string; date: string; note?: string };
type Budget = { id: string; category: string; icon: string; spent: number; total: number };
type Goal = { id: string; title: string; icon: string; saved: number; target: number; dateLabel: string };
type Habit = { id: string; title: string; icon: string; meta: string; progress: number; done: boolean };
```

## 7. Temuan Audit (bug/inkonsistensi — diperbaiki tanpa ubah fungsi)

| # | Temuan | Dampak | Perbaikan yang diizinkan |
|---|---|---|---|
| 1 | `Today` render `transactions.slice(0,2)` (2 dari 3) | Pemasukan 1,5jt hilang di ringkasan | Tetap tampilkan sesuai desain, tapi tambah `Lihat semua` yang memang membuka daftar penuh (aditif) — jangan ubah potongan default tanpa persetujuan. |
| 2 | Hint `Rp 86.000 lagi` statis; seharusnya `180000 - spent` reaktif | Setelah QuickAdd, teks bohong | Hitung `remaining = 180000 - spent`, clamp ≥0; part存在 tetap sama. |
| 3 | Finance `42%` vs bar `w-2/5` (=40%) | Inkonsisten visual | Hitung persen dari `2060000/4900000 ≈ 42%` dan samakan lebar bar via style `%`. |
| 4 | `Urungkan` snackbar tidak melakukan apa-apa | Ekspektasi undo gagal | Simpan `lastAdded`, klik `Urungkan` → `spent -= lastAdded`, tutup toast. Fungsi simpan tetap sama. |
| 5 | Nominal `contentEditable` + `useRef`, parse `Number(replace(/\D/g))` | Bisa NaN/kosong, tanpa format ribuan, tanpa max | Ganti implementasi dengan input terkontrol + format id-ID + validasi `>0` + max (mis. 999.999.999), nilai default & perilaku simpan tetap. |
| 6 | Tanggal `Senin, 28 September` & `September 2025` hardcoded | Kadaluwarsa | Ganti dengan tanggal dinamis `Intl.DateTimeFormat("id-ID")`, fallback teks sama. |
| 7 | Chart batang tanpa `role="img"`/aria-label; backdrop sheet `Action` full-screen focusable | A11y lemah | Tambah `role="img" aria-label="..."` per chart; backdrop `aria-hidden` + fokus-trap + `Esc` close. Visual tetap. |
| 8 | `desktop-content > main` height fix + `scroll-area calc(100vh-…)` | Potensi konten terpotong di desktop | Jadikan `overflow-y-auto` dengan `min-height` bukan `height` fix; padding bawah tetap `pb-36/3rem`. |
| 9 | Duplikasi array tugas Today vs Activity; counter habit statis | Risiko divergen | Ekstrak `data/tasks.ts` tunggal (refaktor internal, output visual identik). |
| 10 | `index.html` masih placeholder `figma:*`, `robots.index=false` | SEO/preview belum final | Isi title `Arunika — Aktivitas & Keuangan`, `lang="id"`, meta description dari `site.json`. |

## 8. Improvement yang Bisa Dilakukan (P0 → P3, semua aditif)

### P0 — Wajib (bug fix, fungsi awal tetap)
- [ ] Hint sisa reaktif + clamp 0 + persen tetap `min(100,…)`.
- [ ] Bar anggaran Finance pakai `%` asli, label tetap `42% dari Rp 4.900.000`.
- [ ] `Urungkan` rollback `spent`.
- [ ] Validasi nominal: tolak 0/kosong/melebihi max dengan pesan inline, tombol Simpan disabled sampai valid.
- [ ] Tanggal dinamis id-ID.
- [ ] A11y: chart `role="img"`, progressbar sudah ada `aria-label` — pertahankan + tambah untuk bar Finance/Activity; sheet `role="dialog" aria-modal` sudah ada — tambah fokus-trap + `Esc`.
- [ ] Meta `index.html`: `lang="id"`, title, description.

**Kriteria terima P0:** tambah `Rp 68.000` → sisa berkurang tepat 68.000; persen = `round(spent/180000*100)`; klik `Urungkan` mengembalikan `spent`; nominal `0`/kosong tidak tersimpan; tidak ada perubahan urutan/warna/label tab.

### P1 — Polish UX (sangat disarankan, tanpa ubah alur)
- [ ] Persistensi `localStorage`: `spent`, `completed`, daftar transaksi user. Muat saat boot, simpan tiap berubah. Data seed tetap sama saat storage kosong.
- [ ] QuickAdd menulis ke daftar transaksi (prepend `{title: kategori, place: dompet, amount, tone}`), bukan hanya `spent`.
- [ ] `Lihat semua` Tugas/Transaksi membuka view penuh (gunakan view Activity `Tugas` & Finance `Transaksi` yang sudah ada — tinggal wire, bukan layar baru).
- [ ] Search (`Keuangan`) + filter (`tune`) berfungsi: filter teks + kategori expense/income.
- [ ] Tambah/hapus tugas (tombol `Tambah` di Activity Jadwal/Kebiasaan yang kini non-fungsi → jadikan benar-benar tambah; hapus via swipe/long-press opsional).
- [ ] Habit `Minum air`: tombol `+1 gelas` (6/8 → 7/8 → 8/8 = done). Tampilan kartu tetap 3 kolom.
- [ ] Empty/loading/error state untuk tiap list (ilustrasi ikon + teks, gaya kartu sama).
- [ ] Format Rp konsisten via helper `formatRp(n)`; angka tabular tetap.

### P2 — Fitur Baru (opsional, di belakang fungsi awal)
- [ ] Anggaran per kategori: input total, warning 80% (`bg-warning`) & over (`bg-expense`), sisa otomatis. Desain kartu sama.
- [ ] Target tabungan: `Setor` menambah `saved`, progress reaktif, tanggal fleksibel.
- [ ] Streak habit (Olahraga 12 hari → 13 dst.), reset jika lewat hari.
- [ ] Laporan periode real: `Minggu/Bulan/Tahun` memfilter transaksi tersimpan; chart dihitung dari data, sorot periode aktif tetap `bg-primary`.
- [ ] Ekspor laporan (CSV) via tombol `ios_share` yang kini non-fungsi.
- [ ] Dompet ganda (Jago Pocket + Tunai + Bank) — dropdown di QuickAdd, default tetap Jago Pocket.
- [ ] Mode terang (token terang mirror, default tetap gelap).
- [ ] PWA + badge `Tersimpan offline` menjadi status sync nyata.

### P3 — Kesehatan Teknis (tidak terlihat user, output visual identik)
- [ ] Pecah `App.tsx` → `src/components/` (`Icon`, `Action`, `NavItem`, `Segmented`, `ProgressBar`, `MoneyCard`), `src/screens/` (`Today`, `Activity`, `Finance`, `Report`, `QuickAdd`), `src/data/` (`tasks.ts`, `transactions.ts`, `budgets.ts`, `goals.ts`), `src/hooks/` (`useLocalStorage`, `useToday`), `src/utils/format.ts`.
- [ ] Ganti `contentEditable` dengan `<input inputMode="numeric">` terkontrol.
- [ ] Tambah `vitest` + `testing-library`: uji `percent`, `remaining`, `formatRp`, toggle tugas, `saveTransaction` + undo.
- [ ] Tambah `eslint`/`oxfmt` check di CI; perbaiki `Action` div → `<button>` semantik (pertahankan class).
- [ ] Cek kontras `on-surface-variant #cac4d0` di atas `surface` untuk WCAG AA; sesuaikan jika gagal tanpa ubah hue.

## 9. Non-Tujuan (out of scope PRD ini)

- Backend, auth multi-user, sync cloud (cukup siapkan bentuk data §6).
- Mengubah urutan tab, FAB, warna/tipe primer, atau menghapus fungsi mock yang sudah ada.
- Menambah dependensi berat (chart lib, form lib) kecuali disetujui — chart batang CSS saat ini dipertahankan.

## 10. Penerimaan Umum (Definition of Done)

1. `pnpm dev` jalan di `$PORT`, 4 tab tampil sesuai §4 tanpa error console.
2. Semua angka Rp memakai `formatRp`, persen memakai rumus beku §3.4.
3. Tidak ada teks statis yang bertentangan dengan state (hint, counter, persen, bar).
4. Keyboard: semua `Action` bisa `Enter/Space`, sheet bisa `Esc`, fokus terlihat.
5. `prefers-reduced-motion` tetap menonaktifkan animasi.
6. Mobile (360px) bottom-nav + FAB tidak menutup konten (`pb-36` dipertahankan); desktop (1280px) sidebar + konten center `64rem`.
7. Tidak ada regresi visual: warna, radius, spacing, ikon sama dengan token §5.

## 11. Roadmap Usulan

| Fase | Isi | Keluaran |
|---|---|---|
| 0 | PRD ini (selesai) | `prd.md` |
| 1 (P0) | Fix reaktif + validasi + a11y + meta, tanpa ubah tampilan | Patch kecil, test manual §10 |
| 2 (P1) | Persistensi + wire tombol mati + search/filter + empty state | Fungsional harian nyata |
| 3 (P2) | Anggaran/setor/streak/laporan real/ekspor/dompet ganda (pilih per prioritas) | Fitur bernilai |
| 4 (P3) | Split file + input terkontrol + vitest + button semantik | Hutang teknis lunas |

**Risiko:** scope creep mengubah fungsi awal → mitigasi dengan checklist §3 sebagai penghalang; data mock → mitigasi dengan tipe §6 sebelum sentuh UI.

---
*Disusun dari pembacaan langsung: `src/App.tsx`, `src/index.css`, `src/main.tsx`, `index.html`, `vite.config.ts`, `package.json`, `make/site.json`, `make/dev.json`. Perilaku yang dikutip (angka, label, class) merujuk ke implementasi berjalan, bukan rencana.*
