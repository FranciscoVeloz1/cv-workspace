import { describe, expect, it } from 'vitest'
import { computeA4Scale } from './a4Scale'

describe('computeA4Scale', () => {
  it('never upscales above 1', () => {
    expect(computeA4Scale({ width: 2000, height: 2000 }, { width: 794, height: 1123 })).toBe(1)
  })

  it('never shrinks below 0.25', () => {
    expect(computeA4Scale({ width: 40, height: 40 }, { width: 794, height: 1123 })).toBe(0.25)
  })

  it('fits a 400x600 stage around a 794x1123 sheet', () => {
    const scale = computeA4Scale({ width: 400, height: 600 }, { width: 794, height: 1123 })
    expect(scale).toBeLessThan(1)
    expect(scale).toBeGreaterThanOrEqual(0.25)
    expect(scale).toBeCloseTo(Math.min((400 - 32) / 794, (600 - 32) / 1123, 1), 5)
  })
})
