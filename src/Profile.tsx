import { useState, useEffect } from "react";

function Icon({ name, filled = false, className = "" }: { name: string; filled?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-rounded ${filled ? "icon-filled" : ""} ${className}`}>
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

export default function Profile() {
  const [name, setName] = useState("Raka");
  const [email, setEmail] = useState("admin@gmail.com");
  const [currency, setCurrency] = useState("IDR");
  const [monthlyIncome, setMonthlyIncome] = useState("2000000");
  const [telegramId, setTelegramId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [fixedExpenses, setFixedExpenses] = useState<{ id: string; name: string; amount: number; is_active: boolean }[]>([
    { id: "1", name: "Internet", amount: 350000, is_active: true },
    { id: "2", name: "Listrik & Air", amount: 500000, is_active: true },
  ]);
  const [newExpName, setNewExpName] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load from mock or simulate fetching default user
    fetch("http://localhost:8099/api/users/47d22b71-3285-48bd-ae7f-4e79b41b3215")
      .then((res) => res.json())
      .catch(() => {});
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setError("");
    setTimeout(() => setSaved(false), 3000);
  }

  function addFixedExpense() {
    if (!newExpName || !newExpAmount) return;
    setFixedExpenses([
      ...fixedExpenses,
      {
        id: Date.now().toString(),
        name: newExpName,
        amount: Number(newExpAmount) || 0,
        is_active: true,
      },
    ]);
    setNewExpName("");
    setNewExpAmount("");
  }

  function removeExpense(id: string) {
    setFixedExpenses(fixedExpenses.filter((item) => item.id !== id));
  }

  return (
    <>
      <header className="flex items-center justify-between px-5 pb-4 pt-6">
        <div>
          <p className="text-headline text-on-surface">Profil & Pengaturan</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">Kelola akun, integrasi & pengeluaran tetap</p>
        </div>
      </header>

      <main className="scroll-area space-y-5 overflow-y-auto px-4 pb-36">
        {saved && (
          <div className="flex items-center gap-3 rounded-medium bg-income/20 border border-income/30 p-4 text-income">
            <Icon name="check_circle" />
            <p className="text-body-sm">Profil dan pengaturan berhasil disimpan!</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-medium bg-expense/20 border border-expense/30 p-4 text-expense">
            <Icon name="error" />
            <p className="text-body-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Edit Profil */}
          <section className="rounded-extra bg-surface-container p-5 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Icon name="person" className="text-icon-sm" />
              <p className="text-title">Informasi Akun</p>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-large border border-outline bg-surface px-4 py-3 text-body text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-large border border-outline bg-surface px-4 py-3 text-body text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1">Mata Uang (Currency)</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-large border border-outline bg-surface px-4 py-3 text-body text-on-surface outline-none focus:border-primary"
                >
                  <option value="IDR">IDR (Rp)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1">Target Pemasukan Bulanan</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="w-full rounded-large border border-outline bg-surface px-4 py-3 text-body text-on-surface outline-none focus:border-primary"
                />
              </div>
            </div>
          </section>

          {/* Integrasi Telegram */}
          <section className="rounded-extra bg-surface-container p-5 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Icon name="send" className="text-icon-sm" />
              <p className="text-title">Integrasi Telegram</p>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              Hubungkan akun Telegram Anda untuk pencatatan transaksi instan melalui Bot Telegram Arunika.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1">Telegram Chat ID / Username</label>
                <input
                  type="text"
                  placeholder="@username atau 12345678"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  className="w-full rounded-large border border-outline bg-surface px-4 py-3 text-body text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1">Kode Verifikasi Bot</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: 9842"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    className="w-full rounded-large border border-outline bg-surface px-4 py-3 text-body text-on-surface outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setVerifyCode(Math.floor(1000 + Math.random() * 9000).toString())}
                    className="rounded-large bg-primary-container px-4 py-3 text-label text-primary shrink-0"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Pengeluaran Tetap (Fixed Expenses) */}
          <section className="rounded-extra bg-surface-container p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Icon name="receipt_long" className="text-icon-sm" />
                <p className="text-title">Pengeluaran Tetap (Fixed Expenses)</p>
              </div>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              Tagihan rutin atau cicilan yang dibayar setiap bulan.
            </p>

            <div className="space-y-2">
              {fixedExpenses.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-surface p-3 rounded-large border border-outline-variant">
                  <div>
                    <p className="text-body text-on-surface">{item.name}</p>
                    <p className="money text-label-sm text-expense">Rp {item.amount.toLocaleString("id-ID")}</p>
                  </div>
                  <Action
                    label={`Hapus ${item.name}`}
                    onClick={() => removeExpense(item.id)}
                    className="text-on-surface-variant hover:text-expense p-2"
                  >
                    <Icon name="delete" className="text-icon-sm" />
                  </Action>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Nama Pengeluaran (cth: Netflix)"
                value={newExpName}
                onChange={(e) => setNewExpName(e.target.value)}
                className="flex-1 rounded-large border border-outline bg-surface px-4 py-3 text-body text-on-surface outline-none focus:border-primary"
              />
              <input
                type="number"
                placeholder="Nominal (Rp)"
                value={newExpAmount}
                onChange={(e) => setNewExpAmount(e.target.value)}
                className="w-36 rounded-large border border-outline bg-surface px-4 py-3 text-body text-on-surface outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={addFixedExpense}
                className="rounded-large bg-primary px-5 py-3 text-label text-on-primary shrink-0 flex items-center gap-1"
              >
                <Icon name="add" />
                Tambah
              </button>
            </div>
          </section>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-4 text-label text-on-primary font-semibold shadow-lg"
          >
            <Icon name="check" />
            Simpan Perubahan
          </button>
        </form>
      </main>
    </>
  );
}
