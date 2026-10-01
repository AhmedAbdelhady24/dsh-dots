import { join, isAbsolute } from "node:path"
import { homedir } from "node:os"
import z from "@deepseek-ai/schemastery"
import type { Context } from "@deepseek-ai/cordis"
import { DotStore } from "./store.js"
import { loadDots, saveDots } from "./persistence.js"
import { defineBrowserTools } from "./browser/tools.js"
import { createBrowserDriver } from "./browser/playwright-driver.js"
import { DotSessionRunner } from "./runner.js"

export const name = "dsh-dots"
export const inject = ["tools", "agents", "goals", "systemPrompt", "agentDefaultModel"]

export const Config = z.object({
  dataPath: z.string().default("dots.json"),
  headless: z.boolean().default(false),
})

export function apply(ctx: Context, config: ReturnType<typeof Config>) {
  const base = process.env.DSH_HOME ?? join(homedir(), ".dsh")
  const dataPath = isAbsolute(config.dataPath) ? config.dataPath : join(base, config.dataPath)
  const data = loadDots(dataPath)
  const store = new DotStore(data, () => saveDots(dataPath, data))
  ctx.provide("dots", store)
  const driver = createBrowserDriver("dots-default", { headless: config.headless })
  for (const tool of defineBrowserTools(driver)) ctx.tools.register(tool)
  ctx.provide("dotRunner", new DotSessionRunner(ctx))
  ctx.logger.info(`dsh-dots: ready (${store.list().length} dot(s))`)
}
