import { useEffect, useState } from "react"
import DataSheet from "./DataSheet"
import {
  addFixed,
  calc,
  deleteFixed,
  exportJson,
  fmt,
  grpNum,
  resetAll,
  saveProfileNow,
  setProfile,
  updateFixed,
  useStore,
  type Profile as ProfileT,
} from "./store"
import {
  Action,
  Empty,
  Field,
  Icon,
  PageHeader,
  PrimaryButton,
  Segmented,
  inputCls,
} from "./ui"

const num = (v: string) => Number(v.replace(/\D/g, "")) || 0

export default function Profile() {
  const s = useStore()
  const c = calc(s)
  const [draft, setDraft] = useState<ProfileT>(s.profile)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [fName, setFName] = useState("")
  const [fAmount, setFAmount] = useState("")
  const [fPeriod, setFPeriod] = useState<"harian" | "bulanan">("bulanan")
  const [fError, setFError] = useState("")
  const [data, setData] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [oldPw, setOldPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [pwMsg, setPwMsg] = useState("")
  const [oldPwErr, setOldPwErr] = useState("")
  const [newPwErr, setNewPwErr] = useState("")
  const [emailErr, setEmailErr] = useState("")
  const [theme, setTheme] = useState(() =>
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "light"
      ? "light"
      : "dark",
  )

  function applyTheme(v: string) {
    const next = v === "Terang" ? "light" : "dark"
    setTheme(next)
    try {
      localStorage.setItem("arunika_theme", next)
      document.documentElement.dataset.theme = next
    } catch {
      /* abaikan — tema tetap berlaku sesi ini */
    }
  }

  const emailValid = (v: string) => !v || /^\S+@\S+\.\S+$/.test(v)

  async function changePassword() {
    setPwMsg("")
    setOldPwErr("")
    setNewPwErr("")
    if (!oldPw) return setOldPwErr("Isi password lama.")
    if (!newPw) return setNewPwErr("Isi password baru.")
    if (newPw.length < 6)
      return setNewPwErr("Password baru minimal 6 karakter.")
    try {
      const res = await fetch("/api/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("arunika_token")}`,
        },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Gagal ganti password.")
      setPwMsg("Password berhasil diganti.")
      setOldPw("")
      setNewPw("")
    } catch (e: any) {
      const msg = e.message || "Gagal ganti password."
      if (/lama/i.test(msg)) setOldPwErr(msg)
      else setNewPwErr(msg)
    }
  }

  // sinkronkan draf saat profil di store berubah (impor, reset)
  useEffect(() => setDraft(s.profile), [s.profile])

  // pratinjau budget memakai draf, supaya slider langsung terasa
  const spendPct = (100 - draft.wealthGoal) / 100
  const previewMonthly = Math.round(draft.monthlyIncome * spendPct)
  const previewDaily = Math.round(previewMonthly / 30)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (draft.monthlyIncome < 0)
      return setError("Target pemasukan tidak boleh negatif.")
    if (!emailValid(draft.email)) {
      setEmailErr("Format email tidak valid.")
      return setError("Format email tidak valid.")
    }
    setError("")
    setEmailErr("")
    const serverErr = await saveProfileNow({
      ...draft,
      name: draft.name.trim(),
    })
    if (serverErr) return setError(serverErr)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  function liveWealthGoal(v: number) {
    setDraft((d) => ({ ...d, wealthGoal: v }))
    setProfile({ wealthGoal: v })
  }

  function addExpense() {
    if (!fName.trim()) return setFError("Nama pengeluaran wajib diisi.")
    if (num(fAmount) <= 0) return setFError("Nominal harus lebih dari 0.")
    setFError("")
    addFixed({ name: fName.trim(), amount: num(fAmount), period: fPeriod })
    setFName("")
    setFAmount("")
  }

  return (
    <>
      <PageHeader
        title="Profil & Pengaturan"
        sub="Kelola akun, budget, dan pengeluaran tetap"
      />
      <main className="scroll-area space-y-5 overflow-y-auto px-4 pb-36">
        {saved && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-medium border border-income/30 bg-income/20 p-4 text-income"
          >
            <Icon name="check_circle" />
            <p className="text-body-sm">
              Profil dan pengaturan berhasil disimpan.
            </p>
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-medium border border-expense/30 bg-expense/20 p-4 text-expense"
          >
            <Icon name="error" />
            <p className="text-body-sm">{error}</p>
          </div>
        )}

        <form onSubmit={save} className="space-y-5">
          <section className="space-y-4 rounded-extra bg-surface-container p-5">
            <div className="flex items-center gap-2 text-primary">
              <Icon name="person" className="text-icon-sm" />
              <p className="text-title">Akun</p>
            </div>
            <Field label="Nama">
              <input
                id="p-name"
                name="name"
                autoComplete="name"
                placeholder="cth: Sumbul"
                className={inputCls}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                id="p-email"
                name="email"
                autoComplete="email"
                placeholder="nama@email.com"
                type="email"
                aria-describedby={emailErr ? "p-email-err" : undefined}
                className={inputCls}
                value={draft.email}
                onChange={(e) => {
                  setDraft({ ...draft, email: e.target.value })
                  if (emailErr) setEmailErr("")
                }}
                onBlur={(e) =>
                  setEmailErr(
                    emailValid(e.target.value)
                      ? ""
                      : "Format email tidak valid.",
                  )
                }
              />
            </Field>
            {emailErr && (
              <p
                id="p-email-err"
                role="alert"
                className="text-body-sm text-expense"
              >
                {emailErr}
              </p>
            )}
          </section>

          <section className="space-y-4 rounded-extra bg-surface-container p-5">
            <div className="flex items-center gap-2 text-primary">
              <Icon name="lock" className="text-icon-sm" />
              <p className="text-title">Ganti Password</p>
            </div>
            <Field label="Password lama">
              <input
                id="p-oldpw"
                type="password"
                aria-describedby={oldPwErr ? "p-oldpw-err" : undefined}
                className={inputCls}
                value={oldPw}
                onChange={(e) => {
                  setOldPw(e.target.value)
                  if (oldPwErr) setOldPwErr("")
                }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
            {oldPwErr && (
              <p
                id="p-oldpw-err"
                role="alert"
                className="text-body-sm text-expense"
              >
                {oldPwErr}
              </p>
            )}
            <Field label="Password baru (min. 6 karakter)">
              <input
                id="p-newpw"
                type="password"
                aria-describedby={newPwErr ? "p-newpw-err" : undefined}
                className={inputCls}
                value={newPw}
                onChange={(e) => {
                  setNewPw(e.target.value)
                  if (newPwErr) setNewPwErr("")
                }}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            {newPwErr && (
              <p
                id="p-newpw-err"
                role="alert"
                className="text-body-sm text-expense"
              >
                {newPwErr}
              </p>
            )}
            {pwMsg && (
              <p role="status" className="text-body-sm text-income">
                {pwMsg}
              </p>
            )}
            <Action
              label="Ganti password"
              onClick={changePassword}
              className="flex items-center justify-center gap-2 rounded-full bg-primary-container py-3 text-label text-primary"
            >
              <Icon name="key" className="text-icon-sm" />
              Ganti password
            </Action>
          </section>

          <section className="space-y-4 rounded-extra bg-surface-container p-5">
            <div className="flex items-center gap-2 text-primary">
              <Icon name="payments" className="text-icon-sm" />
              <p className="text-title">Keuangan</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mata uang">
                <select
                  id="p-cur"
                  className={inputCls}
                  value={draft.currency}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      currency: e.target.value as ProfileT["currency"],
                    })
                  }
                >
                  <option value="IDR">IDR (Rp)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </Field>
              <Field label="Saldo awal">
                <input
                  id="p-start"
                  inputMode="numeric"
                  className={inputCls}
                  value={grpNum(draft.startBalance)}
                  onChange={(e) =>
                    setDraft({ ...draft, startBalance: num(e.target.value) })
                  }
                  placeholder="0"
                />
              </Field>
            </div>
            <Field label="Pemasukan bulanan">
              <input
                id="p-income"
                inputMode="numeric"
                className={inputCls}
                value={grpNum(draft.monthlyIncome)}
                onChange={(e) =>
                  setDraft({ ...draft, monthlyIncome: num(e.target.value) })
                }
                placeholder="0"
              />
            </Field>
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="p-goal"
                  className="text-label-sm text-on-surface-variant"
                >
                  Target menabung
                </label>
                <p className="money text-label text-primary">
                  {draft.wealthGoal}% ·{" "}
                  {fmt(
                    Math.round((draft.monthlyIncome * draft.wealthGoal) / 100),
                  )}
                </p>
              </div>
              <input
                id="p-goal"
                type="range"
                min={0}
                max={100}
                step={1}
                value={draft.wealthGoal}
                onChange={(e) => liveWealthGoal(Number(e.target.value))}
                className="mt-2 w-full accent-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-large bg-surface p-3">
              <div>
                <p className="text-label-sm text-on-surface-variant">
                  BUDGET BULANAN
                </p>
                <p className="money mt-1 text-label text-on-surface">
                  {fmt(previewMonthly)}
                </p>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant">
                  BUDGET HARIAN
                </p>
                <p className="money mt-1 text-label text-on-surface">
                  {fmt(previewDaily)}
                </p>
              </div>
            </div>
          </section>

          <PrimaryButton
            onClick={() => save({ preventDefault() {} } as React.FormEvent)}
          >
            Simpan perubahan
          </PrimaryButton>
        </form>

        <section className="space-y-4 rounded-extra bg-surface-container p-5">
          <div className="flex items-center gap-2 text-primary">
            <Icon name="palette" className="text-icon-sm" />
            <p className="text-title">Tampilan</p>
          </div>
          <Segmented
            items={["Gelap", "Terang"]}
            value={theme === "light" ? "Terang" : "Gelap"}
            onChange={applyTheme}
          />
        </section>

        <section className="space-y-4 rounded-extra bg-surface-container p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Icon name="receipt_long" className="text-icon-sm" />
              <p className="text-title">Pengeluaran tetap</p>
            </div>
            <p className="money text-label text-expense">
              {fmt(c.fixedDaily)}/hari
            </p>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Tagihan rutin yang dipotong dari budget belanja. Matikan sementara
            saat libur atau WFH.
          </p>
          {s.fixed.length === 0 && (
            <Empty icon="receipt_long" text="Belum ada pengeluaran tetap." />
          )}
          <div className="space-y-2">
            {s.fixed.map((f) => (
              <div
                key={f.id}
                className={`flex items-center gap-2 rounded-large border border-outline-variant bg-surface p-3 ${
                  f.isActive ? "" : "opacity-60"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body text-on-surface">{f.name}</p>
                  <p className="money text-label-sm text-expense">
                    {fmt(f.amount)} / {f.period === "harian" ? "hari" : "bulan"}
                  </p>
                </div>
                <Action
                  label={`${f.isActive ? "Matikan" : "Aktifkan"} ${f.name}`}
                  onClick={() => updateFixed(f.id, { isActive: !f.isActive })}
                  className={`rounded-full px-3 py-2 text-label-sm ${
                    f.isActive
                      ? "bg-tertiary-container text-tertiary"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {f.isActive ? "Aktif" : "OFF"}
                </Action>
                <Action
                  label={`Hapus ${f.name}`}
                  onClick={() => deleteFixed(f.id)}
                  className="grid size-11 place-items-center rounded-full text-on-surface-variant"
                >
                  <Icon name="delete" className="text-icon-sm" />
                </Action>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-2">
            <div className="flex gap-2">
              <input
                id="f-name"
                aria-label="Nama pengeluaran"
                className={`${inputCls} min-w-0 flex-1`}
                placeholder="Nama (cth: Internet)"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
              />
              <input
                id="f-amount"
                aria-label="Nominal pengeluaran"
                inputMode="numeric"
                className={`${inputCls} w-32`}
                placeholder="Nominal"
                value={grpNum(fAmount)}
                onChange={(e) => setFAmount(String(num(e.target.value)))}
              />
            </div>
            <div className="flex gap-2">
              <select
                id="f-period"
                aria-label="Periode"
                className={`${inputCls} flex-1`}
                value={fPeriod}
                onChange={(e) =>
                  setFPeriod(e.target.value as "harian" | "bulanan")
                }
              >
                <option value="bulanan">Per bulan</option>
                <option value="harian">Per hari</option>
              </select>
              <Action
                label="Tambah pengeluaran tetap"
                onClick={addExpense}
                className="flex items-center gap-1 rounded-large bg-primary px-5 py-3 text-label text-on-primary"
              >
                <Icon name="add" />
                Tambah
              </Action>
            </div>
            {fError && <p className="text-body-sm text-expense">{fError}</p>}
          </div>
        </section>

        <section className="space-y-3 rounded-extra bg-surface-container p-5">
          <div className="flex items-center gap-2 text-primary">
            <Icon name="database" className="text-icon-sm" />
            <p className="text-title">Data</p>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Data tersimpan aman di akun Anda. Unduh cadangan JSON bila perlu.
          </p>
          <div className="grid grid-cols-1 gap-3">
            <Action
              label="Cadangan dan impor"
              onClick={() => setData(true)}
              className="flex items-center justify-center gap-2 rounded-full bg-primary-container py-3 text-label text-primary"
            >
              <Icon name="backup" className="text-icon-sm" />
              Cadangan
            </Action>
          </div>
          {confirmReset ? (
            <div className="space-y-2 rounded-large bg-expense/10 p-3">
              <p className="text-body-sm text-expense">
                Semua data di akun ini akan dihapus permanen dari server.
                Lanjutkan?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Action
                  label="Batal hapus"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-full bg-surface-container-high py-3 text-center text-label text-on-surface"
                >
                  Batal
                </Action>
                <Action
                  label="Ya, hapus semua"
                  onClick={() => {
                    void resetAll()
                    setConfirmReset(false)
                  }}
                  className="rounded-full bg-expense py-3 text-center text-label text-solid-ink"
                >
                  Ya, hapus
                </Action>
              </div>
            </div>
          ) : (
            <Action
              label="Hapus semua data"
              onClick={() => setConfirmReset(true)}
              className="flex items-center justify-center gap-2 rounded-full py-3 text-label text-expense"
            >
              <Icon name="delete_forever" className="text-icon-sm" />
              Hapus semua data
            </Action>
          )}
        </section>
      </main>
      {data && (
        <DataSheet
          title="Cadangan data"
          text={exportJson()}
          filename="arunika-backup.json"
          importable
          close={() => setData(false)}
        />
      )}
    </>
  )
}
