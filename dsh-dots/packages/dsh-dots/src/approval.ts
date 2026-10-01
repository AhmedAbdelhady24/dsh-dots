import type { ApprovalRule } from "./domain.js"

const RISKY_PREFIXES = ["browser_", "email_", "payment_", "post_", "send_"]

export function policyFor(action: string, rules: ApprovalRule[]): "ask" | "allow" {
  const hit = rules.find((r) => r.action === action)
  if (hit) return hit.policy
  if (RISKY_PREFIXES.some((p) => action.startsWith(p))) return "ask"
  return "allow"
}
