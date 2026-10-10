# PRD — Arunika: Aktivitas & Keuangan Harian
> Rewrite penuh hasil inspeksi keseluruhan kode aktual (Okt 2026). PRD lama (monolit 996 baris, mock `tasks[3]`/`transactions[3]`, `spent=94000`, budget 180.000, tanpa backend) **sudah usang total** dan digantikan dokumen ini. Prinsip tetap: **jangan ubah fungsi awal** — usulan bersifat aditif/kompatibel.
>
> Screenshot acuan: `log/image.png` (layar **Profil & Pengaturan** — layar yang sama sekali belum ada di PRD lama). Temuan insiden screenshot dibahas tuntas di §9.
>
> **Keputusan scope (disepakati): FULL — eksekusi P0 → P1 → P2 → P3 berurutan** (§10 = backlog terurut eksekusi, §12 = fase + verifikasi per fase).
> **Keputusan data: insiden #1 murni salah ketik di form — TANPA migrasi DB.** `add_user_id.sql` tetap dilarang dijalankan ulang; tidak ada SQL swap name/email.

## 1. Ringkasan Produk

**Nama:** Arunika — Aktivitas & keuangan (sidebar desktop: logo `src/assets/logo.svg` + `Arunika` / `Aktivitas & keuangan`).
**Deskripsi:** aplikasi terintegrasi untuk tugas rutin harian + keuangan pribadi (budget harian/mingguan/bulanan, anggaran kategori, target tabungan, laporan) dalam satu tempat.
**Pengguna contoh di screenshot:** akun dengan nama `sumbul`, email `sumbul@gmail.com` (lihat §9 — di screenshot keduanya **tertulis tertukar**).
**Bahasa & lokal:** Indonesia (`id-ID` default). Mata uang multi: `IDR | USD | EUR` (dipilih di Profil; `fmt()` otomatis ganti locale `id-ID / en-US / de-DE`).
**Platform:** Mobile-first (bottom-nav 4 tab + FAB `+` tengah) + adaptif desktop (sidebar 16rem ≥64rem, konten center max 64rem, app-shell kartu ≥48rem).
**Status saat ini:** Fungsional penuh dengan backend — React 19 multi-file + store reaktif custom (`useSyncExternalStore`) + REST Express + Postgres + JWT. Bukan lagi prototipe mock.

## 2. Stack & Inventaris Kode (aktual, hasil cek)

