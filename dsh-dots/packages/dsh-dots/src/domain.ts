import { randomUUID } from "node:crypto"

export type ScheduleSelector =
  | { kind: "after_seconds"; seconds: number }
  | { kind: "at"; instant: string }
  | { kind: "every_seconds"; seconds: number }
  | { kind: "daily"; time: string; timeZone: string }
  | { kind: "weekly"; time: string; timeZone: string; weekdays: number[] }
  | { kind: "cron"; expression: string; timeZone: string }

export interface ScheduleSpec { selector: ScheduleSelector; prompt: string }

export interface ApprovalRule {
  /** Tool action namespace, e.g. "browser_click", "email_send" */
  action: string
  policy: "ask" | "allow"
}

export interface Dot {
  id: string
  name: string
  goal: string
  schedule?: ScheduleSpec
  browser: { profileDir: string; viewport?: { width: number; height: number } }
  memory: { facts: string[]; skills: string[] }
  approvalRules: ApprovalRule[]
  createdAt: number
  updatedAt: number
}

export interface NewDot {
  name: string
  goal: string
  schedule?: ScheduleSpec
  browser?: Partial<Dot["browser"]>
  approvalRules?: ApprovalRule[]
}

export function validateDotName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) throw new TypeError("dot name must be non-empty")
  if (trimmed.length > 120) throw new TypeError("dot name must be at most 120 characters")
  return trimmed
}

export function normalizeDot(input: NewDot): Dot {
  const now = Date.now()
  const id = randomUUID()
  return {
    id,
    name: validateDotName(input.name),
    goal: input.goal.trim(),
    ...(input.schedule ? { schedule: input.schedule } : {}),
    browser: {
      profileDir: `dots-${id}`,
      ...(input.browser?.viewport ? { viewport: input.browser.viewport } : {}),
    },
    memory: { facts: [], skills: [] },
    approvalRules: input.approvalRules ?? [],
    createdAt: now,
    updatedAt: now,
  }
}
