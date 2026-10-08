import { useSyncExternalStore } from "react";

export type TxType = "expense" | "income";
export type Tx = {
  id: string;
  type: TxType;
  category: string;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD (lokal)
  createdAt: number;
};
export type Category = { id: string; name: string; budgetLimit: number };
export type Goal = { id: string; title: string; target: number; saved: number; deadline: string };
export type FixedExpense = {
  id: string;
  name: string;
  amount: number;
  period: "harian" | "bulanan";
  isActive: boolean;
};
export type Task = { id: string; title: string; time: string; tag: string; date: string; done: boolean };
export type Schedule = { id: string; time: string; title: string; meta: string; date: string };
export type Habit = {
  id: string;
  title: string;
  target: number;
  unit: string;
  log: Record<string, number>;
};
export type Profile = {
  name: string;
  email: string;
  currency: "IDR" | "USD" | "EUR";
  monthlyIncome: number;
  wealthGoal: number; // persen pemasukan yang ditabung
  startBalance: number;
};
export type State = {
  profile: Profile;
  txs: Tx[];
  categories: Category[];
  goals: Goal[];
  fixed: FixedExpense[];
  tasks: Task[];
  schedules: Schedule[];
  habits: Habit[];
};

/* ---------- tanggal ---------- */
export const pad = (n: number) => String(n).padStart(2, "0");
export const dstr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => dstr(new Date());
export const parseDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const addDays = (s: string, n: number) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return dstr(d);
};
export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
export const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const longDate = (s: string) => {
  const d = parseDate(s);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/* ---------- id & format ---------- */
export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function fmt(n: number, signed = false) {
  const cur = state.profile.currency;
  const locale = cur === "IDR" ? "id-ID" : cur === "EUR" ? "de-DE" : "en-US";
  const s = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: cur,
    maximumFractionDigits: cur === "IDR" ? 0 : 2,
  }).format(Math.abs(Math.round(n * 100) / 100));
  return (n < 0 ? "-" : signed && n > 0 ? "+" : "") + s;
}
export function short(n: number) {
  return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/* ---------- state awal ---------- */
function defaults(): State {
  return {
    profile: {
      name: "Pengguna",
      email: "",
      currency: "IDR",
      monthlyIncome: 8000000,
      wealthGoal: 30,
      startBalance: 0,
    },
    txs: [],
    categories: [
      { id: uid(), name: "makanan", budgetLimit: 1800000 },
      { id: uid(), name: "transportasi", budgetLimit: 900000 },
      { id: uid(), name: "hiburan", budgetLimit: 500000 },
      { id: uid(), name: "belanja", budgetLimit: 1200000 },
      { id: uid(), name: "tagihan", budgetLimit: 1000000 },
    ],
    goals: [],
    fixed: [],
    tasks: [],
    schedules: [],
    habits: [],
  };
}

const KEY = "arunika:v1";

function sanitize(raw: unknown): State | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<State>;
  const d = defaults();
  const arr = <T,>(v: unknown, fb: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fb);
  return {
    profile: { ...d.profile, ...(r.profile ?? {}) },
    txs: arr(r.txs, []),
    categories: arr(r.categories, d.categories),
    goals: arr(r.goals, []),
    fixed: arr(r.fixed, []),
    tasks: arr(r.tasks, []),
    schedules: arr(r.schedules, []),
    habits: arr(r.habits, []),
  };
}

function load(): State {
  try {
    const s = localStorage.getItem(KEY);
    if (s) {
      const parsed = sanitize(JSON.parse(s));
      if (parsed) return parsed;
    }
  } catch {
    /* storage tidak tersedia */
  }
  return defaults();
}

let state: State = load();
const listeners = new Set<() => void>();

function set(fn: (s: State) => State) {
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* abaikan */
  }
  listeners.forEach((l) => l());
}

export function useStore(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

/* ---------- aksi ---------- */
export const norm = (s: string) => s.trim().toLowerCase();

export function addTx(t: Omit<Tx, "id" | "createdAt">): string {
  const tx: Tx = { ...t, category: norm(t.category) || "uncategorized", id: uid(), createdAt: Date.now() };
  set((s) => ({ ...s, txs: [...s.txs, tx] }));
  return tx.id;
}
export function updateTx(id: string, patch: Partial<Omit<Tx, "id" | "createdAt">>) {
  set((s) => ({
    ...s,
    txs: s.txs.map((t) =>
      t.id === id ? { ...t, ...patch, category: patch.category ? norm(patch.category) : t.category } : t,
    ),
  }));
}
export function deleteTx(id: string) {
  set((s) => ({ ...s, txs: s.txs.filter((t) => t.id !== id) }));
}

export function addCategory(name: string, budgetLimit: number): string | null {
  const n = norm(name);
  if (!n) return "Nama kategori wajib diisi.";
  if (state.categories.some((c) => c.name === n)) return "Kategori sudah ada.";
  set((s) => ({ ...s, categories: [...s.categories, { id: uid(), name: n, budgetLimit }] }));
  return null;
}
export function updateCategory(id: string, name: string, budgetLimit: number): string | null {
  const n = norm(name);
  if (!n) return "Nama kategori wajib diisi.";
  if (state.categories.some((c) => c.id !== id && c.name === n)) return "Kategori sudah ada.";
  set((s) => {
    const old = s.categories.find((c) => c.id === id);
    return {
      ...s,
      categories: s.categories.map((c) => (c.id === id ? { ...c, name: n, budgetLimit } : c)),
      txs: old && old.name !== n ? s.txs.map((t) => (t.category === old.name ? { ...t, category: n } : t)) : s.txs,
    };
  });
  return null;
}
export function deleteCategory(id: string) {
  set((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }));
}