| File | Isi / Peran |
|---|---|
| `src/App.tsx` (±202 baris) | Shell: gate auth, `NAV` 4 item, sidebar desktop, bottom-nav mobile, `ProfileChip`, toast undo, banner `syncError`, `TxSheet` global, `NavContext`. State lokal: `authed`, `active`, `sheetOpen`, `toast {id,text}`, `sessionExpired`, `timer`. |
| `src/main.tsx` | Entry `StrictMode`; `RootApp` memanggil `fetchBackendData()` saat boot bila `arunika_auth === "true"`. |
| `src/store.ts` (±662 baris) | Seluruh domain: tipe `Tx/Category/Goal/FixedExpense/Task/Schedule/Habit/Profile/State`, store reaktif + listener sesi, CRUD async + `withFallback` offline, `calc()`, `fmt()/short()`, `parseQuick()`, `csvFor()`, `habitStreak()`, konstanta tanggal. |
| `src/Today.tsx` | Layar Hari Ini: sapaan jam-reaktif, kartu uang reaktif, sisa minggu/bulan, tugas hari ini, kebiasaan (tap), 4 transaksi terbaru, edit via `TxSheet`. |
| `src/Activity.tsx` | Aktivitas: kartu progres per tanggal, `Segmented` Tugas/Jadwal/Kebiasaan, `Stepper` tanggal (Tugas & Jadwal), `AddSheet` per jenis, `hideDone` filter. |
| `src/Finance.tsx` | Keuangan: kartu saldo, `Segmented` Transaksi/Anggaran/Target/Kalender; sub-komponen `Transactions`, `Budgets`+`CategorySheet`, `Goals`+`GoalSheet`, `CalendarView`. |
| `src/Report.tsx` | Laporan: `Segmented` Minggu/Bulan/Tahun + `Stepper` offset, kartu arus kas, tren batang + `TrendLine` SVG + `Donut` komposisi + skor ring + top-5 + ekspor CSV. |
| `src/Profile.tsx` | Profil & Pengaturan: draf akun, ganti password, keuangan, pengeluaran tetap, data (cadangan/hapus). State draf + validasi (detail §7.6). |
| `src/TxSheet.tsx` | Sheet tambah/ubah transaksi: tipe, catat-cepat `parseQuick`, nominal format ribuan, chip kategori + custom, tanggal; mode edit = hapus + simpan perubahan. `TxRow` dipakai Today/Finance. |
| `src/DataSheet.tsx` | Sheet generik ekspor/impor teks: `textarea` + Salin + Unduh + (opsional) Impor. Dipakai cadangan JSON & ekspor CSV. |
| `src/Login.tsx` | Login: field Username + Password, error `role="alert"`, banner sesi-berakhir. `POST /api/login` → simpan `arunika_token` + `arunika_auth`. |
| `src/ui.tsx` | Primitif: `NavContext`, `Icon`, `Action` (div role=button + keyboard), `inputCls`, `Field`, `Segmented`, `Sheet` (dialog+backdrop), `PrimaryButton` (+`danger`), `Progress`, `Empty`, `SectionHead`, `ProfileChip`, `PageHeader`, `Stepper`. |
| `src/Logo.tsx` | Logo dari `src/assets/logo.svg` (monogram A+U). |
| `src/index.css` (±200 baris) | Tailwind v4 `@import "tailwindcss"` + `@theme` token + `.bg-money-card/.bg-balance-card/.fab/.sheet/.scroll-area/.money/.material-symbols-rounded` + Roboto & Material Symbols Rounded. |
| `api/server.js` (±197 baris) | Express: `POST /api/login`, `GET/PUT /api/profile`, `PUT /api/password`, CRUD generik 8 resource + whitelist `RESOURCE_COLUMNS`, JWT 7 hari, fail-fast env. |
| `api/package.json` | Dep backend: `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `cors`. |
| `db/schema.sql` | 8 tabel (`users`, `transactions`, `categories`, `fixed_expenses`, `budgets`, `goals`, `tasks`, `habits`, `schedules`) + index per `user_id`. Auto-run via `docker-entrypoint-initdb.d` saat volume kosong. |
| `add_user_id.sql` | **Migrasi historis, JANGAN dijalankan ulang** — berisi UUID akun nyata + backfill ke user `sumbul`. Setup baru cukup `db/schema.sql`. |
| `index.html` / `vite.config.ts` | Shell Vite + plugin Figma Make (`figmaSiteConfiguration`, dsb). Alias `@` → `src`. Dev `$PORT` (default 8443). |
| `package.json` (frontend) | `react@19`, `react-dom@19`, `tailwindcss@4`, `@tailwindcss/vite@4`, `vite@8`, `typescript@5.7`, `oxfmt`. Tanpa router/store/chart/test lib. |
| `docker-compose.yml` / `Dockerfile` / `nginx.conf` | Deploy: frontend + api + postgres. |

## 3. Fungsi Inti — DIBEKUKAN (kontrak, dilarang diubah)

1. **4 tab utama:** Hari Ini (`today`), Aktivitas (`activity`), Keuangan (`finance`), Laporan (`report`) + layar ke-5 **Profil** (`profile`, dibuka hanya via `ProfileChip`, tanpa tab nav).
2. **Navigasi mobile:** bottom-nav 5 kolom = 2 tab + FAB `+` tengah (`-mt-8`, `size-16`, `rounded-large`) + 2 tab. Aktif = pill `bg-primary-container` + ikon filled + label. `lg:hidden`.
3. **Navigasi desktop:** sidebar `lg:flex` 16rem: logo + `Arunika`, 4 nav pill, CTA `Tambah transaksi`, footer `ProfileChip` (tengah) + `Keluar` (`bg-surface-container-high`, `text-expense`). Konten max 64rem center.
4. **Rumus uang reaktif (`calc()`, §6):** budget dari `monthlyIncome × (100 − wealthGoal)%`; `dailyBudget = round(monthly ÷ 30)`; pengeluaran tetap dipotong proporsional (`bulanan ÷ hari-dalam-bulan`); sisa = `max(budget − fixed − spend, 0)`; `balance = startBalance + Σincome − Σexpense`.
5. **Tugas:** filter per tanggal + sortir jam; toggle check → coret; counter `done dari N`; hapus via ikon `delete`.
6. **Kebiasaan:** kartu tap-to-increment `v/target unit`; selesai = ikon `check`; streak api (`habitStreak`) + reset ke 0 saat penuh (tap berikutnya).
7. **Transaksi:** grup per tanggal + subtotal signed; search deskripsi/kategori + filter Semua/Keluar/Masuk + paginasi 30; klik baris → edit.
8. **Anggaran:** tone bar `≥100% expense / ≥80% warning / else primary`; kategori tanpa limit = `Tanpa batas` (tanpa bar); kategori liar (ada spend, belum ada anggaran) = kartu dashed + `Atur`.
9. **Target:** setor/tarik via `GoalSheet`; progress reaktif; `≥100%` = ikon `emoji_events` + tone tertiary; deadline tanggal atau `Fleksibel`.
10. **Laporan:** 3 periode + navigasi offset; highlight bucket berjalan `bg-primary`; diff `%` vs periode lalu (hemat/boros/belum-ada-pembanding); ekspor CSV via `DataSheet`.
11. **QuickAdd (`TxSheet`):** tipe Pengeluaran/Pemasukan; catat-cepat `Deskripsi Nominal #kategori`; nominal format ribuan id-ID; kategori dari `categories` (expense) / `INCOME_CATS` (income) + `Baru`; simpan → toast + `Urungkan` (hanya transaksi baru → `deleteTx`).
12. **Visual:** dark M3-like, gradient card + border ungu 12%, segmented `rounded-full bg-surface-container p-1`, FAB shadow, snackbar `bg-inverse-surface`, angka `.money` tabular.

## 4. Flow Global

### 4.1 Auth & sesi
```
boot → main.tsx cek arunika_auth=="true" → fetchBackendData()
  ├─ belum login → <Login/> (full-screen, card max-w-md)
  │    └─ submit → POST /api/login {email, password}
  │         ├─ 200 → simpan arunika_token + arunika_auth="true" → onLogin() → fetchBackendData()
  │         └─ gagal → banner role="alert" (pesan server)
  └─ sudah login → App shell
       └─ API mana pun 401/403 → notifySessionExpired() → handleLogout(expired=true)
            → hapus arunika_auth + arunika_token → <Login sessionExpired> (`arunika:v1` legacy dihapus P3-4)
            → banner "Sesi berakhir. Silakan masuk kembali."
```
- `handleLogout(expired=false)` dipakai tombol `Keluar` (desktop footer + mobile bawah Profil).
- **Variabel:** `localStorage: arunika_auth ("true"), arunika_token (JWT), arunika_theme ("light"/"dark", default dark)`; state `authed: boolean`, `sessionExpired: boolean`.

### 4.2 Navigasi
- `NAV = [{today,today,Hari Ini}, {activity,check_circle,Aktivitas}, {finance,account_balance_wallet,Keuangan}, {report,bar_chart,Laporan}]`; `MOBILE_NAV = NAV`; mobile slice(0,2) + FAB + slice(2).
- `active: "today"|"activity"|"finance"|"report"|"profile"` (default `"today"`).
- `NavContext: (id:string)=>void` = `setActive`; dikonsumsi `ProfileChip` (semua header + sidebar).
- `ProfileChip`: label/inisial dari `name` → prefix email → `?`; skeleton pulse saat `!ready`; `ring-2 ring-primary` saat `active==="profile"`.

