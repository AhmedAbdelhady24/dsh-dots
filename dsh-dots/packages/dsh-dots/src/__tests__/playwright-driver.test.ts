import { describe, it, expect } from "vitest"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createBrowserDriver } from "../browser/playwright-driver.js"

// Use per-test temp profile dirs so runs are isolated and never pollute the repo.
const profileDir = (name: string) => mkdtempSync(join(tmpdir(), `dots-${name}-`))

describe("playwright driver", () => {
  it("navigates and extracts text", async () => {
    const d = createBrowserDriver(profileDir("test"), { headless: true })
    const nav = await d.navigate("data:text/html,<title>Hi</title><body>hello world</body>")
    expect(nav.title).toBe("Hi")
    const page = await d.extract()
    expect(page.text).toContain("hello world")
    await d.handBack()
  }, 30_000)

  it("captures a png screenshot as a data URL", async () => {
    const d = createBrowserDriver(profileDir("shot"), { headless: true })
    await d.navigate("data:text/html,<body>screenshot me</body>")
    const shot = await d.screenshot()
    expect(shot.mime).toBe("image/png")
    expect(shot.dataUrl.startsWith("data:image/png;base64,")).toBe(true)
    await d.handBack()
  }, 30_000)

  it("clicks and types into elements", async () => {
    const d = createBrowserDriver(profileDir("form"), { headless: true })
    await d.navigate("data:text/html,<input id='i'><button id='b'>B</button>")
    expect((await d.type("#i", "hello")).ok).toBe(true)
    expect((await d.click("#b")).ok).toBe(true)
    await d.handBack()
  }, 30_000)

  it("reports ok:false when a selector is missing", async () => {
    const d = createBrowserDriver(profileDir("missing"), { headless: true })
    await d.navigate("data:text/html,<body>empty</body>")
    expect((await d.click("#nope")).ok).toBe(false)
    await d.handBack()
  }, 30_000)
})
