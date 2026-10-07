import { useMemo, useRef, useState } from "react";
import Profile from "./Profile";

type IconProps = {
  name: string;
  filled?: boolean;
  className?: string;
};

function Icon({ name, filled = false, className = "" }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-rounded ${filled ? "icon-filled" : ""} ${className}`}
    >
      {name}
    </span>
  );
}

function Action({
  children,
  label,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      aria-label={label}
      className={`cursor-pointer select-none ${className}`}
      onClick={onClick}
      onKeyDown={(event) => event.key === "Enter" && onClick?.()}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  );
}

const tasks = [
  { id: 1, title: "Review proposal klien", time: "09.30", tag: "Kerja", priority: true },
  { id: 2, title: "Bayar tagihan internet", time: "12.00", tag: "Keuangan", finance: true },
  { id: 3, title: "Beli kebutuhan dapur", time: "18.00", tag: "Pribadi" },
];

const transactions = [
  { icon: "restaurant", title: "Kopi & makan siang", place: "Makanan", amount: "-Rp 68.000", tone: "expense" },
  { icon: "directions_bus", title: "Transportasi", place: "Mobilitas", amount: "-Rp 24.000", tone: "expense" },
  { icon: "payments", title: "Pembayaran proyek", place: "Pemasukan", amount: "+Rp 1.500.000", tone: "income" },
];

function Today({
  spent,
  completed,
  setCompleted,
}: {
  spent: number;
  completed: number[];
  setCompleted: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const percent = Math.min(100, Math.round((spent / 180000) * 100));

  function toggleTask(id: number) {
    setCompleted((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <>
      <header className="flex items-center justify-between px-5 pb-4 pt-5">
        <div>
          <p className="text-body-sm text-on-surface-variant">Senin, 28 September</p>
          <p className="mt-1 text-headline text-on-surface">Selamat pagi, Raka</p>
        </div>
        <Action
          label="Buka profil"
          onClick={() => setActive("profile")}
          className="grid size-12 place-items-center rounded-full bg-primary-container text-primary"
        >
          <span className="text-title font-semibold">R</span>
        </Action>
      </header>

      <main className="scroll-area space-y-5 overflow-y-auto px-4 pb-36">
        <section className="overflow-hidden rounded-extra bg-money-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Icon name="account_balance_wallet" className="text-icon-sm" />
                <p className="text-label">UANG HARI INI</p>
              </div>
              <p className="mt-4 text-body-sm text-on-surface-variant">Sudah dibelanjakan</p>
              <p className="money mt-1 text-display text-on-surface">
                Rp {spent.toLocaleString("id-ID")}
              </p>
            </div>
            <Action
              label="Lihat detail uang hari ini"
              className="grid size-10 place-items-center rounded-full bg-surface-translucent text-on-surface"
            >
              <Icon name="arrow_outward" />
            </Action>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-label-sm text-on-surface-variant">SISA AMAN HARI INI</p>
              <p className="money mt-1 text-title text-tertiary">
                Rp {(180000 - spent).toLocaleString("id-ID")}
              </p>
            </div>
            <p className="text-label text-on-surface-variant">{percent}% terpakai</p>
          </div>
          <div
            aria-label={`${percent} persen anggaran harian terpakai`}
            className="mt-3 h-2 overflow-hidden rounded-full bg-outline-variant"
            role="progressbar"
          >
            <div className="h-full rounded-full bg-tertiary transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-on-surface-variant">
            <Icon name="tips_and_updates" className="text-icon-xs text-warning" />
            <p className="text-label-sm">Kamu bisa belanja Rp 86.000 lagi tanpa khawatir.</p>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-baseline gap-2">
              <p className="text-title text-on-surface">Tugas hari ini</p>
              <p className="text-label text-on-surface-variant">{completed.length}/3</p>
            </div>
            <Action label="Lihat semua tugas" className="rounded-full px-3 py-2 text-label text-primary">
              Lihat semua
            </Action>
          </div>
          <div className="overflow-hidden rounded-large bg-surface-container">
            {tasks.map((task, index) => {
              const done = completed.includes(task.id);
              return (
                <Action
                  key={task.id}
                  label={`${done ? "Batalkan" : "Tandai"} tugas ${task.title}`}
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-center gap-3 p-4 ${index !== tasks.length - 1 ? "border-b border-outline-variant" : ""}`}
                >
                  <div
                    className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all ${
                      done ? "border-primary bg-primary text-on-primary" : "border-outline text-transparent"
                    }`}
                  >
                    <Icon name="check" className="text-icon-xs" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-body text-on-surface ${done ? "line-through opacity-60" : ""}`}>
                      {task.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-label-sm text-on-surface-variant">{task.time}</span>
                      <span className="size-1 rounded-full bg-outline" />
                      <span className="text-label-sm text-on-surface-variant">{task.tag}</span>
                    </div>
                  </div>
                  {task.priority && <Icon name="flag" filled className="text-icon-sm text-expense" />}
                  {task.finance && <Icon name="payments" className="text-icon-sm text-tertiary" />}
                </Action>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-baseline gap-2 px-1">
            <p className="text-title text-on-surface">Kebiasaan</p>
            <p className="text-label text-on-surface-variant">2 dari 3 selesai</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "water_drop", label: "Minum air", meta: "6/8 gelas", value: "75%" },
              { icon: "directions_run", label: "Olahraga", meta: "12 hari", value: "done" },
              { icon: "menu_book", label: "Membaca", meta: "20 menit", value: "done" },
            ].map((habit) => (
              <Action
                key={habit.label}
                label={habit.label}
                className="rounded-large bg-surface-container p-3 text-center"
              >
                <div
                  className={`mx-auto grid size-11 place-items-center rounded-full ${
                    habit.value === "done"
                      ? "bg-tertiary text-on-tertiary"
                      : "bg-tertiary-container text-tertiary"
                  }`}
                >
                  <Icon name={habit.value === "done" ? "check" : habit.icon} filled />
                </div>
                <p className="mt-3 truncate text-label text-on-surface">{habit.label}</p>
                <div className="mt-1 flex items-center justify-center gap-1 text-label-sm text-on-surface-variant">
                  {habit.label === "Olahraga" && (
                    <Icon name="local_fire_department" filled className="text-icon-xs text-warning" />
                  )}
                  <span>{habit.meta}</span>
                </div>
              </Action>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-title text-on-surface">Transaksi terbaru</p>
            <Action label="Lihat semua transaksi" className="rounded-full px-3 py-2 text-label text-primary">
              Lihat semua
            </Action>
          </div>
          <div className="overflow-hidden rounded-large bg-surface-container">
            {transactions.slice(0, 2).map((transaction) => (
              <div
                className="flex items-center gap-3 border-b border-outline-variant p-4 last:border-0"
                key={transaction.title}
              >
                <div className="grid size-11 place-items-center rounded-medium bg-surface-container-high text-secondary">
                  <Icon name={transaction.icon} />
                </div>
                <div className="flex-1">
                  <p className="text-body text-on-surface">{transaction.title}</p>
                  <p className="mt-1 text-label-sm text-on-surface-variant">{transaction.place}</p>
                </div>
                <p className="money text-label text-expense">{transaction.amount}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function Activity({
  completed,
  setCompleted,
}: {
  completed: number[];
  setCompleted: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const [view, setView] = useState("Tugas");
  const [addModal, setAddModal] = useState<null | "Tugas" | "Jadwal" | "Kebiasaan">(null);
  const [extraTasks, setExtraTasks] = useState<{ id: number; title: string; time: string; tag: string }[]>([]);
  const [schedules, setSchedules] = useState([
    { time: "09.30", title: "Review proposal klien", meta: "Ruang fokus \u00B7 45 menit" },
    { time: "12.00", title: "Bayar tagihan internet", meta: "Pengingat \u00B7 10 menit" },
    { time: "18.00", title: "Beli kebutuhan dapur", meta: "Pribadi \u00B7 30 menit" },
  ]);
  const [habits, setHabits] = useState([
    { icon: "water_drop", title: "Minum air", meta: "6 dari 8 gelas", progress: "w-3/4" },
    { icon: "directions_run", title: "Olahraga", meta: "Selesai \u00B7 Runtun 12 hari", progress: "w-full" },
    { icon: "menu_book", title: "Membaca", meta: "Selesai \u00B7 20 menit", progress: "w-full" },
  ]);
  const allTasks = [...tasks, ...extraTasks];
  function handleAdd(values: Record<string, string>) {
    const title = (values.title || "Item baru").trim() || "Item baru";
    if (addModal === "Tugas") {
      setExtraTasks((c) => [...c, { id: Date.now(), title, time: values.time || "--.--", tag: values.tag || "Pribadi" }]);
    } else if (addModal === "Jadwal") {
      setSchedules((c) => [...c, { time: values.time || "--.--", title, meta: values.meta || "Baru" }]);
    } else if (addModal === "Kebiasaan") {
      setHabits((c) => [...c, { icon: "autorenew", title, meta: values.meta || "Baru", progress: "w-1/4" }]);
    }
    setAddModal(null);
  }

  function toggleTask(id: number) {
    setCompleted((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <>
      <header className="flex items-center justify-between px-5 pb-4 pt-6">
        <div>
          <p className="text-headline text-on-surface">Aktivitas</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">Atur ritme harianmu</p>
        </div>
        <Action label="Buka kalender" className="grid size-12 place-items-center rounded-full text-on-surface">
          <Icon name="calendar_month" />
        </Action>
      </header>

      <main className="scroll-area space-y-5 overflow-y-auto px-4 pb-36">
        <section className="rounded-extra bg-money-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label text-primary">PROGRES HARI INI</p>
              <p className="mt-3 text-display text-on-surface">{completed.length} dari 3</p>
              <p className="mt-1 text-body-sm text-on-surface-variant">tugas sudah diselesaikan</p>
            </div>
            <div className="grid size-14 place-items-center rounded-full bg-primary-container text-primary">
              <Icon name="task_alt" filled className="text-icon-lg" />
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-outline-variant">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(completed.length / tasks.length) * 100}%` }}
            />
          </div>
        </section>

        <div className="grid grid-cols-3 rounded-full bg-surface-container p-1">
          {[
            ["Tugas", "check_circle"],
            ["Jadwal", "calendar_today"],
            ["Kebiasaan", "autorenew"],
          ].map(([item, icon]) => (
            <Action
              key={item}
              label={`Buka ${item}`}
              onClick={() => setView(item)}
              className={`flex items-center justify-center gap-2 rounded-full py-3 text-label ${
                view === item ? "bg-primary-container text-primary" : "text-on-surface-variant"
              }`}
            >
              <Icon name={icon} className="text-icon-xs" />
              {item}
            </Action>
          ))}
        </div>

        {view === "Tugas" && (
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-title text-on-surface">Tugas hari ini</p>
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  {tasks.length - completed.length} tugas masih perlu diselesaikan
                </p>
              </div>
              <Action label="Filter tugas" className="grid size-11 place-items-center rounded-full text-on-surface">
                <Icon name="tune" />
              </Action>
            </div>
            <div className="overflow-hidden rounded-large bg-surface-container">
              {tasks.map((task, index) => {
                const done = completed.includes(task.id);
                return (
                  <Action
                    key={task.id}
                    label={`${done ? "Batalkan" : "Tandai"} tugas ${task.title}`}
                    onClick={() => toggleTask(task.id)}
                    className={`flex items-center gap-3 p-4 ${
                      index !== tasks.length - 1 ? "border-b border-outline-variant" : ""
                    }`}
                  >
                    <div
                      className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all ${
                        done ? "border-primary bg-primary text-on-primary" : "border-outline text-transparent"
                      }`}
                    >
                      <Icon name="check" className="text-icon-xs" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-body text-on-surface ${done ? "line-through opacity-60" : ""}`}>
                        {task.title}
                      </p>
                      <p className="mt-1 text-label-sm text-on-surface-variant">
                        {task.time} · {task.tag}
                      </p>
                    </div>
                    <Icon name="chevron_right" className="text-on-surface-variant" />
                  </Action>
                );
              })}
            </div>
          </section>
        )}

        {view === "Jadwal" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-title text-on-surface">Jadwal hari ini</p>
                <p className="mt-1 text-label-sm text-on-surface-variant">Senin, 28 September</p>
              </div>
              <Action label="Tambah jadwal" className="rounded-full px-3 py-2 text-label text-primary">
                Tambah
              </Action>
            </div>
            {[
              { time: "09.30", title: "Review proposal klien", meta: "Ruang fokus · 45 menit" },
              { time: "12.00", title: "Bayar tagihan internet", meta: "Pengingat · 10 menit" },
              { time: "18.00", title: "Beli kebutuhan dapur", meta: "Pribadi · 30 menit" },
            ].map((schedule, index) => (
              <div className="flex gap-4 rounded-large bg-surface-container p-4" key={schedule.time}>
                <div className="flex flex-col items-center">
                  <span className="money text-label text-primary">{schedule.time}</span>
                  {index !== 2 && <span className="mt-2 h-10 w-0.5 rounded-full bg-outline-variant" />}
                </div>
                <div>
                  <p className="text-body text-on-surface">{schedule.title}</p>
                  <p className="mt-1 text-label-sm text-on-surface-variant">{schedule.meta}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {view === "Kebiasaan" && (
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-title text-on-surface">Kebiasaan hari ini</p>
                <p className="mt-1 text-label-sm text-on-surface-variant">Pertahankan konsistensimu</p>
              </div>
              <Action label="Tambah kebiasaan" className="rounded-full px-3 py-2 text-label text-primary">
                Tambah
              </Action>
            </div>
            <div className="space-y-3">
              {[
                { icon: "water_drop", title: "Minum air", meta: "6 dari 8 gelas", progress: "w-3/4" },
                { icon: "directions_run", title: "Olahraga", meta: "Selesai · Runtun 12 hari", progress: "w-full" },
                { icon: "menu_book", title: "Membaca", meta: "Selesai · 20 menit", progress: "w-full" },
              ].map((habit) => (
                <Action
                  key={habit.title}
                  label={`Buka kebiasaan ${habit.title}`}
                  className="flex items-center gap-3 rounded-large bg-surface-container p-4"
                >
                  <div className="grid size-12 place-items-center rounded-full bg-tertiary-container text-tertiary">
                    <Icon name={habit.icon} filled />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-body text-on-surface">{habit.title}</p>
                      <p className="text-label-sm text-on-surface-variant">{habit.meta}</p>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-outline-variant">
                      <div className={`h-full rounded-full bg-tertiary ${habit.progress}`} />
                    </div>
                  </div>
                </Action>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function Finance({ spent }: { spent: number }) {
  const [view, setView] = useState("Transaksi");

  return (
    <>
      <header className="flex items-center justify-between px-5 pb-4 pt-6">
        <p className="text-headline text-on-surface">Keuangan</p>
        <Action label="Cari transaksi" className="grid size-12 place-items-center rounded-full text-on-surface">
          <Icon name="search" />
        </Action>
      </header>
      <main className="scroll-area space-y-5 overflow-y-auto px-4 pb-36">
        <section className="rounded-extra bg-balance-card p-5">
          <p className="text-label text-primary">TOTAL SALDO</p>
          <p className="money mt-3 text-display text-on-surface">Rp 8.452.000</p>
          <div className="mt-6 flex items-center gap-2 text-label text-tertiary">
            <Icon name="trending_up" className="text-icon-sm" />
            <span>+Rp 1.124.000 bulan ini</span>
          </div>
        </section>

        <div className="grid grid-cols-3 rounded-full bg-surface-container p-1">
          {["Transaksi", "Anggaran", "Target"].map((item) => (
            <Action
              key={item}
              label={`Buka ${item}`}
              onClick={() => setView(item)}
              className={`rounded-full py-3 text-center text-label ${
                view === item ? "bg-primary-container text-primary" : "text-on-surface-variant"
              }`}
            >
              {item}
            </Action>
          ))}
        </div>

        {view === "Transaksi" && (
          <>
            <section>
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-title text-on-surface">Hari ini</p>
                  <p className="mt-1 text-label-sm text-on-surface-variant">
                    Pengeluaran Rp {spent.toLocaleString("id-ID")}
                  </p>
                </div>
                <Action
                  label="Filter transaksi"
                  className="grid size-11 place-items-center rounded-full text-on-surface"
                >
                  <Icon name="tune" />
                </Action>
              </div>
              <div className="overflow-hidden rounded-large bg-surface-container">
                {transactions.map((transaction) => (
                  <div
                    className="flex items-center gap-3 border-b border-outline-variant p-4 last:border-0"
                    key={transaction.title}
                  >
                    <div className="grid size-11 place-items-center rounded-medium bg-surface-container-high text-secondary">
                      <Icon name={transaction.icon} />
                    </div>
                    <div className="flex-1">
                      <p className="text-body text-on-surface">{transaction.title}</p>
                      <p className="mt-1 text-label-sm text-on-surface-variant">
                        {transaction.place} · 10.24
                      </p>
                    </div>
                    <p
                      className={`money text-label ${
                        transaction.tone === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {transaction.amount}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-large bg-surface-container p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-label-sm text-on-surface-variant">ANGGARAN BULANAN</p>
                  <p className="mt-1 text-title text-on-surface">Rp 2.840.000 tersisa</p>
                </div>
                <div className="grid size-12 place-items-center rounded-full bg-warning-container text-warning">
                  <Icon name="donut_large" />
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-outline-variant">
                <div className="h-full w-2/5 rounded-full bg-primary" />
              </div>
              <p className="mt-2 text-label-sm text-on-surface-variant">42% dari Rp 4.900.000 terpakai</p>
            </section>
          </>
        )}

        {view === "Anggaran" && (
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-title text-on-surface">Anggaran September</p>
                <p className="mt-1 text-label-sm text-on-surface-variant">Rp 2.060.000 dari Rp 4.900.000</p>
              </div>
              <Action label="Tambah anggaran" className="rounded-full px-3 py-2 text-label text-primary">
                Tambah
              </Action>
            </div>
            <div className="space-y-3">
              {[
                { icon: "restaurant", title: "Makanan", spent: "Rp 1.280.000", total: "Rp 1.800.000", width: "w-3/4", tone: "bg-warning" },
                { icon: "directions_bus", title: "Transportasi", spent: "Rp 420.000", total: "Rp 900.000", width: "w-1/2", tone: "bg-primary" },
                { icon: "shopping_bag", title: "Belanja", spent: "Rp 360.000", total: "Rp 1.200.000", width: "w-1/3", tone: "bg-tertiary" },
                { icon: "more_horiz", title: "Lainnya", spent: "Rp 0", total: "Rp 1.000.000", width: "w-0", tone: "bg-primary" },
              ].map((budget) => (
                <Action
                  key={budget.title}
                  label={`Buka anggaran ${budget.title}`}
                  className="rounded-large bg-surface-container p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-medium bg-surface-container-high text-secondary">
                      <Icon name={budget.icon} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-body text-on-surface">{budget.title}</p>
                        <p className="money text-label text-on-surface">{budget.spent}</p>
                      </div>
                      <p className="mt-1 text-label-sm text-on-surface-variant">dari {budget.total}</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-outline-variant">
                    <div className={`h-full rounded-full ${budget.width} ${budget.tone}`} />
                  </div>
                </Action>
              ))}
            </div>
          </section>
        )}

        {view === "Target" && (
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-title text-on-surface">Target tabungan</p>
                <p className="mt-1 text-label-sm text-on-surface-variant">Wujudkan tujuanmu bertahap</p>
              </div>
              <Action label="Tambah target" className="rounded-full px-3 py-2 text-label text-primary">
                Tambah
              </Action>
            </div>
            <div className="space-y-3">
              {[
                { icon: "laptop_mac", title: "Laptop baru", saved: "Rp 8.500.000", target: "Rp 15.000.000", date: "Des 2025", width: "w-3/5" },
                { icon: "flight", title: "Liburan Jepang", saved: "Rp 4.200.000", target: "Rp 12.000.000", date: "Apr 2026", width: "w-1/3" },
                { icon: "health_and_safety", title: "Dana darurat", saved: "Rp 18.000.000", target: "Rp 30.000.000", date: "Fleksibel", width: "w-3/5" },
              ].map((goal) => (
                <Action
                  key={goal.title}
                  label={`Buka target ${goal.title}`}
                  className="rounded-large bg-surface-container p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-12 place-items-center rounded-full bg-primary-container text-primary">
                      <Icon name={goal.icon} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-body text-on-surface">{goal.title}</p>
                        <span className="rounded-full bg-surface-container-high px-2 py-1 text-label-sm text-on-surface-variant">
                          {goal.date}
                        </span>
                      </div>
                      <p className="money mt-2 text-label text-primary">
                        {goal.saved} <span className="text-on-surface-variant">/ {goal.target}</span>
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-outline-variant">
                        <div className={`h-full rounded-full bg-primary ${goal.width}`} />
                      </div>
                    </div>
                  </div>
                </Action>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function Report() {
  const [period, setPeriod] = useState("Bulan");

  return (
    <>
      <header className="flex items-center justify-between px-5 pb-4 pt-6">
        <div>
          <p className="text-headline text-on-surface">Laporan</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">Ringkasan September 2025</p>
        </div>
        <Action label="Ekspor laporan" className="grid size-12 place-items-center rounded-full text-on-surface">
          <Icon name="ios_share" />
        </Action>
      </header>
      <main className="scroll-area space-y-5 overflow-y-auto px-4 pb-36">
        <div className="grid grid-cols-3 rounded-full bg-surface-container p-1">
          {["Minggu", "Bulan", "Tahun"].map((item) => (
            <Action
              key={item}
              label={`Laporan per ${item}`}
              onClick={() => setPeriod(item)}
              className={`rounded-full py-3 text-center text-label ${
                period === item ? "bg-primary-container text-primary" : "text-on-surface-variant"
              }`}
            >
              {item}
            </Action>
          ))}
        </div>

        <section className="rounded-extra bg-balance-card p-5">
          <p className="text-label text-primary">ARUS KAS BERSIH</p>
          <p className="money mt-3 text-display text-income">+Rp 3.240.000</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-large bg-surface-translucent p-3">
              <div className="flex items-center gap-2 text-income">
                <Icon name="south_west" className="text-icon-sm" />
                <p className="text-label-sm">PEMASUKAN</p>
              </div>
              <p className="money mt-2 text-title text-on-surface">Rp 8.450.000</p>
            </div>
            <div className="rounded-large bg-surface-translucent p-3">
              <div className="flex items-center gap-2 text-expense">
                <Icon name="north_east" className="text-icon-sm" />
                <p className="text-label-sm">PENGELUARAN</p>
              </div>
              <p className="money mt-2 text-title text-on-surface">Rp 5.210.000</p>
            </div>
          </div>
        </section>

        <section className="rounded-large bg-surface-container p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-title text-on-surface">Tren pengeluaran</p>
              <p className="mt-1 text-label-sm text-tertiary">12% lebih hemat dari bulan lalu</p>
            </div>
            <Icon name="trending_down" className="text-tertiary" />
          </div>
          <div className="mt-6 flex h-32 items-end justify-between gap-3">
            {[
              ["Mei", "h-20"],
              ["Jun", "h-28"],
              ["Jul", "h-24"],
              ["Agu", "h-32"],
              ["Sep", "h-24"],
            ].map(([month, height], index) => (
              <div className="flex flex-1 flex-col items-center gap-2" key={month}>
                <div
                  className={`w-full max-w-8 rounded-t-medium ${
                    index === 4 ? "bg-primary" : "bg-primary-container"
                  } ${height}`}
                />
                <span className="text-label-sm text-on-surface-variant">{month}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-title text-on-surface">Pengeluaran terbesar</p>
            <Action label="Lihat rincian laporan" className="rounded-full px-3 py-2 text-label text-primary">
              Rincian
            </Action>
          </div>
          <div className="overflow-hidden rounded-large bg-surface-container">
            {[
              { icon: "restaurant", title: "Makanan", amount: "Rp 1.860.000", share: "36%" },
              { icon: "home", title: "Rumah & tagihan", amount: "Rp 1.420.000", share: "27%" },
              { icon: "directions_bus", title: "Transportasi", amount: "Rp 780.000", share: "15%" },
            ].map((category) => (
              <div
                className="flex items-center gap-3 border-b border-outline-variant p-4 last:border-0"
                key={category.title}
              >
                <div className="grid size-11 place-items-center rounded-medium bg-surface-container-high text-secondary">
                  <Icon name={category.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body text-on-surface">{category.title}</p>
                  <p className="mt-1 text-label-sm text-on-surface-variant">{category.share} pengeluaran</p>
                </div>
                <p className="money text-label text-on-surface">{category.amount}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function QuickAdd({
  close,
  save,
}: {
  close: () => void;
  save: (amount: number) => void;
}) {
  const amount = useRef(68000);
  const [category, setCategory] = useState("Makanan");

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-scrim" role="dialog" aria-modal="true">
      <Action label="Tutup tambah transaksi" className="absolute inset-0" onClick={close}>
        <span />
      </Action>
      <section className="sheet relative z-10 w-full rounded-t-sheet bg-surface-container-high p-5 pb-7 lg:mx-auto lg:mb-8 lg:max-w-mobile lg:rounded-sheet">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-outline" />
        <div className="flex items-center justify-between">
          <p className="text-title text-on-surface">Tambah transaksi</p>
          <Action label="Tutup" onClick={close} className="grid size-11 place-items-center rounded-full">
            <Icon name="close" />
          </Action>
        </div>

        <div className="mt-4 grid grid-cols-3 rounded-full bg-surface p-1">
          {["Pengeluaran", "Pemasukan", "Transfer"].map((type, index) => (
            <Action
              key={type}
              label={type}
              className={`rounded-full py-3 text-center text-label ${
                index === 0 ? "bg-primary-container text-primary" : "text-on-surface-variant"
              }`}
            >
              {type}
            </Action>
          ))}
        </div>

        <div className="mt-5 rounded-large border border-outline bg-surface px-4 py-3">
          <p className="text-label-sm text-primary">Nominal</p>
          <div className="mt-1 flex items-center">
            <span className="text-title text-on-surface-variant">Rp</span>
            <div
              aria-label="Nominal transaksi"
              className="money min-w-0 flex-1 px-3 text-money text-on-surface outline-none"
              contentEditable
              inputMode="numeric"
              onInput={(event) => {
                amount.current = Number(event.currentTarget.textContent?.replace(/\D/g, "") || 0);
              }}
              role="textbox"
              suppressContentEditableWarning
            >
              68.000
            </div>
          </div>
        </div>

        <p className="mb-3 mt-5 text-label-sm text-on-surface-variant">PILIH KATEGORI</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            ["restaurant", "Makanan"],
            ["directions_bus", "Transport"],
            ["shopping_bag", "Belanja"],
            ["more_horiz", "Lainnya"],
          ].map(([icon, label]) => (
            <Action
              key={label}
              label={`Kategori ${label}`}
              onClick={() => setCategory(label)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-label ${
                category === label
                  ? "border-primary bg-primary-container text-primary"
                  : "border-outline text-on-surface-variant"
              }`}
            >
              <Icon name={icon} className="text-icon-sm" />
              {label}
            </Action>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Action label="Pilih dompet" className="flex items-center gap-3 rounded-large bg-surface p-4">
            <Icon name="account_balance_wallet" className="text-primary" />
            <div>
              <p className="text-label-sm text-on-surface-variant">Dompet</p>
              <p className="mt-1 text-label text-on-surface">Jago Pocket</p>
            </div>
          </Action>
          <Action label="Pilih tanggal" className="flex items-center gap-3 rounded-large bg-surface p-4">
            <Icon name="calendar_today" className="text-primary" />
            <div>
              <p className="text-label-sm text-on-surface-variant">Tanggal</p>
              <p className="mt-1 text-label text-on-surface">Hari ini</p>
            </div>
          </Action>
        </div>

        <Action
          label="Simpan transaksi"
          onClick={() => save(amount.current)}
          className="mt-6 flex items-center justify-center gap-2 rounded-full bg-primary py-4 text-label text-on-primary"
        >
          <Icon name="check" />
          Simpan transaksi
        </Action>
      </section>
    </div>
  );
}


function GenericAddModal({
  title,
  close,
  onSave,
  fields,
}: {
  title: string;
  close: () => void;
  onSave: (values: Record<string, string>) => void;
  fields: { name: string; label: string; placeholder: string }[];
}) {
  const [vals, setVals] = useState<Record<string, string>>({});

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-scrim" role="dialog" aria-modal="true">
      <Action label="Tutup" className="absolute inset-0" onClick={close}>
        <span />
      </Action>
      <section className="sheet relative z-10 w-full rounded-t-sheet bg-surface-container-high p-5 pb-7 lg:mx-auto lg:mb-8 lg:max-w-mobile lg:rounded-sheet">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-outline" />
        <div className="flex items-center justify-between">
          <p className="text-title text-on-surface">{title}</p>
          <Action label="Tutup" onClick={close} className="grid size-11 place-items-center rounded-full">
            <Icon name="close" />
          </Action>
        </div>

        <div className="mt-4 space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="rounded-large border border-outline bg-surface px-4 py-3">
              <p className="text-label-sm text-primary">{f.label}</p>
              <input
                type="text"
                placeholder={f.placeholder}
                className="mt-1 w-full bg-transparent text-body text-on-surface outline-none"
                onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <Action
          label="Simpan"
          onClick={() => onSave(vals)}
          className="mt-6 flex items-center justify-center gap-2 rounded-full bg-primary py-4 text-label text-on-primary"
        >
          <Icon name="check" />
          Simpan Data
        </Action>
      </section>
    </div>
  );
}


export default function App() {
  const [active, setActive] = useState("today");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [spent, setSpent] = useState(94000);
  const [completed, setCompleted] = useState([1]);
  const [saved, setSaved] = useState(false);

  const navItems = useMemo(
    () => [
      { id: "today", icon: "today", label: "Hari Ini" },
      { id: "activity", icon: "check_circle", label: "Aktivitas" },
      { id: "finance", icon: "account_balance_wallet", label: "Keuangan" },
      { id: "report", icon: "bar_chart", label: "Laporan" },
      { id: "profile", icon: "person", label: "Profil" },
    ],
    [],
  );

  function saveTransaction(amount: number) {
    setSpent((value) => value + amount);
    setSheetOpen(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2800);
  }

  return (
    <div className="app-shell relative mx-auto min-h-screen max-w-mobile overflow-hidden bg-background lg:max-w-none">
      <aside className="desktop-sidebar hidden border-r border-outline-variant bg-surface lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-6 py-7">
          <div className="grid size-11 place-items-center rounded-large bg-primary text-on-primary">
            <Icon name="all_inclusive" filled />
          </div>
          <div>
            <p className="text-title text-on-surface">Arunika</p>
            <p className="text-label-sm text-on-surface-variant">Aktivitas & keuangan</p>
          </div>
        </div>

        <nav aria-label="Navigasi utama" className="space-y-2 px-3">
          {navItems.map((item) => (
            <Action
              key={item.id}
              label={`Buka ${item.label}`}
              onClick={() => setActive(item.id)}
              className={`flex items-center gap-4 rounded-full px-4 py-3 ${
                active === item.id
                  ? "bg-primary-container text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <Icon name={item.icon} filled={active === item.id} />
              <span className="text-label">{item.label}</span>
            </Action>
          ))}
        </nav>

        <Action
          label="Tambah transaksi cepat"
          onClick={() => setSheetOpen(true)}
          className="mx-4 mt-7 flex items-center justify-center gap-3 rounded-large bg-primary px-4 py-4 text-label text-on-primary"
        >
          <Icon name="add" />
          Tambah transaksi
        </Action>

        <div className="mx-4 mb-6 mt-auto rounded-large bg-surface-container p-4">
          <div className="flex items-center gap-2 text-tertiary">
            <Icon name="cloud_done" className="text-icon-sm" />
            <p className="text-label">Tersimpan offline</p>
          </div>
          <p className="mt-2 text-label-sm text-on-surface-variant">
            Data terbaru akan disinkronkan saat perangkat kembali online.
          </p>
        </div>
      </aside>

      <div className="desktop-content">
        {active === "today" && (
          <Today spent={spent} completed={completed} setCompleted={setCompleted} />
        )}
        {active === "activity" && <Activity completed={completed} setCompleted={setCompleted} />}
        {active === "finance" && <Finance spent={spent} />}
        {active === "report" && <Report />}
        {active === "profile" && <Profile />}
      </div>

      <nav className="absolute inset-x-0 bottom-0 z-30 grid grid-cols-5 items-end border-t border-outline-variant bg-nav px-1 pb-safe pt-2 lg:hidden">
        {navItems.slice(0, 3).map((item) => (
          <NavItem key={item.id} {...item} active={active === item.id} onClick={() => setActive(item.id)} />
        ))}
        <div className="flex justify-center">
          <Action
            label="Tambah cepat"
            onClick={() => setSheetOpen(true)}
            className="fab -mt-8 grid size-14 place-items-center rounded-large bg-primary text-on-primary"
          >
            <Icon name="add" className="text-icon-lg" />
          </Action>
        </div>
        {navItems.slice(3).map((item) => (
          <NavItem key={item.id} {...item} active={active === item.id} onClick={() => setActive(item.id)} />
        ))}
      </nav>

      {saved && (
        <div className="absolute bottom-28 left-4 right-4 z-40 flex items-center gap-3 rounded-medium bg-inverse-surface p-4 text-inverse-on-surface">
          <Icon name="check_circle" className="text-tertiary" />
          <p className="flex-1 text-body-sm">Transaksi berhasil disimpan</p>
          <Action label="Urungkan transaksi" className="text-label text-primary">
            Urungkan
          </Action>
        </div>
      )}

      {sheetOpen && <QuickAdd close={() => setSheetOpen(false)} save={saveTransaction} />}
    </div>
  );
}

function NavItem({
  id,
  icon,
  label,
  active,
  onClick,
}: {
  id: string;
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Action
      label={`Buka ${label}`}
      onClick={onClick}
      className={`flex min-w-0 flex-col items-center gap-1 pb-2 ${
        active ? "text-on-surface" : "text-on-surface-variant"
      }`}
    >
      <div className={`grid h-8 w-16 place-items-center rounded-full ${active ? "bg-primary-container" : ""}`}>
        <Icon name={icon} filled={active} className="text-icon-sm" />
      </div>
      <span className="truncate text-label-sm">{label}</span>
      <span className="sr-only">{id}</span>
    </Action>
  );
}
