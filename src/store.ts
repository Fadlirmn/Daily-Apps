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
  /** Pesan sinkronisasi terakhir yang gagal (bukan karena sesi berakhir). UI menampilkan ini sebagai peringatan. */
  syncError: string | null;
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
  const cur = state.profile.currency || "IDR";
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
      name: "",
      email: "",
      currency: "IDR",
      monthlyIncome: 0,
      wealthGoal: 0,
      startBalance: 0,
    },
    txs: [],
    categories: [],
    goals: [],
    fixed: [],
    tasks: [],
    schedules: [],
    habits: [],
    syncError: null,
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

/** Dipanggil saat token expired/invalid (401/403). Dengarkan di App.tsx untuk logout paksa. */
const sessionExpiredListeners = new Set<() => void>();
export function onSessionExpired(cb: () => void): () => void {
  sessionExpiredListeners.add(cb);
  return () => sessionExpiredListeners.delete(cb);
}
function notifySessionExpired() {
  sessionExpiredListeners.forEach((l) => l());
}

function setSyncError(msg: string | null) {
  set((s) => ({ ...s, syncError: msg }));
}

let profileSaveTimer: number | null = null;

async function syncProfileToBackend(profile: Profile) {
  try {
    await apiCall("/api/profile", "PUT", {
      name: profile.name,
      email: profile.email,
      monthly_income: profile.monthlyIncome,
      wealth_goal: profile.wealthGoal,
      currency: profile.currency,
      start_balance: profile.startBalance,
    });
    setSyncError(null);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      notifySessionExpired();
      return;
    }
    console.error("Failed to save profile:", err);
    setSyncError("Profil belum tersimpan ke server.");
    throw err;
  }
}

export async function fetchBackendData() {
  const token = localStorage.getItem("arunika_token");
  if (!token) return;

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

    if ([profileRes, txsRes, catRes, goalsRes, fixedRes, tasksRes, schedRes, habitsRes].some((r) => r.status === 401 || r.status === 403)) {
      notifySessionExpired();
      return;
    }

    const profileData = profileRes.ok ? await profileRes.json() : null;
    const txs = txsRes.ok ? await txsRes.json() : [];
    const categories = catRes.ok ? await catRes.json() : [];
    const goals = goalsRes.ok ? await goalsRes.json() : [];
    const fixed = fixedRes.ok ? await fixedRes.json() : [];
    const tasks = tasksRes.ok ? await tasksRes.json() : [];
    const schedules = schedRes.ok ? await schedRes.json() : [];
    const habits = habitsRes.ok ? await habitsRes.json() : [];

    set((s) => ({
      ...s,
      syncError: null,
      profile: {
        ...s.profile,
        name: profileData?.name ?? s.profile.name,
        email: profileData?.email ?? s.profile.email,
        monthlyIncome: profileData?.monthly_income ?? s.profile.monthlyIncome,
        wealthGoal: profileData?.wealth_goal ?? s.profile.wealthGoal,
        currency: profileData?.currency ?? s.profile.currency,
        startBalance: profileData?.start_balance ?? s.profile.startBalance,
      },
      txs: txs.map((t: any) => ({
        id: t.id,
        type: t.type === "income" ? "income" : "expense",
        category: t.category_name,
        amount: Math.abs(Number(t.amount)),
        description: t.description,
        date: t.created_at ? t.created_at.slice(0, 10) : todayStr(),
        createdAt: new Date(t.created_at).getTime(),
      })),
      categories: categories.map((c: any) => ({ id: c.id, name: c.name, budgetLimit: Number(c.budget_limit) })),
      goals: goals.map((g: any) => ({ id: g.id, title: g.title, target: Number(g.target), saved: Number(g.saved), deadline: g.date_label || "" })),
      fixed: fixed.map((f: any) => ({ id: f.id, name: f.name, amount: Number(f.amount), period: "bulanan", isActive: f.is_active })),
      tasks: tasks.map((t: any) => ({ id: t.id, title: t.title, time: t.time || "", tag: t.tag || "Pribadi", date: t.created_at ? t.created_at.slice(0, 10) : todayStr(), done: t.done })),
      schedules: schedules.map((sc: any) => ({ id: sc.id, time: sc.time, title: sc.title, meta: sc.meta || "", date: sc.created_at ? sc.created_at.slice(0, 10) : todayStr() })),
      habits: habits.map((h: any) => ({ id: h.id, title: h.title, target: h.progress || 8, unit: h.meta || "gelas", log: {} })),
    }));
  } catch (err) {
    console.error("Failed to fetch backend data:", err);
    setSyncError("Gagal memuat data dari server. Menampilkan data lokal.");
  }
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Wrapper terpusat untuk semua panggilan API otentikasi. 401/403 memicu
 * sesi-berakhir (logout paksa), error lain dilempar sebagai ApiError untuk
 * ditangani pemanggil (fallback lokal + tandai syncError). */
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
  if (res.status === 401 || res.status === 403) {
    notifySessionExpired();
    throw new ApiError(res.status, "Sesi berakhir, silakan masuk kembali.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || "Permintaan API gagal.");
  }
  return res.json();
}

