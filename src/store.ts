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
      { id: "c1", name: "makanan", budgetLimit: 1800000 },
      { id: "c2", name: "transportasi", budgetLimit: 900000 },
      { id: "c3", name: "hiburan", budgetLimit: 500000 },
      { id: "c4", name: "belanja", budgetLimit: 1200000 },
      { id: "c5", name: "tagihan", budgetLimit: 1000000 },
    ],
    goals: [],
    fixed: [],
    tasks: [],
    schedules: [],
    habits: [],
  };
}

let state: State = defaults();
const listeners = new Set<() => void>();

function set(fn: (s: State) => State) {
  state = fn(state);
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

// Fetch initial data from backend API
async function migrateLocalStorageOnce() {
  const old = localStorage.getItem("arunika:v1");
  if (old && !localStorage.getItem("arunika_migrated")) {
    try {
      const parsed = JSON.parse(old);
      const token = localStorage.getItem("arunika_token");
      if (token) {
        // Push items to backend if needed, or just let backend serve defaults/synced data
        localStorage.setItem("arunika_migrated", "true");
      }
    } catch {}
  }
}

export async function fetchBackendData() {
  const token = localStorage.getItem("arunika_token");
  if (!token) return;

  await migrateLocalStorageOnce();
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const [profileRes, txsRes, catRes, goalsRes, fixedRes, tasksRes, schedRes, habitsRes] = await Promise.all([
      fetch("/api/profile", { headers }),
      fetch("/api/transactions", { headers }),
      fetch("/api/categories", { headers }),
      fetch("/api/goals", { headers }),
      fetch("/api/fixed_expenses", { headers }),
      fetch("/api/tasks", { headers }),
      fetch("/api/schedules", { headers }),
      fetch("/api/habits", { headers }),
    ]);

    const profileData = profileRes.ok ? await profileRes.json() : null;
    const txs = txsRes.ok ? await txsRes.json() : [];
    const categories = catRes.ok ? await catRes.json() : [];
    const goals = goalsRes.ok ? await goalsRes.json() : [];
    const fixed = fixedRes.ok ? await fixedRes.json() : [];
    const tasks = tasksRes.ok ? await tasksRes.json() : [];
    const schedules = schedRes.ok ? await schedulesRes.json() : [];
    const habits = habitsRes.ok ? await habitsRes.json() : [];

    set((s) => ({
      ...s,
      profile: {
        ...s.profile,
        name: profileData?.name || s.profile.name,
        email: profileData?.email || s.profile.email,
        monthlyIncome: profileData?.monthly_income ?? s.profile.monthlyIncome,
        wealthGoal: profileData?.wealth_goal ?? s.profile.wealthGoal,
      },
      txs: txs.map((t: any) => ({
        id: t.id,
        type: t.amount >= 0 ? "expense" : "expense", // mapped accordingly
        category: t.category_name,
        amount: Math.abs(t.amount),
        description: t.description,
        date: t.created_at ? t.created_at.slice(0, 10) : todayStr(),
        createdAt: new Date(t.created_at).getTime(),
      })),
      categories: categories.map((c: any) => ({ id: c.id, name: c.name, budgetLimit: Number(c.budget_limit) })),
      goals: goals.map((g: any) => ({ id: g.id, title: g.title, target: Number(g.target), saved: Number(g.saved), deadline: g.date_label || "" })),
      fixed: fixed.map((f: any) => ({ id: f.id, name: f.name, amount: Number(f.amount), period: "bulanan", isActive: f.is_active })),
      tasks: tasks.map((t: any) => ({ id: t.id, title: t.title, time: t.time || "", tag: t.tag || "Pribadi", date: t.created_at ? t.created_at.slice(0, 10) : todayStr(), done: t.done })),
      schedules: schedules.map((sc: any) => ({ id: sc.id, time: sc.time, title: sc.title, meta: sc.meta || "", date: sc.created_at ? sc.created_at.slice(0, 10) : todayStr() })),
      habits: habits.map((h: any) => ({ id: h.id, title: h.title, target: 8, unit: "gelas", log: {} })),
    }));
  } catch (err) {
    console.error("Failed to fetch backend data:", err);
  }
}

