import { useEffect, useState } from "react";
import DataSheet from "./DataSheet";
import {
  addFixed, calc, deleteFixed, exportJson, fmt, loadSample, resetAll, setProfile, updateFixed, useStore,
  type Profile as ProfileT,
} from "./store";
import { Action, Empty, Field, Icon, PageHeader, PrimaryButton, inputCls } from "./ui";

const num = (v: string) => Number(v.replace(/\D/g, "")) || 0;
const grp = (v: string | number) => (Number(v) ? Number(v).toLocaleString("id-ID") : "");

export default function Profile() {
  const s = useStore();
  const c = calc(s);
  const [draft, setDraft] = useState<ProfileT>(s.profile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fName, setFName] = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fPeriod, setFPeriod] = useState<"harian" | "bulanan">("bulanan");
  const [fError, setFError] = useState("");
  const [data, setData] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // sinkronkan draf saat profil di store berubah (impor, reset)
  useEffect(() => setDraft(s.profile), [s.profile]);

  // pratinjau budget memakai draf, supaya slider langsung terasa
  const spendPct = (100 - draft.wealthGoal) / 100;
  const previewMonthly = Math.round(draft.monthlyIncome * spendPct);
  const previewDaily = Math.round(previewMonthly / 30);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (draft.monthlyIncome < 0) return setError("Target pemasukan tidak boleh negatif.");
    if (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email)) return setError("Format email tidak valid.");
    setError("");
    setProfile({ ...draft, name: draft.name.trim() || "Pengguna" });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  function addExpense() {
    if (!fName.trim()) return setFError("Nama pengeluaran wajib diisi.");
    if (num(fAmount) <= 0) return setFError("Nominal harus lebih dari 0.");
    setFError("");
    addFixed({ name: fName.trim(), amount: num(fAmount), period: fPeriod });
    setFName("");
    setFAmount("");
  }

  return (
    <>
      <PageHeader title="Profil & Pengaturan" sub="Kelola akun, budget, dan pengeluaran tetap" />
      <main className="scroll-area space-y-5 overflow-y-auto px-4 pb-36">
        {saved && (
          <div role="status" className="flex items-center gap-3 rounded-medium border border-income/30 bg-income/20 p-4 text-income">
            <Icon name="check_circle" />
            <p className="text-body-sm">Profil dan pengaturan berhasil disimpan.</p>
          </div>
        )}
        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-medium border border-expense/30 bg-expense/20 p-4 text-expense">
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
              <input id="p-name" className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input id="p-email" type="email" className={inputCls} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </Field>
          </section>

          <section className="space-y-4 rounded-extra bg-surface-container p-5">
            <div className="flex items-center gap-2 text-primary">
              <Icon name="payments" className="text-icon-sm" />
              <p className="text-title">Keuangan</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mata uang">
                <select id="p-cur" className={inputCls} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value as ProfileT["currency"] })}>
                  <option value="IDR">IDR (Rp)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </Field>
              <Field label="Saldo awal">
                <input id="p-start" inputMode="numeric" className={inputCls} value={grp(draft.startBalance)} onChange={(e) => setDraft({ ...draft, startBalance: num(e.target.value) })} placeholder="0" />
              </Field>
            </div>
            <Field label="Pemasukan bulanan">
              <input id="p-income" inputMode="numeric" className={inputCls} value={grp(draft.monthlyIncome)} onChange={(e) => setDraft({ ...draft, monthlyIncome: num(e.target.value) })} placeholder="0" />
            </Field>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="p-goal" className="text-label-sm text-on-surface-variant">Target menabung</label>
                <p className="money text-label text-primary">
                  {draft.wealthGoal}% · {fmt(Math.round((draft.monthlyIncome * draft.wealthGoal) / 100))}
                </p>
              </div>
              <input
                id="p-goal" type="range" min={10} max={80} step={1}
                value={draft.wealthGoal}
                onChange={(e) => setDraft({ ...draft, wealthGoal: Number(e.target.value) })}
                className="mt-2 w-full accent-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-large bg-surface p-3">
              <div>
                <p className="text-label-sm text-on-surface-variant">BUDGET BULANAN</p>
                <p className="money mt-1 text-label text-on-surface">{fmt(previewMonthly)}</p>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant">BUDGET HARIAN</p>
                <p className="money mt-1 text-label text-on-surface">{fmt(previewDaily)}</p>
              </div>
            </div>
          </section>

          <PrimaryButton onClick={() => save({ preventDefault() {} } as React.FormEvent)}>Simpan perubahan</PrimaryButton>
        </form>

        <section className="space-y-4 rounded-extra bg-surface-container p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Icon name="receipt_long" className="text-icon-sm" />
              <p className="text-title">Pengeluaran tetap</p>
            </div>
            <p className="money text-label text-expense">{fmt(c.fixedDaily)}/hari</p>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Tagihan rutin yang dipotong dari budget belanja. Matikan sementara saat libur atau WFH.
          </p>
          {s.fixed.length === 0 && <Empty icon="receipt_long" text="Belum ada pengeluaran tetap." />}
          <div className="space-y-2">
            {s.fixed.map((f) => (
              <div key={f.id} className={`flex items-center gap-2 rounded-large border border-outline-variant bg-surface p-3 ${f.isActive ? "" : "opacity-60"}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body text-on-surface">{f.name}</p>
                  <p className="money text-label-sm text-expense">
                    {fmt(f.amount)} / {f.period === "harian" ? "hari" : "bulan"}
                  </p>
                </div>
                <Action
                  label={`${f.isActive ? "Matikan" : "Aktifkan"} ${f.name}`}
                  onClick={() => updateFixed(f.id, { isActive: !f.isActive })}
                  className={`rounded-full px-3 py-2 text-label-sm ${f.isActive ? "bg-tertiary-container text-tertiary" : "bg-surface-container-high text-on-surface-variant"}`}
                >
                  {f.isActive ? "Aktif" : "OFF"}
                </Action>
                <Action label={`Hapus ${f.name}`} onClick={() => deleteFixed(f.id)} className="grid size-11 place-items-center rounded-full text-on-surface-variant">
                  <Icon name="delete" className="text-icon-sm" />
                </Action>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-2">
            <div className="flex gap-2">
              <input id="f-name" aria-label="Nama pengeluaran" className={`${inputCls} min-w-0 flex-1`} placeholder="Nama (cth: Internet)" value={fName} onChange={(e) => setFName(e.target.value)} />
              <input id="f-amount" aria-label="Nominal pengeluaran" inputMode="numeric" className={`${inputCls} w-32`} placeholder="Nominal" value={grp(fAmount)} onChange={(e) => setFAmount(String(num(e.target.value)))} />
            </div>
            <div className="flex gap-2">
              <select id="f-period" aria-label="Periode" className={`${inputCls} flex-1`} value={fPeriod} onChange={(e) => setFPeriod(e.target.value as "harian" | "bulanan")}>
                <option value="bulanan">Per bulan</option>
                <option value="harian">Per hari</option>
              </select>
              <Action label="Tambah pengeluaran tetap" onClick={addExpense} className="flex items-center gap-1 rounded-large bg-primary px-5 py-3 text-label text-on-primary">
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
            Data tersimpan di browser ini. Salin cadangan JSON untuk memindahkannya ke perangkat lain.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Action label="Cadangan dan impor" onClick={() => setData(true)} className="flex items-center justify-center gap-2 rounded-full bg-primary-container py-3 text-label text-primary">
              <Icon name="backup" className="text-icon-sm" />
              Cadangan
            </Action>
            <Action label="Muat data contoh" onClick={loadSample} className="flex items-center justify-center gap-2 rounded-full bg-primary-container py-3 text-label text-primary">
              <Icon name="science" className="text-icon-sm" />
              Data contoh
            </Action>
          </div>
          {confirmReset ? (
            <div className="space-y-2 rounded-large bg-expense/10 p-3">
              <p className="text-body-sm text-expense">Semua data akan dihapus permanen. Lanjutkan?</p>
              <div className="grid grid-cols-2 gap-3">
                <Action label="Batal hapus" onClick={() => setConfirmReset(false)} className="rounded-full bg-surface-container-high py-3 text-center text-label text-on-surface">
                  Batal
                </Action>
                <Action label="Ya, hapus semua" onClick={() => { resetAll(); setConfirmReset(false); }} className="rounded-full bg-expense py-3 text-center text-label text-background">
                  Ya, hapus
                </Action>
              </div>
            </div>
          ) : (
            <Action label="Hapus semua data" onClick={() => setConfirmReset(true)} className="flex items-center justify-center gap-2 rounded-full py-3 text-label text-expense">
              <Icon name="delete_forever" className="text-icon-sm" />
              Hapus semua data
            </Action>
          )}
        </section>
      </main>
      {data && <DataSheet title="Cadangan data" text={exportJson()} filename="arunika-backup.json" importable close={() => setData(false)} />}
    </>
  );
}
