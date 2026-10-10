import { useState } from "react"
import {
  DEFAULT_WALLET,
  INCOME_CATS,
  WALLETS,
  addTx,
  catIcon,
  deleteTx,
  fmt,
  grpNum,
  parseDate,
  parseQuick,
  todayStr,
  updateTx,
  useStore,
  type Tx,
  type TxType,
} from "./store"
import {
  Action,
  Field,
  Icon,
  PrimaryButton,
  Segmented,
  Sheet,
  inputCls,
} from "./ui"

export function TxRow({ tx, onClick }: { tx: Tx; onClick?: () => void }) {
  const income = tx.type === "income"
  return (
    <Action
      label={`Ubah transaksi ${tx.description || tx.category}`}
      onClick={onClick}
      className="flex items-center gap-3 border-b border-outline-variant p-4 last:border-0"
    >
      <div className="grid size-11 shrink-0 place-items-center rounded-medium bg-surface-container-high text-secondary">
        <Icon name={catIcon(tx.category)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body text-on-surface">
          {tx.description || tx.category}
        </p>
        <p className="mt-1 truncate text-label-sm capitalize text-on-surface-variant">
          {tx.category} · {tx.wallet}
        </p>
      </div>
      <p
        className={`money shrink-0 text-label ${
          income ? "text-income" : "text-expense"
        }`}
      >
        {fmt(income ? tx.amount : -tx.amount, true)}
      </p>
    </Action>
  )
}

export default function TxSheet({
  initial,
  defaultDate,
  close,
  onSaved,
}: {
  initial?: Tx
  defaultDate?: string
  close: () => void
  onSaved?: (id: string, isNew: boolean) => void
}) {
  const { categories } = useStore()
  const [type, setType] = useState<TxType>(initial?.type ?? "expense")
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [category, setCategory] = useState(initial?.category ?? "")
  const [custom, setCustom] = useState(false)
  const [wallet, setWallet] = useState(initial?.wallet ?? DEFAULT_WALLET)
  const [wCustom, setWCustom] = useState(false)
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? todayStr())
  const [quick, setQuick] = useState("")
  const [error, setError] = useState("")
  const [confirmDel, setConfirmDel] = useState(false)
  // Transaksi lama (>7 hari) wajib konfirmasi dua ketuk; yang baru langsung hapus.
  const ageDays = initial
    ? Math.round(
        (parseDate(todayStr()).getTime() - parseDate(initial.date).getTime()) /
          86400000,
      )
    : 0

  const names = type === "expense" ? categories.map((c) => c.name) : INCOME_CATS
  const list =
    category && !names.includes(category) && !custom
      ? [...names, category]
      : names
  const walletList =
    wallet && !WALLETS.includes(wallet) && !wCustom
      ? [...WALLETS, wallet]
      : WALLETS

  function applyQuick() {
    const q = parseQuick(quick)
    if (!q) {
      setError("Format tidak valid. Gunakan: [Deskripsi] [Nominal] #[Kategori]")
      return
    }
    setError("")
    setDescription(q.description)
    setAmount(String(q.amount))
    if (q.category) {
      setCategory(q.category)
      setCustom(false)
    }
    setQuick("")
  }

  async function save() {
    const n = Number(amount.replace(/\D/g, ""))
    if (!n || n <= 0) return setError("Nominal harus lebih dari 0.")
    if (!date) return setError("Tanggal wajib diisi.")
    const data = {
      type,
      amount: n,
      description: description.trim(),
      category:
        category.trim() || (type === "income" ? "lainnya" : "uncategorized"),
      wallet: wallet.trim() || DEFAULT_WALLET,
      date,
    }
    if (initial) {
      await updateTx(initial.id, data)
      onSaved?.(initial.id, false)
    } else {
      const id = await addTx(data)
      onSaved?.(id, true)
    }
    close()
  }

  return (
    <Sheet
      title={initial ? "Ubah transaksi" : "Tambah transaksi"}
      onClose={close}
    >
      <Segmented
        items={["Pengeluaran", "Pemasukan"]}
        value={type === "expense" ? "Pengeluaran" : "Pemasukan"}
        onChange={(v) => {
          setType(v === "Pengeluaran" ? "expense" : "income")
          setCategory("")
        }}
      />

      {!initial && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field label="Catat cepat · cth: Beli kopi 25000 #makanan">
              <input
                id="quick-entry"
                className={inputCls}
                value={quick}
                onChange={(e) => setQuick(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyQuick()}
                placeholder="Beli kopi 25000 #makanan"
              />
            </Field>
          </div>
          <Action
            label="Terapkan catat cepat"
            onClick={applyQuick}
            className="rounded-large bg-primary-container px-4 py-3 text-label text-primary"
          >
            Isi
          </Action>
        </div>
      )}

      <div className="rounded-large border border-outline bg-surface px-4 py-3">
        <p className="text-label-sm text-primary">Nominal</p>
        <div className="mt-1 flex items-center">
          <span className="text-title text-on-surface-variant">
            {fmt(0).replace(/[\d.,\s]/g, "")}
          </span>
          <input
            id="tx-amount"
            aria-label="Nominal transaksi"
            className="money min-w-0 flex-1 bg-transparent px-3 text-money text-on-surface outline-none"
            inputMode="numeric"
            placeholder="0"
            value={amount ? grpNum(amount.replace(/\D/g, "")) : ""}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>

      <Field label="Deskripsi">
        <input
          id="tx-desc"
          className={inputCls}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="cth: Makan siang"
        />
      </Field>

      <div>
        <p className="mb-2 text-label-sm text-on-surface-variant">KATEGORI</p>
        <div className="flex flex-wrap gap-2">
          {list.map((name) => (
            <Action
              key={name}
              label={`Kategori ${name}`}
              onClick={() => {
                setCategory(name)
                setCustom(false)
              }}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-label capitalize ${
                category === name && !custom
                  ? "border-primary bg-primary-container text-primary"
                  : "border-outline text-on-surface-variant"
              }`}
            >
              <Icon name={catIcon(name)} className="text-icon-sm" />
              {name}
            </Action>
          ))}
          <Action
            label="Kategori baru"
            onClick={() => {
              setCustom(true)
              setCategory("")
            }}
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-label ${
              custom
                ? "border-primary bg-primary-container text-primary"
                : "border-outline text-on-surface-variant"
            }`}
          >
            <Icon name="add" className="text-icon-sm" />
            Baru
          </Action>
        </div>
        {custom && (
          <input
            id="tx-newcat"
            className={`${inputCls} mt-3`}
            autoFocus
            placeholder="Nama kategori baru"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        )}
      </div>

      <div>
        <p className="mb-2 text-label-sm text-on-surface-variant">DOMPET</p>
        <div className="flex flex-wrap gap-2">
          {walletList.map((name) => (
            <Action
              key={name}
              label={`Dompet ${name}`}
              onClick={() => {
                setWallet(name)
                setWCustom(false)
              }}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-label ${
                wallet === name && !wCustom
                  ? "border-primary bg-primary-container text-primary"
                  : "border-outline text-on-surface-variant"
              }`}
            >
              <Icon name="account_balance_wallet" className="text-icon-sm" />
              {name}
            </Action>
          ))}
          <Action
            label="Dompet baru"
            onClick={() => {
              setWCustom(true)
              setWallet("")
            }}
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-label ${
              wCustom
                ? "border-primary bg-primary-container text-primary"
                : "border-outline text-on-surface-variant"
            }`}
          >
            <Icon name="add" className="text-icon-sm" />
            Baru
          </Action>
        </div>
        {wCustom && (
          <input
            id="tx-newwallet"
            className={`${inputCls} mt-3`}
            autoFocus
            placeholder="Nama dompet baru"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
          />
        )}
      </div>

      <Field label="Tanggal">
        <input
          id="tx-date"
          type="date"
          className={inputCls}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>

      {error && <p className="text-body-sm text-expense">{error}</p>}

      <PrimaryButton onClick={save}>
        {initial ? "Simpan perubahan" : "Simpan transaksi"}
      </PrimaryButton>
      {initial && (
        <PrimaryButton
          danger
          icon="delete"
          onClick={() => {
            if (ageDays > 7 && !confirmDel) {
              setConfirmDel(true)
              return
            }
            deleteTx(initial.id)
            close()
          }}
        >
          {ageDays > 7 && !confirmDel
            ? "Hapus transaksi lama?"
            : confirmDel
              ? "Ketuk lagi untuk hapus"
              : "Hapus transaksi"}
        </PrimaryButton>
      )}
    </Sheet>
  )
}