### 4.3 Toast & sync banner
- `toast: {id, text} | null`; `onSaved(id, isNew)`: baru → teks `Transaksi berhasil disimpan` + `id` (tombol `Urungkan` → `deleteTx(id)`); ubah → `Transaksi diperbarui`, tanpa undo. Auto-dismiss 4000ms (`timer` ref, clear tiap save).
- `syncError: string | null` (dari store): banner `role="alert"` atas `bg-warning-container` + ikon `cloud_off`. Di-set tiap fallback offline, di-clear tiap API sukses.

## 5. Model Data & Variabel (store.ts)

```ts
TxType = "expense" | "income";
Tx = { id, type, category (lowercase via norm), amount: number (>0), description, date: "YYYY-MM-DD", createdAt: epoch, wallet (dompet; server: kolom `source`; legacy `'web'` → `Jago Pocket`) };
Category = { id, name (lowercase), budgetLimit };
Goal = { id, title, target, saved, deadline: "YYYY-MM-DD" | "" };
FixedExpense = { id, name, amount, period: "harian"|"bulanan", isActive };
Task = { id, title, time: "HH:MM"|"", tag, date, done };
Schedule = { id, time, title, meta, date };
Habit = { id, title, target: number, unit, log: Record<"YYYY-MM-DD", number> };
Profile = { name, email, currency: "IDR"|"USD"|"EUR", monthlyIncome, wealthGoal: 0–100, startBalance };
State = { profile, txs, categories, goals, fixed, tasks, schedules, habits, syncError };
```

**Helper tanggal:** `pad`, `dstr(d)`, `todayStr()`, `parseDate`, `addDays(s,n)`, `MONTHS[12]`, `DAYS[7]` (Minggu dulu), `longDate("Hari, D Bulan")`, `daysInMonth`, `uid()` (randomUUID + fallback).
**Format:** `fmt(n, signed=false)` — currency `profile.currency`, locale IDR→`id-ID` (0 desimal) / USD→`en-US` / EUR→`de-DE` (2 desimal); `short(n)` compact id-ID.
**Kategori & dompet:** `norm = trim().toLowerCase()`; `WALLETS = [Jago Pocket, Tunai, Bank]`, `DEFAULT_WALLET = Jago Pocket`, `walletOf(source)` untuk legacy; `CATEGORY_ICONS {makanan:restaurant, transportasi:directions_bus, hiburan:movie, belanja:shopping_bag, tagihan:receipt_long, gaji:payments, bonus:redeem, investasi:trending_up, uncategorized:label}`; `catIcon()` fallback `label`; `INCOME_CATS = [gaji, bonus, investasi, lainnya]`.
**Mutasi (semua: `apiCall` → sukses: clear syncError; gagal non-401: fallback lokal + syncError; 401/403: rethrow → logout):** `addTx/updateTx/deleteTx`, `addCategory/updateCategory(merge nama ke txs)/deleteCategory`, `addGoal/updateGoal/deleteGoal`, `addFixed/updateFixed/deleteFixed`, `setProfile(patch, immediate)` (debounce 400ms, `immediate=true` saat Simpan), `addTask/toggleTask/deleteTask`, `addSchedule/deleteSchedule`, `addHabit/deleteHabit`, `tapHabit` (**lokal saja, tanpa sync**), `resetAll` (**lokal saja**).
**Impor:** `importJson()` saat ini **hanya validasi** (return pesan error / null) — belum me-restore state (bug §9.5).
**`parseQuick`:** regex `/^(.+?)\s+(\d[\d.]*)(?:\s+#([\w-]+))?$/` → `{description, amount (titik = pemisah ribuan), category}` atau `null`.

## 6. Mesin Hitung — `calc(s, now)` (kontrak rumus)

```
spendPct      = monthlyIncome>0 ? (100−wealthGoal)/100 : 1
dailyBudget   = round(monthlyIncome × spendPct / 30)
monthlyBudget = round(monthlyIncome × spendPct)
dim           = hari dalam bulan berjalan
fixedDaily    = Σ fixed aktif (bulanan→amount/dim, harian→amount)
todaySpend    = Σ expense date==today
weekSpend     = Σ expense weekStart..today (weekStart = today − getDay(), Minggu–Sabtu)
monthSpend    = Σ expense YYYY-MM bulan berjalan
monthIncome   = Σ income bulan berjalan
spendableToday/Week/Month = max(round((budget−fixed)×periode − spend), 0)
score         = monthlyBudget>0 ? round(min(spendableMonth/monthlyBudget,1)×100) : 100
balance       = startBalance + Σ income − Σ expense (SEMUA waktu)
savingTarget  = round(monthlyIncome × wealthGoal / 100)
```
`categorySpend(txs, "YYYY-MM") → Record<category, Σexpense>`; `habitStreak(h)`: hitung mundur dari hari ini (atau kemarin bila hari ini belum penuh) selama `log ≥ target`; `csvFor(txs)`: header `tanggal,jenis,kategori,nominal,deskripsi,dompet` + escape `"`.

## 7. Spesifikasi Per Layar (Given/When/Then — sesuai kode)

### 7.1 Login (`Login.tsx`)
- Card: **Logo Arunika** (`Logo`, `h-16`), `Masuk ke Arunika`, `Masukkan kredensial akun Anda`.
- Field: label **Username** (`type=text`, required, placeholder `Username`) + **Password** (`type=password`, required). NOTE: nilai Username dikirim sebagai `email` ke `/api/login` (inkonsistensi label, §9.4).
- Gagal → `role="alert"` `bg-expense/20`; sesi berakhir → pesan default `Sesi berakhir. Silakan masuk kembali.`

