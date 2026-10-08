import { useState } from "react";
import {
  addDays, addHabit, addSchedule, addTask, deleteHabit, deleteSchedule, deleteTask, habitStreak,
  longDate, tapHabit, toggleTask, todayStr, useStore,
} from "./store";
import { Action, Empty, Field, Icon, PageHeader, PrimaryButton, Progress, SectionHead, Segmented, Sheet, Stepper, inputCls } from "./ui";

type Kind = "Tugas" | "Jadwal" | "Kebiasaan";

function AddSheet({ kind, date, close }: { kind: Kind; date: string; close: () => void }) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [extra, setExtra] = useState("");
  const [target, setTarget] = useState("1");
  const [unit, setUnit] = useState("kali");
  const [error, setError] = useState("");

  function save() {
    if (!title.trim()) return setError("Judul wajib diisi.");
    if (kind === "Tugas") addTask({ title: title.trim(), time, tag: extra.trim() || "Pribadi", date });
    if (kind === "Jadwal") addSchedule({ title: title.trim(), time: time || "00:00", meta: extra.trim(), date });
    if (kind === "Kebiasaan") {
      const t = Math.max(1, Number(target) || 1);
      addHabit({ title: title.trim(), target: t, unit: unit.trim() || "kali" });
    }
    close();
  }

  return (
    <Sheet title={`Tambah ${kind.toLowerCase()}`} onClose={close}>
      <Field label={kind === "Kebiasaan" ? "Nama kebiasaan" : "Judul"}>
        <input id="act-title" autoFocus className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "Tugas" ? "cth: Kirim invoice" : kind === "Jadwal" ? "cth: Meeting tim" : "cth: Meditasi"} />
      </Field>
      {kind !== "Kebiasaan" && (
        <Field label="Waktu">
          <input id="act-time" type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      )}
      {kind === "Tugas" && (
        <Field label="Kategori">
          <input id="act-tag" className={inputCls} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="cth: Kerja" />
        </Field>
      )}
      {kind === "Jadwal" && (
        <Field label="Catatan">
          <input id="act-meta" className={inputCls} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="cth: Ruang fokus · 30 menit" />
        </Field>
      )}
      {kind === "Kebiasaan" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target per hari">
            <input id="act-target" type="number" min={1} className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)} />
          </Field>
          <Field label="Satuan">
            <input id="act-unit" className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="gelas, menit…" />
          </Field>
        </div>
      )}
      {error && <p className="text-body-sm text-expense">{error}</p>}
      <PrimaryButton onClick={save}>Simpan</PrimaryButton>
    </Sheet>
  );
}

