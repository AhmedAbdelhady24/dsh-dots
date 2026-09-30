import { normalizeDot } from "./domain.js"
import type { Dot, NewDot } from "./domain.js"

export interface DotsData { dots: Dot[] }

export class DotStore {
  private readonly data: DotsData
  private readonly onChange?: () => void
  constructor(data: DotsData, onChange?: () => void) { this.data = data; this.onChange = onChange }
  list(): Dot[] { return [...this.data.dots] }
  get(id: string): Dot | undefined { return this.data.dots.find((d) => d.id === id) }
  create(input: NewDot): Dot {
    const dot = normalizeDot(input)
    this.data.dots.push(dot)
    this.onChange?.()
    return dot
  }
  update(id: string, patch: Partial<Omit<Dot, "id" | "createdAt">>): Dot {
    const i = this.data.dots.findIndex((d) => d.id === id)
    if (i < 0) throw new Error(`dot not found: ${id}`)
    const name = patch.name !== undefined ? patch.name.trim() : this.data.dots[i].name
    if (!name || name.length > 120) throw new TypeError("dot name must be non-empty and at most 120 characters")
    const next: Dot = { ...this.data.dots[i], ...patch, name, updatedAt: Date.now() }
    this.data.dots[i] = next
    this.onChange?.()
    return next
  }
  remove(id: string): void {
    const i = this.data.dots.findIndex((d) => d.id === id)
    if (i < 0) throw new Error(`dot not found: ${id}`)
    this.data.dots.splice(i, 1)
    this.onChange?.()
  }
}