### 7.2 Hari Ini (`Today.tsx`, prop `setActive`)
- Header: `longDate(today)` + sapaan jam (`<11 pagi, <15 siang, <19 sore, else malam`) + `, {name}` bila ada + `ProfileChip` (`lg:hidden`).
- Banner info (bila `txs` kosong): `Belum ada data. Tambah transaksi lewat tombol +.`
- Kartu `UANG HARI INI` (`bg-money-card`): `Boleh dibelanjakan hari ini` + `fmt(spendableToday)` (tone: `<20% daily → expense` else tertiary); `SUDAH DIBELANJAKAN fmt(todaySpend)` + `{pct}% dari {daily}` (`pct = round(todaySpend/dailyBudget×100)`, guard 0); `Progress` (tone `≥100% → expense` else tertiary); hint fixed (bila >0): `Pengeluaran tetap aktif {fixedDaily}/hari sudah dipotong.`
- Grid 2: `SISA MINGGU INI` (tone `<0.5×daily → warning` else primary) + `SISA BULAN INI` (`<20% monthly → expense` else tertiary).
- Tugas hari ini: `SectionHead` sub `{done} dari {N} selesai` / `Belum ada tugas`; `Lihat semua` → `setActive("activity")`; kosong → `Empty(task_alt)`. Baris = toggle done (coret bila done) + `{time||"--:--"} · {tag}`.
- Kebiasaan: sub `{done} dari {N} selesai` / `Belum ada kebiasaan`; grid-3 max 6: tap → `tapHabit`; selesai = lingkaran `bg-tertiary` + `check`; label `v/target unit`; streak → `local_fire_department {n} hari`.
- Transaksi terbaru: 4 terbaru (sort date desc, createdAt desc); `Lihat semua` → finance; kosong → `Empty(receipt_long)`. Klik baris → `TxSheet` mode edit (tanpa toast).

### 7.3 Aktivitas (`Activity.tsx`)
- `PageHeader(Aktivitas / Atur ritme harianmu)`.
- Kartu progres (`bg-money-card`): label `PROGRES HARI INI` / `PROGRES TANGGAL INI` (bila `date ≠ today`), angka display `{done} dari {N}`, `tugas sudah diselesaikan`, `Progress(done/N×100)`.
- `Segmented` Tugas(`check_circle`)/Jadwal(`calendar_today`)/Kebiasaan(`autorenew`); state `view` (default Tugas), `date` (default today), `add: Kind|null`, `hideDone`.
- `Stepper` (`Hari ini · longDate` / `longDate`, prev/next `addDays ±1`) — tampil untuk Tugas & Jadwal, disembunyikan di Kebiasaan (global per-hari-ini).
- Tugas: tombol `Tambah` + toggle `tune` (aktif = `bg-primary-container`); kosong → `Semua tugas selesai.` / `Belum ada tugas di tanggal ini.`; baris = toggle + hapus `delete`.
- Jadwal: `SectionHead(Jadwal, {N} agenda)` + `Tambah`; baris: waktu (`money text-primary`) + judul + meta + hapus.
- Kebiasaan: `SectionHead(Kebiasaan hari ini, Ketuk untuk menambah progres)` + `Tambah`; baris: ikon 12 (`check` bila penuh), `v/target unit`, `Progress` tertiary, `Runtun {n} hari`, hapus.
- `AddSheet(kind, date)`: Tugas = Judul + Waktu(`time`) + Kategori(default `Pribadi`); Jadwal = Judul + Waktu(default `00:00`) + Catatan; Kebiasaan = Nama + Target/hari(`≥1`) + Satuan(default `kali`). Validasi: judul wajib. Kebiasaan selalu global (tanpa tanggal).

### 7.4 Keuangan (`Finance.tsx`, `view` default Transaksi)
- `PageHeader(Keuangan)` (tanpa tombol kanan).
- Kartu saldo (`bg-balance-card`): `TOTAL SALDO` + `fmt(balance)` display + `{fmt(monthNet,signed)} bulan ini` (`monthNet = monthIncome−monthSpend`; `≥0 → trending_up tertiary` else `trending_down expense`).
- `Segmented` Transaksi/Anggaran/Target/Kalender.
- **Transaksi:** search (`Cari deskripsi atau kategori`, mencakup dompet) + chip Semua/Keluar/Masuk + chip dompet (`Semua dompet` + tiap dompet terpakai; muncul bila >1 dompet); grup tanggal (`Hari ini` / `longDate`) + net signed; paginasi `limit=30` + `Muat lebih banyak (sisa)`; empty: `Belum ada transaksi…` / `Tidak ada transaksi yang cocok.`; klik → edit sheet.
- **Anggaran:** `SectionHead(Anggaran {Bulan}, {totalSpent} terpakai · batas kategori {totalLimit})` + tambah; ringkasan: `BUDGET BELANJA BULAN INI (setelah target menabung {wealthGoal}%)` + `{spendableMonth} tersisa` + bar + `{monthSpend} dari {monthlyBudget} · pengeluaran tetap {fixedDaily×dim}`; kartu kategori (klik → `CategorySheet`): ikon, nama capitalize, spend, `{pct}% dari {limit}` / `Tanpa batas`, bar bila limit>0; kategori liar = dashed + `Atur` (preset nama).
- **`CategorySheet`:** tambah/ubah/hapus; validasi `Nama kategori wajib diisi.` / `Kategori sudah ada.` (cek `norm`, kecualikan diri sendiri saat ubah); batas `0 = tanpa batas`.
- **Target:** `SectionHead(Target tabungan, Wujudkan tujuanmu bertahap)` + tambah; kartu (klik → `GoalSheet`): ikon 12 (`emoji_events` bila lunas), judul + badge deadline (`longDate` / `Fleksibel`), `{saved} / {target}`, bar, `{pct}% tercapai`; kosong → `Empty(savings)`.
- **`GoalSheet`:** tambah/ubah/hapus; bila edit: panel `TABUNGAN SAAT INI` + input delta + `Setor(add)` / `Tarik(remove)` (clamp ≥0, tutup sheet); validasi nama + target>0 + delta terisi.
- **Kalender:** `Stepper({Bulan} {Tahun})`; grid 7 kolom header Min–Sab; sel: nomor + `short(spend)` (expense-hijau? merah-expense; transparan bila 0); aktif = `bg-primary-container`; hari ini = border primary; pilih → daftar transaksi tanggal itu + subtotal + `Tambah` (preset tanggal → sheet).