/** Jalankan mutasi API; kalau sesi sudah ditangani (401/403), jangan jalankan
 * fallback lokal — biarkan logout mengambil alih. Untuk error lain, jalankan
 * fallback dan tandai syncError agar user tahu datanya belum tersinkron. */
async function withFallback<T>(
  call: () => Promise<T>,
  fallback: () => T,
  errorMsg: string,
): Promise<T> {
  try {
    const result = await call();
    setSyncError(null);
    return result;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      throw err;
    }
    console.error(errorMsg, err);
    setSyncError(errorMsg);
    return fallback();
  }
}

export const norm = (s: string) => s.trim().toLowerCase();

export async function addTx(t: Omit<Tx, "id" | "createdAt">): Promise<string> {
  const cat = norm(t.category) || "uncategorized";
  const localId = uid();
  const id = await withFallback(
    async () => {
      const res = await apiCall("/api/transactions", "POST", {
        type: t.type,
        category_name: cat,
        amount: t.amount,
        description: t.description,
        source: "web",
      });
      return res.id as string;
    },
    () => localId,
    "Transaksi belum tersimpan ke server.",
  );
  const newTx: Tx = { ...t, category: cat, id, createdAt: Date.now() };
  set((s) => ({ ...s, txs: [newTx, ...s.txs] }));
  return id;
}

export async function updateTx(id: string, patch: Partial<Omit<Tx, "id" | "createdAt">>) {
  await withFallback(
    () => apiCall(`/api/transactions/${id}`, "PUT", {
      ...(patch.type ? { type: patch.type } : {}),
      ...(patch.category ? { category_name: norm(patch.category) } : {}),
      ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
    }),
    () => null,
    "Perubahan transaksi belum tersinkron ke server.",
  );
  set((s) => ({
    ...s,
    txs: s.txs.map((t) =>
      t.id === id ? { ...t, ...patch, category: patch.category ? norm(patch.category) : t.category } : t,
    ),
  }));
}

export async function deleteTx(id: string) {
  await withFallback(
    () => apiCall(`/api/transactions/${id}`, "DELETE"),
    () => null,
    "Hapus transaksi belum tersinkron ke server.",
  );
  set((s) => ({ ...s, txs: s.txs.filter((t) => t.id !== id) }));
}

export async function addCategory(name: string, budgetLimit: number): Promise<string | null> {
  const n = norm(name);
  if (!n) return "Nama kategori wajib diisi.";
  if (state.categories.some((c) => c.name === n)) return "Kategori sudah ada.";
  const localId = uid();
  const id = await withFallback(
    async () => {
      const res = await apiCall("/api/categories", "POST", { name: n, budget_limit: budgetLimit });
      return res.id as string;
    },
    () => localId,
    "Kategori belum tersimpan ke server.",
  );
  set((s) => ({ ...s, categories: [...s.categories, { id, name: n, budgetLimit }] }));
  return null;
}

export async function updateCategory(id: string, name: string, budgetLimit: number): Promise<string | null> {
  const n = norm(name);
  if (!n) return "Nama kategori wajib diisi.";
  if (state.categories.some((c) => c.id !== id && c.name === n)) return "Kategori sudah ada.";
  await withFallback(
    () => apiCall(`/api/categories/${id}`, "PUT", { name: n, budget_limit: budgetLimit }),
    () => null,
    "Perubahan kategori belum tersinkron ke server.",
  );
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
  await withFallback(
    () => apiCall(`/api/categories/${id}`, "DELETE"),
    () => null,
    "Hapus kategori belum tersinkron ke server.",
  );
  set((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }));
}

export async function addGoal(g: Omit<Goal, "id" | "saved">) {
  const localId = uid();
  const id = await withFallback(
    async () => {
      const res = await apiCall("/api/goals", "POST", { title: g.title, target: g.target, saved: 0, date_label: g.deadline || "Fleksibel" });
      return res.id as string;
    },
    () => localId,
    "Target belum tersimpan ke server.",
  );
  set((s) => ({ ...s, goals: [...s.goals, { ...g, id, saved: 0 }] }));
}

