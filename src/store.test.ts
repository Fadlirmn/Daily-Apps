import { describe, expect, it } from "vitest"
import {
  addDays,
  calc,
  categorySpend,
  csvFor,
  habitStreak,
  isMilestone,
  norm,
  parseQuick,
  todayStr,
  uid,
  walletOf,
  type Habit,
  type State,
} from "./store"

function blankState(over: Partial<State> = {}): State {
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
    ready: true,
    pendingSync: 0,
    syncError: null,
    ...over,
  }
}

describe("calc", () => {
  const now = new Date(2026, 9, 10) // 10 Okt 2026
  it("budget dari monthlyIncome − wealthGoal", () => {
    const c = calc(
      blankState({
        profile: {
          name: "",
          email: "",
          currency: "IDR",
          monthlyIncome: 9000000,
          wealthGoal: 20,
          startBalance: 0,
        },
      }),
      now,
    )
    expect(c.monthlyBudget).toBe(7200000)
    expect(c.dailyBudget).toBe(240000)
    expect(c.savingTarget).toBe(1800000)
  })
  it("sisa = budget − fixed − spend, clamp 0", () => {
    const c = calc(
      blankState({
        profile: {
          name: "",
          email: "",
          currency: "IDR",
          monthlyIncome: 3000000,
          wealthGoal: 0,
          startBalance: 0,
        },
        fixed: [
          {
            id: "f",
            name: "Internet",
            amount: 300000,
            period: "bulanan",
            isActive: true,
          },
        ],
        txs: [
          {
            id: "t",
            type: "expense",
            category: "makanan",
            amount: 50000,
            description: "",
            date: "2026-10-10",
            createdAt: 1,
            wallet: "Tunai",
          },
        ],
      }),
      now,
    )
    // Oktober 31 hari → fixedDaily = 300000/31 ≈ 9677
    expect(c.spendableToday).toBe(
      Math.max(Math.round(100000 - 300000 / 31 - 50000), 0),
    )
    expect(c.todaySpend).toBe(50000)
  })
  it("balance = start + income − expense semua waktu", () => {
    const c = calc(
      blankState({
        profile: {
          name: "",
          email: "",
          currency: "IDR",
          monthlyIncome: 0,
          wealthGoal: 0,
          startBalance: 100000,
        },
        txs: [
          {
            id: "a",
            type: "income",
            category: "gaji",
            amount: 500000,
            description: "",
            date: "2026-09-01",
            createdAt: 1,
            wallet: "Bank",
          },
          {
            id: "b",
            type: "expense",
            category: "makanan",
            amount: 200000,
            description: "",
            date: "2026-10-10",
            createdAt: 2,
            wallet: "Tunai",
          },
        ],
      }),
      now,
    )
    expect(c.balance).toBe(400000)
    expect(c.monthIncome).toBe(0) // income September, bukan Oktober
    expect(c.monthSpend).toBe(200000)
  })
  it("score 100 saat tanpa budget", () => {
    expect(calc(blankState(), now).score).toBe(100)
  })
})

describe("parseQuick", () => {
  it("format penuh", () => {
    expect(parseQuick("Beli kopi 25000 #makanan")).toEqual({
      description: "Beli kopi",
      amount: 25000,
      category: "makanan",
    })
  })
  it("titik = pemisah ribuan, tanpa kategori", () => {
    expect(parseQuick("Gaji 1.500.000")).toEqual({
      description: "Gaji",
      amount: 1500000,
      category: "",
    })
  })
  it("menolak format jelek & nol", () => {
    expect(parseQuick("tanpa nominal")).toBeNull()
    expect(parseQuick("Kopi 0")).toBeNull()
    expect(parseQuick("")).toBeNull()
  })
})

describe("habitStreak", () => {
  const mk = (log: Record<string, number>): Habit => ({
    id: "h",
    title: "X",
    target: 2,
    unit: "kali",
    log,
  })
  it("hitung mundur runtun penuh", () => {
    const t = todayStr()
    expect(
      habitStreak(mk({ [t]: 2, [addDays(t, -1)]: 2, [addDays(t, -2)]: 2 })),
    ).toBe(3)
  })
  it("mulai dari kemarin bila hari ini belum penuh", () => {
    const t = todayStr()
    expect(habitStreak(mk({ [t]: 1, [addDays(t, -1)]: 2 }))).toBe(1)
  })
  it("putus bila ada hari bolong", () => {
    const t = todayStr()
    expect(habitStreak(mk({ [t]: 2, [addDays(t, -2)]: 2 }))).toBe(1)
  })
})

describe("isMilestone", () => {
  it("7 & 30 true, lainnya false", () => {
    expect(isMilestone(7)).toBe(true)
    expect(isMilestone(30)).toBe(true)
    expect(isMilestone(6)).toBe(false)
    expect(isMilestone(0)).toBe(false)
  })
})

describe("walletOf", () => {
  it("legacy web/kosong → default", () => {
    expect(walletOf("web")).toBe("Jago Pocket")
    expect(walletOf("")).toBe("Jago Pocket")
    expect(walletOf(undefined)).toBe("Jago Pocket")
    expect(walletOf("Tunai")).toBe("Tunai")
  })
})

describe("categorySpend", () => {
  it("hanya expense di bulan kunci", () => {
    const out = categorySpend(
      [
        {
          id: "a",
          type: "expense",
          category: "makanan",
          amount: 100,
          description: "",
          date: "2026-10-05",
          createdAt: 1,
          wallet: "Tunai",
        },
        {
          id: "b",
          type: "income",
          category: "gaji",
          amount: 999,
          description: "",
          date: "2026-10-05",
          createdAt: 2,
          wallet: "Bank",
        },
        {
          id: "c",
          type: "expense",
          category: "makanan",
          amount: 50,
          description: "",
          date: "2026-09-05",
          createdAt: 3,
          wallet: "Tunai",
        },
      ],
      "2026-10",
    )
    expect(out).toEqual({ makanan: 100 })
  })
})

describe("csvFor", () => {
  it("header + kolom dompet + escape kutip", () => {
    const csv = csvFor([
      {
        id: "a",
        type: "expense",
        category: "makanan",
        amount: 25000,
        description: 'Kopi "spesial"',
        date: "2026-10-10",
        createdAt: 1,
        wallet: "Tunai",
      },
    ])
    const [head, row] = csv.split("\n")
    expect(head).toBe("tanggal,jenis,kategori,nominal,deskripsi,dompet")
    expect(row).toContain('"Kopi ""spesial"""')
    expect(row).toContain('"Tunai"')
  })
})

describe("norm & uid", () => {
  it("norm lowercase-trim", () => {
    expect(norm("  Makanan ")).toBe("makanan")
  })
  it("uid unik", () => {
    expect(uid()).not.toBe(uid())
  })
})
