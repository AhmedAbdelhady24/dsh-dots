import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import type { DotsData } from "./store.js"

export function loadDots(path: string): DotsData {
  try { return JSON.parse(readFileSync(path, "utf8")) as DotsData }
  catch { return { dots: [] } }
}
export function saveDots(path: string, data: DotsData): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2))
}
