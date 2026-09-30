import type { ApprovalRule } from "./domain.js"

const RISKY_PREFIXES = ["browser.", "email.", "payment.", "post.", "send."]

export function policyFor(action: string, rules: ApprovalRule[]): "ask" | "allow" {
  const hit = rules.find((r) => r.action === action)
  if (hit) return hit.policy
  if (RISKY_PREFIXES.some((p) => action.startsWith(p))) return "ask"
  return "allow"
}
