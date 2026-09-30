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
  it("maps after_seconds", () => {
    const out = toScheduleCreate({ selector: { kind: "after_seconds", seconds: 600 }, prompt: "x" }, "t")
    expect(out).toEqual({ title: "t", prompt: "x", after_seconds: 600 })
  })
  it("maps at", () => {
    const out = toScheduleCreate({ selector: { kind: "at", instant: "2099-01-01T09:00:00Z" }, prompt: "x" }, "t")
    expect(out).toEqual({ title: "t", prompt: "x", at: "2099-01-01T09:00:00Z" })
  })
  it("maps every_seconds", () => {
    const out = toScheduleCreate({ selector: { kind: "every_seconds", seconds: 300 }, prompt: "x" }, "t")
    expect(out).toEqual({ title: "t", prompt: "x", every_seconds: 300 })
  })
  it("maps weekly", () => {
    const out = toScheduleCreate({ selector: { kind: "weekly", time: "09:00:00", timeZone: "UTC", weekdays: [1, 3] }, prompt: "x" }, "t")
    expect(out).toEqual({ title: "t", prompt: "x", weekly: { time: "09:00:00", time_zone: "UTC", weekdays: [1, 3] } })
  })
  it("rejects every_seconds under 60", () => {
    expect(() => toScheduleCreate({ selector: { kind: "every_seconds", seconds: 59 }, prompt: "x" }, "t")).toThrow(/60/)
  })
})