export async function updateGoal(id: string, patch: Partial<Goal>) {
  await withFallback(
    () => apiCall(`/api/goals/${id}`, "PUT", { title: patch.title, target: patch.target, saved: patch.saved, date_label: patch.deadline }),
    () => null,
    "Perubahan target belum tersinkron ke server.",
  );
  set((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
}

export async function deleteGoal(id: string) {
  await withFallback(
    () => apiCall(`/api/goals/${id}`, "DELETE"),
    () => null,
    "Hapus target belum tersinkron ke server.",
  );
  set((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
}

export async function addFixed(f: Omit<FixedExpense, "id" | "isActive">) {
  const localId = uid();
  const id = await withFallback(
    async () => {
      const res = await apiCall("/api/fixed_expenses", "POST", { name: f.name, amount: f.amount, is_active: true });
      return res.id as string;
    },
    () => localId,
    "Pengeluaran tetap belum tersimpan ke server.",
  );
  set((s) => ({ ...s, fixed: [...s.fixed, { ...f, id, isActive: true }] }));
}

export async function updateFixed(id: string, patch: Partial<FixedExpense>) {
  await withFallback(
    () => apiCall(`/api/fixed_expenses/${id}`, "PUT", { name: patch.name, amount: patch.amount, is_active: patch.isActive }),
    () => null,
    "Perubahan pengeluaran tetap belum tersinkron ke server.",
  );
  set((s) => ({ ...s, fixed: s.fixed.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
}

export async function deleteFixed(id: string) {
  await withFallback(
    () => apiCall(`/api/fixed_expenses/${id}`, "DELETE"),
    () => null,
    "Hapus pengeluaran tetap belum tersinkron ke server.",
  );
  set((s) => ({ ...s, fixed: s.fixed.filter((f) => f.id !== id) }));
}

export async function setProfile(p: Partial<Profile>, immediate = false) {
  set((s) => {
    const updated = { ...s.profile, ...p };
    if (profileSaveTimer) window.clearTimeout(profileSaveTimer);
    if (immediate) {
      void syncProfileToBackend(updated);
    } else {
      profileSaveTimer = window.setTimeout(() => {
        void syncProfileToBackend(updated);
      }, 400);
    }
    return { ...s, profile: updated };
  });
}

export async function addTask(t: Omit<Task, "id" | "done">) {
  const localId = uid();
  const id = await withFallback(
    async () => {
      const res = await apiCall("/api/tasks", "POST", { title: t.title, time: t.time, tag: t.tag, done: false });
      return res.id as string;
    },
    () => localId,
    "Tugas belum tersimpan ke server.",
  );
  set((s) => ({ ...s, tasks: [...s.tasks, { ...t, id, done: false }] }));
}

export async function toggleTask(id: string) {
  const task = state.tasks.find((t) => t.id === id);
  if (task) {
    await withFallback(
      () => apiCall(`/api/tasks/${id}`, "PUT", { done: !task.done }),
      () => null,
      "Perubahan tugas belum tersinkron ke server.",
    );
  }
  set((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
}

export async function deleteTask(id: string) {
  await withFallback(
    () => apiCall(`/api/tasks/${id}`, "DELETE"),
    () => null,
    "Hapus tugas belum tersinkron ke server.",
  );
  set((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
}

export async function addSchedule(x: Omit<Schedule, "id">) {
  const localId = uid();
  const id = await withFallback(
    async () => {
      const res = await apiCall("/api/schedules", "POST", { time: x.time, title: x.title, meta: x.meta });
      return res.id as string;
    },
    () => localId,
    "Jadwal belum tersimpan ke server.",
  );
  set((s) => ({ ...s, schedules: [...s.schedules, { ...x, id }] }));
}

export async function deleteSchedule(id: string) {
  await withFallback(
    () => apiCall(`/api/schedules/${id}`, "DELETE"),
    () => null,
    "Hapus jadwal belum tersinkron ke server.",
  );
  set((s) => ({ ...s, schedules: s.schedules.filter((x) => x.id !== id) }));
}

export async function addHabit(h: Omit<Habit, "id" | "log">) {
  const localId = uid();
  const id = await withFallback(
    async () => {
      const res = await apiCall("/api/habits", "POST", { title: h.title, icon: "water_drop", meta: h.unit, progress: h.target, done: false });
      return res.id as string;
    },
    () => localId,
    "Kebiasaan belum tersimpan ke server.",
  );
  set((s) => ({ ...s, habits: [...s.habits, { ...h, id, log: {} }] }));
}

export async function deleteHabit(id: string) {
  await withFallback(
    () => apiCall(`/api/habits/${id}`, "DELETE"),
    () => null,
    "Hapus kebiasaan belum tersinkron ke server.",
  );
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

export function loadSample() {}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function calc(s: State, now = new Date()) {
  const p = s.profile;
  const spendPct = p.monthlyIncome > 0 ? (100 - p.wealthGoal) / 100 : 1;
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
  const score = monthlyBudget > 0 ? Math.round(Math.min(spendableMonth / Math.max(monthlyBudget, 1), 1) * 100) : 100;
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
