import { useState } from "react"
import { importJson } from "./store"
import { Icon, PrimaryButton, Sheet, Action } from "./ui"

/** Ekspor/impor lewat teks. Unduhan file diblokir di beberapa viewer, jadi salin teks selalu tersedia. */
export default function DataSheet({
  title,
  text,
  filename,
  importable = false,
  close,
}: {
  title: string
  text: string
  filename: string
  importable?: boolean
  close: () => void
}) {
  const [value, setValue] = useState(text)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setMsg({ ok: true, text: "Tersalin ke papan klip." })
    } catch {
      const el = document.getElementById(
        "data-text",
      ) as HTMLTextAreaElement | null
      el?.select()
      setMsg({
        ok: false,
        text: "Salin otomatis ditolak. Teks sudah dipilih, tekan Ctrl/Cmd+C.",
      })
    }
  }
  function download() {
    try {
      const url = URL.createObjectURL(new Blob([value], { type: "text/plain" }))
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* diblokir viewer; pakai salin */
    }
  }
  function doImport() {
    if (busy) return
    setBusy(true)
    setMsg(null)
    void importJson(value).then((err) => {
      setBusy(false)
      setMsg(
        err
          ? { ok: false, text: err }
          : {
              ok: true,
              text: "Data berhasil diimpor (ditambahkan ke data saat ini).",
            },
      )
    })
  }

  return (
    <Sheet title={title} onClose={close}>
      <textarea
        id="data-text"
        aria-label={title}
        className="h-52 w-full resize-none rounded-large border border-outline bg-surface p-3 font-mono text-label-sm text-on-surface outline-none focus:border-primary"
        value={value}
        readOnly={!importable}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <PrimaryButton icon="content_copy" onClick={copy}>
          Salin
        </PrimaryButton>
        <Action
          label="Unduh file"
          onClick={download}
          className="flex items-center justify-center gap-2 rounded-full bg-primary-container py-4 text-label text-primary"
        >
          <Icon name="download" />
          Unduh
        </Action>
      </div>
      {importable && (
        <PrimaryButton icon="upload" onClick={doImport}>
          Impor dari teks di atas
        </PrimaryButton>
      )}
      {msg && (
        <p
          className={`text-body-sm ${msg.ok ? "text-income" : "text-expense"}`}
        >
          {msg.text}
        </p>
      )}
    </Sheet>
  )
}
