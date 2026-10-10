import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Empty, Progress, Segmented } from "./ui"

describe("Progress", () => {
  it("clamp 0–100 + aria", () => {
    const { rerender } = render(<Progress pct={150} />)
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "100",
    )
    rerender(<Progress pct={-20} />)
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "0",
    )
  })
})

describe("Empty", () => {
  it("tampilkan teks", () => {
    render(<Empty icon="receipt_long" text="Belum ada data." />)
    expect(screen.getByText("Belum ada data.")).toBeTruthy()
  })
})

describe("Segmented", () => {
  it("klik memanggil onChange", () => {
    const onChange = vi.fn()
    render(<Segmented items={["A", "B"]} value="A" onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Buka B" }))
    expect(onChange).toHaveBeenCalledWith("B")
  })
})
