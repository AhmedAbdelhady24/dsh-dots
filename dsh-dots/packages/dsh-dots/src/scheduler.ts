import type { ScheduleSpec } from "./domain.js"

export function toScheduleCreate(spec: ScheduleSpec, title: string): Record<string, unknown> {
  const { selector, prompt } = spec
  const base = { title, prompt }
  switch (selector.kind) {
    case "after_seconds": return { ...base, after_seconds: selector.seconds }
    case "at": return { ...base, at: selector.instant }
    case "every_seconds": return { ...base, every_seconds: selector.seconds }
    case "daily": return { ...base, daily: { time: selector.time, time_zone: selector.timeZone } }
    case "weekly": return { ...base, weekly: { time: selector.time, time_zone: selector.timeZone, weekdays: selector.weekdays } }
    case "cron": return { ...base, cron: { expression: selector.expression, time_zone: selector.timeZone } }
  }
}