async function apiCall(endpoint: string, method: string, body?: any) {
  const token = localStorage.getItem("arunika_token");
  const res = await fetch(endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error("API request failed");
  return res.json();
}

export const norm = (s: string) => s.trim().toLowerCase();

export async function addTx(t: Omit<Tx, "id" | "createdAt">): Promise<string> {
  const cat = norm(t.category) || "uncategorized";
  try {
    const res = await apiCall("/api/transactions", "POST", {
      category_name: cat,
      amount: t.amount,
      description: t.description,
      source: "web",
    });
    const newTx: Tx = { ...t, category: cat, id: res.id, createdAt: Date.now() };
    set((s) => ({ ...s, txs: [newTx, ...s.txs] }));
    return res.id;
  } catch {
    const tx: Tx = { ...t, category: cat, id: uid(), createdAt: Date.now() };
    set((s) => ({ ...s, txs: [...s.txs, tx] }));
    return tx.id;
  }
}

export async function updateTx(id: string, patch: Partial<Omit<Tx, "id" | "createdAt">>) {
  try {
    await apiCall(`/api/transactions/${id}`, "PUT", patch);
  } catch {}
  set((s) => ({
    ...s,
    txs: s.txs.map((t) =>
      t.id === id ? { ...t, ...patch, category: patch.category ? norm(patch.category) : t.category } : t,
    ),
  }));
}

export async function deleteTx(id: string) {
  try {
    await apiCall(`/api/transactions/${id}`, "DELETE");
  } catch {}
  set((s) => ({ ...s, txs: s.txs.filter((t) => t.id !== id) }));
}

export async function addCategory(name: string, budgetLimit: number): Promise<string | null> {
  const n = norm(name);
  if (!n) return "Nama kategori wajib diisi.";
  if (state.categories.some((c) => c.name === n)) return "Kategori sudah ada.";
  try {
    const res = await apiCall("/api/categories", "POST", { name: n, budget_limit: budgetLimit });
    set((s) => ({ ...s, categories: [...s.categories, { id: res.id, name: n, budgetLimit }] }));
    return null;
  } catch {
    set((s) => ({ ...s, categories: [...s.categories, { id: uid(), name: n, budgetLimit }] }));
    return null;
  }
}

export async function updateCategory(id: string, name: string, budgetLimit: number): Promise<string | null> {
  const n = norm(name);
  if (!n) return "Nama kategori wajib diisi.";
  if (state.categories.some((c) => c.id !== id && c.name === n)) return "Kategori sudah ada.";
  try {
    await apiCall(`/api/categories/${id}`, "PUT", { name: n, budget_limit: budgetLimit });
  } catch {}
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

export async function deleteCategory(id: string) {
  try {
    await apiCall(`/api/categories/${id}`, "DELETE");
  } catch {}
  set((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }));
}

export async function addGoal(g: Omit<Goal, "id" | "saved">) {
  try {
    const res = await apiCall("/api/goals", "POST", { title: g.title, target: g.target, saved: 0, date_label: g.deadline || "Fleksibel" });
    set((s) => ({ ...s, goals: [...s.goals, { ...g, id: res.id, saved: 0 }] }));
  } catch {
    set((s) => ({ ...s, goals: [...s.goals, { ...g, id: uid(), saved: 0 }] }));
  }
}

export async function updateGoal(id: string, patch: Partial<Goal>) {
  try {
    await apiCall(`/api/goals/${id}`, "PUT", { title: patch.title, target: patch.target, saved: patch.saved, date_label: patch.deadline });
  } catch {}
  set((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
}

export async function deleteGoal(id: string) {
  try {
    await apiCall(`/api/goals/${id}`, "DELETE");
  } catch {}
  set((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
}

export async function addFixed(f: Omit<FixedExpense, "id" | "isActive">) {
  try {
    const res = await apiCall("/api/fixed_expenses", "POST", { name: f.name, amount: f.amount, is_active: true });
    set((s) => ({ ...s, fixed: [...s.fixed, { ...f, id: res.id, isActive: true }] }));
  } catch {
    set((s) => ({ ...s, fixed: [...s.fixed, { ...f, id: uid(), isActive: true }] }));
  }
}

export async function updateFixed(id: string, patch: Partial<FixedExpense>) {
  try {
    await apiCall(`/api/fixed_expenses/${id}`, "PUT", { name: patch.name, amount: patch.amount, is_active: patch.isActive });
  } catch {}
  set((s) => ({ ...s, fixed: s.fixed.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
}

export async function deleteFixed(id: string) {
  try {
    await apiCall(`/api/fixed_expenses/${id}`, "DELETE");
  } catch {}
  set((s) => ({ ...s, fixed: s.fixed.filter((f) => f.id !== id) }));
}

export async function setProfile(p: Partial<Profile>) {
  set((s) => ({ ...s, profile: { ...s.profile, ...p } }));
}

export async function addTask(t: Omit<Task, "id" | "done">) {
  try {
    const res = await apiCall("/api/tasks", "POST", { title: t.title, time: t.time, tag: t.tag, done: false });
    set((s) => ({ ...s, tasks: [...s.tasks, { ...t, id: res.id, done: false }] }));
  } catch {
    set((s) => ({ ...s, tasks: [...s.tasks, { ...t, id: uid(), done: false }] }));
  }
}

export async function toggleTask(id: string) {
  const task = state.tasks.find((t) => t.id === id);
  if (task) {
    try {
      await apiCall(`/api/tasks/${id}`, "PUT", { done: !task.done });
    } catch {}
  }
  set((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
}

export async function deleteTask(id: string) {
  try {
    await apiCall(`/api/tasks/${id}`, "DELETE");
  } catch {}
  set((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
}

export async function addSchedule(x: Omit<Schedule, "id">) {
  try {
    const res = await apiCall("/api/schedules", "POST", { time: x.time, title: x.title, meta: x.meta });
    set((s) => ({ ...s, schedules: [...s.schedules, { ...x, id: res.id }] }));
  } catch {
    set((s) => ({ ...s, schedules: [...s.schedules, { ...x, id: uid() }] }));
  }
}

export async function deleteSchedule(id: string) {
  try {
    await apiCall(`/api/schedules/${id}`, "DELETE");
  } catch {}
  set((s) => ({ ...s, schedules: s.schedules.filter((x) => x.id !== id) }));
}

export async function addHabit(h: Omit<Habit, "id" | "log">) {
  try {
    const res = await apiCall("/api/habits", "POST", { title: h.title, icon: "water_drop", meta: h.unit, progress: 0, done: false });
    set((s) => ({ ...s, habits: [...s.habits, { ...h, id: res.id, log: {} }] }));
  } catch {
    set((s) => ({ ...s, habits: [...s.habits, { ...h, id: uid(), log: {} }] }));
  }
}

export async function deleteHabit(id: string) {
  try {
    await apiCall(`/api/habits/${id}`, "DELETE");
  } catch {}
  set((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));
}

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
  if ((h.log[day] ?? 0) < h.target) day = addDays(day, -1);
  let n = 0;
  while ((h.log[day] ?? 0) >= h.target && h.target > 0) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export function exportJson(): string {
  return JSON.stringify(state, null, 2);
}

export function importJson(text: string): string | null {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return "Format data tidak dikenali.";
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
  // Sample handled by backend or local defaults
}

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
  const weekStart = addDays(today, -now.getDay());
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
