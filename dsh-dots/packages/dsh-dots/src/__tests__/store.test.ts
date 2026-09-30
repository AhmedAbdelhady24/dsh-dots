import { describe, it, expect } from "vitest"
import { DotStore } from "../store.js"
import type { NewDot } from "../domain.js"

const sample: NewDot = { name: "Brief", goal: "Summarize inbox" }

describe("DotStore", () => {
  it("creates, lists, and gets dots", () => {
    const s = new DotStore({ dots: [] })
    const d = s.create(sample)
    expect(s.get(d.id)?.name).toBe("Brief")
    expect(s.list()).toHaveLength(1)
  })
  it("updates and removes", () => {
    const s = new DotStore({ dots: [] })
    const d = s.create(sample)
    const updated = s.update(d.id, { name: "Brief v2" })
    expect(updated.name).toBe("Brief v2")
    expect(updated.updatedAt).toBeGreaterThanOrEqual(d.updatedAt)
    s.remove(d.id)
    expect(s.list()).toHaveLength(0)
  })
  it("rejects unknown id", () => {
    const s = new DotStore({ dots: [] })
    expect(() => s.update("missing", { name: "x" })).toThrow(/not found/)
  })
  it("rejects invalid names on update", () => {
    const s = new DotStore({ dots: [] })
    const d = s.create(sample)
    expect(() => s.update(d.id, { name: "   " })).toThrow(/non-empty|at most 120/)
    expect(() => s.update(d.id, { name: "x".repeat(121) })).toThrow(/120/)
  })
})
