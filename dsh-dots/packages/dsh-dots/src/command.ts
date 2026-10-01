import { CommandDefinitionId } from "@deepseek-ai/dsh-commands/brand"
import type { CommandInvocation, CommandResult } from "@deepseek-ai/dsh-commands"
import type { Context } from "@deepseek-ai/cordis"

const USAGE = "Usage: /dot <list|create <name> <goal>|start <id>|stop <id>>"

function listText(store: { list(): { id: string; name: string; goal: string }[] }): string {
  const dots = store.list()
  if (dots.length === 0) return "(no dots)"
  return dots.map((d) => `${d.id}  ${d.name}  \u2014 ${d.goal}`).join("\n")
}

function executeDotCommand(ctx: Context, invocation: CommandInvocation): CommandResult {
  const store = ctx.get("dots")
  const runner = ctx.get("dotRunner")
  const input = invocation.rawInput.trim()
  if (!input) return { kind: "success", text: `${listText(store)}\n\n${USAGE}` }
  const [verb, ...rest] = input.split(/\s+/)
  const arg = rest.join(" ").trim()
  try {
    switch (verb) {
      case "list":
        return { kind: "success", text: listText(store) }
      case "create": {
        const m = arg.match(/^(\S+)\s+([\s\S]+)$/)
        if (!m) return { kind: "error", text: `Dot creation needs a name and a goal.\n${USAGE}` }
        const dot = store.create({ name: m[1], goal: m[2].trim() })
        return { kind: "success", text: `Created dot ${dot.id} (${dot.name})` }
      }
      case "start": {
        if (!arg) return { kind: "error", text: `Dot start needs an id.\n${USAGE}` }
        void runner.start(arg).catch((err: Error) => ctx.logger.warn(`dot start failed: ${err.message}`))
        return { kind: "success", text: `Started dot ${arg}` }
      }
      case "stop": {
        if (!arg) return { kind: "error", text: `Dot stop needs an id.\n${USAGE}` }
        void runner.stop(arg)
        return { kind: "success", text: `Stopped dot ${arg}` }
      }
      default:
        return { kind: "error", text: USAGE }
    }
  } catch (err) {
    return { kind: "error", text: err instanceof Error ? err.message : String(err) }
  }
}

export function registerDotCommand(ctx: Context): void {
  ctx.commands.register({
    definitionId: CommandDefinitionId("dsh-dots"),
    name: "dot",
    description: "Create, list, start, and stop always-on agents (dots)",
    input: { hint: "<list|create <name> <goal>|start <id>|stop <id>>", attachments: false },
    handler: (invocation) => executeDotCommand(ctx, invocation),
  })
}
