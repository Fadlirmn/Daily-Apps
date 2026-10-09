import { useState } from "react";
import TxSheet, { TxRow } from "./TxSheet";
import {
  calc, fmt, habitStreak, longDate, tapHabit, toggleTask, todayStr, useStore, type Tx,
} from "./store";
import { Action, Empty, Icon, ProfileChip, Progress, SectionHead } from "./ui";

export default function Today({ setActive }: { setActive: (id: string) => void }) {
  const s = useStore();
  const c = calc(s);
  const today = todayStr();
  const [edit, setEdit] = useState<Tx | null>(null);
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";
  const tasks = s.tasks.filter((t) => t.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const done = tasks.filter((t) => t.done).length;
  const spentPct = c.dailyBudget > 0 ? Math.round((c.todaySpend / c.dailyBudget) * 100) : 0;
  const recent = [...s.txs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 4);
  const habitsDone = s.habits.filter((h) => (h.log[today] ?? 0) >= h.target).length;

  const weekTone = c.spendableWeek < c.dailyBudget * 0.5 ? "text-warning" : "text-primary";
  const monthTone = c.spendableMonth < c.monthlyBudget * 0.2 ? "text-expense" : "text-tertiary";
  const dayTone = c.spendableToday < c.dailyBudget * 0.2 ? "text-expense" : "text-tertiary";

  return (
    <>
      <header className="flex items-center justify-between px-5 pb-4 pt-5">
        <div className="min-w-0">
          <p className="text-body-sm text-on-surface-variant">{longDate(today)}</p>
          <p className="mt-1 truncate text-headline text-on-surface">
            {greeting}{s.profile.name ? `, ${s.profile.name}` : ""}
          </p>
        </div>
        <div className="lg:hidden">
          <ProfileChip />
        </div>
      </header>

      <main className="scroll-area space-y-5 overflow-y-auto px-4 pb-36">
        {s.txs.length === 0 && (
          <section className="flex items-center gap-3 rounded-large bg-warning-container p-4">
            <Icon name="info" className="text-warning" />
            <p className="flex-1 text-body-sm text-on-surface">Belum ada data. Tambah transaksi lewat tombol +.</p>
          </section>
        )}

        <section className="overflow-hidden rounded-extra bg-money-card p-5">
          <div className="flex items-center gap-2 text-primary">
            <Icon name="account_balance_wallet" className="text-icon-sm" />
            <p className="text-label">UANG HARI INI</p>
          </div>
          <p className="mt-4 text-body-sm text-on-surface-variant">Boleh dibelanjakan hari ini</p>
          <p className={`money mt-1 text-display ${dayTone}`}>{fmt(c.spendableToday)}</p>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-label-sm text-on-surface-variant">SUDAH DIBELANJAKAN</p>
              <p className="money mt-1 text-title text-on-surface">{fmt(c.todaySpend)}</p>
            </div>
            <p className="text-label text-on-surface-variant">{spentPct}% dari {fmt(c.dailyBudget)}</p>
          </div>
          <div className="mt-3">
            <Progress pct={spentPct} tone={spentPct >= 100 ? "bg-expense" : "bg-tertiary"} />
          </div>
          {c.fixedDaily > 0 && (
            <div className="mt-3 flex items-center gap-2 text-on-surface-variant">
              <Icon name="tips_and_updates" className="text-icon-xs text-warning" />
              <p className="text-label-sm">Pengeluaran tetap aktif {fmt(c.fixedDaily)}/hari sudah dipotong.</p>
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-large bg-surface-container p-4">
            <p className="text-label-sm text-on-surface-variant">SISA MINGGU INI</p>
            <p className={`money mt-2 text-title ${weekTone}`}>{fmt(c.spendableWeek)}</p>
          </div>
          <div className="rounded-large bg-surface-container p-4">
            <p className="text-label-sm text-on-surface-variant">SISA BULAN INI</p>
            <p className={`money mt-2 text-title ${monthTone}`}>{fmt(c.spendableMonth)}</p>
          </div>
        </section>

        <section>
          <SectionHead
            title={`Tugas hari ini`}
            sub={tasks.length ? `${done} dari ${tasks.length} selesai` : "Belum ada tugas"}
            actionLabel="Lihat semua tugas"
            actionText="Lihat semua"
            onAction={() => setActive("activity")}
          />
          {tasks.length === 0 ? (
            <Empty icon="task_alt" text="Tambah tugas pertamamu di tab Aktivitas." />
          ) : (
            <div className="overflow-hidden rounded-large bg-surface-container">
              {tasks.map((task) => (
                <Action
                  key={task.id}
                  label={`${task.done ? "Batalkan" : "Tandai"} tugas ${task.title}`}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-center gap-3 border-b border-outline-variant p-4 last:border-0"
                >
                  <div
                    className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all ${
                      task.done ? "border-primary bg-primary text-on-primary" : "border-outline text-transparent"
                    }`}
                  >
                    <Icon name="check" className="text-icon-xs" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-body text-on-surface ${task.done ? "line-through opacity-60" : ""}`}>{task.title}</p>
                    <p className="mt-1 text-label-sm text-on-surface-variant">
                      {task.time || "--:--"} · {task.tag}
                    </p>
                  </div>
                </Action>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHead
            title="Kebiasaan"
            sub={s.habits.length ? `${habitsDone} dari ${s.habits.length} selesai` : "Belum ada kebiasaan"}
          />
          {s.habits.length === 0 ? (
            <Empty icon="autorenew" text="Buat kebiasaan di tab Aktivitas." />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {s.habits.slice(0, 6).map((h) => {
                const v = h.log[today] ?? 0;
                const ok = v >= h.target;
                return (
                  <Action
                    key={h.id}
                    label={`Catat kebiasaan ${h.title}`}
                    onClick={() => tapHabit(h.id)}
                    className="rounded-large bg-surface-container p-3 text-center"
                  >
                    <div
                      className={`mx-auto grid size-11 place-items-center rounded-full ${
                        ok ? "bg-tertiary text-on-tertiary" : "bg-tertiary-container text-tertiary"
                      }`}
                    >
                      <Icon name={ok ? "check" : "autorenew"} filled />
                    </div>
                    <p className="mt-3 truncate text-label text-on-surface">{h.title}</p>
                    <p className="mt-1 text-label-sm text-on-surface-variant">
                      {v}/{h.target} {h.unit}
                    </p>
                    {habitStreak(h) > 0 && (
                      <p className="mt-1 flex items-center justify-center gap-1 text-label-sm text-warning">
                        <Icon name="local_fire_department" filled className="text-icon-xs" />
                        {habitStreak(h)} hari
                      </p>
                    )}
                  </Action>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <SectionHead
            title="Transaksi terbaru"
            actionLabel="Lihat semua transaksi"
            actionText="Lihat semua"
            onAction={() => setActive("finance")}
          />
          {recent.length === 0 ? (
            <Empty icon="receipt_long" text="Belum ada transaksi. Tekan + untuk mencatat." />
          ) : (
            <div className="overflow-hidden rounded-large bg-surface-container">
              {recent.map((t) => (
                <TxRow key={t.id} tx={t} onClick={() => setEdit(t)} />
              ))}
            </div>
          )}
        </section>
      </main>
      {edit && <TxSheet initial={edit} close={() => setEdit(null)} />}
    </>
  );
}
