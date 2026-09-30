import { chromium } from "playwright"
import type { BrowserContext, Page } from "playwright"
import type { BrowserDriver } from "./driver.js"

// Fail fast on missing selectors instead of waiting Playwright's full default.
const ACTION_TIMEOUT_MS = 5_000

// One persistent browser context per profile directory, so a dot's browser
// session (cookies, localStorage, open tabs) survives across tool calls.
const contexts = new Map<string, BrowserContext>()

// Per-dot hand-over flag. The live view reads this to decide whether the user
// is driving the browser; for now it is only toggled, with no other effect.
const takeOverFlags = new Map<string, boolean>()

/** Reduce an unknown Playwright error to a short, single-line message. */
function shortMessage(err: unknown): string {
  if (err instanceof Error) {
    const firstLine = err.message.trim().split("\n")[0]!.trim()
    return firstLine || err.name
  }
  return String(err)
}

async function getContext(profileDir: string, headless: boolean): Promise<BrowserContext> {
  const existing = contexts.get(profileDir)
  if (existing) return existing
  const context = await chromium.launchPersistentContext(profileDir, { headless })
  contexts.set(profileDir, context)
  return context
}

async function getPage(context: BrowserContext): Promise<Page> {
  const pages = context.pages()
  if (pages.length > 0) return pages[0]!
  return await context.newPage()
}

export function createBrowserDriver(profileDir: string, opts?: { headless?: boolean }): BrowserDriver {
  const headless = opts?.headless ?? false

  return {
    async navigate(url) {
      try {
        const context = await getContext(profileDir, headless)
        const page = await getPage(context)
        await page.goto(url)
        return { url: page.url(), title: await page.title() }
      } catch (err) {
        throw new Error(shortMessage(err))
      }
    },

    async extract() {
      try {
        const context = await getContext(profileDir, headless)
        const page = await getPage(context)
        return { url: page.url(), text: await page.locator("body").innerText() }
      } catch (err) {
        throw new Error(shortMessage(err))
      }
    },

    async screenshot() {
      try {
        const context = await getContext(profileDir, headless)
        const page = await getPage(context)
        const buf = await page.screenshot({ type: "png" })
        return { mime: "image/png", dataUrl: "data:image/png;base64," + buf.toString("base64") }
      } catch (err) {
        throw new Error(shortMessage(err))
      }
    },

    async click(selector) {
      try {
        const context = await getContext(profileDir, headless)
        const page = await getPage(context)
        await page.click(selector, { timeout: ACTION_TIMEOUT_MS })
        return { ok: true }
      } catch {
        return { ok: false }
      }
    },

    async type(selector, value) {
      try {
        const context = await getContext(profileDir, headless)
        const page = await getPage(context)
        await page.fill(selector, value, { timeout: ACTION_TIMEOUT_MS })
        return { ok: true }
      } catch {
        return { ok: false }
      }
    },

    async takeOver(_reason) {
      takeOverFlags.set(profileDir, true)
    },

    async handBack() {
      takeOverFlags.set(profileDir, false)
    },
  }
}