### 7.5 Laporan (`Report.tsx`)
- `PageHeader(Laporan, sub={title periode}, right=ios_share → ekspor CSV)`.
- `Segmented` Minggu/Bulan/Tahun (ganti → reset `off=0`) + `Stepper(title)` (prev/next offset).
- `buildRange`: Minggu = 7 bucket harian Sen? (label Min–Sab dari `start = today − getDay + off×7`; title `D Bulan – D Bulan`); Bulan = N bucket harian (`{Bulan} {Tahun}`); Tahun = 12 bucket bulanan (label 3 huruf, title tahun).
- Arus kas (`bg-balance-card`): `ARUS KAS BERSIH` + signed net (income/expense tone) + 2 mini `bg-surface-translucent`: PEMASUKAN(`south_west` income) + PENGELUARAN(`north_east` expense).
- Tren: judul + sub (`{x}% lebih hemat/boros dari periode lalu` / `Belum ada pembanding periode lalu` bila prev=0) + ikon trend; bar chart (`role="img"`, tinggi `%` dari max, min 4%/1%, title tooltip) + label sumbu (Bulan: tiap indeks %5==0) + `Tertinggi {short(max)} per {bulan→"bulan" else "hari"}`; `TrendLine` SVG interaktif (hover dot + crosshair + tooltip) di bawah divider.
- Komposisi: `Donut` SVG (8 warna `COLORS`, stroke 14, `-rotate-90`) + legenda max 6 (`{pct}%`); kosong → Empty.
- Skor ring: SVG 120 (`score/100`, tone `<20 expense / <50 warning / else tertiary`, angka tengah) + narasi (`…masih on track.` / `Budget bulan ini habis.`).
- Terbesar: top-5 kategori + ikon + `{pct}% pengeluaran` + nominal.

### 7.6 Profil & Pengaturan (`Profile.tsx`) — layar di screenshot
- `PageHeader(Profil & Pengaturan / Kelola akun, budget, dan pengeluaran tetap)`.
- Banner sukses (`check_circle`, income): `Profil dan pengaturan berhasil disimpan.` (2500ms). Banner error (`error`, expense): validasi/gagal server.
- **§ Akun** (ikon `person`): `Field Nama` (`#p-name`, tanpa placeholder) + `Field Email` (`#p-email`, `type=email`). Draf lokal `draft: Profile`, sinkron dari store (`useEffect [s.profile]`). **Simpan** (`PrimaryButton`, submit form): tolak `monthlyIncome<0` (`Target pemasukan tidak boleh negatif.`); tolak email tak-cocok `/^\S+@\S+\.\S+$/` (**`Format email tidak valid.`** — persis banner di screenshot); `saveProfileNow({...draft, name: trim})` (await server) — toast sukses HANYA bila server benar-benar menyimpan (anti toast-bohong §9.11); konflik email → `Email sudah dipakai akun lain.` (409).
- **§ Ganti Password** (ikon `lock`): `#p-oldpw` + `#p-newpw` (`••••••••`, autocomplete current/new). Tombol `key` `Ganti password` (`bg-secondary-container text-secondary` — ⚠️ token `secondary-container` **tidak ada** di `@theme`, §9.4). `PUT /api/password`: kosong → `Isi password lama dan baru.`; baru<6 → `Password baru minimal 6 karakter.`; salah → pesan server (`Password lama salah`); sukses → `Password berhasil diganti.` + reset field.
- **§ Keuangan** (ikon `payments`): grid-2 Mata uang (`#p-cur`: IDR/USD/EUR) + Saldo awal (`#p-start`, grouping id-ID); Pemasukan bulanan (`#p-income`, grouping); slider `Target menabung` (`#p-goal`, range 0–100, **live**: tiap geser → `setProfile({wealthGoal})` debounce 400ms + preview `BUDGET BULANAN/HARIAN` dari draf); label `{wealthGoal}% · {savingTarget}`.
- **Tombol `Simpan perubahan`** (submit seluruh draf akun+keuangan).
- **§ Pengeluaran tetap** (ikon `receipt_long`, header + `{fixedDaily}/hari` expense): deskripsi `Tagihan rutin yang dipotong dari budget belanja. Matikan sementara saat libur atau WFH.`; kosong → Empty; baris: nama + `{amount} / {hari|bulan}` + toggle `Aktif/OFF` + hapus; form: `#f-name` + `#f-amount` (grouping) + `#f-period` (Per bulan/hari) + `Tambah` (primary). Validasi: nama wajib (`Nama pengeluaran wajib diisi.`), nominal>0 (`Nominal harus lebih dari 0.`).
- **§ Data** (ikon `database`): `Data tersimpan aman di akun Anda. Unduh cadangan JSON bila perlu.`; `Cadangan` (`backup` → `DataSheet` JSON + impor) ; `Hapus semua data` (`delete_forever`, expense) → konfirmasi inline (`bg-expense/10`: `Semua data akan dihapus permanen. Lanjutkan?` → Batal / `Ya, hapus` → `resetAll()` lokal).
- Mobile: tombol `Keluar` besar di bawah Profil (desktop: di sidebar).

