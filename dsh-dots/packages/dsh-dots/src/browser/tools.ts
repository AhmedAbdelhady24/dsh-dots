import { defineTool } from "@deepseek-ai/dsh-tools"
import type { BrowserDriver } from "./driver.js"

export type Tool = ReturnType<typeof defineTool>

export function defineBrowserTools(driver: BrowserDriver): Tool[] {
  return [
    defineTool({
      name: "browser.navigate",
      description: "Open a URL in the dot's browser.",
      parameters: { url: { type: "string", required: true, description: "Full URL" } },
      output: { schema: { type: "string" }, render: (_a, v) => [{ type: "text", text: v }] },
      execute: async (args) => JSON.stringify(await driver.navigate(args.url)),
    }),
    defineTool({
      name: "browser.screenshot",
      description: "Capture the current browser screen.",
      parameters: {},
      output: { schema: { type: "string" }, render: (_a, _v) => [{ type: "text", text: "screenshot captured and streamed to the live view" }] },
      execute: async () => (await driver.screenshot()).dataUrl,
    }),
    defineTool({
      name: "browser.extract",
      description: "Return readable text of the current page.",
      parameters: {},
      output: { schema: { type: "string" }, render: (_a, v) => [{ type: "text", text: v }] },
      execute: async () => JSON.stringify(await driver.extract()),
    }),
    defineTool({
      name: "browser.click",
      description: "Click an element by CSS selector or visible text.",
      parameters: { selector: { type: "string", required: true } },
      output: { schema: { type: "string" }, render: (_a, v) => [{ type: "text", text: v }] },
      execute: async (args) => JSON.stringify(await driver.click(args.selector)),
    }),
    defineTool({
      name: "browser.type",
      description: "Type text into a field.",
      parameters: { selector: { type: "string", required: true }, value: { type: "string", required: true } },
      output: { schema: { type: "string" }, render: (_a, v) => [{ type: "text", text: v }] },
      execute: async (args) => JSON.stringify(await driver.type(args.selector, args.value)),
    }),
    defineTool({
      name: "browser.take_over",
      description: "Pause and hand the browser to the user.",
      parameters: { reason: { type: "string" } },
      output: { schema: { type: "string" }, render: (_a, v) => [{ type: "text", text: v }] },
      execute: async (args) => { await driver.takeOver(args.reason ?? ""); return "ok" },
    }),
    defineTool({
      name: "browser.hand_back",
      description: "Return browser control to the dot.",
      parameters: {},
      output: { schema: { type: "string" }, render: (_a, v) => [{ type: "text", text: v }] },
      execute: async () => { await driver.handBack(); return "ok" },
    }),
  ]
}