export default function Activity() {
  const s = useStore();
  const [view, setView] = useState<Kind>("Tugas");
  const [date, setDate] = useState(todayStr());
  const [add, setAdd] = useState<Kind | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const today = todayStr();

  const dayTasks = s.tasks.filter((t) => t.date === date).sort((a, b) => a.time.localeCompare(b.time));
  const shown = hideDone ? dayTasks.filter((t) => !t.done) : dayTasks;
  const done = dayTasks.filter((t) => t.done).length;
  const schedules = s.schedules.filter((x) => x.date === date).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <>
      <PageHeader title="Aktivitas" sub="Atur ritme harianmu" />
      <main className="scroll-area space-y-5 overflow-y-auto px-4 pb-36">
        <section className="rounded-extra bg-money-card p-5">
          <p className="text-label text-primary">{date === today ? "PROGRES HARI INI" : "PROGRES TANGGAL INI"}</p>
          <p className="mt-3 text-display text-on-surface">
            {done} dari {dayTasks.length}
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">tugas sudah diselesaikan</p>
          <div className="mt-5">
            <Progress pct={dayTasks.length ? (done / dayTasks.length) * 100 : 0} />
          </div>
        </section>

        <Segmented
          items={[["Tugas", "check_circle"], ["Jadwal", "calendar_today"], ["Kebiasaan", "autorenew"]]}
          value={view}
          onChange={(v) => setView(v as Kind)}
        />

        {view !== "Kebiasaan" && (
          <div className="rounded-large bg-surface-container px-2">
            <Stepper
              label={date === today ? `Hari ini · ${longDate(date)}` : longDate(date)}
              onPrev={() => setDate(addDays(date, -1))}
              onNext={() => setDate(addDays(date, 1))}
            />
          </div>
        )}

        {view === "Tugas" && (
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-title text-on-surface">Tugas</p>
              <div className="flex items-center">
                <Action label="Tambah tugas" onClick={() => setAdd("Tugas")} className="rounded-full px-3 py-2 text-label text-primary">
                  Tambah
                </Action>
                <Action
                  label={hideDone ? "Tampilkan tugas selesai" : "Sembunyikan tugas selesai"}
                  onClick={() => setHideDone(!hideDone)}
                  className={`grid size-11 place-items-center rounded-full ${hideDone ? "bg-primary-container text-primary" : "text-on-surface"}`}
                >
                  <Icon name="tune" />
                </Action>
              </div>
            </div>
            {shown.length === 0 ? (
              <Empty icon="task_alt" text={dayTasks.length ? "Semua tugas selesai." : "Belum ada tugas di tanggal ini."} />
            ) : (
              <div className="overflow-hidden rounded-large bg-surface-container">
                {shown.map((task) => (
                  <div key={task.id} className="flex items-center border-b border-outline-variant last:border-0">
                    <Action
                      label={`${task.done ? "Batalkan" : "Tandai"} tugas ${task.title}`}
                      onClick={() => toggleTask(task.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 p-4"
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
                    <Action label={`Hapus tugas ${task.title}`} onClick={() => deleteTask(task.id)} className="grid size-11 shrink-0 place-items-center rounded-full text-on-surface-variant">
                      <Icon name="delete" className="text-icon-sm" />
                    </Action>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {view === "Jadwal" && (
          <section className="space-y-3">
            <SectionHead title="Jadwal" sub={`${schedules.length} agenda`} actionLabel="Tambah jadwal" onAction={() => setAdd("Jadwal")} />
            {schedules.length === 0 && <Empty icon="calendar_today" text="Belum ada jadwal di tanggal ini." />}
            {schedules.map((x) => (
              <div className="flex items-center gap-4 rounded-large bg-surface-container p-4" key={x.id}>
                <span className="money text-label text-primary">{x.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-body text-on-surface">{x.title}</p>
                  {x.meta && <p className="mt-1 text-label-sm text-on-surface-variant">{x.meta}</p>}
                </div>
                <Action label={`Hapus jadwal ${x.title}`} onClick={() => deleteSchedule(x.id)} className="grid size-11 place-items-center rounded-full text-on-surface-variant">
                  <Icon name="delete" className="text-icon-sm" />
                </Action>
              </div>
            ))}
          </section>
        )}

        {view === "Kebiasaan" && (
          <section>
            <SectionHead title="Kebiasaan hari ini" sub="Ketuk untuk menambah progres" actionLabel="Tambah kebiasaan" onAction={() => setAdd("Kebiasaan")} />
            {s.habits.length === 0 && <Empty icon="autorenew" text="Belum ada kebiasaan. Tambah satu untuk mulai membangun runtun." />}
            <div className="space-y-3">
              {s.habits.map((h) => {
                const v = h.log[today] ?? 0;
                const streak = habitStreak(h);
                return (
                  <div key={h.id} className="flex items-center rounded-large bg-surface-container">
                    <Action label={`Catat kebiasaan ${h.title}`} onClick={() => tapHabit(h.id)} className="flex min-w-0 flex-1 items-center gap-3 p-4">
                      <div className="grid size-12 shrink-0 place-items-center rounded-full bg-tertiary-container text-tertiary">
                        <Icon name={v >= h.target ? "check" : "autorenew"} filled />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-body text-on-surface">{h.title}</p>
                          <p className="shrink-0 text-label-sm text-on-surface-variant">
                            {v}/{h.target} {h.unit}
                          </p>
                        </div>
                        <div className="mt-3">
                          <Progress pct={(v / h.target) * 100} tone="bg-tertiary" />
                        </div>
                        {streak > 0 && <p className="mt-2 text-label-sm text-warning">Runtun {streak} hari</p>}
                      </div>
                    </Action>
                    <Action label={`Hapus kebiasaan ${h.title}`} onClick={() => deleteHabit(h.id)} className="grid size-11 shrink-0 place-items-center rounded-full text-on-surface-variant">
                      <Icon name="delete" className="text-icon-sm" />
                    </Action>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
      {add && <AddSheet kind={add} date={date} close={() => setAdd(null)} />}
    </>
  );
}
