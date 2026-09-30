import { describe, it, expect } from "vitest"
import { renderMemorySection } from "../memory.js"

describe("renderMemorySection", () => {
  it("renders facts and skills", () => {
    const out = renderMemorySection({ facts: ["prefers terse answers"], skills: ["compose email"] }, "Brief")
    expect(out).toContain("Brief")
    expect(out).toContain("prefers terse answers")
    expect(out).toContain("compose email")
  })
  it("returns empty string when memory is empty", () => {
    expect(renderMemorySection({ facts: [], skills: [] }, "Brief")).toBe("")
  })
})