### 7.7 Tambah/Ubah Transaksi (`TxSheet.tsx`)
- `Sheet(Tambah transaksi / Ubah transaksi)`. State: `type` (default expense), `amount` (digit saja), `description`, `category`, `custom`, `wallet` (default `Jago Pocket`), `wCustom`, `date` (default today / preset kalender), `quick`, `error`, `confirmDel`.
- `Segmented` Pengeluaran/Pemasukan (ganti → reset kategori). List opsi: expense → `categories` store; income → `INCOME_CATS`; kategori arsip (tidak di list, tidak custom) tetap dimunculkan.
- Catat-cepat (hanya mode tambah): `Catat cepat · cth: Beli kopi 25000 #makanan` + `Isi` → `parseQuick`; gagal → `Format tidak valid. Gunakan: [Deskripsi] [Nominal] #[Kategori]`.
- Nominal: box border (label `Nominal` + simbol currency dari `fmt(0)` + input `text-money`, grouping locale currency live via `grpNum`).
- Kategori: chip + ikon (`catIcon`), aktif `border-primary bg-primary-container`; `Baru(add)` → input bebas (autoFocus).
- Dompet: chip `WALLETS` + ikon `account_balance_wallet` + `Baru(add)` → input bebas; dompet arsip tetap dimunculkan. Default simpan: `Jago Pocket`.
- Tanggal: `input type=date`. Validasi: nominal>0 (`Nominal harus lebih dari 0.`), tanggal wajib. Default kategori: expense→`uncategorized`, income→`lainnya`.
- Simpan: tambah → `addTx` + `onSaved(id,true)` (toast+undo); ubah → `updateTx` + `onSaved(id,false)`. Mode ubah + tombol hapus danger: transaksi >7 hari dua ketuk (`Hapus transaksi lama?` → `Ketuk lagi untuk hapus`), ≤7 hari langsung tutup.
- `TxRow`: ikon kategori + deskripsi||kategori + `{kategori} · {dompet}` capitalize + nominal signed (income/expense tone).

### 7.8 Cadangan (`DataSheet.tsx`)
- `Sheet(title)`: `textarea` mono (readOnly kecuali impor), `Salin(content_copy)` (clipboard + fallback select + pesan), `Unduh(download)` (Blob + `filename`), `Impor dari teks di atas(upload)` bila `importable`.
- Dipakai: Profil → `Cadangan data` (`arunika-backup.json`, JSON + impor); Report → `Ekspor CSV · {title}` (CSV, tanpa impor).

## 8. Backend & Database

- **Env wajib (fail-fast):** `JWT_SECRET`, `POSTGRES_PASSWORD` (lihat `.env.example`); pool default host `postgres:5432`, db/user `fintrack`; `CORS_ORIGIN` opsional (kosong = allow all); `PORT` default 3000.
- **Auth:** `POST /api/login {email,password}` → bcrypt vs `users.password_hash` → JWT `{userId,email}` 7 hari; 400/401/500. `authenticateToken`: tanpa token → 401, invalid/expired → 403.
- **Profil:** `GET /api/profile` (1 baris user); `PUT /api/profile {name,email,monthly_income,wealth_goal,currency,start_balance}` (COALESCE per kolom; duplikat email → 409 `Email sudah dipakai akun lain.`).
- **Password:** `PUT /api/password {oldPassword,newPassword}` (wajib, baru ≥6, bcrypt compare → hash 10).
- **CRUD generik** `transactions/categories/fixed_expenses/budgets/goals/tasks/habits/schedules`: `GET` (all milik user), `POST` (whitelist + `user_id`, kosong → insert default), `PUT /:id` (whitelist, 400 bila kosong, 404 bila bukan milik user), `DELETE /:id` (404 bila bukan milik user). `RESOURCE_COLUMNS`: transactions `[type,category_name,amount,description,source]`, categories `[name,budget_limit]`, fixed_expenses `[name,amount,is_active]` (⚠️ **tanpa `period`** — periode selalu default DB, §9.6), budgets `[]`, goals `[title,target,saved,date_label]`, tasks `[title,time,tag,done]`, habits `[title,icon,meta,progress,done]`, schedules `[time,title,meta]`.
- **Skema (`db/schema.sql`):** `users(id,email UNIQUE,password_hash,name,monthly_income,wealth_goal,currency='IDR',start_balance,created_at)`; semua entitas `id UUID + user_id FK CASCADE + created_at` + index `user_id`; `transactions(type CHECK expense/income, category_name='uncategorized', amount, description='', source='web')`; `categories(name,budget_limit=0)`; `fixed_expenses(name,amount=0,is_active=true)`; `budgets()` (kosong — legacy); `goals(title,target=0,saved=0,date_label='Fleksibel')`; `tasks(title,time='',tag='Pribadi',done=false)`; `habits(title,icon='water_drop',meta='',progress=1,done=false)`; `schedules(time='00:00',title,meta='')`.

## 9. Temuan Audit — Insiden Screenshot + Inkonsistensi

