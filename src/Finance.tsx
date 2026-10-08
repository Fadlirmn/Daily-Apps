import { useState } from "react";
import TxSheet, { TxRow } from "./TxSheet";
import {
  MONTHS, addCategory, addGoal, calc, catIcon, categorySpend, daysInMonth, deleteCategory, deleteGoal,
  dstr, fmt, longDate, short, sum, todayStr, updateCategory, updateGoal, useStore,
  type Category, type Goal, type Tx,
} from "./store";
import { Action, Empty, Field, Icon, PageHeader, PrimaryButton, Progress, SectionHead, Segmented, Sheet, Stepper, inputCls } from "./ui";

const num = (v: string) => Number(v.replace(/\D/g, "")) || 0;

/* ---------- Transaksi ---------- */
function Transactions({ onEdit }: { onEdit: (t: Tx) => void }) {
  const { txs } = useStore();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("Semua");
  const [limit, setLimit] = useState(30);

  const filtered = txs
    .filter((t) => (kind === "Semua" ? true : kind === "Keluar" ? t.type === "expense" : t.type === "income"))
    .filter((t) => `${t.description} ${t.category}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const page = filtered.slice(0, limit);
  const groups: [string, Tx[]][] = [];
  for (const t of page) {
    const last = groups[groups.length - 1];
    if (last && last[0] === t.date) last[1].push(t);
    else groups.push([t.date, [t]]);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 rounded-full border border-outline bg-surface px-4">
        <Icon name="search" className="text-on-surface-variant" />
        <input
          id="tx-search"
          aria-label="Cari transaksi"
          className="w-full bg-transparent py-3 text-body text-on-surface outline-none"
          placeholder="Cari deskripsi atau kategori"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        {["Semua", "Keluar", "Masuk"].map((k) => (
          <Action
            key={k}
            label={`Filter ${k}`}
            onClick={() => setKind(k)}
            className={`rounded-full border px-4 py-2 text-label ${
              kind === k ? "border-primary bg-primary-container text-primary" : "border-outline text-on-surface-variant"
            }`}
          >
            {k}
          </Action>
        ))}
      </div>
      {groups.length === 0 && <Empty icon="receipt_long" text={txs.length ? "Tidak ada transaksi yang cocok." : "Belum ada transaksi. Tekan + untuk mencatat."} />}
      {groups.map(([date, list]) => {
        const net = sum(list.map((t) => (t.type === "income" ? t.amount : -t.amount)));
        return (
          <div key={date}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <p className="text-label text-on-surface">{date === todayStr() ? "Hari ini" : longDate(date)}</p>
              <p className="money text-label-sm text-on-surface-variant">{fmt(net, true)}</p>
            </div>
            <div className="overflow-hidden rounded-large bg-surface-container">
              {list.map((t) => (
                <TxRow key={t.id} tx={t} onClick={() => onEdit(t)} />
              ))}
            </div>
          </div>
        );
      })}
      {filtered.length > limit && (
        <Action label="Muat lebih banyak" onClick={() => setLimit(limit + 30)} className="rounded-full py-3 text-center text-label text-primary">
          Muat lebih banyak ({filtered.length - limit})
        </Action>
      )}
    </section>
  );
}

/* ---------- Anggaran ---------- */
function CategorySheet({ cat, presetName, close }: { cat?: Category; presetName?: string; close: () => void }) {
  const [name, setName] = useState(cat?.name ?? presetName ?? "");
  const [limit, setLimit] = useState(cat ? String(cat.budgetLimit) : "");
  const [error, setError] = useState("");
  function save() {
    const err = cat ? updateCategory(cat.id, name, num(limit)) : addCategory(name, num(limit));
    if (err) setError(err);
    else close();
  }
  return (
    <Sheet title={cat ? "Ubah anggaran" : "Tambah anggaran"} onClose={close}>
      <Field label="Nama kategori">
        <input id="cat-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: makanan" />
      </Field>
      <Field label="Batas anggaran per bulan (0 = tanpa batas)">
        <input id="cat-limit" className={inputCls} inputMode="numeric" value={limit ? num(limit).toLocaleString("id-ID") : ""} onChange={(e) => setLimit(e.target.value)} placeholder="0" />
      </Field>
      {error && <p className="text-body-sm text-expense">{error}</p>}
      <PrimaryButton onClick={save}>Simpan</PrimaryButton>
      {cat && (
        <PrimaryButton danger icon="delete" onClick={() => { deleteCategory(cat.id); close(); }}>
          Hapus kategori
        </PrimaryButton>
      )}
    </Sheet>
  );
}

function Budgets() {
  const s = useStore();
  const c = calc(s);
  const monthKey = todayStr().slice(0, 7);
  const spent = categorySpend(s.txs, monthKey);
  const [sheet, setSheet] = useState<{ cat?: Category; name?: string } | null>(null);
  const known = new Set(s.categories.map((x) => x.name));
  const loose = Object.keys(spent).filter((k) => !known.has(k));
  const totalLimit = sum(s.categories.map((x) => x.budgetLimit));
  const totalSpent = sum(Object.values(spent));
  const tone = (pct: number) => (pct >= 100 ? "bg-expense" : pct >= 80 ? "bg-warning" : "bg-primary");

  return (
    <section className="space-y-3">
      <SectionHead
        title={`Anggaran ${MONTHS[new Date().getMonth()]}`}
        sub={`${fmt(totalSpent)} terpakai · batas kategori ${fmt(totalLimit)}`}
        actionLabel="Tambah anggaran"
        onAction={() => setSheet({})}
      />
      <div className="rounded-large bg-surface-container p-4">
        <p className="text-label-sm text-on-surface-variant">BUDGET BELANJA BULAN INI (setelah target menabung {s.profile.wealthGoal}%)</p>
        <p className="money mt-1 text-title text-on-surface">{fmt(c.spendableMonth)} tersisa</p>
        <div className="mt-3">
          <Progress pct={c.monthlyBudget ? (c.monthSpend / c.monthlyBudget) * 100 : 0} tone={tone(c.monthlyBudget ? (c.monthSpend / c.monthlyBudget) * 100 : 0)} />
        </div>
        <p className="mt-2 text-label-sm text-on-surface-variant">
          {fmt(c.monthSpend)} dari {fmt(c.monthlyBudget)} · pengeluaran tetap {fmt(c.fixedDaily * c.dim)}
        </p>
      </div>
      {s.categories.length === 0 && <Empty icon="donut_large" text="Belum ada anggaran kategori." />}
      {s.categories.map((cat) => {
        const sp = spent[cat.name] ?? 0;
        const pct = cat.budgetLimit > 0 ? (sp / cat.budgetLimit) * 100 : 0;
        return (
          <Action key={cat.id} label={`Ubah anggaran ${cat.name}`} onClick={() => setSheet({ cat })} className="block rounded-large bg-surface-container p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-medium bg-surface-container-high text-secondary">
                <Icon name={catIcon(cat.name)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-body capitalize text-on-surface">{cat.name}</p>
                  <p className="money text-label text-on-surface">{fmt(sp)}</p>
                </div>
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  {cat.budgetLimit > 0 ? `${Math.round(pct)}% dari ${fmt(cat.budgetLimit)}` : "Tanpa batas"}
                </p>
              </div>
            </div>
            {cat.budgetLimit > 0 && (
              <div className="mt-4">
                <Progress pct={pct} tone={tone(pct)} />
              </div>
            )}
          </Action>
        );
      })}
      {loose.map((name) => (
        <Action key={name} label={`Atur anggaran ${name}`} onClick={() => setSheet({ name })} className="flex items-center gap-3 rounded-large border border-dashed border-outline-variant p-4">
          <Icon name={catIcon(name)} className="text-secondary" />
          <p className="flex-1 text-body capitalize text-on-surface">{name}</p>
          <p className="money text-label text-on-surface">{fmt(spent[name])}</p>
          <span className="text-label-sm text-primary">Atur</span>
        </Action>
      ))}
      {sheet && <CategorySheet cat={sheet.cat} presetName={sheet.name} close={() => setSheet(null)} />}
    </section>
  );
}

/* ---------- Target ---------- */
function GoalSheet({ goal, close }: { goal?: Goal; close: () => void }) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [target, setTarget] = useState(goal ? String(goal.target) : "");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [delta, setDelta] = useState("");
  const [error, setError] = useState("");

  function save() {
    if (!title.trim()) return setError("Nama target wajib diisi.");
    if (num(target) <= 0) return setError("Nominal target harus lebih dari 0.");
    if (goal) updateGoal(goal.id, { title: title.trim(), target: num(target), deadline });
    else addGoal({ title: title.trim(), target: num(target), deadline });
    close();
  }
  function move(sign: 1 | -1) {
    const d = num(delta);
    if (!goal || !d) return setError("Isi nominal tabungan.");
    updateGoal(goal.id, { saved: Math.max(0, goal.saved + sign * d) });
    close();
  }

  return (
    <Sheet title={goal ? "Ubah target" : "Tambah target"} onClose={close}>
      {goal && (
        <div className="space-y-3 rounded-large bg-surface p-4">
          <p className="text-label-sm text-on-surface-variant">TABUNGAN SAAT INI: <span className="money text-primary">{fmt(goal.saved)}</span></p>
          <input id="goal-delta" aria-label="Nominal tabungan" className={inputCls} inputMode="numeric" placeholder="Nominal" value={delta ? num(delta).toLocaleString("id-ID") : ""} onChange={(e) => setDelta(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <PrimaryButton icon="add" onClick={() => move(1)}>Setor</PrimaryButton>
            <PrimaryButton icon="remove" danger onClick={() => move(-1)}>Tarik</PrimaryButton>
          </div>
        </div>
      )}
      <Field label="Nama target">
        <input id="goal-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="cth: Liburan Jepang" />
      </Field>
      <Field label="Nominal target">
        <input id="goal-target" className={inputCls} inputMode="numeric" value={target ? num(target).toLocaleString("id-ID") : ""} onChange={(e) => setTarget(e.target.value)} placeholder="0" />
      </Field>
      <Field label="Tenggat (opsional)">
        <input id="goal-deadline" type="date" className={inputCls} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </Field>
      {error && <p className="text-body-sm text-expense">{error}</p>}
      <PrimaryButton onClick={save}>Simpan</PrimaryButton>
      {goal && (
        <PrimaryButton danger icon="delete" onClick={() => { deleteGoal(goal.id); close(); }}>
          Hapus target
        </PrimaryButton>
      )}
    </Sheet>
  );
}

function Goals() {
  const { goals } = useStore();
  const [sheet, setSheet] = useState<{ goal?: Goal } | null>(null);
  return (
    <section>
      <SectionHead title="Target tabungan" sub="Wujudkan tujuanmu bertahap" actionLabel="Tambah target" onAction={() => setSheet({})} />
      {goals.length === 0 && <Empty icon="savings" text="Belum ada target. Tambah satu untuk mulai menabung." />}
      <div className="space-y-3">
        {goals.map((g) => {
          const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
          return (
            <Action key={g.id} label={`Buka target ${g.title}`} onClick={() => setSheet({ goal: g })} className="block rounded-large bg-surface-container p-4">
              <div className="flex items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-container text-primary">
                  <Icon name={pct >= 100 ? "emoji_events" : "savings"} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-body text-on-surface">{g.title}</p>
                    <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-1 text-label-sm text-on-surface-variant">
                      {g.deadline ? longDate(g.deadline) : "Fleksibel"}
                    </span>
                  </div>
                  <p className="money mt-2 text-label text-primary">
                    {fmt(g.saved)} <span className="text-on-surface-variant">/ {fmt(g.target)}</span>
                  </p>
                  <div className="mt-3">
                    <Progress pct={pct} tone={pct >= 100 ? "bg-tertiary" : "bg-primary"} />
                  </div>
                  <p className="mt-2 text-label-sm text-on-surface-variant">{Math.round(pct)}% tercapai</p>
                </div>
              </div>
            </Action>
          );
        })}
      </div>
      {sheet && <GoalSheet goal={sheet.goal} close={() => setSheet(null)} />}
    </section>
  );
}

/* ---------- Kalender ---------- */
function CalendarView({ onEdit, onAdd }: { onEdit: (t: Tx) => void; onAdd: (date: string) => void }) {
  const { txs } = useStore();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sel, setSel] = useState(todayStr());
  const first = new Date(ym.y, ym.m, 1);
  const dim = daysInMonth(first);
  const key = `${ym.y}-${String(ym.m + 1).padStart(2, "0")}`;
  const spendMap: Record<string, number> = {};
  for (const t of txs) if (t.type === "expense" && t.date.startsWith(key)) spendMap[t.date] = (spendMap[t.date] ?? 0) + t.amount;
  const cells: (number | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const dayTx = txs.filter((t) => t.date === sel);
  const shift = (n: number) => {
    const d = new Date(ym.y, ym.m + n, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <section className="space-y-4">
      <div className="rounded-large bg-surface-container p-2">
        <Stepper label={`${MONTHS[ym.m]} ${ym.y}`} onPrev={() => shift(-1)} onNext={() => shift(1)} />
        <div className="mt-2 grid grid-cols-7 gap-1 px-1 pb-2 text-center">
          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
            <p key={d} className="py-1 text-label-sm text-on-surface-variant">{d}</p>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const ds = dstr(new Date(ym.y, ym.m, day));
            const v = spendMap[ds];
            const active = ds === sel;
            return (
              <Action
                key={ds}
                label={`Pilih tanggal ${day}`}
                onClick={() => setSel(ds)}
                className={`flex min-h-14 flex-col items-center justify-start rounded-medium py-1 ${
                  active ? "bg-primary-container text-primary" : ds === todayStr() ? "border border-primary text-on-surface" : "text-on-surface"
                }`}
              >
                <span className="text-label">{day}</span>
                <span className={`money text-[0.625rem] ${v ? "text-expense" : "text-transparent"}`}>{v ? short(v) : "0"}</span>
              </Action>
            );
          })}
        </div>
      </div>

      <div>
        <SectionHead
          title={longDate(sel)}
          sub={`Pengeluaran ${fmt(sum(dayTx.filter((t) => t.type === "expense").map((t) => t.amount)))}`}
          actionLabel="Tambah transaksi di tanggal ini"
          actionText="Tambah"
          onAction={() => onAdd(sel)}
        />
        {dayTx.length === 0 ? (
          <Empty icon="event_available" text="Tidak ada transaksi di tanggal ini." />
        ) : (
          <div className="overflow-hidden rounded-large bg-surface-container">
            {dayTx.map((t) => (
              <TxRow key={t.id} tx={t} onClick={() => onEdit(t)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Layar ---------- */
export default function Finance() {
  const s = useStore();
  const c = calc(s);
  const [view, setView] = useState("Transaksi");
  const [sheet, setSheet] = useState<{ tx?: Tx; date?: string } | null>(null);
  const monthNet = c.monthIncome - c.monthSpend;

  return (
    <>
      <PageHeader title="Keuangan" />
      <main className="scroll-area space-y-5 overflow-y-auto px-4 pb-36">
        <section className="rounded-extra bg-balance-card p-5">
          <p className="text-label text-primary">TOTAL SALDO</p>
          <p className="money mt-3 text-display text-on-surface">{fmt(c.balance)}</p>
          <div className={`mt-6 flex items-center gap-2 text-label ${monthNet >= 0 ? "text-tertiary" : "text-expense"}`}>
            <Icon name={monthNet >= 0 ? "trending_up" : "trending_down"} className="text-icon-sm" />
            <span>{fmt(monthNet, true)} bulan ini</span>
          </div>
        </section>

        <Segmented items={["Transaksi", "Anggaran", "Target", "Kalender"]} value={view} onChange={setView} />

        {view === "Transaksi" && <Transactions onEdit={(tx) => setSheet({ tx })} />}
        {view === "Anggaran" && <Budgets />}
        {view === "Target" && <Goals />}
        {view === "Kalender" && <CalendarView onEdit={(tx) => setSheet({ tx })} onAdd={(date) => setSheet({ date })} />}
      </main>
      {sheet && <TxSheet initial={sheet.tx} defaultDate={sheet.date} close={() => setSheet(null)} />}
    </>
  );
}
