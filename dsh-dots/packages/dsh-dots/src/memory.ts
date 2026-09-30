import type { Dot } from "./domain.js"

export function renderMemorySection(memory: Dot["memory"], dotName: string): string {
  const facts = memory.facts.length ? memory.facts.map((f) => `- ${f}`).join("\n") : ""
  const skills = memory.skills.length ? memory.skills.map((s) => `- ${s}`).join("\n") : ""
  if (!facts && !skills) return ""
  const parts: string[] = [`## Memory for dot "${dotName}"`]
  if (facts) parts.push("### Facts\n" + facts)
  if (skills) parts.push("### Skills\n" + skills)
  return parts.join("\n\n")
}
