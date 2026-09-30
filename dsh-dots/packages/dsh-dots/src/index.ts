import z from "@deepseek-ai/schemastery"
import type { Context } from "@deepseek-ai/cordis"
import { DotStore } from "./store.js"
import { loadDots, saveDots } from "./persistence.js"
import { defineBrowserTools } from "./browser/tools.js"
import { createBrowserDriver } from "./browser/playwright-driver.js"

export const name = "dsh-dots"
export const inject = ["tools"]

export const Config = z.object({
  dataPath: z.string().default("dots.json"),
  headless: z.boolean().default(false),
})

export function apply(ctx: Context, config: ReturnType<typeof Config>) {
  const data = loadDots(config.dataPath)
  const store = new DotStore(data, () => saveDots(config.dataPath, data))
  ctx.provide("dots", store)
  const driver = createBrowserDriver("dots-default", { headless: config.headless })
  for (const tool of defineBrowserTools(driver)) ctx.tools.register(tool)
  ctx.logger.info(`dsh-dots: ready (${store.list().length} dot(s))`)
}
