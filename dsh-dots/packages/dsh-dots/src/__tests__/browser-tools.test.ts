import { describe, it, expect } from "vitest"
import { defineBrowserTools } from "../browser/tools.js"
import type { BrowserDriver } from "../browser/driver.js"

const noop: BrowserDriver = {
  navigate: async () => ({ url: "https://x", title: "X" }),
  extract: async () => ({ url: "https://x", text: "hi" }),
  screenshot: async () => ({ mime: "image/png", dataUrl: "data:image/png;base64," }),
  click: async () => ({ ok: true }),
  type: async () => ({ ok: true }),
  takeOver: async () => {},
  handBack: async () => {},
}

describe("defineBrowserTools", () => {
  it("registers all browser tools with correct names", () => {
    const tools = defineBrowserTools(noop)
    const names = tools.map((t) => t.name)
    expect(names).toEqual([
      "browser.navigate", "browser.screenshot", "browser.extract",
      "browser.click", "browser.type", "browser.take_over", "browser.hand_back",
    ])
  })
})