| # | Temuan | Bukti | Akar masalah | Perbaikan (aditif) |
|---|---|---|---|---|
| 1 | **Field Nama ↔ Email tertukar di screenshot** → banner `Format email tidak valid.` + data tak tersimpan | `log/image.png`: Nama=`sumbul@gmail.com`, Email=`sumbul`; banner error merah | Nilai draf tertukar (input manual / autofill browser salah kolom — kedua input tanpa `autocomplete`/`placeholder` pembeda; `save()` menolak sebelum `setProfile`) | Tambah `autoComplete="name"/"email"`, `placeholder` contoh, `name` attr; pertimbangkan validasi per-field saat blur; TIDAK auto-swap (berisiko menimpa data benar) |
| 2 | **`ProfileChip` tampil `?`/`?`** (lingkaran merah bawah) | `log/image.png` sidebar bawah | Konsekuensi #1: store `profile.name=""` → fallback `?` (`ui.tsx: name = profile.name \|\| "?"`) | Ikut sembuh setelah #1 diperbaiki + user Simpan; tambah `title`/`aria` pada chip; opsional fallback inisial dari email |
| 3 | **PRD lama usang total** (sumber "ga sama") | `prd.md` lama vs kode | PRD mendeskripsikan prototipe mock; app kini full-stack 15 file + backend | **Dokumen ini** (rewrite); jadikan `prd.md` living-doc per rilis |
| 4 | **Token `secondary-container` tak terdefinisi** | `Profile.tsx:126` `bg-secondary-container` vs `@theme` tanpa token itu | Tombol Ganti password tanpa background (class mati) | Tambah `--color-secondary-container` di `@theme` ATAU ganti ke `bg-primary-container text-primary` |
| 5 | **`importJson` tidak benar-benar mengimpor** | `store.ts:571-579` hanya `JSON.parse` + return | Tombol `Impor dari teks di atas` selalu lapor sukses palsu tanpa mengubah state | Implementasi restore state + validasi skema + `set()` + sync backend, atau hapus tombol impor |
| 6 | **Periode fixed-expense hilang di round-trip** | POST kirim `{name,amount,is_active}`; fetch paksa `period:"bulanan"` | `RESOURCE_COLUMNS.fixed_expenses` tanpa `period`; kolom DB pun tak ada | Tambah kolom `period` (DB + whitelist + fetch mapping) |
| 7 | **Label Login `Username` vs API `email`** | `Login.tsx:51` label/placeholder vs body `{email}` | Membingungkan + autofill/autocomplete tak optimal | Ganti label → `Email`, `type="email"`, `autoComplete="email"` |
| 8 | **`tapHabit` & `resetAll` lokal saja** | `store.ts:544,581` tanpa `apiCall` | Streak & hapus data tak tersinkron; refresh = hilang/kembali | Sync `tapHabit` (atau tandai eksperimental); `resetAll` → konfirmasi + DELETE per resource / endpoint reset |
| 9 | **Pemetaan habits rapuh** | POST `{meta:unit, progress:target}` ↔ fetch `{target:progress, unit:meta}` | Konsisten tapi implisit; `done` tidak dipakai | Dokumentasikan kontrak mapping atau samakan nama kolom |
| 11 | **Toast sukses berbohong** (nama "belum tampil" setelah refresh) | Simpan lokal + `void` sync; server 500 (mis. email duplikat) → refresh menimpa dengan data lama | `saveProfileNow` (await) + 409 `Email sudah dipakai akun lain.` — toast hanya saat server OK |
| 12 | **Login tanpa logo** (`log/image copy 2.png`) | Ikon `lock` generik | Ganti dengan `Logo` (`h-16`) |
| 13 | **Screenshot = build basi** (`dist/` 9 Okt < src) | Preview Docker menyajikan `dist` lama (bukti: label `Username` yang sudah diganti di src) | Wajib `docker compose up -d --build` + migrasi `db/migrate_001_period_log.sql` di DB lama sebelum pakai |
| 10 | **`Action` = div `role=button`** | `ui.tsx:27` | Bukan `<button>` semantik (form submit/Enter bawaan, screen reader) | Migrasi ke `<button>` dengan class identik (visual beku) |

## 10. Rencana Eksekusi Flawless & Konsisten (P0 → P3, semua aditif)

Urutan wajib berurutan: P0 dulu sampai DoD fase lolos, baru P1, dst. Setiap item mencantumkan target file:baris + kriteria terima sendiri.

### P0 — Wajib (temuan §9 #1–#10). DoD fase: §11.7 lolos (chip inisial benar setelah Simpan)

> Status: **SELESAI semua (7/7)** — dieksekusi + `tsc --strict` bersih (hanya sisa 2 error asset `vite/client` khas sandbox, tidak ada di toolchain proyek) + `node --check api/server.js` OK.

- [x] **P0-1 Form anti-tertukar** (`Profile.tsx:105-110`): `autoComplete="name"/"email"` + `name` attr + placeholder (`cth: Sumbul` / `nama@email.com`). Terima: autofill browser masuk kolom benar; pesan `Format email tidak valid.` tetap block-level.
- [x] **P0-2 Token hilang** (`Profile.tsx:126`): `bg-secondary-container text-secondary` → `bg-primary-container text-primary` (konsisten dengan tombol `Cadangan`). Terima: tombol Ganti password punya background terlihat; tanpa token baru.
- [x] **P0-3 Label Login** (`Login.tsx:50-58`): label + placeholder `Username` → `Email`, `type="email"`, `autoComplete="email"`; body request tetap `{email}`. Terima: tidak ada perubahan API.
- [x] **P0-4 Impor nyata** (`store.ts:571-579`, `DataSheet.tsx:44-47`): `importJson` validasi skema per koleksi → `set()` → sync backend per item; error spesifik per koleksi. Alternatif yang diizinkan: cabut tombol impor bila restore penuh ditunda — bukan sukses palsu. Terima: impor JSON cadangan → state + server berubah, atau tombol hilang.
- [x] **P0-5 Periode fixed-expense end-to-end**: kolom `period` di `db/schema.sql` + `RESOURCE_COLUMNS.fixed_expenses` (`api/server.js:119`) + mapping fetch (`store.ts:226`, hapus hardcode `period:"bulanan"`). Butuh migrasi `ALTER TABLE … ADD COLUMN IF NOT EXISTS` untuk DB lama (bukan `add_user_id.sql`). Terima: buat fixed `harian` → refresh → tetap `harian`.
- [x] **P0-6 Sync bolong**: `tapHabit` (`store.ts:544`) → `PUT /api/habits/:id` (tambah kolom log / endpoint increment); `resetAll` (`store.ts:581`) → hapus per-resource di server ATAU teks konfirmasi `Hanya menghapus tampilan lokal…`. Terima: streak & hapus bertahan setelah refresh (atau peringatan eksplisit).
- [x] **P0-7 Button semantik** (`ui.tsx:15-38` `Action`): div `role=button` → `<button type="button">`, class + visual identik, keyboard Enter/Space bawaan. Terima: zero regresi visual; axe/lighthouse tidak keluhkan role.