export function addGoal(g: Omit<Goal, "id" | "saved">) {
  set((s) => ({ ...s, goals: [...s.goals, { ...g, id: uid(), saved: 0 }] }));
}
export function updateGoal(id: string, patch: Partial<Goal>) {
  set((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
}
export function deleteGoal(id: string) {
  set((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
}

export function addFixed(f: Omit<FixedExpense, "id" | "isActive">) {
  set((s) => ({ ...s, fixed: [...s.fixed, { ...f, id: uid(), isActive: true }] }));
}
export function updateFixed(id: string, patch: Partial<FixedExpense>) {
  set((s) => ({ ...s, fixed: s.fixed.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
}
export function deleteFixed(id: string) {
  set((s) => ({ ...s, fixed: s.fixed.filter((f) => f.id !== id) }));
}

export function setProfile(p: Partial<Profile>) {
  set((s) => ({ ...s, profile: { ...s.profile, ...p } }));
}

export function addTask(t: Omit<Task, "id" | "done">) {
  set((s) => ({ ...s, tasks: [...s.tasks, { ...t, id: uid(), done: false }] }));
}
export function toggleTask(id: string) {
  set((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
}
export function deleteTask(id: string) {
  set((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
}

export function addSchedule(x: Omit<Schedule, "id">) {
  set((s) => ({ ...s, schedules: [...s.schedules, { ...x, id: uid() }] }));
}
export function deleteSchedule(id: string) {
  set((s) => ({ ...s, schedules: s.schedules.filter((x) => x.id !== id) }));
}

export function addHabit(h: Omit<Habit, "id" | "log">) {
  set((s) => ({ ...s, habits: [...s.habits, { ...h, id: uid(), log: {} }] }));
}
export function deleteHabit(id: string) {
  set((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));
}
/** Tambah 1 progres hari ini; jika sudah tercapai, ulangi dari nol. */
export function tapHabit(id: string) {
  const day = todayStr();
  set((s) => ({
    ...s,
    habits: s.habits.map((h) => {
      if (h.id !== id) return h;
      const cur = h.log[day] ?? 0;
      return { ...h, log: { ...h.log, [day]: cur >= h.target ? 0 : cur + 1 } };
    }),
  }));
}
export function habitStreak(h: Habit): number {
  let day = todayStr();
  if ((h.log[day] ?? 0) < h.target) day = addDays(day, -1); // hari ini belum selesai tidak memutus runtun
  let n = 0;
  while ((h.log[day] ?? 0) >= h.target && h.target > 0) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/* ---------- data: ekspor, impor, contoh, reset ---------- */
export function exportJson(): string {
  return JSON.stringify(state, null, 2);
}
export function importJson(text: string): string | null {
  try {
    const parsed = sanitize(JSON.parse(text));
    if (!parsed) return "Format data tidak dikenali.";
    set(() => parsed);
    return null;
  } catch {
    return "Teks bukan JSON yang valid.";
  }
}
export function resetAll() {
  set(() => defaults());
}
export function csvFor(txs: Tx[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [
    "tanggal,jenis,kategori,nominal,deskripsi",
    ...[...txs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => [t.date, t.type, esc(t.category), t.amount, esc(t.description)].join(",")),
  ].join("\n");
}

export function loadSample() {
  const today = todayStr();
  const txs: Tx[] = [];
  const spend: [string, string, number][] = [
    ["makanan", "Makan siang", 38000],
    ["makanan", "Kopi & roti", 27000],
    ["transportasi", "Ojek online", 24000],
    ["belanja", "Belanja bulanan", 185000],
    ["hiburan", "Nonton film", 55000],
    ["tagihan", "Pulsa & paket data", 75000],
    ["makanan", "Makan malam", 62000],
  ];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 75; i++) {
    const day = addDays(today, -i);
    const n = rnd() < 0.2 ? 0 : 1 + Math.floor(rnd() * 2);
    for (let k = 0; k < n; k++) {
      const [category, description, base] = spend[Math.floor(rnd() * spend.length)];
      txs.push({
        id: uid(),
        type: "expense",
        category,
        description,
        amount: Math.round((base * (0.8 + rnd() * 0.5)) / 1000) * 1000,
        date: day,
        createdAt: Date.now() - i * 86400000 - k,
      });
    }
  }
  const now = new Date();
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    if (dstr(d) <= today)
      txs.push({
        id: uid(), type: "income", category: "gaji", description: "Gaji bulanan",
        amount: 8000000, date: dstr(d), createdAt: Date.now() - m,
      });
  }
  set((s) => ({
    ...s,
    txs,
    goals: [
      { id: uid(), title: "Laptop baru", target: 15000000, saved: 8500000, deadline: addDays(today, 120) },
      { id: uid(), title: "Dana darurat", target: 30000000, saved: 12000000, deadline: "" },
    ],
    fixed: [
      { id: uid(), name: "Internet", amount: 350000, period: "bulanan", isActive: true },
      { id: uid(), name: "Listrik & Air", amount: 500000, period: "bulanan", isActive: true },
      { id: uid(), name: "Uang makan kantor", amount: 15000, period: "harian", isActive: false },
    ],
    tasks: [
      { id: uid(), title: "Review proposal klien", time: "09:30", tag: "Kerja", date: today, done: false },
      { id: uid(), title: "Bayar tagihan internet", time: "12:00", tag: "Keuangan", date: today, done: false },
      { id: uid(), title: "Beli kebutuhan dapur", time: "18:00", tag: "Pribadi", date: today, done: false },
    ],
    schedules: [
      { id: uid(), time: "09:30", title: "Sesi fokus", meta: "Ruang fokus · 45 menit", date: today },
      { id: uid(), time: "15:00", title: "Meeting tim", meta: "Online · 30 menit", date: today },
    ],
    habits: [
      { id: uid(), title: "Minum air", target: 8, unit: "gelas", log: { [today]: 3 } },
      { id: uid(), title: "Olahraga", target: 1, unit: "sesi", log: { [addDays(today, -1)]: 1, [addDays(today, -2)]: 1 } },
      { id: uid(), title: "Membaca", target: 20, unit: "menit", log: {} },
    ],
  }));
}

/* ---------- perhitungan keuangan (dari FinTrack) ---------- */
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function calc(s: State, now = new Date()) {
  const p = s.profile;
  const spendPct = (100 - p.wealthGoal) / 100;
  const dailyBudget = Math.round((p.monthlyIncome * spendPct) / 30);
  const monthlyBudget = Math.round(p.monthlyIncome * spendPct);
  const dim = daysInMonth(now);
  const fixedDaily = sum(
    s.fixed.filter((f) => f.isActive).map((f) => (f.period === "bulanan" ? f.amount / dim : f.amount)),
  );
  const today = dstr(now);
  const weekStart = addDays(today, -now.getDay()); // Minggu, 00.00
  const monthKey = today.slice(0, 7);
  const exp = s.txs.filter((t) => t.type === "expense");
  const todaySpend = sum(exp.filter((t) => t.date === today).map((t) => t.amount));
  const weekSpend = sum(exp.filter((t) => t.date >= weekStart && t.date <= today).map((t) => t.amount));
  const monthSpend = sum(exp.filter((t) => t.date.startsWith(monthKey)).map((t) => t.amount));
  const monthIncome = sum(s.txs.filter((t) => t.type === "income" && t.date.startsWith(monthKey)).map((t) => t.amount));
  const spendableToday = Math.max(Math.round(dailyBudget - fixedDaily - todaySpend), 0);
  const spendableWeek = Math.max(Math.round((dailyBudget - fixedDaily) * 7 - weekSpend), 0);
  const spendableMonth = Math.max(Math.round(monthlyBudget - fixedDaily * dim - monthSpend), 0);
  const score = Math.round(Math.min(spendableMonth / Math.max(monthlyBudget, 1), 1) * 100);
  const balance =
    p.startBalance +
    sum(s.txs.filter((t) => t.type === "income").map((t) => t.amount)) -
    sum(exp.map((t) => t.amount));
  return {
    dailyBudget, monthlyBudget, fixedDaily, dim, todaySpend, weekSpend, monthSpend, monthIncome,
    spendableToday, spendableWeek, spendableMonth, score, balance,
    savingTarget: Math.round((p.monthlyIncome * p.wealthGoal) / 100),
  };
}

export function categorySpend(txs: Tx[], monthKey: string) {
  const out: Record<string, number> = {};
  for (const t of txs)
    if (t.type === "expense" && t.date.startsWith(monthKey)) out[t.category] = (out[t.category] ?? 0) + t.amount;
  return out;
}

/** Parser pesan cepat: "Beli kopi 25000 #makanan" */
export function parseQuick(text: string): { description: string; amount: number; category: string } | null {
  const m = text.trim().match(/^(.+?)\s+(\d[\d.]*)(?:\s+#([\w-]+))?$/);
  if (!m) return null;
  const amount = Number(m[2].replace(/\./g, ""));
  if (!amount || amount <= 0) return null;
  return { description: m[1].trim(), amount, category: m[3] ? norm(m[3]) : "" };
}

export const CATEGORY_ICONS: Record<string, string> = {
  makanan: "restaurant",
  transportasi: "directions_bus",
  hiburan: "movie",
  belanja: "shopping_bag",
  tagihan: "receipt_long",
  gaji: "payments",
  bonus: "redeem",
  investasi: "trending_up",
  uncategorized: "label",
};
export const catIcon = (name: string) => CATEGORY_ICONS[name] ?? "label";
export const INCOME_CATS = ["gaji", "bonus", "investasi", "lainnya"];
