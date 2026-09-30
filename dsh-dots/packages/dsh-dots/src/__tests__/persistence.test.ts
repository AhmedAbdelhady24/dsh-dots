import { describe, it, expect } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadDots, saveDots } from "../persistence.js"

describe("persistence", () => {
  it("round-trips dots data", () => {
    const dir = mkdtempSync(join(tmpdir(), "dots-"))
    const p = join(dir, "dots.json")
    saveDots(p, { dots: [] })
    expect(loadDots(p)).toEqual({ dots: [] })
    rmSync(dir, { recursive: true, force: true })
  })
  it("returns empty on missing file", () => {
    expect(loadDots("/nonexistent/definitely/dots.json")).toEqual({ dots: [] })
  })
})