### P1 — Polish UX (tanpa ubah alur). DoD fase: tidak ada flash `?`/kosong saat load; refresh di tab mana pun kembali ke tab itu

> Status: **SELESAI semua (5/5)** — `tsc --strict` bersih + audit `toLocaleString` tersisa 1 titik (`grpNum`, locale-aware).

- [x] **P1-1 Validasi inline**: blur per-field Profil (Nama/Email) + `aria-describedby`; error password pindah ke bawah field terkait. Pesan block-level tetap sebagai ringkasan.
- [x] **P1-2 Deep-link tab**: `active` ↔ `?tab=` (today/activity/finance/report/profile); default `today` bila param tak dikenal.
- [x] **P1-3 Skeleton loading**: state loading di `fetchBackendData` → skeleton kartu + list; ganti flash `ProfileChip ?` + `Empty` sesaat.
- [x] **P1-4 Konfirmasi hapus**: bedakan hapus langsung di `TxSheet` (sudah ada, pertahankan) vs toast `Urungkan` 4 detik (transaksi baru). Tambah konfirmasi hanya untuk transaksi >7 hari.
- [x] **P1-5 Kunci locale**: audit semua angka uang lewat `fmt()` (currency aktif); tidak ada `toLocaleString` mentah tersisa di luar `fmt`/`short`/input grouping.

### P2 — Fitur baru (di belakang fungsi awal; pilih per prioritas saat eksekusi). DoD fase: fungsi beku §3 tak berubah

- [x] **P2-1 Dompet ganda** (prioritas 1 — fondasi API `source` sudah ada): pemilih dompet di `TxSheet` + filter di Transaksi; default tetap perilaku sekarang.
- [x] **P2-2 Setor cepat** (prioritas 2): aksi setor di kartu Target Finance tanpa buka `GoalSheet` penuh.
- [x] **P2-3 Milestone streak** (prioritas 3): rayakan 7/30 hari; reset-to-0 saat penuh tetap (§3.6).
- [x] **P2-4 Laporan**: banding 2 periode custom + bagikan gambar (selain CSV yang sudah ada).
- [x] **P2-5 Mode terang**: mirror token `@theme`, default tetap gelap.
- [x] **P2-6 PWA + retry**: `syncError` jadi antrian retry nyata (bukan banner pasif).

### P3 — Kesehatan teknis (output visual identik). DoD fase: CI hijau

- [x] **P3-1 Tes**: `vitest` + testing-library — `calc` (tiap rumus §6), `parseQuick`, `habitStreak`, `csvFor`, regex email, duplikat `CategorySheet`.
- [x] **P3-2 CI**: `eslint` + `tsc` + `vitest` + `build` via `.github/workflows/ci.yml`; script `test/lint/typecheck` di `package.json`. **oxfmt 0.2.0 DILARANG** (menghapus `;` di type literal → 11 titik rusak di 7 file, sudah diperbaiki manual). Hapus `budgets` legacy DITUNDA (butuh persetujuan terpisah).
- [x] **P3-3 A11y**: kontras `on-surface-variant #cac4d0` WCAG AA; `Sheet` fokus-trap + `Esc` close.
- [x] **P3-4 Bersih legacy**: hapus `arunika:v1` (`App.tsx:35`) bila migrasi selesai; dokumentasikan di README.

## 11. Penerimaan Umum (Definition of Done)

1. `pnpm dev` jalan di `$PORT`; login → 5 layar (4 tab + profil via chip) tanpa error console.
2. Semua angka uang via `fmt()` (currency aktif), persen memakai rumus §6.
3. Tidak ada teks statis bertentangan state (sisa, counter, persen, bar, chip inisial).
4. Keyboard: semua `Action` Enter/Space, sheet `Esc`, fokus terlihat; chart SVG `role="img"` + label.
5. `prefers-reduced-motion` menonaktifkan animasi (dipertahankan).
6. Mobile 360px: bottom-nav + FAB tak menutup konten (`pb-36`); desktop 1280px: sidebar + konten 64rem.
7. Profil: Nama/Email tersimpan → chip inisial benar (regresi insiden §9.1–9.2 tertutup).
8. Tidak ada regresi visual: warna, radius, spacing, ikon = token §8/@theme.

## 12. Roadmap Eksekusi

| Fase | Isi (§10) | Keluaran + verifikasi |
|---|---|---|
| 0 | PRD rewrite + keputusan scope FULL & tanpa-migrasi (selesai) | `prd.md` ini |
| 1 (P0) | P0-1 → P0-7 berurutan | Patch kecil; DoD §11.7 (chip inisial benar); tanpa regresi visual §11.8 |
| 2 (P1) | P1-1 → P1-5 | Refresh di tab apapun kembali ke tab itu; tanpa flash `?` |
| 3 (P2) | P2-1 → P2-6 sesuai prioritas (dompet dulu) | Fitur bernilai; fungsi beku §3 lolos checklist |
| 4 (P3) | P3-1 → P3-4 | CI hijau (vitest + eslint + tsc + build; oxfmt DILARANG §10) |

**Aturan eksekusi:** satu fase lolos DoD-nya baru lanjut fase berikut; tiap item diverifikasi kriteria terimanya sendiri sebelum dicentang. **Risiko:** scope creep mengubah fungsi beku §3 → mitigasi checklist §3 sebagai gerbang; data user nyata (UUID di `add_user_id.sql`) → JANGAN jalankan ulang file itu; kredensial via env (fail-fast `api/server.js`); DB lama butuh migrasi `period` kecil terpisah (bukan file historis).

---
*Disusun dari pembacaan langsung: `src/{App,main,store,Today,Activity,Finance,Report,Profile,TxSheet,DataSheet,Login,ui,Logo,index.css}`, `api/server.js`, `api/package.json`, `db/schema.sql`, `add_user_id.sql`, `package.json`, `index.html`, `vite.config.ts`, `log/image.png`. Angka, label, class, dan rumus merujuk implementasi berjalan.*
