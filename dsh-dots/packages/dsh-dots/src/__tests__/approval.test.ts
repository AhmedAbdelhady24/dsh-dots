import { describe, it, expect } from "vitest"
import { policyFor } from "../approval.js"

describe("policyFor", () => {
  it("explicit rule wins", () => {
    expect(policyFor("email_send", [{ action: "email_send", policy: "allow" }])).toBe("allow")
  })
  it("browser actions default to ask", () => {
    expect(policyFor("browser_click", [])).toBe("ask")
  })
  it("unknown actions default to allow", () => {
    expect(policyFor("fs.read", [])).toBe("allow")
  })
})
