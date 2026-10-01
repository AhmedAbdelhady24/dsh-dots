import type { Context } from "@deepseek-ai/cordis"
import { createUserMessage } from "@deepseek-ai/dsh-llm"
import { SessionId } from "@deepseek-ai/dsh-session"
import type { AgentHandle } from "@deepseek-ai/dsh-agent"
// The three service type imports below activate the `@deepseek-ai/cordis`
// `Context` augmentations that type `ctx.goals`, `ctx.systemPrompt`, and
// `ctx.agentDefaultModel` (each package declares `interface Context { … }`).
import type { GoalService } from "@deepseek-ai/dsh-goal"
import type { SystemPrompt } from "@deepseek-ai/dsh-system-prompt"
import type { AgentDefaultModelConfig } from "@deepseek-ai/dsh-agent-default-model"
import type { DotStore } from "./store.js"
import { renderMemorySection } from "./memory.js"

export class DotSessionRunner {
  private readonly handles = new Map<string, AgentHandle>()

  constructor(private readonly ctx: Context) {}

  private get store(): DotStore {
    return this.ctx.get("dots")
  }

  async start(dotId: string): Promise<void> {
    const dot = this.store.get(dotId)
    if (!dot) throw new Error(`dot not found: ${dotId}`)
    const sessionId = SessionId(`dot-${dot.id}`)
    const controller = new AbortController()
    const selection = this.ctx.agentDefaultModel.currentSelection()
    const handle = await this.ctx.agents.create({
      sessionId,
      meta: { cwd: process.cwd() },
      agentOptions: selection,
      setup: (agentCtx) => {
        const memory = renderMemorySection(dot.memory, dot.name)
        if (memory) agentCtx.systemPrompt.section({ name: `dots:${dot.id}`, order: 150, text: memory })
      },
      signal: controller.signal,
    })
    this.handles.set(dot.id, handle)
    try {
      this.ctx.goals.create(handle.agent, { objective: dot.goal })
      handle.agent.followup(createUserMessage({ content: [{ type: "text", text: dot.goal }], source: { kind: "user" } }))
      await handle.agent.whenIdle()
    } finally {
      this.handles.delete(dot.id)
      await handle.dispose().catch(() => {})
    }
  }

  async stop(dotId: string): Promise<void> {
    const handle = this.handles.get(dotId)
    if (!handle) return
    handle.agent.cancel({ kind: "user" })
  }
}
