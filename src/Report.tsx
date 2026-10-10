import { useState } from "react"
import DataSheet from "./DataSheet"
import {
  MONTHS,
  addDays,
  calc,
  catIcon,
  csvFor,
  daysInMonth,
  dstr,
  fmt,
  longDate,
  pad,
  short,
  sum,
  todayStr,
  useStore,
  type Tx,
} from "./store"
import { Action, Empty, Icon, PageHeader, Segmented, Stepper } from "./ui"

type Period = "Minggu" | "Bulan" | "Tahun"
type Bucket = { label: string; from: string; to: string }

const COLORS = [
  "#bfa9ff",
  "#7fd6c2",
  "#ffd54f",
  "#ff8a80",
  "#8ab4f8",
  "#f48fb1",
  "#c5e1a5",
  "#ffab91",
]

function buildRange(
  p: Period,
  off: number,
): { title: string; buckets: Bucket[] } {
  const now = new Date()
  if (p === "Minggu") {
    const start = addDays(todayStr(), -now.getDay() + off * 7)
    const names = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
    const buckets = names.map((label, i) => ({
      label,
      from: addDays(start, i),
      to: addDays(start, i),
    }))
    return {
      title: `${longDate(start).split(", ")[1]} – ${longDate(addDays(start, 6)).split(", ")[1]}`,
      buckets,
    }
  }
  if (p === "Bulan") {
    const d = new Date(now.getFullYear(), now.getMonth() + off, 1)
    const n = daysInMonth(d)
    const buckets = Array.from({ length: n }, (_, i) => {
      const s = dstr(new Date(d.getFullYear(), d.getMonth(), i + 1))
      return { label: String(i + 1), from: s, to: s }
    })
    return { title: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, buckets }
  }
  const y = now.getFullYear() + off
  const buckets = Array.from({ length: 12 }, (_, m) => ({
    label: MONTHS[m].slice(0, 3),
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(daysInMonth(new Date(y, m, 1)))}`,
  }))
  return { title: String(y), buckets }
}

const inRange = (t: Tx, b: Bucket[]) =>
  t.date >= b[0].from && t.date <= b[b.length - 1].to

function TrendLine({
  series,
  labels,
  fmtFn,
}: {
  series: number[]
  labels: string[]
  fmtFn: (v: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 600,
    H = 180,
    PAD = 28
  const max = Math.max(...series, 1)
  const n = series.length
  const x = (i: number) =>
    n <= 1 ? W / 2 : PAD + (i / (n - 1)) * (W - PAD * 2)
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2)
  const pts = series.map((v, i) => `${x(i)},${y(v)}`).join(" ")
  const area = `${PAD},${H - PAD} ${pts} ${x(n - 1)},${H - PAD}`
  const step = Math.max(1, Math.ceil(n / 8))
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Tren pengeluaran interaktif"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-primary)"
              stopOpacity="0.35"
            />
            <stop
              offset="100%"
              stopColor="var(--color-primary)"
              stopOpacity="0.03"
            />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={PAD}
            x2={W - PAD}
            y1={H - PAD - f * (H - PAD * 2)}
            y2={H - PAD - f * (H - PAD * 2)}
            stroke="var(--color-outline-variant)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
        ))}
        <polygon points={area} fill="url(#trendFill)" />
        <polyline
          points={pts}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {series.map((v, i) => (
          <g key={i}>
            <rect
              x={x(i) - W / n / 2}
              y={0}
              width={W / n}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
            {(hover === i || (hover === null && v === max && v > 0)) && (
              <circle
                cx={x(i)}
                cy={y(v)}
                r={hover === i ? 6 : 4}
                fill="var(--color-primary)"
                stroke="var(--color-surface)"
                strokeWidth="2"
              />
            )}
            {hover === i && (
              <line
                x1={x(i)}
                x2={x(i)}
                y1={PAD - 8}
                y2={H - PAD}
                stroke="var(--color-secondary)"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
            )}
          </g>
        ))}
        {labels.map(
          (l, i) =>
            i % step === 0 && (
              <text
                key={i}
                x={x(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize="11"
                fill="var(--color-on-surface-variant)"
              >
                {l}
              </text>
            ),
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-large bg-surface-container-high px-3 py-2 shadow-lg ring-1 ring-outline-variant"
          style={{ left: `${(x(hover) / W) * 100}%`, top: 0 }}
        >
          <p className="text-label-sm text-on-surface-variant">
            {labels[hover]}
          </p>
          <p className="money text-label text-primary">
            {fmtFn(series[hover])}
          </p>
        </div>
      )}
    </div>
  )
}

function Donut({ data }: { data: [string, number][] }) {
  const total = sum(data.map((d) => d[1]))
  const r = 40
  const circ = 2 * Math.PI * r
  let acc = 0
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-36 shrink-0 -rotate-90"
      role="img"
      aria-label="Komposisi pengeluaran per kategori"
    >
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--color-outline-variant)"
        strokeWidth="14"
      />
      {data.map(([name, v], i) => {
        const len = (v / total) * circ
        const el = (
          <circle
            key={name}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={COLORS[i % COLORS.length]}
            strokeWidth="14"
            strokeDasharray={`${Math.max(len - 1, 0)} ${circ - Math.max(len - 1, 0)}`}
            strokeDashoffset={-acc}
          />
        )
        acc += len
        return el
      })}
    </svg>
  )
}

export default function Report() {
  const s = useStore()
  const c = calc(s)
  const [period, setPeriod] = useState<Period>("Bulan")
  const [off, setOff] = useState(0)
  const [exporting, setExporting] = useState(false)
  // Offset periode pembanding (null = periode sebelumnya). Bisa digeser bebas via kontrol "vs".
  const [compareOff, setCompareOff] = useState<number | null>(null)

  const { title, buckets } = buildRange(period, off)
  const cmp = compareOff ?? off - 1
  const { title: cmpTitle, buckets: prev } = buildRange(period, cmp)
  const sameRange = cmp === off
  const txs = s.txs.filter((t) => inRange(t, buckets))
  const income = sum(
    txs.filter((t) => t.type === "income").map((t) => t.amount),
  )
  const expense = sum(
    txs.filter((t) => t.type === "expense").map((t) => t.amount),
  )
  const prevExpense = sum(
    s.txs
      .filter((t) => t.type === "expense" && inRange(t, prev))
      .map((t) => t.amount),
  )
  const net = income - expense

  const series = buckets.map((b) =>
    sum(
      txs
        .filter(
          (t) => t.type === "expense" && t.date >= b.from && t.date <= b.to,
        )
        .map((t) => t.amount),
    ),
  )
  const max = Math.max(...series, 1)
  const today = todayStr()

  const catMap: Record<string, number> = {}
  for (const t of txs)
    if (t.type === "expense")
      catMap[t.category] = (catMap[t.category] ?? 0) + t.amount
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1])

  const diff = sameRange
    ? 0
    : prevExpense > 0
      ? Math.round(((expense - prevExpense) / prevExpense) * 100)
      : null
  const ringLen = 314.15
  const scoreTone =
    c.score < 20
      ? "var(--color-expense)"
      : c.score < 50
        ? "var(--color-warning)"
        : "var(--color-tertiary)"

  function shareImage() {
    const W = 1080,
      H = 1440
    const cv = document.createElement("canvas")
    cv.width = W
    cv.height = H
    const g = cv.getContext("2d")
    if (!g) return
    g.fillStyle = "#1c1b1f"
    g.fillRect(0, 0, W, H)
    const grad = g.createLinearGradient(0, 0, W, 320)
    grad.addColorStop(0, "#2e2750")
    grad.addColorStop(1, "#1c1b1f")
    g.fillStyle = grad
    g.fillRect(0, 0, W, 460)
    g.fillStyle = "#bfa9ff"
    g.font = "600 44px Roboto, sans-serif"
    g.fillText("Arunika · Laporan", 72, 120)
    g.fillStyle = "#cac4d0"
    g.font = "400 40px Roboto, sans-serif"
    g.fillText(title, 72, 178)
    g.fillStyle = "#e6e1e5"
    g.font = "400 34px Roboto, sans-serif"
    g.fillText("ARUS KAS BERSIH", 72, 300)
    g.fillStyle = net >= 0 ? "#7ddc9a" : "#ff8a80"
    g.font = "600 100px Roboto, sans-serif"
    g.fillText(fmt(net, true), 72, 410)
    g.font = "400 40px Roboto, sans-serif"
    g.fillStyle = "#7ddc9a"
    g.fillText(`Masuk  ${fmt(income)}`, 72, 520)
    g.fillStyle = "#ff8a80"
    g.fillText(`Keluar  ${fmt(expense)}`, 72, 580)
    g.fillStyle = "#e6e1e5"
    g.font = "600 40px Roboto, sans-serif"
    g.fillText("Pengeluaran terbesar", 72, 700)
    const top = cats.slice(0, 5)
    const maxCat = Math.max(...top.map(([, v]) => v), 1)
    top.forEach(([name, v], i) => {
      const y = 770 + i * 110
      g.fillStyle = "#e6e1e5"
      g.font = "400 38px Roboto, sans-serif"
      g.fillText(`${i + 1}. ${name}`, 72, y)
      g.fillStyle = "#cac4d0"
      g.font = "400 36px Roboto, sans-serif"
      g.fillText(fmt(v), 72, y + 44)
      g.fillStyle = "#4a3a8f"
      g.fillRect(560, y - 28, 448, 26)
      g.fillStyle = "#bfa9ff"
      g.fillRect(560, y - 28, Math.max((v / maxCat) * 448, 8), 26)
    })
    g.fillStyle = "#938f99"
    g.font = "400 32px Roboto, sans-serif"
    g.fillText(`Dibuat ${longDate(today)} · Arunika`, 72, H - 72)
    cv.toBlob(async (blob) => {
      if (!blob) return
      const file = new File(
        [blob],
        `arunika-${title.replace(/\s+/g, "-")}.png`,
        { type: "image/png" },
      )
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Arunika · ${title}` })
        } else {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = file.name
          a.click()
          URL.revokeObjectURL(url)
        }
      } catch {
        /* share dibatalkan — abaikan */
      }
    }, "image/png")
  }

  return (
    <>
      <PageHeader
        title="Laporan"
        sub={title}
        right={
          <div className="flex items-center">
            <Action
              label="Bagikan gambar ringkasan"
              onClick={shareImage}
              className="grid size-12 place-items-center rounded-full text-on-surface"
            >
              <Icon name="share" />
            </Action>
            <Action
              label="Ekspor laporan"
              onClick={() => setExporting(true)}
              className="grid size-12 place-items-center rounded-full text-on-surface"
            >
              <Icon name="ios_share" />
            </Action>
          </div>
        }
      />
      <main className="scroll-area space-y-5 overflow-y-auto px-4 pb-36">
        <Segmented
          items={["Minggu", "Bulan", "Tahun"]}
          value={period}
          onChange={(v) => {
            setPeriod(v as Period)
            setOff(0)
            setCompareOff(null)
          }}
        />
        <div className="rounded-large bg-surface-container px-2">
          <Stepper
            label={title}
            onPrev={() => setOff(off - 1)}
            onNext={() => setOff(off + 1)}
          />
        </div>
        <div className="flex items-center justify-between rounded-large bg-surface-container px-2">
          <Action
            label="Bandingkan dengan periode sebelumnya"
            onClick={() => setCompareOff(cmp - 1)}
            className="grid size-11 place-items-center rounded-full text-on-surface"
          >
            <Icon name="chevron_left" />
          </Action>
          <p className="text-label-sm text-on-surface-variant">vs {cmpTitle}</p>
          <Action
            label="Bandingkan dengan periode berikutnya"
            onClick={() => setCompareOff(cmp + 1)}
            className="grid size-11 place-items-center rounded-full text-on-surface"
          >
            <Icon name="chevron_right" />
          </Action>
        </div>

        <section className="rounded-extra bg-balance-card p-5">
          <p className="text-label text-primary">ARUS KAS BERSIH</p>
          <p
            className={`money mt-3 text-display ${
              net >= 0 ? "text-income" : "text-expense"
            }`}
          >
            {fmt(net, true)}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-large bg-surface-translucent p-3">
              <div className="flex items-center gap-2 text-income">
                <Icon name="south_west" className="text-icon-sm" />
                <p className="text-label-sm">PEMASUKAN</p>
              </div>
              <p className="money mt-2 text-title text-on-surface">
                {fmt(income)}
              </p>
            </div>
            <div className="rounded-large bg-surface-translucent p-3">
              <div className="flex items-center gap-2 text-expense">
                <Icon name="north_east" className="text-icon-sm" />
                <p className="text-label-sm">PENGELUARAN</p>
              </div>
              <p className="money mt-2 text-title text-on-surface">
                {fmt(expense)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-large bg-surface-container p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-title text-on-surface">Tren pengeluaran</p>
              <p
                className={`mt-1 text-label-sm ${
                  sameRange
                    ? "text-on-surface-variant"
                    : diff === null
                      ? "text-on-surface-variant"
                      : diff <= 0
                        ? "text-tertiary"
                        : "text-expense"
                }`}
              >
                {sameRange
                  ? "Membandingkan dengan periode yang sama"
                  : diff === null
                    ? `Belum ada data di ${cmpTitle}`
                    : diff <= 0
                      ? `${Math.abs(diff)}% lebih hemat dari ${cmpTitle}`
                      : `${diff}% lebih boros dari ${cmpTitle}`}
              </p>
            </div>
            <Icon
              name={diff !== null && diff > 0 ? "trending_up" : "trending_down"}
              className={
                diff !== null && diff > 0 ? "text-expense" : "text-tertiary"
              }
            />
          </div>
          <div
            className="mt-6 flex h-32 items-end gap-0.5"
            role="img"
            aria-label="Grafik batang pengeluaran"
          >
            {series.map((v, i) => (
              <div
                key={buckets[i].from}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                title={`${buckets[i].label}: ${fmt(v)}`}
              >
                <div
                  className={`w-full max-w-8 rounded-t-medium ${
                    buckets[i].from <= today && today <= buckets[i].to
                      ? "bg-primary"
                      : "bg-primary-container"
                  }`}
                  style={{
                    height: `${Math.max((v / max) * 100, v > 0 ? 4 : 1)}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-0.5">
            {buckets.map((b, i) => (
              <span
                key={b.from}
                className="flex-1 text-center text-[0.625rem] text-on-surface-variant"
              >
                {period === "Bulan" && i % 5 !== 0 ? "" : b.label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-label-sm text-on-surface-variant">
            Tertinggi {short(max === 1 && !series.some(Boolean) ? 0 : max)} per{" "}
            {period === "Tahun" ? "bulan" : "hari"}
          </p>
          <div className="mt-4 border-t border-outline-variant pt-4">
            <TrendLine
              series={series}
              labels={buckets.map((b) => b.label)}
              fmtFn={(v) => fmt(v)}
            />
          </div>
        </section>

        <section className="rounded-large bg-surface-container p-4">
          <p className="mb-4 text-title text-on-surface">
            Komposisi pengeluaran
          </p>
          {cats.length === 0 ? (
            <Empty
              icon="donut_large"
              text="Belum ada pengeluaran di periode ini."
            />
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <Donut data={cats} />
              <ul
                className="min-w-0 flex-1 space-y-2"
                style={{ minWidth: "10rem" }}
              >
                {cats.slice(0, 6).map(([name, v], i) => (
                  <li key={name} className="flex items-center gap-2 text-label">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="flex-1 truncate capitalize text-on-surface">
                      {name}
                    </span>
                    <span className="money text-on-surface-variant">
                      {Math.round((v / expense) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="flex items-center gap-4 rounded-large bg-surface-container p-4">
          <svg
            viewBox="0 0 120 120"
            className="size-28 shrink-0 -rotate-90"
            role="img"
            aria-label={`Skor keuangan ${c.score} dari 100`}
          >
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--color-outline-variant)"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={scoreTone}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={ringLen}
              strokeDashoffset={ringLen - (ringLen * c.score) / 100}
            />
            <text
              x="60"
              y="60"
              textAnchor="middle"
              dominantBaseline="central"
              transform="rotate(90 60 60)"
              fill="var(--color-on-surface)"
              fontSize="28"
              fontWeight="600"
            >
              {c.score}
            </text>
          </svg>
          <div className="min-w-0">
            <p className="text-label-sm text-primary">
              SKOR KEUANGAN BULAN INI
            </p>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {c.spendableMonth > 0
                ? `Pengeluaran ${fmt(c.monthSpend)} dari budget ${fmt(c.monthlyBudget)}. Sisa ${fmt(c.spendableMonth)}, kamu masih on track.`
                : `Budget bulan ini habis. Pengeluaran ${fmt(c.monthSpend)} dari budget ${fmt(c.monthlyBudget)}.`}
            </p>
          </div>
        </section>

        <section>
          <p className="mb-3 px-1 text-title text-on-surface">
            Pengeluaran terbesar
          </p>
          {cats.length === 0 ? (
            <Empty icon="receipt_long" text="Belum ada data." />
          ) : (
            <div className="overflow-hidden rounded-large bg-surface-container">
              {cats.slice(0, 5).map(([name, v]) => (
                <div
                  key={name}
                  className="flex items-center gap-3 border-b border-outline-variant p-4 last:border-0"
                >
                  <div className="grid size-11 shrink-0 place-items-center rounded-medium bg-surface-container-high text-secondary">
                    <Icon name={catIcon(name)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body capitalize text-on-surface">
                      {name}
                    </p>
                    <p className="mt-1 text-label-sm text-on-surface-variant">
                      {Math.round((v / expense) * 100)}% pengeluaran
                    </p>
                  </div>
                  <p className="money text-label text-on-surface">{fmt(v)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      {exporting && (
        <DataSheet
          title={`Ekspor CSV · ${title}`}
          text={csvFor(txs)}
          filename={`arunika-${title.replace(/\s+/g, "-")}.csv`}
          close={() => setExporting(false)}
        />
      )}
    </>
  )
}
