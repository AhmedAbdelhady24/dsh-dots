import { describe, it, expect } from "vitest"
import { toScheduleCreate } from "../scheduler.js"

describe("toScheduleCreate", () => {
  it("maps a daily selector", () => {
    const out = toScheduleCreate({ selector: { kind: "daily", time: "08:00:00", timeZone: "Asia/Shanghai" }, prompt: "Brief my inbox" }, "Brief")
    expect(out).toEqual({ title: "Brief", prompt: "Brief my inbox", daily: { time: "08:00:00", time_zone: "Asia/Shanghai" } })
  })
  it("maps a cron selector", () => {
    const out = toScheduleCreate({ selector: { kind: "cron", expression: "0 8 * * 1-5", timeZone: "UTC" }, prompt: "x" }, "t")
    expect(out).toEqual({ title: "t", prompt: "x", cron: { expression: "0 8 * * 1-5", time_zone: "UTC" } })
  })
})
