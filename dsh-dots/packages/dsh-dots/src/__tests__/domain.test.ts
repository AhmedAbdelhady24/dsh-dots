import { describe, it, expect } from "vitest"
import { validateDotName, normalizeDot } from "../domain.js"

describe("dot domain", () => {
  it("trims and validates a dot name", () => {
    expect(validateDotName("  Daily brief  ")).toBe("Daily brief")
    expect(() => validateDotName("   ")).toThrow(/non-empty/)
    expect(() => validateDotName("x".repeat(121))).toThrow(/120/)
  })

  it("normalizes a new dot with defaults", () => {
    const dot = normalizeDot({
      name: "Brief",
      goal: "Summarize my inbox every morning",
    })
    expect(dot.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(dot.name).toBe("Brief")
    expect(dot.browser.profileDir).toBeTruthy()
    expect(dot.memory).toEqual({ facts: [], skills: [] })
    expect(dot.approvalRules).toEqual([])
    expect(dot.createdAt).toBeGreaterThan(0)
  })
})
